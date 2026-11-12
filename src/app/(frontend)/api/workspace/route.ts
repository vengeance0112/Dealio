import { appIdentity } from '@/lib/firebase-server'
import { z } from 'zod'
const brief = z.object({ title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(10000),
  amountCents: z.number().int().min(100).max(100000000) }).strict()

async function handle(request: Request, write: boolean) {
  const requestId = crypto.randomUUID()
  try {
    const { payload, user } = await appIdentity(request)
    if (write) {
      if (Number(request.headers.get('content-length') || 0) > 15000)
        return Response.json({ error: 'Request too large', requestId }, { status: 413 })
      const data = brief.parse(await request.json())
      const doc = await payload.create({ collection: 'deal-briefs', user, overrideAccess: false, data: { ...data, owner: user.id } })
      return Response.json({ doc }, { status: 201 })
    }
    const result = await payload.find({ collection: 'deal-briefs', user, overrideAccess: false,
      sort: '-createdAt', limit: 100, depth: 0 })
    return Response.json({ user: { name: user.name, email: user.email }, docs: result.docs },
      { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const status = message === 'UNAUTHORIZED' ? 401 : message === 'VERIFY_EMAIL' ? 403 : error instanceof z.ZodError ? 400 : 500
    return Response.json({ error: status === 401 ? 'Please sign in again.' : status === 403 ? 'Verify your email, then sign in again.' :
      status === 400 ? 'Check the title, description and amount.' : 'Unable to load your workspace. Please retry.', requestId }, { status })
  }
}
export const GET = (req: Request) => handle(req, false)
export const POST = (req: Request) => handle(req, true)
