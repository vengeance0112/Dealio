'use client'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase's web configuration is public; authorization is enforced on the server.
export function firebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp({
    apiKey: 'AIzaSyCoKr6t7czlfFYPQZjcBD4GI_g2SufR_mQ',
    authDomain: 'dealio-effe8.firebaseapp.com',
    projectId: 'dealio-effe8',
    storageBucket: 'dealio-effe8.firebasestorage.app',
    messagingSenderId: '317101413871',
    appId: '1:317101413871:web:239ce8740042050033121a',
  })
  return getAuth(app)
}
