import type { Requester } from '@delta-comic/request'
import { shallowRef } from 'vue'
export namespace ehStore {
  export const loginToken = shallowRef('')
  export const api = shallowRef<Requester>()
}