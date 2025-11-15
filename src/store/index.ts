import { shallowRef } from "vue"
import { Utils } from 'delta-comic-core'
export namespace ehStore {
  
  export const loginToken = shallowRef('')
  export const api = shallowRef<Utils.request.Requester>()
}