import { Stream, uni, type RStream } from '@delta-comic/model'
import { require } from '@delta-comic/plugin'

import { pluginName, LayoutPlugin } from '@/symbol'

import { eh } from '.'

const { view, model } = require(LayoutPlugin)

export class EhPage extends model.ContentImagePage {
  override comments: RStream<uni.comment.Comment> = Stream.create<uni.comment.Comment>(
    async function* () {
      yield []
      return
    }
  )
  public static contentType = uni.content.ContentPage.contentPage.toString([pluginName, 'comic'])
  override contentType = uni.content.ContentPage.contentPage.toJSON(EhPage.contentType)
  override loadAll(signal?: AbortSignal) {
    this.pid.resolve(this.id)
    return this.detail.content.loadPromise(
      eh.api.comic.getComicInfo(this.id, signal).then(info => {
        this.comments = Stream.create<uni.comment.Comment>(async function* () {
          yield info.comment
          return
        })
        return info.info
      })
    )
  }
  override reloadAll(_signal?: AbortSignal): Promise<any> {
    throw new Error('Method not implemented.')
  }
  override plugin = pluginName
  override loadAllOffline(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  override exportOffline(): Promise<any> {
    throw new Error('Method not implemented.')
  }
  override ViewComp = view.Image as uni.content.ViewComp
  constructor(preload: uni.content.PreloadValue, id: string, ep: string) {
    super(preload, id, ep)
  }
}