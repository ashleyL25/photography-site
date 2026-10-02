import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { formatDate, formatRelative } from '@/lib/format'
import { AdminHeader } from './AdminLayout'
import { useToast } from './ui/Toast'
import { HoldIconButton } from './ui/HoldConfirm'
import { EmptyState, Panel } from './ui/controls'
import type { InquiryRow } from '@shared/types'

/**
 * Inquiries from the contact form.
 *
 * Every inquiry is written to the database before it is emailed, so this list is
 * the record and the email is the notification. When mail is not configured — or
 * fails — the messages are still all here, and the banner says so rather than
 * leaving an empty inbox to be misread as nobody having written.
 */
export default function InquiriesPage() {
  const notify = useToast()

  const [enquiries, setEnquiries] = useState<InquiryRow[]>([])
  const [mail, setMail] = useState<{ configured: boolean; error: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const inbox = await api.get<{
        inquiries: InquiryRow[]
        mail: { configured: boolean; error: string | null }
      }>('/admin/inquiries')
      setEnquiries(inbox.inquiries)
      setMail(inbox.mail)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load messages', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleRead(enquiry: InquiryRow) {
    const read = enquiry.read_at === null
    setEnquiries((current) =>
      current.map((e) =>
        e.id === enquiry.id ? { ...e, read_at: read ? Math.floor(Date.now() / 1000) : null } : e,
      ),
    )
    try {
      await api.post(`/admin/inquiries/${enquiry.id}/read`, { read })
    } catch {
      await load()
    }
  }

  async function remove(enquiry: InquiryRow) {
    try {
      await api.del(`/admin/inquiries/${enquiry.id}`)
      setEnquiries((current) => current.filter((e) => e.id !== enquiry.id))
      notify('Deleted')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  const unread = enquiries.filter((e) => e.read_at === null).length

  return (
    <>
      <AdminHeader
        title="Messages"
        description={
          unread > 0
            ? `${unread} unread of ${enquiries.length}.`
            : 'Every inquiry sent through the contact form.'
        }
      />

      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 md:px-10 md:py-10">
        {mail && !mail.configured && (
          <div className="rounded-[var(--card-radius)] border border-gilt/40 bg-gilt/10 px-5 py-4">
            <p className="text-sm text-gilt">
              Messages are being saved but not emailed. {mail.error}
            </p>
            <p className="mt-1.5 text-xs text-faint">
              Everything sent so far is listed below — nothing has been lost.
            </p>
          </div>
        )}

        <Panel title="Inbox">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-[3px] bg-ink/[0.04]" />
              ))}
            </div>
          ) : enquiries.length === 0 ? (
            <EmptyState title="No messages yet" body="Anything sent through the contact form lands here." />
          ) : (
            <ul className="divide-y divide-line">
              {enquiries.map((enquiry) => {
                const expanded = open === enquiry.id
                return (
                  <li key={enquiry.id} className={clsx(enquiry.read_at === null && 'bg-gilt/[0.04]')}>
                    <div className="flex flex-wrap items-center gap-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(expanded ? null : enquiry.id)
                          if (!expanded && enquiry.read_at === null) void toggleRead(enquiry)
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="flex items-center gap-2.5">
                          {enquiry.read_at === null && (
                            <span className="size-1.5 shrink-0 rounded-full bg-gilt" />
                          )}
                          <span className="truncate text-sm">{enquiry.name}</span>
                          {enquiry.session && (
                            <span className="shrink-0 rounded-full bg-gilt/10 px-2 py-0.5 text-[0.7rem] font-medium text-gilt">
                              {enquiry.session}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block truncate text-xs text-faint">
                          {enquiry.email}
                          <span className="mx-2 opacity-50">·</span>
                          {formatRelative(enquiry.created_at)}
                          {!enquiry.emailed && (
                            <>
                              <span className="mx-2 opacity-50">·</span>
                              <span className="text-accent">not emailed</span>
                            </>
                          )}
                        </span>
                      </button>

                      <a
                        href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Re: ${enquiry.session ?? 'your inquiry'}`)}`}
                        className="label shrink-0 text-faint transition-colors hover:text-gilt"
                      >
                        Reply
                      </a>

                      <button
                        type="button"
                        onClick={() => void toggleRead(enquiry)}
                        className="label shrink-0 text-faint transition-colors hover:text-gilt"
                      >
                        {enquiry.read_at === null ? 'Mark read' : 'Mark unread'}
                      </button>

                      <HoldIconButton label="Delete message" onConfirm={() => void remove(enquiry)}>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </HoldIconButton>
                    </div>

                    {expanded && (
                      <div className="pb-6">
                        <dl className="mb-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                          {(
                            [
                              ['Session', enquiry.session],
                              ['Tier', enquiry.tier],
                              ['When', enquiry.timeframe],
                              ['Where', enquiry.location],
                              ['Phone', enquiry.phone],
                              ['Found you through', enquiry.heard_from],
                            ] as const
                          )
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <div key={k} className="flex gap-3">
                                <dt className="w-32 shrink-0 text-faint">{k}</dt>
                                <dd>{v}</dd>
                              </div>
                            ))}
                        </dl>
                        <p className="rounded-[3px] border border-line bg-canvas px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                          {enquiry.message}
                        </p>
                        <p className="mt-2.5 text-xs text-faint">
                          Sent {formatDate(enquiry.created_at)}
                          {enquiry.source_path && ` from ${enquiry.source_path}`}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

      </div>
    </>
  )
}
