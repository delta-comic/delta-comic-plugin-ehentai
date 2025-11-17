import type { uni } from "delta-comic-core"
import { eh } from ".."
import { pluginName } from "@/symbol"
import dayjs from 'dayjs'
import { EhPage } from "../page"
import Dompurify from 'dompurify'
import { _ehTranslate } from "../translate"

export const createCommonToItem = async (tr: HTMLTableRowElement) => {
  const bigCategory = <Category><any>Category[<any>tr.querySelector<HTMLDivElement>('.cn')?.innerText]
  const tagsTable = tr.querySelector<HTMLTableElement>('.gl2e>div>a table')!
  const categories = await createCategories(tagsTable, bigCategory)
  const coverEl = tr.querySelector<HTMLImageElement>(' .gl1e img')!
  const id = new URL(tr.querySelector('a')?.href ?? '').pathname.replaceAll('/', '-')
  return new eh.comic.EhItem({
    categories,
    $$plugin: pluginName,
    $$meta: {},
    author: await createAuthors(tr.querySelector<HTMLTableElement>('& table')!),
    title: tr.querySelector<HTMLDivElement>('div.glink')?.innerText ?? '',
    commentSendable: true,
    contentType: EhPage.contentType,
    epLength: '1',
    id,
    thisEp: {
      $$plugin: pluginName,
      index: '1',
      name: ''
    },
    length: tr.querySelector<HTMLDivElement>('.gl3e:nth-child(5)')?.innerText.match(/\d+/)?.[0] ?? '',
    customIsAI: categories.some(v => v.name.includes('AI')),
    cover: {
      $$plugin: pluginName,
      forkNamespace: 'ehgt',
      path: coverEl.src,
      $$meta: {
        width: Number(coverEl.style.width.match(/\d+/)?.[0]),
        height: Number(coverEl.style.height.match(/\d+/)?.[0]),
      }
    },
    likeNumber: RateMap[tr.querySelector<HTMLDivElement>('div.ir')!.style.backgroundPosition],
    updateTime: dayjs(tr.querySelector<HTMLDivElement>(`#posted_${id.split('-').at(-2)}`)?.innerText).toDate().getTime(),
    customIsSafe: checkIsSafe(categories)
  })
}
const RateMap: Record<string, number> = {
  '-64px -21px': 0.5,
  '-64px -1px': 0.5,
  '-48px -21px': 1.5,
  '-48px -1px': 2,
  '-32px -21px': 2.5,
  '-32px -1px': 3,
  '-16px -21px': 3.5,
  '-16px -1px': 4,
  '0px -21px': 4.5,
  '0px -1px': 5,
}

export const createCategories = (table: HTMLTableElement, bigCategory: Category): Promise<uni.item.Category[]> => {
  if (!table) return Promise.resolve([])
  const trs = Array.from(table.querySelectorAll('tr'))
  console.log('-------------create-categories-------------')
  console.log(trs)
  return Promise.all(trs.flatMap(r => {
    let rawGroup = r.querySelector<HTMLTableCellElement>('td.tc')?.innerText ?? ''
    rawGroup = rawGroup.slice(0, -1)
    // const translated = await _ehTranslate.db.group
    const rawTags = Array.from(r.querySelectorAll<HTMLDivElement>('.gt,.gtl'))
    console.log(rawGroup, rawTags)
    return [Promise.resolve({
      group: '',
      name: CategoriesTranslations[bigCategory] ?? '1234',
      search: {
        keyword: `#${Category[bigCategory]}-${bigCategory}#`,
        sort: '',
        source: 'keyword'
      }
    }), ...rawTags.map(async div => (<uni.item.Category>{
      group: rawGroup,
      name: (await _ehTranslate.db.tags.get(div.innerText))?.translate ?? div.innerText,
      search: {
        keyword: `${rawGroup}:${div.innerText}`,
        sort: '',
        source: 'keyword'
      }
    }))]
  }))
}
export const createAuthors = (table: HTMLTableElement): Promise<uni.item.Author[]> => {
  if (!table) return Promise.resolve([])
  const trs = Array.from(table.querySelectorAll('tr'))
  return Promise.all(trs.flatMap(r => {
    const _rawGroup = r.querySelector<HTMLTableCellElement>('td.tc')?.innerText ?? ''
    const rawGroup = <_ehTranslate.EHTNamespaceName>_rawGroup.slice(0, -1)
    if (!(<_ehTranslate.EHTNamespaceName[]>['artist', 'cosplayer', 'group']).includes(rawGroup)) return []
    const rawTags = Array.from(r.querySelectorAll<HTMLDivElement>('.gt,.gtl'))
    return rawTags.map(async div => (<uni.item.Author>{
      $$plugin: pluginName,
      description: rawGroup == 'artist' ? '作者' : (rawGroup == 'group' ? '团队' : 'coser'),
      icon: rawGroup == 'artist' ? 'draw' : 'user',
      label: (await _ehTranslate.db.tags.get(div.innerText))?.translate ?? div.innerText,
      actions: ['search'],
      subscribe: 'tag'
    }))
  }))
}
export enum Category {
  Misc = 1,
  Doujinshi = 2,
  Manga = 4,
  'Artist CG' = 8,
  'Game CG' = 16,
  'Image Set' = 32,
  Cosplay = 64,
  'Asian Porn' = 128,
  'Non-H' = 256,
  Western = 512,
}
export const CategoriesTranslations = {
  [Category.Misc]: '杂项',
  [Category.Doujinshi]: '同人志',
  [Category.Manga]: '漫画',
  [Category['Artist CG']]: '画师CG',
  [Category['Game CG']]: '游戏CG',
  [Category['Image Set']]: '图集',
  [Category.Cosplay]: 'Cosplay',
  [Category['Asian Porn']]: '亚洲色情',
  [Category['Non-H']]: '无H内容',
  [Category.Western]: '西方色情',
}
export const calcCategory = (categories: Category[]) =>
  1023 - categories.reduce((acc, category) => acc | category, 0)

export const createFullToItem = async (gm: Document, id: string, commentsCount: number) => {
  const bigCategory = <Category><any>Category[<any>gm.querySelector<HTMLDivElement>('#gdc>.cs')?.innerText]
  const categories = await createCategories(gm.querySelector<HTMLTableElement>('#taglist>table')!, bigCategory)
  const coverEl = gm.querySelector<HTMLDivElement>('#gd1>div')!
  return new eh.comic.EhItem({
    categories,
    $$plugin: pluginName,
    $$meta: {},
    author: await createAuthors(gm.querySelector<HTMLTableElement>('#taglist>table')!),
    title: gm.querySelector<HTMLHRElement>('#gn')?.innerText ?? '',
    commentSendable: true,
    contentType: EhPage.contentType,
    epLength: '1',
    id,
    thisEp: {
      $$plugin: pluginName,
      index: '1',
      name: ''
    },
    length: gm.querySelector<HTMLParagraphElement>('.gtb>.gpc')?.innerText.match(/\d+/)?.[0] ?? '',
    customIsAI: categories.some(v => v.name.includes('AI')),
    cover: {
      $$plugin: pluginName,
      forkNamespace: 'ehgt',
      path: coverEl.style.backgroundImage.slice(5, -2),
      $$meta: {
        width: Number(coverEl.style.width.match(/\d+/)?.[0]),
        height: Number(coverEl.style.height.match(/\d+/)?.[0]),
      }
    },
    likeNumber: Number(gm.querySelector<HTMLTableColElement>('#rating_label')!.innerText.match(/[\d\.]+/)?.[0] ?? ''),
    updateTime: dayjs(gm.querySelectorAll<HTMLDivElement>('#gdd>table>tbody>tr>.gdt2').item(0).innerText).toDate().getTime(),
    description: {
      type: 'html',
      content: Dompurify.sanitize(gm.getElementById('comment_0')?.innerHTML ?? '')
    },
    customIsSafe: checkIsSafe(categories),
    commentNumber: commentsCount,
  })
}

const checkIsSafe = (categories: uni.item.Category[]) => categories.some(v => [
  CategoriesTranslations[Category["Non-H"]],
  '无露点',
  '无H图片集',
].includes(v.name))