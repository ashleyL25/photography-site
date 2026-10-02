import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useSite } from '@/lib/site'
import { useToast } from '../ui/Toast'
import { EditorShell, SettingsGrid } from '../ui/EditorShell'
import { SectionEditor } from '../ui/SectionEditor'
import { SlugField } from '../ui/SlugField'
import { PublishDialog, type PublishResult } from '../ui/PublishDialog'
import { MediaField } from '../ui/MediaPicker'
import { Label, MultiChoice, Panel, Select, Switch, TextArea, TextInput } from '../ui/controls'
import type { Post, Section } from '@shared/types'

/**
 * Editing one post.
 *
 * Same shape as the page editor — one draft object, a comparison for the dirty
 * flag, save and publish kept separate — with the extra fields a post has: a
 * featured image, an excerpt, a category and tags.
 */
export default function PostEditorPage() {
  const { id } = useParams<{ id: string }>()
  const notify = useToast()
  const { terms, refresh } = useSite()

  const [saved, setSaved] = useState<Post | null>(null)
  const [draft, setDraft] = useState<Post | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [savedTagIds, setSavedTagIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tab, setTab] = useState('build')
  const [result, setResult] = useState<PublishResult | null>(null)

  useEffect(() => {
    let canceled = false
    api
      .get<{ post: Post }>(`/admin/posts/${id}`)
      .then((data) => {
        if (canceled) return
        setSaved(data.post)
        setDraft(structuredClone(data.post))
        const ids = data.post.tags.map((t) => t.id)
        setTagIds(ids)
        setSavedTagIds(ids)
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load', 'error'))
      .finally(() => !canceled && setLoading(false))
    return () => {
      canceled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const dirty = useMemo(() => {
    if (!saved || !draft) return false
    if (tagIds.join() !== savedTagIds.join()) return true
    return JSON.stringify(stripVolatile(saved)) !== JSON.stringify(stripVolatile(draft))
  }, [saved, draft, tagIds, savedTagIds])

  function patch(next: Partial<Post>) {
    setDraft((current) => (current ? { ...current, ...next } : current))
  }

  async function save(): Promise<Post | null> {
    if (!draft) return null
    setSaving(true)
    try {
      const data = await api.patch<{ post: Post }>(`/admin/posts/${id}`, {
        title: draft.title,
        slug: draft.slug,
        subtitle: draft.subtitle,
        excerpt: draft.excerpt,
        featuredImage: draft.featuredImage,
        featuredAlt: draft.featuredAlt,
        categoryId: draft.category?.id ?? null,
        tagIds,
        featured: draft.featured,
        metaTitle: draft.metaTitle,
        metaDescription: draft.metaDescription,
        ogImage: draft.ogImage,
        noindex: draft.noindex,
        sections: (draft.sections ?? []).map((s) => ({
          id: s.id.startsWith('new-') ? undefined : s.id,
          type: s.type,
          hidden: s.hidden,
          content: s.content,
          styles: s.styles,
        })),
      })

      setSaved(data.post)
      setDraft(structuredClone(data.post))
      const ids = data.post.tags.map((t) => t.id)
      setTagIds(ids)
      setSavedTagIds(ids)
      notify('Saved')
      return data.post
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function setStatus(status: 'published' | 'draft') {
    setPublishing(true)
    try {
      if (dirty) {
        const savedPost = await save()
        if (!savedPost) return
      }

      const response = await api.post<PublishResult & { ok: boolean }>(
        `/admin/posts/${id}/status`,
        { status },
      )

      setSaved((current) => (current ? { ...current, status } : current))
      setDraft((current) => (current ? { ...current, status } : current))
      setResult({ status: response.status, path: response.path, wasPublished: response.wasPublished })
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change the status', 'error')
    } finally {
      setPublishing(false)
    }
  }

  if (loading || !draft) {
    return (
      <div className="px-8 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-ink/[0.05]" />
        <div className="mt-8 h-96 animate-pulse rounded bg-ink/[0.03]" />
      </div>
    )
  }

  const categories = terms.post.filter((t) => t.kind === 'category')
  const tags = terms.post.filter((t) => t.kind === 'tag')

  return (
    <>
      <EditorShell
        back={{ to: '/dashboard/blog', label: 'All posts' }}
        title={draft.title}
        onTitleChange={(title) => patch({ title })}
        titlePlaceholder="Post title"
        status={draft.status}
        dirty={dirty}
        saving={saving}
        publishing={publishing}
        updatedAt={saved?.updatedAt}
        publicPath={`/blog/${draft.slug}`}
        tabs={[
          { key: 'build', label: 'Build' },
          { key: 'settings', label: 'Details' },
        ]}
        activeTab={tab}
        onTab={setTab}
        onSave={() => void save()}
        onPublish={() => void setStatus('published')}
        onUnpublish={() => void setStatus('draft')}
        extraActions={
          <span className="text-xs text-faint">{draft.readingMinutes} min read</span>
        }
      >
        {tab === 'build' ? (
          <SectionEditor
            host="post"
            sections={draft.sections ?? []}
            onChange={(sections: Section[]) => patch({ sections })}
          />
        ) : (
          <SettingsGrid
            main={
              <>
                <Panel title="The post">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="subtitle" help="Shown beneath the title on the post itself.">
                        Standfirst
                      </Label>
                      <TextInput
                        id="subtitle"
                        value={draft.subtitle ?? ''}
                        onChange={(subtitle) => patch({ subtitle: subtitle || null })}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="excerpt"
                        help="Used on cards and in search results. Left empty, the opening of the post is used."
                      >
                        Excerpt
                      </Label>
                      <TextArea
                        id="excerpt"
                        value={draft.excerpt ?? ''}
                        onChange={(excerpt) => patch({ excerpt: excerpt || null })}
                      />
                    </div>

                    <SlugField
                      title={draft.title}
                      value={draft.slug}
                      onChange={(slug) => patch({ slug })}
                      prefix="/blog/"
                    />
                  </div>
                </Panel>

                <Panel title="Featured image" description="The picture that represents this post everywhere else on the site.">
                  <div className="space-y-5">
                    <MediaField
                      value={draft.featuredImage ?? ''}
                      onChange={(featuredImage) => patch({ featuredImage: featuredImage || null })}
                    />
                    <div>
                      <Label htmlFor="featured-alt" help="What the image shows, for anyone who cannot see it.">
                        Alt text
                      </Label>
                      <TextInput
                        id="featured-alt"
                        value={draft.featuredAlt ?? ''}
                        onChange={(featuredAlt) => patch({ featuredAlt: featuredAlt || null })}
                      />
                    </div>
                  </div>
                </Panel>

                <Panel title="Search & sharing">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="meta-title">Title in search results</Label>
                      <TextInput
                        id="meta-title"
                        value={draft.metaTitle ?? ''}
                        onChange={(metaTitle) => patch({ metaTitle: metaTitle || null })}
                        placeholder={draft.title}
                      />
                    </div>

                    <div>
                      <Label htmlFor="meta-description">Description</Label>
                      <TextArea
                        id="meta-description"
                        value={draft.metaDescription ?? ''}
                        onChange={(metaDescription) =>
                          patch({ metaDescription: metaDescription || null })
                        }
                        placeholder={draft.excerpt ?? ''}
                      />
                    </div>

                    <div>
                      <Label help="Left empty, the featured image is used.">Share image</Label>
                      <MediaField
                        value={draft.ogImage ?? ''}
                        onChange={(ogImage) => patch({ ogImage: ogImage || null })}
                      />
                    </div>

                    <Switch
                      checked={draft.noindex}
                      onChange={(noindex) => patch({ noindex })}
                      label="Ask search engines not to index this post"
                    />
                  </div>
                </Panel>
              </>
            }
            side={
              <>
                <Panel title="Filing">
                  <div className="space-y-6">
                    <div>
                      <Label>Category</Label>
                      {categories.length === 0 ? (
                        <p className="text-xs text-faint">
                          None yet — add some under Categories &amp; tags.
                        </p>
                      ) : (
                        <Select
                          value={draft.category?.id ?? ''}
                          onChange={(categoryId) =>
                            patch({
                              category: categories.find((c) => c.id === categoryId) ?? null,
                            })
                          }
                          options={[
                            { value: '', label: 'None' },
                            ...categories.map((c) => ({ value: c.id, label: c.name })),
                          ]}
                        />
                      )}
                    </div>

                    {tags.length > 0 && (
                      <div>
                        <Label>Tags</Label>
                        <MultiChoice
                          value={tagIds}
                          onChange={setTagIds}
                          options={tags.map((t) => ({ value: t.id, label: t.name }))}
                        />
                      </div>
                    )}

                    <Switch
                      checked={draft.featured}
                      onChange={(featured) => patch({ featured })}
                      label="Feature this post"
                    />
                  </div>
                </Panel>

                {draft.author && (
                  <Panel title="Byline">
                    <p className="text-sm">{draft.author.name}</p>
                    <p className="mt-1.5 text-xs text-faint">
                      Change how your name appears under Your account.
                    </p>
                  </Panel>
                )}
              </>
            }
          />
        )}
      </EditorShell>

      <PublishDialog result={result} onClose={() => setResult(null)} />
    </>
  )
}

function stripVolatile(post: Post) {
  return {
    title: post.title,
    slug: post.slug,
    subtitle: post.subtitle,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    featuredAlt: post.featuredAlt,
    categoryId: post.category?.id ?? null,
    featured: post.featured,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    ogImage: post.ogImage,
    noindex: post.noindex,
    sections: (post.sections ?? []).map((s) => ({
      type: s.type,
      hidden: s.hidden,
      content: s.content,
      styles: s.styles,
    })),
  }
}
