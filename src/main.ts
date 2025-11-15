import "@/index.css"
import { coreModule, definePlugin, requireDepend, Utils } from "delta-comic-core"
import axios from "axios"
import { inRange } from "es-toolkit/compat"
import { pluginName } from "./symbol"
import { config } from "./config"
import { main } from "./api/forks"
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
  api: {
    eh: {
      forks: () => main,
      test: (fork, signal) => testAxios.get(fork, { signal })
    }
  },
  onBooted: ins => {

  },
  otherProgress: [],
  config: [
    config
  ],

})