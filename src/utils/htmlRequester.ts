import { AxiosRequestConfig, GenericAbortSignal, CanceledError } from 'axios'
export class IFrameRequester {
  private createIFrame(src: string) {
    const iframe = document.createElement('iframe') as HTMLIFrameElement & { [Symbol.dispose](): void }
    iframe.hidden = true
    iframe[Symbol.dispose] = () => {
      iframe.remove()
    }
    iframe.src = `${this.config}/${src}`
    document.body.appendChild(iframe)
    if (iframe.contentWindow && this.config.cookie) {
      for (const key in this.config.cookie) {
        const element = this.config.cookie[key]
        iframe.contentWindow.document.cookie = `${key}=${element};`
      }
    }
    return iframe
  }
  public async get(path: string = '/', config: AxiosRequestConfig = {}) {
    path += this.createParams({ ...config.params, ...config.data })
    using iframe = this.createIFrame(path)
    const window = await this.waitIFrame(iframe, config.signal)
    return window.document
  }
  private createParams(params: Record<string, any>) {
    let path = '?'
    for (const key in params) {
      const element = params[key]
      path += `${key}=${element}&`
    }
    return path.slice(0, -1)
  }
  private waitIFrame(iframe: HTMLIFrameElement, signal?: GenericAbortSignal) {
    const { promise, ...controller } = Promise.withResolvers<Window>()
    iframe.addEventListener('load', () => {
      controller.resolve(iframe.contentWindow!)
    })
    if (signal) signal.onabort = () => controller.reject(new CanceledError('canceled'))

    iframe.addEventListener('error', (ev) => {
      controller.reject(ev.error)
    })
    return promise
  }
  constructor(public config: Partial<{
    baseUrl: string
    cookie?: Record<string, string>
  }> = {}) {

  }
}