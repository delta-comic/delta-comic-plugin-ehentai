import { ehStore } from "@/store"
import type { uni } from "@delta-comic/model"

export const getImage: uni.resource.ProcessInstance = async (nowPath, resource) => {
  // like assets/example.detail.html
  const res = await ehStore.api.value!.get<Document>(`${resource.getThisFork()}/${nowPath}`)
  const url = res.querySelector<HTMLImageElement>('#img')!.src
  return [url, true]
}