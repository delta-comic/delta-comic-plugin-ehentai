import { useNativeStore } from '@delta-comic/db'
import { appConfig, useConfig } from '@delta-comic/plugin'
import { createDownloadMessage } from '@delta-comic/ui'
import { Octokit } from '@octokit/rest'
import axios from 'axios'
import { isEmpty } from 'es-toolkit/compat'
import type { Selectable } from 'kysely'
import * as pako from 'pako'

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

const version = useNativeStore(pluginName, 'translate_version', { tag: '' })

export const checkIsEmpty = () => version.value.tag == ''

export const getIsUpdate = async () => {
  const octokit = useOctokit()
  const { data: repo } = await octokit.rest.repos.getLatestRelease({
    owner: 'EhTagTranslation',
    repo: 'Database'
  })
  const downloadUrl = repo.assets.find(v => v.name == 'db.text.json.gz')
  if (!downloadUrl) throw new Error('未找到资源')
  return {
    downloadUrl: downloadUrl.browser_download_url,
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
      const { data: gzip } = await axios.request<Blob>({
        url: downloadUrl,
        responseType: 'blob',
        onDownloadProgress: progressEvent => {
          if (progressEvent.lengthComputable) {
            c.progress = (progressEvent.loaded / progressEvent.total!) * 100 //实时获取最新下载进度
          }
        }
      })
      const table: EHTDatabase = JSON.parse(pako.ungzip(await gzip.arrayBuffer(), { to: 'string' }))
      return table
    })

    await createLoading('数据库写入', async c => {
      c.retryable = true
      c.description = '写入中'
      const { db } = await import('.')
      for (const tag of table.data.flatMap(group =>
        Object.entries(group.data).flatMap(([raw, tag]) => ({
          group: group.namespace,
          raw,
          translate: tag.name,
          description: tag.intro
        }))
      )) {
        await db.value.replaceInto('translate_key').values(tag).execute()
      }
    })
    version.value.tag = tag
  })