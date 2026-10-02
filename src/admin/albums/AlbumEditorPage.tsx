import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { useSite } from '@/lib/site'
import { EditorShell, SettingsGrid } from '../ui/EditorShell'
import { SectionEditor } from '../ui/SectionEditor'
import { SlugField } from '../ui/SlugField'
import { PublishDialog } from '../ui/PublishDialog'
import { HoldConfirm } from '../ui/HoldConfirm'
import { MediaListField } from '../ui/MediaPicker'
import { Label, Panel, Select, Switch, TextArea, TextInput } from '../ui/controls'
import { useEditor } from '../ui/useEditor'
import { useToast } from '../ui/Toast'
import { useAdminAuth } from '../AdminAuth'
import { thumbOf } from '../photos'
import type { Album } from '@shared/types'

/**
 * One album.
 *
 * Its **photographs** are chosen from the media library, in order; the first is
 * the cover unless another is picked. Its **details** fill the facts beside the
 * story on its page. **Extras** are optional sections that render under the
 * gallery, for the album that needs a little more than photographs.
 */
export default function AlbumEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const notify = useToast()
  const { isOwner } = useAdminAuth()
  const { categories, sessions } = useSite()
  const [tab, setTab] = useState('photos')

  const editor = useEditor<Album>({
    base: '/admin/albums',
    id,
    key: 'album',
    body: (d) => ({
      title: d.title,
      slug: d.slug,
      categoryId: d.category?.id ?? '',
      featured: d.featured,
      shootDate: d.shootDate ?? '',
      dateLabel: d.dateLabel ?? '',
      cover: d.cover ?? '',
      story: d.story ?? '',
      location: d.location ?? '',
      conditions: d.conditions ?? '',
      requests: d.requests ?? '',
      photos: d.photos,
      metaTitle: d.metaTitle ?? '',
      metaDescription: d.metaDescription ?? '',
      noindex: d.noindex,
    }),
  })
  const { draft, patch } = editor

  if (editor.loading || !draft) {
    return (
      <div className="px-8 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-ink/[0.05]" />
        <div className="mt-8 h-96 animate-pulse rounded bg-ink/[0.03]" />
      </div>
    )
  }

  const cover = draft.cover || draft.photos[0] || ''
  const onSessions = sessions.filter((s) => draft.category && s.category === draft.category.slug)

  async function remove() {
    try {
      await api.del(`/admin/albums/${draft!.id}`)
      notify('Album deleted')
      navigate('/dashboard/albums')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  return (
    <>
      <EditorShell
        back={{ to: '/dashboard/albums', label: 'All albums' }}
        title={draft.title}
        onTitleChange={(title) => patch({ title })}
        titlePlaceholder="Album title"
        status={draft.status}
        dirty={editor.dirty}
        saving={editor.saving}
        publishing={editor.publishing}
        updatedAt={editor.saved?.updatedAt}
        publicPath={`/portfolio/${draft.slug}`}
        tabs={[
          { key: 'photos', label: `Photographs (${draft.photos.length})` },
          { key: 'details', label: 'Details' },
          { key: 'extras', label: 'Extras' },
        ]}
        activeTab={tab}
        onTab={setTab}
        onSave={() => void editor.save()}
        onPublish={() => void editor.setStatus('published')}
        onUnpublish={() => void editor.setStatus('draft')}
      >
        {tab === 'extras' ? (
          <SectionEditor
            host="album"
            hostValue={{ kind: 'album', album: draft }}
            sections={draft.sections ?? []}
            onChange={(sections) => patch({ sections })}
          />
        ) : tab === 'photos' ? (
          <div className="mx-auto w-full max-w-6xl space-y-6 px-5 py-8 md:px-8">
            <Panel
              title="Photographs"
              description="In the order they appear in the gallery. Add from the media library — or upload there first and pick them here."
            >
              <MediaListField value={draft.photos} onChange={(photos) => patch({ photos })} firstLabel="First" />
            </Panel>

            {draft.photos.length > 0 && (
              <Panel title="Cover" description="The card on the portfolio and the masthead of the album’s page.">
                <div className="flex flex-wrap gap-2">
                  {draft.photos.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => patch({ cover: url === draft.photos[0] ? null : url })}
                      className={clsx(
                        'size-20 overflow-hidden rounded-md border-2 transition-colors',
                        url === cover ? 'border-gilt' : 'border-transparent opacity-70 hover:opacity-100',
                      )}
                      aria-label="Use as the cover"
                      aria-pressed={url === cover}
                    >
                      <img src={thumbOf(url)} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        ) : (
          <SettingsGrid
            main={
              <>
                <Panel title="The story" description="A sentence or two about the photographs. Shown beside the facts on the album’s page.">
                  <TextArea value={draft.story ?? ''} onChange={(story) => patch({ story })} rows={4} />
                </Panel>

                <Panel title="The particulars" description="Only the ones filled in appear on the page.">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label help="Sorts the portfolio, newest first.">Date of the shoot</Label>
                      <TextInput type="date" value={draft.shootDate ?? ''} onChange={(shootDate) => patch({ shootDate })} />
                    </div>
                    <div>
                      <Label help="What the page prints.">Shown as</Label>
                      <TextInput value={draft.dateLabel ?? ''} onChange={(dateLabel) => patch({ dateLabel })} placeholder="June 2024" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Where</Label>
                      <TextInput value={draft.location ?? ''} onChange={(location) => patch({ location })} placeholder="Water Works Park, Des Moines" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Conditions</Label>
                      <TextInput value={draft.conditions ?? ''} onChange={(conditions) => patch({ conditions })} placeholder="Overcast, then golden hour" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Requests</Label>
                      <TextInput value={draft.requests ?? ''} onChange={(requests) => patch({ requests })} />
                    </div>
                  </div>
                </Panel>

                <Panel title="Address">
                  <SlugField title={draft.title} value={draft.slug} onChange={(slug) => patch({ slug })} prefix="/portfolio/" />
                </Panel>

                <Panel title="Search & sharing">
                  <div className="space-y-6">
                    <div>
                      <Label>Title in search results</Label>
                      <TextInput value={draft.metaTitle ?? ''} onChange={(metaTitle) => patch({ metaTitle })} placeholder={draft.title} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <TextArea value={draft.metaDescription ?? ''} onChange={(metaDescription) => patch({ metaDescription })} placeholder={draft.story ?? ''} />
                    </div>
                    <Switch checked={draft.noindex} onChange={(noindex) => patch({ noindex })} label="Ask search engines not to index this album" />
                  </div>
                </Panel>
              </>
            }
            side={
              <>
                <Panel title="Filing">
                  <div className="space-y-6">
                    <div>
                      <Label help="The portfolio filter it sits under — and the session pages it appears on.">Category</Label>
                      <Select
                        value={draft.category?.id ?? ''}
                        onChange={(categoryId) => {
                          const c = categories.find((x) => x.id === categoryId)
                          patch({
                            category: c
                              ? { id: c.id, slug: c.slug, name: c.name, kind: 'category', appliesTo: 'portfolio', description: null, swatch: 'accent', position: 0 }
                              : null,
                          })
                        }}
                        options={[{ value: '', label: 'None' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                      />
                      {onSessions.length > 0 && (
                        <p className="mt-2 text-xs text-faint">Shows on: {onSessions.map((s) => s.title).join(', ')}</p>
                      )}
                    </div>
                    <Switch checked={draft.featured} onChange={(featured) => patch({ featured })} label="Feature this album" />
                  </div>
                </Panel>

                {isOwner && (
                  <Panel title="Delete">
                    <HoldConfirm label="Delete this album" holdingLabel="Hold to delete" variant="danger" onConfirm={() => void remove()} className="w-full py-3 text-[0.7rem]" />
                    <p className="mt-2.5 text-xs text-faint">The photographs stay in the media library.</p>
                  </Panel>
                )}
              </>
            }
          />
        )}
      </EditorShell>

      <PublishDialog result={editor.result} onClose={() => editor.setResult(null)} />
    </>
  )
}
