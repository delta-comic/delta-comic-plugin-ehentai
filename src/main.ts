import '@/index.css'
import { SharedFunction } from '@delta-comic/core'
import { definePlugin, require } from '@delta-comic/plugin'
import { interceptors, createAxios } from '@delta-comic/request'
import { UserOutlined } from '@vicons/antd'
import { DrawOutlined, DriveFolderUploadOutlined } from '@vicons/material'
import axios from 'axios'
import { isString } from 'es-toolkit'
import { inRange } from 'es-toolkit/compat'

import { eh } from './api'
import './api'
import { mainHost } from './api/fork'
import { initCookie } from './api/header'
import Card from './components/card.vue'
import { config } from './config'
import { TranslateDB } from './db'
import { ehStore } from './store'
import { LayoutPlugin, pluginName } from './symbol'
const { layout } = require(LayoutPlugin)
const testAxios = axios.create({
  timeout: 10000,
  method: 'GET',
  validateStatus(status) {
    return inRange(status, 199, 499)
  }
})
testAxios.interceptors.response.use(undefined, interceptors.createAutoRetry(testAxios, 2))

definePlugin({
  name: pluginName,
  content: {
    [eh.page.EhPage.contentType]: {
      itemCard: Card,
      contentPage: eh.page.EhPage,
      itemTranslator: v => eh.comic.EhItem.create(v),
      layout: layout.Default
    }
  },
  api: { eh: { forks: () => mainHost, test: (fork, signal) => testAxios.get(fork, { signal }) } },
  resource: {
    types: [
      {
        type: 'ehgt',
        urls: ['https://ehgt.org'],
        test: async (url, signal) => {
          return
          const body = await fetch(url + '/g/t.png', { signal })
          if (!body.ok) throw new Error('fail to connect')
        }
      },
      {
        type: 'hath',
        urls: ['http://hath.network'],
        test: async (url, signal) => {
          const body = await fetch(url, { signal })
          if (!body.ok) throw new Error('fail to connect')
        }
      }
    ],
    process: { getImage: eh.image.getImage }
  },
  user: {
    authorIcon: { coser: UserOutlined, draw: DrawOutlined, uploader: DriveFolderUploadOutlined }
  },
  onBooted: async ins => {
    if (!isString(ins.api?.eh)) throw new Error('api not resolved')
    await initCookie()
    ehStore.api.value = createAxios(
      () => ins.api!.eh!.toString()!,
      { withCredentials: true, responseType: 'document' },
      axios => {
        // axios.interceptors.response.use(res => {
        //   if (!isString(res.data)) return res
        //   if (res.config.responseType != 'document') return res
        //   const parser = new DOMParser()
        //   console.debug('eh request', res.data)
        //   return { ...res, data: parser.parseFromString(res.data, 'text/html') }
        // })
        return axios
      }
    )
    SharedFunction.define(
      signal => eh.api.search.getRandomComic(signal),
      pluginName,
      'getRandomProvide'
    )
  },
  otherProgress: [
    {
      name: '更新翻译数据',
      async call(setDescription) {
        setDescription('检测更新...')
        const updating = (async () => {
          try {
            const { isNew } = await TranslateDB.getIsUpdate()
            if (isNew) {
              setDescription('更新中')
              await TranslateDB.downloadDatabase()
            }
          } catch (error) {
            console.warn(error)
          }
        })()
        if (TranslateDB.checkIsEmpty()) await updating
      }
    }
  ],
  config: [config]
})