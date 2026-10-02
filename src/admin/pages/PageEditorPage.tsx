import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/lib/api'
import { useToast } from '../ui/Toast'
import { EditorShell, SettingsGrid } from '../ui/EditorShell'
import { SectionEditor } from '../ui/SectionEditor'
import { SlugField } from '../ui/SlugField'
import { PublishDialog, type PublishResult } from '../ui/PublishDialog'
import { Label, Panel, Switch, TextArea, TextInput } from '../ui/controls'
import { MediaField } from '../ui/MediaPicker'
import type { Page, Section } from '@shared/types'

/**
 * Editing one page.
 *
 * The page's own fields and its section list are held together in `draft`, and
 * `dirty` is a comparison against the last saved copy — so "unsaved changes" is
 * true exactly when something differs, rather than whenever a control has been
 * touched. Typing a character and deleting it again leaves the editor clean,
 * which is the behavior anyone expects and almost no editor delivers.
 */
export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const notify = useToast()

  const [saved, setSaved] = useState<Page | null>(null)
  const [draft, setDraft] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [tab, setTab] = useState('build')
  const [result, setResult] = useState<PublishResult | null>(null)

  useEffect(() => {
    let canceled = false
    api
      .get<{ page: Page }>(`/admin/pages/${id}`)
      .then((data) => {
        if (canceled) return
        setSaved(data.page)
        setDraft(structuredClone(data.page))
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
    return JSON.stringify(stripVolatile(saved)) !== JSON.stringify(stripVolatile(draft))
  }, [saved, draft])

  function patch(next: Partial<Page>) {
    setDraft((current) => (current ? { ...current, ...next } : current))
  }

  async function save(): Promise<Page | null> {
    if (!draft) return null
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: draft.title,
        metaTitle: draft.metaTitle,
        metaDescription: draft.metaDescription,
        ogImage: draft.ogImage,
        noindex: draft.noindex,
        sections: (draft.sections ?? []).map((s) => ({
          // A client-minted `new-…` id is not sent: the server mints the real
          // one, and sending a fake would have it look for a row that is not there.
          id: s.id.startsWith('new-') ? undefined : s.id,
          type: s.type,
          hidden: s.hidden,
          content: s.content,
          styles: s.styles,
        })),
      }
      // A core page's address is fixed, and the server refuses the field rather
      // than silently ignoring it — so it is only sent when it can be changed.
      if (!draft.pageKey) body.slug = draft.slug

      const data = await api.patch<{ page: Page }>(`/admin/pages/${id}`, body)
      setSaved(data.page)
      setDraft(structuredClone(data.page))
      notify('Saved')
      return data.page
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
      // Saved first, always. Publishing a page whose latest edits are still in
      // the browser is the single most confusing thing an editor can do.
      if (dirty) {
        const savedPage = await save()
        if (!savedPage) return
      }

      const response = await api.post<PublishResult & { ok: boolean }>(
        `/admin/pages/${id}/status`,
        { status },
      )

      setSaved((current) => (current ? { ...current, status } : current))
      setDraft((current) => (current ? { ...current, status } : current))
      setResult({ status: response.status, path: response.path, wasPublished: response.wasPublished })
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

  const publicPath = draft.pageKey === 'home' ? '/' : `/${draft.slug}`

  return (
    <>
      <EditorShell
        back={{ to: '/dashboard/pages', label: 'All pages' }}
        title={draft.title}
        onTitleChange={(title) => patch({ title })}
        titlePlaceholder="Page title"
        status={draft.status}
        dirty={dirty}
        saving={saving}
        publishing={publishing}
        updatedAt={saved?.updatedAt}
        publicPath={publicPath}
        tabs={[
          { key: 'build', label: 'Build' },
          { key: 'settings', label: 'Settings' },
        ]}
        activeTab={tab}
        onTab={setTab}
        onSave={() => void save()}
        onPublish={() => void setStatus('published')}
        onUnpublish={() => void setStatus('draft')}
      >
        {tab === 'build' ? (
          <SectionEditor
            host="page"
            sections={draft.sections ?? []}
            onChange={(sections: Section[]) => patch({ sections })}
          />
        ) : (
          <SettingsGrid
            main={
              <>
                <Panel title="Address">
                  <SlugField
                    title={draft.title}
                    value={draft.pageKey ? draft.slug : draft.slug}
                    onChange={(slug) => patch({ slug })}
                    locked={Boolean(draft.pageKey)}
                    lockedReason={
                      draft.pageKey === 'home'
                        ? 'The home page always lives at the root of the site.'
                        : 'The site routes to this page directly, so its address is fixed.'
                    }
                  />
                </Panel>

                <Panel
                  title="Search & sharing"
                  description="Leave these empty to fall back to the page title and the site description."
                >
                  <div className="space-y-6">
                    <div>
                      <Label
                        htmlFor="meta-title"
                        help={`${(draft.metaTitle ?? '').length}/60 characters is the usual limit before Google truncates it.`}
                      >
                        Title in search results
                      </Label>
                      <TextInput
                        id="meta-title"
                        value={draft.metaTitle ?? ''}
                        onChange={(metaTitle) => patch({ metaTitle: metaTitle || null })}
                        placeholder={draft.title}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="meta-description"
                        help={`${(draft.metaDescription ?? '').length}/160 characters.`}
                      >
                        Description
                      </Label>
                      <TextArea
                        id="meta-description"
                        value={draft.metaDescription ?? ''}
                        onChange={(metaDescription) =>
                          patch({ metaDescription: metaDescription || null })
                        }
                      />
                    </div>

                    <div>
                      <Label help="Shown when the page is shared in a message or on social media.">
                        Share image
                      </Label>
                      <MediaField
                        value={draft.ogImage ?? ''}
                        onChange={(ogImage) => patch({ ogImage: ogImage || null })}
                      />
                    </div>

                    <Switch
                      checked={draft.noindex}
                      onChange={(noindex) => patch({ noindex })}
                      label="Ask search engines not to index this page"
                    />
                  </div>
                </Panel>
              </>
            }
            side={
              <Panel title="Navigation">
                <p className="text-sm text-muted">
                  The menu across the top of the site is set in{' '}
                  <Link to="/dashboard/settings/site" className="text-gilt underline underline-offset-2">
                    Settings → Site
                  </Link>
                  , so it can link to pages, sessions or a section of a page like the pricing.
                </p>
              </Panel>
            }
          />
        )}
      </EditorShell>

      <PublishDialog result={result} onClose={() => setResult(null)} />
    </>
  )
}

/**
 * Fields that change on their own and must not count as an edit.
 *
 * `updatedAt` is written by the server on every save, and the section ids change
 * from `new-…` to real UUIDs — so comparing the raw objects would report the
 * page as dirty the instant it finished saving.
 */
function stripVolatile(page: Page) {
  return {
    ...page,
    updatedAt: 0,
    publishedAt: 0,
    status: 'x',
    sections: (page.sections ?? []).map((s) => ({
      type: s.type,
      hidden: s.hidden,
      content: s.content,
      styles: s.styles,
    })),
  }
}
