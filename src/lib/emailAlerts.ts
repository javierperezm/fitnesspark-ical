import { Resend } from 'resend'

import { env } from '@/env'
import StructureAlertEmail from '@/lib/emails/StructureAlertEmail'
import { HtmlValidationResult } from '@/types'

export async function sendStructureAlert(
  failures: HtmlValidationResult[],
): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log(
      'RESEND_API_KEY not configured, skipping email alert. Failures:',
      JSON.stringify(failures, null, 2),
    )
    return false
  }

  if (!env.ALERT_EMAIL_TO) {
    console.log(
      'ALERT_EMAIL_TO not configured, skipping email alert. Failures:',
      JSON.stringify(failures, null, 2),
    )
    return false
  }

  const resend = new Resend(env.RESEND_API_KEY)

  const affectedShops = [...new Set(failures.map((f) => f.shop))]
  const totalErrors = failures.reduce((acc, f) => acc + f.errors.length, 0)

  try {
    const { error } = await resend.emails.send({
      from: env.ALERT_EMAIL_FROM,
      to: env.ALERT_EMAIL_TO,
      subject: `[Fitnesspark iCal] Structure Alert: ${totalErrors} errors in shops ${affectedShops.join(', ')}`,
      react: StructureAlertEmail({ failures }),
    })

    if (error) {
      console.error('Failed to send structure alert email:', error)
      return false
    }

    console.log('Structure alert email sent successfully')
    return true
  } catch (error) {
    console.error('Error sending structure alert email:', error)
    return false
  }
}
