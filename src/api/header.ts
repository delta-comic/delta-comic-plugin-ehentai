import { CapacitorCookies } from '@capacitor/core'
import { mainHost } from './fork'
export const initCookie = () => {
  const promises = new Array<Promise<void>>()
  for (const url of mainHost) {
    promises.push(CapacitorCookies.setCookie({
      key: 'sl',
      value: 'dm_2',
      url
    }))
    promises.push(CapacitorCookies.setCookie({
      key: 'ns',
      value: 'session',
      url
    }))
  }
  return Promise.all(promises)
}