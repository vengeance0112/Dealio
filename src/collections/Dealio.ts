import type { Access, CollectionConfig } from 'payload'

const admin: Access = ({ req }) => req.user?.collection === 'admins'
const own: Access = ({ req }) => req.user?.collection === 'users'
  ? { owner: { equals: req.user.id } } : false

export const DemoScenarios: CollectionConfig = {
  slug: 'demo-scenarios',
  admin: { useAsTitle: 'name', group: 'Dealio demo' },
  access: { read: () => true, create: admin, update: admin, delete: admin },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'state', type: 'json', required: true },
  ],
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: { disableLocalStrategy: true },
  admin: { useAsTitle: 'name', group: 'Dealio accounts' },
  access: {
    create: () => false,
    read: ({ req }) => req.user?.collection === 'users' ? { id: { equals: req.user.id } } : false,
    update: () => false, delete: () => false,
  },
  fields: [
    { name: 'firebaseUid', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
  ],
}

// These records are private briefs, not funded agreements. No client can write payment state.
export const DealBriefs: CollectionConfig = {
  slug: 'deal-briefs',
  admin: { useAsTitle: 'title', group: 'Dealio workspace' },
  access: { read: own, create: ({ req }) => req.user?.collection === 'users', update: () => false, delete: () => false },
  hooks: {
    beforeValidate: [({ data, req, operation }) => {
      if (!data) return data
      if (operation === 'create') {
        if (req.user?.collection !== 'users') throw new Error('Sign in required')
        data.owner = req.user.id
      }
      return data
    }],
  },
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true, index: true,
      access: { create: () => false, update: () => false } },
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    { name: 'description', type: 'textarea', required: true, maxLength: 10000 },
    { name: 'amountCents', type: 'number', required: true, min: 100, max: 100000000,
      validate: (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) || 'Use whole cents' },
  ],
}

export const WebhookEvents: CollectionConfig = {
  slug: 'paypal-events',
  admin: { useAsTitle: 'eventId', group: 'Payment operations' },
  access: { read: admin, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'eventId', type: 'text', unique: true, required: true },
    { name: 'eventType', type: 'text', required: true },
    { name: 'resourceId', type: 'text' },
    { name: 'receivedAt', type: 'date', required: true },
  ],
}
