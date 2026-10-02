import { env } from '../env.js'

/**
 * Outbound mail, over Resend's HTTP API.
 *
 * HTTP rather than SMTP on purpose: Hostinger's shared plans block outbound port
 * 587 often enough that an SMTP client is a coin flip, and a coin flip in the one
 * path that tells Ashley somebody wants to book a session is not acceptable. HTTPS is
 * never blocked.
 *
 * Optional throughout. With no API key configured, `sendMail` reports that it
 * did not send rather than throwing — the enquiry is already safely in the
 * database by the time this is called, and a contact form that 500s because mail
 * is misconfigured loses the enquiry to protect a notification.
 */

export const mailConfigured = Boolean(env.RESEND_API_KEY && env.MAIL_FROM && env.MAIL_TO)

export function mailConfigError(): string | null {
  if (mailConfigured) return null
  const missing = [
    !env.RESEND_API_KEY && 'RESEND_API_KEY',
    !env.MAIL_FROM && 'MAIL_FROM',
    !env.MAIL_TO && 'MAIL_TO',
  ].filter(Boolean)
  return `Email notifications are off — set ${missing.join(' and ')}`
}

export interface MailResult {
  sent: boolean
  error?: string
}

export async function sendMail(opts: {
  subject: string
  text: string
  replyTo?: string
  to?: string
}): Promise<MailResult> {
  if (!mailConfigured) return { sent: false, error: mailConfigError() ?? 'Mail is not configured' }

  try {
    /**
     * A timeout, because `fetch` has none by default. Without it a hanging
     * Resend request holds the contact form's response open until the browser
     * gives up — and the visitor, having seen nothing happen, submits again.
     */
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [opts.to ?? env.MAIL_TO],
        subject: opts.subject,
        text: opts.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      return { sent: false, error: `Resend returned ${response.status}: ${body.slice(0, 200)}` }
    }

    return { sent: true }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'Unknown mail error' }
  }
}
