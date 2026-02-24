import { uni } from '@delta-comic/model'

export namespace _ehComic {
  export class EhItem extends uni.item.Item {
    override like(_signal?: AbortSignal): PromiseLike<boolean> {
      throw new Error('Method not implemented.')
    }
    override report(_signal?: AbortSignal): PromiseLike<any> {
      throw new Error('Method not implemented.')
    }
    override sendComment(_text: string, _signal?: AbortSignal): PromiseLike<any> {
      throw new Error('Method not implemented.')
    }
    constructor(v: uni.item.RawItem) {
      super(v)
    }
  }
}