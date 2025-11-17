import "@/index.css"
import { coreModule, definePlugin, requireDepend, Utils } from "delta-comic-core"
import axios from "axios"
import { inRange } from "es-toolkit/compat"
import { pluginName } from "./symbol"
import { config } from "./config"
import { ehStore } from "./store"
import { isString } from "es-toolkit"

import './api'
import { EhPage } from "./api/page"
import Card from "./components/card.vue"
import { UserOutlined } from "@vicons/antd"
import { DrawOutlined, DriveFolderUploadOutlined } from "@vicons/material"
import { eh } from "./api"
const { layout } = requireDepend(coreModule)
const testAxios = axios.create({
  timeout: 10000,
  method: 'GET',
  validateStatus(status) {
    return inRange(status, 199, 499)
  }
})
testAxios.interceptors.response.use(undefined, Utils.request.utilInterceptors.createAutoRetry(testAxios, 2))


definePlugin({
  name: pluginName,
  content: {
    [EhPage.contentType]: {
      itemCard: Card,
      contentPage: EhPage,
      itemTranslator: v => eh.comic.EhItem.create(v),
      layout: layout.Default,

    }
  },
  api: {
    eh: {
      forks: () => [
        'https://e-hentai.org',
        'https://exhentai.org'
      ],
      test: (fork, signal) => testAxios.get(fork, { signal })
    }
  },
  image: {
    forks: {
      ehgt: ['https://ehgt.org'],
      hath: ['https://hath.network']
    },
    test: ''
  },
  user: {
    authorIcon: {
      coser: UserOutlined,
      draw: DrawOutlined,
      uploader: DriveFolderUploadOutlined
    }
  },
  onBooted: ins => {
    ehStore.api.value = Utils.request.createAxios(() => {
      if (!isString(ins.api?.eh)) throw new Error('api not resolved')
      return ins.api.eh
    }, {
      withCredentials: true,
    })
    Utils.eventBus.SharedFunction.define(signal => eh.api.search.getRandomComic(signal), pluginName, 'getRandomProvide')
  },
  otherProgress: [{
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
    },
  }],
  config: [
    config
  ],
})