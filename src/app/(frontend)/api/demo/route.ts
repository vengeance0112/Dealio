import { getPayload } from 'payload'
import config from '@payload-config'
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({ collection: 'demo-scenarios', overrideAccess: false,
      where: { key: { equals: 'evaluator-v1' } }, limit: 1, depth: 0 })
    if (!docs[0]) return Response.json({ error: 'Demo scenario not configured' }, { status: 503 })
    return Response.json({ state: docs[0].state }, { headers: { 'Cache-Control': 'no-store' } })
  } catch { return Response.json({ error: 'Demo temporarily unavailable' }, { status: 503 }) }
}
