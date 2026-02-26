import { useNativeStore } from '@delta-comic/db'
import { SourcedKeyMap } from '@delta-comic/model'
import { appConfig, useConfig } from '@delta-comic/plugin'
import { createDownloadMessage } from '@delta-comic/ui'
import { Octokit } from '@octokit/rest'
import axios from 'axios'
// import { isString } from 'es-toolkit'
import { isEmpty } from 'es-toolkit/compat'
import type { Selectable } from 'kysely'
// import * as pako from 'pako'

import { pluginName } from '@/symbol'

export namespace Tag {
  export interface Table {
    group: string
    raw: string
    translate: string
    description: string
  }
  export type Item = Selectable<Table>
}

export namespace Group {
  export interface Table {
    raw: string
    translate: string
  }
  export type Item = Selectable<Table>
}

export interface EHTDatabase {
  head: {
    author: { name: string; email: string; when: string }
    committer: { name: string; email: string; when: string }
    sha: string
    message: string
  }
  version: number
  repo: string
  data: EHTNamespace[]
}

export enum EHTNamespaceName {
  Row = 'rows',
  ReClass = 'reclass',
  Language = 'language',
  Parody = 'parody',
  Character = 'character',
  Group = 'group',
  Artist = 'artist',
  Cosplayer = 'cosplayer',
  Male = 'male',
  Female = 'female',
  Mixed = 'mixed',
  Other = 'other',
  Location = 'location',
  Temp = 'temp'
}

export enum EHTNamespaceNameShort {
  Row = '',
  ReClass = 'r',
  Language = 'l',
  Parody = 'p',
  Character = 'c',
  Group = 'g',
  Artist = 'a',
  Cosplayer = 'cos',
  Male = 'm',
  Female = 'f',
  Mixed = 'x',
  Other = 'o',
  Location = 'loc',
  Temp = 't'
}

export interface EHTNamespace {
  namespace: EHTNamespaceName
  count: number
  data: Record<string, EHTTag>
}

export interface EHTTag {
  name: string
  intro: string
  links: string
}

export const useOctokit = () => {
  try {
    var config = useConfig().$load(appConfig).value.githubToken
  } catch (error) {
    console.error('fail to get github token', error)
    var config = ''
  }

  return new Octokit({ auth: isEmpty(config) ? undefined : config })
}
window.$api.ehOctokit = useOctokit

const version = useNativeStore(pluginName, 'translate_version', { tag: '' })

export const checkIsEmpty = async () => {
  console.debug('version.value.tag', version.value.tag)
  if (version.value.tag == '') return true
  const { db } = await import('.')

  const { count: tagCount } = await db.value
    .selectFrom('translate_tag')
    .select(c => c.fn.countAll().as('count'))
    .executeTakeFirstOrThrow()
  console.debug('tagCount', tagCount)
  if (tagCount == 0) return true

  const { count: groupCount } = await db.value
    .selectFrom('translate_group')
    .select(c => c.fn.countAll().as('count'))
    .executeTakeFirstOrThrow()
  console.debug('groupCount', groupCount)
  if (groupCount == 0) return true

  return false
}

export const getIsUpdate = async () => {
  const octokit = useOctokit()
  let { data: repo } = await octokit.repos.getLatestRelease({
    owner: 'EhTagTranslation',
    repo: 'Database'
  })
  return {
    downloadUrl: `https://raw.githubusercontent.com/EhTagTranslation/Database/refs/heads/release/db.text.json`,
    tag: repo.tag_name,
    isNew: version.value.tag != repo.tag_name
  }
}

export const downloadDatabase = () =>
  createDownloadMessage('更新翻译数据库', async ({ createLoading, createProgress }) => {
    const { downloadUrl, tag } = await createLoading('获取仓库信息', async c => {
      c.retryable = true
      c.description = '读取中'
      const { downloadUrl, tag, isNew } = await getIsUpdate()
      if (!isNew) throw new Error('已是最新版本')
      return { downloadUrl, tag }
    })
    const table = await createProgress('下载归档文件', async c => {
      c.retryable = true
      c.description = '下载中'
      const { data: table } = await axios.request<EHTDatabase>({
        url: downloadUrl,
        responseType: 'json',
        onDownloadProgress: progressEvent => {
          if (progressEvent.lengthComputable) {
            c.progress = (progressEvent.loaded / progressEvent.total!) * 100 //实时获取最新下载进度
          }
        }
      })
      // const table: EHTDatabase = JSON.parse(pako.ungzip(await gzip.arrayBuffer(), { to: 'string' }))
      return table
    })

    await createLoading('数据库写入', async c => {
      c.retryable = true
      c.description = '写入中'
      const { db } = await import('.')
      await db.value
        .replaceInto('translate_tag')
        .values(
          table.data.flatMap(group =>
            Object.entries(group.data).flatMap(([raw, tag]) => ({
              group: group.namespace,
              raw,
              translate: tag.name,
              description: tag.intro
            }))
          )
        )
        .execute()
    })
    version.value.tag = tag
  })

export const tagTranslateCache = SourcedKeyMap.create<[group: string, tag: string], string>(':')
export const getTagTranslation = async (group: string, tag: string) => {
  tag = tag.replaceAll(' ', '_')
  const { db } = await import('.')
  const cachedTranslation = tagTranslateCache.get([group, tag])
  if (!cachedTranslation) {
    const { translate } = (await db.value
      .selectFrom('translate_tag')
      .where('group', '=', group)
      .where('raw', '=', tag)
      .select('translate')
      .executeTakeFirst()) ?? { translate: tag }
    tagTranslateCache.set([group, tag], translate)
    return translate
  }
  return cachedTranslation
}

export const groupTranslateCache = new Map<string, string>()
export const getGroupTranslation = async (group: string) => {
  const { db } = await import('.')
  const cachedTranslation = groupTranslateCache.get(group)
  if (!cachedTranslation) {
    const { translate } = (await db.value
      .selectFrom('translate_group')
      .where('raw', '=', group)
      .select('translate')
      .executeTakeFirst()) ?? { translate: group }
    groupTranslateCache.set(group, translate)
    return translate
  }
  return cachedTranslation
}