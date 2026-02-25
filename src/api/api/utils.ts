import type { uni } from '@delta-comic/model'
import dayjs from 'dayjs'
import Dompurify from 'dompurify'

import { db, type TranslateDB } from '@/db'
import { pluginName } from '@/symbol'

import { eh } from '..'

export const createCommonToItem = async (tr: HTMLTableRowElement) => {
  const bigCategory = tr.querySelector<HTMLDivElement>('.cn')?.innerText as Category

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
    contentType: eh.page.EhPage.contentType,
    epLength: '1',
    id,
    thisEp: { $$plugin: pluginName, index: '1', name: '' },
    length:
      tr.querySelector<HTMLDivElement>('.gl3e:nth-child(5)')?.innerText.match(/\d+/)?.[0] ?? '',
    customIsAI: categories.some(v => v.name.includes('AI')),
    cover: {
      $$plugin: pluginName,
      forkNamespace: 'ehgt',
      path: coverEl.src,
      $$meta: {
        width: Number(coverEl.style.width.match(/\d+/)?.[0]),
        height: Number(coverEl.style.height.match(/\d+/)?.[0])
      }
    },
    likeNumber: RateMap[tr.querySelector<HTMLDivElement>('div.ir')!.style.backgroundPosition],
    updateTime: dayjs(
      tr.querySelector<HTMLDivElement>(`#posted_${id.split('-').at(-2)}`)?.innerText
    )
      .toDate()
      .getTime(),
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
  '0px -1px': 5
}

export const createCategories = async (
  table: HTMLTableElement,
  bigCategory: Category
): Promise<uni.item.Category[]> => {
  if (!table) return Promise.resolve([])
  const trs = Array.from(table.querySelectorAll('tr'))
  const tags = [
    {
      group: '',
      name: CategoriesTranslations[bigCategory] ?? '<BigCategory>',
      search: {
        keyword: `#${CategoryNumber[bigCategory]}-${bigCategory}#`,
        sort: '',
        source: 'keyword'
      }
    },
    ...(await Promise.all(
      trs.flat().flatMap(r => {
        const tagEls = Array.from(r.querySelectorAll<HTMLDivElement>('.gt,.gtl'))
        return tagEls.map(async div => {
          if (!div.title) var [group, key] = div.id.slice(3).split(':')
          else var [group, key] = div.title.split(':')
          const tagName = key.replaceAll('_', ' ').split(':')
          const category: uni.item.Category = {
            group:
              (
                await db.value
                  .selectFrom('translate_group')
                  .where('raw', '=', group)
                  .select('translate')
                  .executeTakeFirst()
              )?.translate ?? group,
            name:
              (
                await db.value
                  .selectFrom('translate_key')
                  .where('group', '=', tagName[0])
                  .where('raw', '=', tagName[1])
                  .select('translate')
                  .executeTakeFirst()
              )?.translate ?? key.replaceAll('_', ' '),
            search: { keyword: div.title, sort: '', source: 'keyword' }
          }
          return category
        })
      })
    ))
  ]
  return tags
}
export const createAuthors = async (table: HTMLTableElement): Promise<uni.item.Author[]> => {
  const categories = await createCategories(table, Category.Cosplay)
  const rawAuthors = categories.filter(c =>
    (<TranslateDB.EHTNamespaceName[]>['artist', 'cosplayer', 'group']).some(v =>
      c.search.keyword.startsWith(v)
    )
  )
  return Promise.all(
    rawAuthors.map(
      async cate =>
        <uni.item.Author>{
          $$plugin: pluginName,
          description: cate.search.keyword.startsWith('artist')
            ? '作者'
            : cate.search.keyword.startsWith('group')
              ? '团队'
              : 'coser',
          icon: cate.search.keyword.startsWith('artist') ? 'draw' : 'user',
          label:
            (
              await (async () => {
                const [group, raw] = cate.name.replaceAll('_', ' ').split(':')
                return await db.value
                  .selectFrom('translate_key')
                  .where('group', '=', group)
                  .where('raw', '=', raw)
                  .select('translate')
                  .executeTakeFirst()
              })()
            )?.translate ?? cate.name,
          actions: ['search'],
          subscribe: 'tag'
        }
    )
  )
}

export enum Category {
  Misc = 'Misc',
  Doujinshi = 'Doujinshi',
  Manga = 'Manga',
  ArtistCG = 'Artist CG',
  GameCG = 'Game CG',
  ImageSet = 'Image Set',
  Cosplay = 'Cosplay',
  AsianPorn = 'Asian Porn',
  NonH = 'Non-H',
  Western = 'Western'
}
export const CategoryNumber: Record<Category, number> = {
  [Category.Misc]: 1,
  [Category.Doujinshi]: 2,
  [Category.Manga]: 4,
  [Category.ArtistCG]: 8,
  [Category.GameCG]: 16,
  [Category.ImageSet]: 32,
  [Category.Cosplay]: 64,
  [Category.AsianPorn]: 128,
  [Category.NonH]: 256,
  [Category.Western]: 512
}
export const CategoriesTranslations: Record<Category, string> = {
  [Category.Misc]: '杂项',
  [Category.Doujinshi]: '同人志',
  [Category.Manga]: '漫画',
  [Category.ArtistCG]: '画师CG',
  [Category.GameCG]: '游戏CG',
  [Category.ImageSet]: '图集',
  [Category.Cosplay]: 'Cosplay',
  [Category.AsianPorn]: '亚洲色情',
  [Category.NonH]: '无H内容',
  [Category.Western]: '西方色情'
}
export const calcCategory = (categories: Category[]) =>
  1023 - categories.reduce((acc, category) => acc | CategoryNumber[category], 0)

export const createFullToItem = async (gm: Document, id: string, commentsCount: number) => {
  const bigCategory = <Category>gm.querySelector<HTMLDivElement>('#gdc>.cs')?.innerText

  const categories = await createCategories(
    gm.querySelector<HTMLTableElement>('#taglist>table')!,
    bigCategory
  )
  const coverEl = gm.querySelector<HTMLDivElement>('#gd1>div')!
  return new eh.comic.EhItem({
    categories,
    $$plugin: pluginName,
    $$meta: {},
    author: await createAuthors(gm.querySelector<HTMLTableElement>('#taglist>table')!),
    title: gm.querySelector<HTMLHRElement>('#gn')?.innerText ?? '',
    commentSendable: true,
    contentType: eh.page.EhPage.contentType,
    epLength: '1',
    id,
    thisEp: { $$plugin: pluginName, index: '1', name: '' },
    length: gm.querySelector<HTMLParagraphElement>('.gtb>.gpc')?.innerText.match(/\d+/)?.[0] ?? '',
    customIsAI: categories.some(v => v.name.includes('AI')),
    cover: {
      $$plugin: pluginName,
      forkNamespace: 'ehgt',
      path: coverEl.style.backgroundImage.slice(5, -2),
      $$meta: {
        width: Number(coverEl.style.width.match(/\d+/)?.[0]),
        height: Number(coverEl.style.height.match(/\d+/)?.[0])
      }
    },
    likeNumber: Number(
      gm.querySelector<HTMLTableColElement>('#rating_label')!.innerText.match(/[\d\.]+/)?.[0] ?? ''
    ),
    updateTime: dayjs(
      gm.querySelectorAll<HTMLDivElement>('#gdd>table>tbody>tr>.gdt2').item(0).innerText
    )
      .toDate()
      .getTime(),
    description: {
      type: 'html',
      content: Dompurify.sanitize(gm.getElementById('comment_0')?.innerHTML ?? '')
    },
    customIsSafe: checkIsSafe(categories),
    commentNumber: commentsCount
  })
}

const checkIsSafe = (categories: uni.item.Category[]) =>
  categories.some(v =>
    [CategoriesTranslations[Category.NonH], '无露点', '无H图片集'].includes(v.name)
  )