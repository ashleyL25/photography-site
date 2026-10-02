import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSite } from '@/lib/site'
import { SESSION_FIELDS, fromPrice, publicTiers } from '@shared/settings'
import { EditorShell, SettingsGrid } from '../ui/EditorShell'
import { SectionEditor } from '../ui/SectionEditor'
import { SlugField } from '../ui/SlugField'
import { PublishDialog } from '../ui/PublishDialog'
import { FieldList } from '../ui/Fields'
import { Label, Panel, Select, Switch, TextArea, TextInput } from '../ui/controls'
import { useEditor } from '../ui/useEditor'
import { usePhotoLookup } from '../photos'
import { PackagesEditor } from './PackagesEditor'
import type { PublicSession, SessionType } from '@shared/types'

/**
 * One session type.
 *
 * Three tabs for the three things a session is: its **details** (the copy and
 * photographs every list and card draws on, plus which guide it sends and which
 * albums are "sessions like yours"), its **tiers**, and its **page**, built
 * with the same page builder as everything else.
 */
export default function SessionEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { settings, categories, guides } = useSite()
  const [tab, setTab] = useState('details')

  const editor = useEditor<SessionType>({
    base: '/admin/sessions',
    id,
    key: 'session',
    body: (d) => ({
      title: d.title,
      slug: d.slug,
      details: d.details,
      packages: {
        ...d.packages,
        tiers: d.packages.tiers.map((t) => ({ ...t, includes: t.includes.map((l) => l.trim()).filter(Boolean) })),
      },
      privatePricing: d.privatePricing,
      guideId: d.guideId ?? '',
      portfolioCategoryId: d.portfolioCategoryId ?? '',
      metaTitle: d.metaTitle ?? '',
      metaDescription: d.metaDescription ?? '',
      noindex: d.noindex,
    }),
  })
  const { draft, patch } = editor
  usePhotoLookup(draft?.details)

  /** The session as its page widgets will see it, built live from the draft. */
  const hostSession = useMemo<PublicSession | null>(() => {
    if (!draft) return null
    const d = draft.details
    const str = (v: unknown) => (typeof v === 'string' ? v : '')
    const tiers = publicTiers(draft.packages, settings.pricing, true)
    return {
      id: draft.id,
      slug: draft.slug,
      title: draft.title,
      index: str(d.index),
      blurb: str(d.blurb),
      runs: str(d.runs),
      photo: str(d.photo),
      heroPhoto: str(d.hero_photo) || str(d.photo),
      gallery: Array.isArray(d.gallery) ? (d.gallery as string[]) : [],
      detail: str(d.detail),
      points: Array.isArray(d.points) ? (d.points as string[]) : [],
      editingStyle: d.editing_style === 'retouched' ? 'retouched' : 'natural',
      category: categories.find((c) => c.id === draft.portfolioCategoryId)?.slug ?? null,
      guideSlug: guides.find((g) => g.id === draft.guideId)?.slug ?? null,
      privatePricing: draft.privatePricing,
      pricesShown: true,
      intro: draft.packages.intro,
      note: draft.packages.note,
      tiers,
      fromPrice: fromPrice(tiers, true, settings.pricing),
      metaDescription: draft.metaDescription,
    }
  }, [draft, settings.pricing, categories, guides])

  if (editor.loading || !draft || !hostSession) {
    return (
      <div className="px-8 py-12">
        <div className="h-8 w-64 animate-pulse rounded bg-ink/[0.05]" />
        <div className="mt-8 h-96 animate-pulse rounded bg-ink/[0.03]" />
      </div>
    )
  }

  return (
    <>
      <EditorShell
        back={{ to: '/dashboard/sessions', label: 'All sessions' }}
        title={draft.title}
        onTitleChange={(title) => patch({ title })}
        titlePlaceholder="Session name"
        status={draft.status}
        dirty={editor.dirty}
        saving={editor.saving}
        publishing={editor.publishing}
        updatedAt={editor.saved?.updatedAt}
        publicPath={`/sessions/${draft.slug}`}
        tabs={[
          { key: 'details', label: 'Details' },
          { key: 'packages', label: 'Tiers & pricing' },
          { key: 'page', label: 'Page' },
        ]}
        activeTab={tab}
        onTab={setTab}
        onSave={() => void editor.save()}
        onPublish={() => void editor.setStatus('published')}
        onUnpublish={() => void editor.setStatus('draft')}
      >
        {tab === 'page' ? (
          <SectionEditor
            host="session"
            hostValue={{ kind: 'session', session: hostSession }}
            sections={draft.sections ?? []}
            onChange={(sections) => patch({ sections })}
          />
        ) : tab === 'packages' ? (
          <PackagesEditor value={draft.packages} onChange={(packages) => patch({ packages })} />
        ) : (
          <SettingsGrid
            main={
              <>
                <Panel title="About this session" description="Shown on the homepage list, the sessions page, and at the top of this session’s own page.">
                  <FieldList fields={SESSION_FIELDS} values={draft.details} onChange={(details) => patch({ details })} />
                </Panel>

                <Panel title="Address">
                  <SlugField title={draft.title} value={draft.slug} onChange={(slug) => patch({ slug })} prefix="/sessions/" />
                </Panel>

                <Panel title="Search & sharing">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="meta-title">Title in search results</Label>
                      <TextInput
                        id="meta-title"
                        value={draft.metaTitle ?? ''}
                        onChange={(metaTitle) => patch({ metaTitle: metaTitle || null })}
                        placeholder={`${draft.title} — Ashley Photography`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="meta-description" help="Prices are never put here for a private session.">
                        Description
                      </Label>
                      <TextArea
                        id="meta-description"
                        value={draft.metaDescription ?? ''}
                        onChange={(metaDescription) => patch({ metaDescription: metaDescription || null })}
                        placeholder={hostSession.blurb}
                      />
                    </div>
                    <Switch checked={draft.noindex} onChange={(noindex) => patch({ noindex })} label="Ask search engines not to index this session" />
                  </div>
                </Panel>
              </>
            }
            side={
              <>
                <Panel title="Connections" description="What this session links to.">
                  <div className="space-y-6">
                    <div>
                      <Label help="The guide sent to people who book this session. Shown on its page.">Prep guide</Label>
                      <Select
                        value={draft.guideId ?? ''}
                        onChange={(guideId) => patch({ guideId: guideId || null })}
                        options={[{ value: '', label: 'None' }, ...guides.map((g) => ({ value: g.id, label: g.title }))]}
                      />
                    </div>
                    <div>
                      <Label help="Albums in this category appear as “sessions like yours”.">Portfolio category</Label>
                      <Select
                        value={draft.portfolioCategoryId ?? ''}
                        onChange={(portfolioCategoryId) => patch({ portfolioCategoryId: portfolioCategoryId || null })}
                        options={[{ value: '', label: 'None' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                      />
                    </div>
                  </div>
                </Panel>

                <Panel title="Pricing">
                  <Switch
                    checked={draft.privatePricing}
                    onChange={(privatePricing) => patch({ privatePricing })}
                    label="Keep the prices private"
                  />
                  <p className="mt-3 text-xs leading-relaxed text-faint">
                    Shows “By request” instead of figures, unless the visitor arrived on your private link — set the key under
                    Settings → Pricing.
                  </p>
                  <p className="mt-4 text-sm">
                    Starts at <strong className="text-gilt">{hostSession.fromPrice.replace(/^From /, '')}</strong>
                  </p>
                </Panel>
              </>
            }
          />
        )}
      </EditorShell>

      <PublishDialog result={editor.result} onClose={() => editor.setResult(null)} />
    </>
  )
}
