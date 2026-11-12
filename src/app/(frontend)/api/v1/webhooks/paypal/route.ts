import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  const client = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || '3RW68050TF413525E'
  if (!client || !secret) return Response.json({ error: 'PayPal secrets are not configured' }, { status: 503 })
  const raw = await request.text()
  if (raw.length > 262144) return new Response(null, { status: 413 })
  let event
  try { event = JSON.parse(raw) } catch { return new Response(null, { status: 400 }) }
  try {
    const base = 'https://api-m.sandbox.paypal.com'
    const auth = await fetch(`${base}/v1/oauth2/token`, { method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${client}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials', signal: AbortSignal.timeout(15000) })
    if (!auth.ok) throw new Error('PayPal authorization failed')
    const { access_token } = await auth.json()
    const verification = await fetch(`${base}/v1/notifications/verify-webhook-signature`, { method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: request.headers.get('paypal-auth-algo'),
        cert_url: request.headers.get('paypal-cert-url'),
        transmission_id: request.headers.get('paypal-transmission-id'),
        transmission_sig: request.headers.get('paypal-transmission-sig'),
        transmission_time: request.headers.get('paypal-transmission-time'),
        webhook_id: webhookId, webhook_event: event,
      }), signal: AbortSignal.timeout(15000) })
    if (!verification.ok || (await verification.json()).verification_status !== 'SUCCESS')
      return Response.json({ error: 'Invalid signature' }, { status: 400 })
    if (typeof event.id !== 'string' || typeof event.event_type !== 'string')
      return new Response(null, { status: 400 })
    const payload = await getPayload({ config })
    const find = () => payload.find({ collection: 'paypal-events', overrideAccess: true, where: { eventId: { equals: event.id } }, limit: 1 })
    if ((await find()).docs.length) return Response.json({ received: true, duplicate: true })
    try {
      // Trusted, verified provider event. Unique eventId is the durable deduplication boundary.
      await payload.create({ collection: 'paypal-events', overrideAccess: true, data: {
        eventId: event.id, eventType: event.event_type,
        resourceId: String(event.resource?.id || ''), receivedAt: new Date().toISOString(),
      } })
    } catch (error) { if (!(await find()).docs.length) throw error }
    return Response.json({ received: true })
  } catch {
    return Response.json({ error: 'Webhook processing failed. Retry later.' }, { status: 503 })
  }
}
