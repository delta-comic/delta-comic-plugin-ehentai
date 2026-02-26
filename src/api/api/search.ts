import { PromiseContent, Stream } from '@delta-comic/model'
import { pad } from 'es-toolkit'
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
  let totalPages = NaN
  export const getRandomComic = PromiseContent.fromAsyncFunction(async (signal?: AbortSignal) => {
    if (Number.isNaN(totalPages))
      totalPages = Number(
        (await ehStore.api.value!.get<Document>('/', { signal, responseType: 'document' }))
          .querySelector<HTMLAnchorElement>('.itg.glte>tbody>tr:first-child a:nth-child(2)')
          ?.href.split('/')[4]
      )

    const page = totalPages.toString()
    const res = await ehStore.api.value!.get<Document>('/', {
      signal,
      params: {
        next: page.slice(0, -3) + pad(random(0, Number(page.slice(-3)), false).toString(), 3, '0')
      },
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