import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSite } from '@/lib/site'
import { GUIDE_FIELDS } from '@shared/settings'
import { EditorShell, SettingsGrid } from '../ui/EditorShell'
import { SectionEditor } from '../ui/SectionEditor'
import { SlugField } from '../ui/SlugField'
import { PublishDialog } from '../ui/PublishDialog'
import { FieldList } from '../ui/Fields'
import { Label, Panel, Select, Switch, TextArea, TextInput } from '../ui/controls'
import { useEditor } from '../ui/useEditor'
import { usePhotoLookup } from '../photos'
import type { Guide } from '@shared/types'

/**
 * One prep guide.
 *
 * **Details** are the masthead, the opening letter and the at-a-glance table.
 * **Chapters** is the page builder: a Chapter widget starts a chapter, and the
 * blocks after it — paragraphs, timelines, checklists, recommendations — belong
 * to it, exactly as they will be numbered on the page.
 */
export default function GuideEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { sessions } = useSite()
  const [tab, setTab] = useState('chapters')

  const editor = useEditor<Guide>({
    base: '/admin/guides',
    id,
    key: 'guide',
    body: (d) => ({
      title: d.title,
      slug: d.slug,
      details: d.details,
      sessionTypeId: d.sessionTypeId ?? '',
      metaTitle: d.metaTitle ?? '',
      metaDescription: d.metaDescription ?? '',
      noindex: d.noindex,
    }),
  })
  const { draft, patch } = editor
  usePhotoLookup(draft?.details)

  if (editor.loading || !draft) {
    return (
      <div className="px-8 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-ink/[0.05]" />
        <div className="mt-8 h-96 animate-pulse rounded bg-ink/[0.03]" />
      </div>
    )
  }

  const session = sessions.find((s) => s.id === draft.sessionTypeId) ?? null

  return (
    <>
      <EditorShell
        back={{ to: '/dashboard/guides', label: 'All guides' }}
        title={draft.title}
        onTitleChange={(title) => patch({ title })}
        titlePlaceholder="Guide title"
        status={draft.status}
        dirty={editor.dirty}
        saving={editor.saving}
        publishing={editor.publishing}
        updatedAt={editor.saved?.updatedAt}
        publicPath={`/guides/${draft.slug}`}
        tabs={[
          { key: 'chapters', label: 'Chapters' },
          { key: 'details', label: 'Details' },
        ]}
        activeTab={tab}
        onTab={setTab}
        onSave={() => void editor.save()}
        onPublish={() => void editor.setStatus('published')}
        onUnpublish={() => void editor.setStatus('draft')}
      >
        {tab === 'chapters' ? (
          <SectionEditor
            host="guide"
            hostValue={{ kind: 'guide', guide: draft, session }}
            sections={draft.sections ?? []}
            onChange={(sections) => patch({ sections })}
          />
        ) : (
          <SettingsGrid
            main={
              <>
                <Panel title="The letter" description="The masthead, the opening note in your voice, and the table beside it.">
                  <FieldList fields={GUIDE_FIELDS} values={draft.details} onChange={(details) => patch({ details })} />
                </Panel>

                <Panel title="Address" description="The link you send a client when they book.">
                  <SlugField title={draft.title} value={draft.slug} onChange={(slug) => patch({ slug })} prefix="/guides/" />
                </Panel>

                <Panel title="Search & sharing">
                  <div className="space-y-6">
                    <div>
                      <Label>Title in search results</Label>
                      <TextInput value={draft.metaTitle ?? ''} onChange={(metaTitle) => patch({ metaTitle })} placeholder={`${draft.title} prep guide`} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <TextArea value={draft.metaDescription ?? ''} onChange={(metaDescription) => patch({ metaDescription })} />
                    </div>
                    <Switch checked={draft.noindex} onChange={(noindex) => patch({ noindex })} label="Ask search engines not to index this guide" />
                  </div>
                </Panel>
              </>
            }
            side={
              <Panel title="Session" description="Shown on that session’s page, and the guide links back to its pricing.">
                <Select
                  value={draft.sessionTypeId ?? ''}
                  onChange={(sessionTypeId) => patch({ sessionTypeId: sessionTypeId || null })}
                  options={[{ value: '', label: 'Not connected' }, ...sessions.map((s) => ({ value: s.id, label: s.title }))]}
                />
                {session && (
                  <p className="mt-3 text-xs text-faint">
                    The editing note in this guide follows the session: {session.editingStyle === 'retouched' ? 'fully retouched' : 'naturally edited'}.
                  </p>
                )}
              </Panel>
            }
          />
        )}
      </EditorShell>

      <PublishDialog result={editor.result} onClose={() => editor.setResult(null)} />
    </>
  )
}
