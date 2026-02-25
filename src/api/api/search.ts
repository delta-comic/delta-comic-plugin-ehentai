import { PromiseContent, Stream } from '@delta-comic/model'
import { random } from 'es-toolkit/compat'

import { ehStore } from '@/store'

import type { eh } from '..'
import { createCommonToItem } from './utils'

export namespace _ehApiSearch {
  export const createSearchStream = (category?: string[], keyword?: string) =>
    Stream.create<eh.comic.EhItem>(async function* (signal, that) {
      let absolutePage = NaN
      let isDone = false
      while (true) {
        if (isDone) return
        const res = await ehStore.api.value!.get<Document>('/', {
          params: {
            next: Number.isNaN(absolutePage) ? undefined : absolutePage,
            f_search: keyword ? encodeURIComponent(keyword) : undefined,
            f_cats: category
          },
          signal,
          responseType: 'document'
        })
        const html = res.querySelector('body')!
        const cards = Array.from(html.querySelectorAll<HTMLTableRowElement>('.itg.glte>tbody>tr'))
        const nextHref = html.querySelector<HTMLAnchorElement>('#unext')?.href
        if (!nextHref) isDone = true
        absolutePage = Number(new URL(nextHref ?? '').searchParams.get('next'))
        that.pageSize.value = cards.length
        that.page.value = absolutePage + 1
        if (!Number.isNaN(that.pages.value)) that.pages.value = absolutePage + 1
        that.total.value = Number(
          html.querySelector<HTMLParagraphElement>('.searchtext>p')?.innerText.match(/\d+/)?.[0]
        )
        console.log('body:', html, 'cards:', cards)
        yield await Promise.all(cards.map(c => createCommonToItem(c)))
      }
    })
  export const getRandomComic = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => {
    const res = await ehStore.api.value!.get<Document>('/', {
      signal,
      params: { next: `36${random(0, 5)}0${random(0, 999)}` },
      responseType: 'document'
    })
    console.log('random', res)
    const body = res.querySelector('body')!
    const cards = Array.from(
      body.querySelectorAll<HTMLTableRowElement>('.itg.glte>tbody>tr:has(td.gl1e)') ?? []
    )
    console.log('cards:', cards)
    return await Promise.all(cards.map(c => createCommonToItem(c)))
  })
}