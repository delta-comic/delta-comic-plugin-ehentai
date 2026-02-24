import { PromiseContent } from '@delta-comic/model'
import dayjs from 'dayjs'
import DOMPurify from 'dompurify'

import { ehStore } from '@/store'
import { pluginName } from '@/symbol'

import { _ehComment } from '../cooment'
import { createFullToItem } from './utils'

export namespace _ehApiComic {
  export const getComicInfo = PromiseContent.fromAsyncFunction(
    async (id: string, signal?: AbortSignal) => {
      const html = await ehStore.api.value!.get<Document>(id.replaceAll('-', '/'), {
        params: { hc: 1, nw: 'session' },
        // cookie nw=1
        signal
      })
      const comments = Array.from(html.querySelectorAll<HTMLDivElement>('#cdiv>.c1'))
      return {
        info: createFullToItem(html, id, comments.length),
        comment: comments.map(
          v =>
            new _ehComment.Comment({
              $$plugin: pluginName,
              childrenCount: 0,
              content: {
                type: 'html',
                text: DOMPurify.sanitize(v.querySelector('.c6')?.innerHTML ?? '')
              },
              id: v.querySelector('.c6')?.id ?? '',
              isLiked: false,
              isTop: false,
              reported: false,
              time: dayjs(
                v.querySelector<HTMLDivElement>('.c3')?.innerText ?? '',
                'Posted on DD MMMM YYYY, HH:mm by:'
              )
                .toDate()
                .getTime(),
              sender: new _ehComment.CommentUser({
                $$plugin: pluginName,
                id: v.querySelector<HTMLAnchorElement>('.c3>a')?.innerText ?? '',
                name: v.querySelector<HTMLAnchorElement>('.c3>a')?.innerText ?? ''
              }),
              likeCount: Number(
                v.querySelector<HTMLAnchorElement>('.c5.nosel>span')?.innerText ?? '0'
              ) //c5 nosel
            })
        )
      }
    }
  )
}