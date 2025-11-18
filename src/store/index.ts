import { shallowRef } from "vue"
import type { IFrameRequester } from "@/utils/htmlRequester"
export namespace ehStore {
  
  export const loginToken = shallowRef('')
  export const api = shallowRef<IFrameRequester>()
}