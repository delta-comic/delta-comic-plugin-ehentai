import { CORSFetch } from 'tauri-plugin-better-cors-fetch'

import { mainHost } from './fork'
export const initCookie = async () => {
  for (const url of mainHost) {
    await CORSFetch.setCookieByParts(url, 'sl', 'dm_2', {
      path: '/',
      sameSite: 'Lax',
      secure: true
    })
    await CORSFetch.setCookieByParts(url, 'ns', 'session', {
      path: '/',
      sameSite: 'Lax',
      secure: true
    })
  }
}