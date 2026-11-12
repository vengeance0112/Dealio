import 'server-only'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function appIdentity(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) throw new Error('UNAUTHORIZED')
  const app = getApps().find(a => a.name === 'dealio') ??
    initializeApp({ projectId: 'dealio-effe8' }, 'dealio')
  let claims
  try { claims = await getAuth(app).verifyIdToken(token) } catch { throw new Error('UNAUTHORIZED') }
  if (!claims.email || !claims.email_verified) throw new Error('VERIFY_EMAIL')
  const payload = await getPayload({ config })
  // Trusted identity synchronization only: there is no app user before this point.
  const existing = await payload.find({ collection: 'users', overrideAccess: true,
    where: { firebaseUid: { equals: claims.uid } }, limit: 1 })
  let user = existing.docs[0]
  if (!user) {
    try {
      user = await payload.create({ collection: 'users', overrideAccess: true,
        data: { firebaseUid: claims.uid, email: claims.email, name: claims.name || claims.email.split('@')[0] } })
    } catch {
      user = (await payload.find({ collection: 'users', overrideAccess: true,
        where: { firebaseUid: { equals: claims.uid } }, limit: 1 })).docs[0]
      if (!user) throw new Error('Identity sync failed')
    }
  }
  return { payload, user: { ...user, collection: 'users' as const } }
}
