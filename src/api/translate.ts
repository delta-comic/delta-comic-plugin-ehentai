import { Utils } from "delta-comic-core"
import { Octokit } from '@octokit/rest'
import { useLocalStorage } from "@vueuse/core"
import { Axios } from 'axios'
import pako from 'pako'
import Dexie, { type Table } from "dexie"


export namespace _ehTranslate {
  export interface EHTDatabase {
    head: {
      author: {
        name: string
        email: string
        when: string
      }
      committer: {
        name: string
        email: string
        when: string
      }
      sha: string
      message: string
    }
    version: number
    repo: string
    data: EHTNamespace[]
  }

  export type EHTNamespaceName =
    | 'rows'
    | 'reclass'
    | 'language'
    | 'parody'
    | 'character'
    | 'group'
    | 'artist'
    | 'cosplayer'
    | 'male'
    | 'female'
    | 'mixed'
    | 'other'
    | 'location'
    | 'temp'

  export type EHTNamespaceNameShort = '' | 'r' | 'l' | 'p' | 'c' | 'g' | 'a' | 'cos' | 'm' | 'f' | 'x' | 'o' | 'loc'

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

  const octokit = new Octokit


  export interface EHTranslateDBTags {
    group: string
    raw: string
    translate: string
    description: string
  }
  export interface EHTranslateDBGroup {
    raw: string
    translate: string
  }

  export class TranslateDB extends Dexie {
    public tags!: Table<EHTranslateDBTags, EHTranslateDBTags['raw']>
    public group!: Table<EHTranslateDBGroup, EHTranslateDBGroup['raw']>
    constructor() {
      super('EhTranslateDB')
      this.version(1).stores({
        tags: 'raw, group, translate',
        group: 'raw'
      })
    }
  }
  export const db = new TranslateDB

  export const getIsUpdate = async () => {
    const version = useLocalStorage('eh.db.version', '')
    const { data: repo } = await octokit.repos.getLatestRelease({
      owner: 'EhTagTranslation',
      repo: 'Database'
    })
    const downloadUrl = repo.assets.find(v => v.name == 'db.text.json.gz')
    if (!downloadUrl) throw new Error('未找到资源')
    return { downloadUrl: downloadUrl.browser_download_url, tag: repo.tag_name, isNew: version.value != repo.tag_name }
  }

  export const downloadDatabase = () => Utils.message.createDownloadMessage('更新翻译数据库', async ({ createLoading, createProgress }) => {
    const version = useLocalStorage('eh.db.version', '')
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
      const axios = new Axios()
      const { data: gzip } = await axios.request<Blob>({
        url: downloadUrl,
        responseType: 'blob',
        onDownloadProgress: progressEvent => {
          if (progressEvent.lengthComputable) {
            c.progress = progressEvent.loaded / progressEvent.total! * 100 //实时获取最新下载进度
          }
        }
      })
      const table: EHTDatabase = JSON.parse(pako.ungzip(await gzip.arrayBuffer(), { to: 'string' }))
      return table
    })

    await createLoading('数据库写入', async c => {
      c.retryable = true
      c.description = '写入中'
      await db.tags.bulkPut(table.data.flatMap(group => Object.entries(group.data).flatMap(([raw, tag]) => ({
        group: group.namespace,
        raw,
        translate: tag.name,
        description: tag.intro
      }))))
    })
    version.value = tag
  })
}