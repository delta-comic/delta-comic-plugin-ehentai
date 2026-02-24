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
import { EhPage } from './api/page'
import Card from './components/card.vue'
import { config } from './config'
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
    [EhPage.contentType]: {
      itemCard: Card,
      contentPage: EhPage,
      itemTranslator: v => eh.comic.EhItem.create(v),
      layout: layout.Default
    }
  },
  api: { eh: { forks: () => mainHost, test: (fork, signal) => testAxios.get(fork, { signal }) } },
  image: { forks: { ehgt: ['https://ehgt.org'], hath: ['https://hath.network'] }, test: '' },
  user: {
    authorIcon: { coser: UserOutlined, draw: DrawOutlined, uploader: DriveFolderUploadOutlined }
  },
  onBooted: async ins => {
    if (!isString(ins.api?.eh)) throw new Error('api not resolved')
    await initCookie()
    ehStore.api.value = createAxios(() => ins.api!.eh!.toString()!, {
      withCredentials: true,
      responseType: 'document'
    })
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
        try {
          const { isNew } = await eh.translate.getIsUpdate()
          if (isNew) {
            setDescription('更新中')
            await eh.translate.downloadDatabase()
          }
        } catch (error) {
          console.warn(error)
        }
      }
    }
  ],
  config: [config]
})