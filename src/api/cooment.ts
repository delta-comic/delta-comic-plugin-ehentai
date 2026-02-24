import { pluginName } from "@/symbol"
import { Stream, uni } from "@delta-comic/model"
export namespace _ehComment {
  export class Comment extends uni.comment.Comment {
    public override sender: uni.user.User
    public override like(_signal?: AbortSignal): PromiseLike<boolean> {
      throw new Error("Method not implemented.")
    }
    public override report(_signal?: AbortSignal): PromiseLike<any> {
      throw new Error("Method not implemented.")
    }
    public override sendComment(_text: string, _signal?: AbortSignal): PromiseLike<any> {
      throw new Error("Method not implemented.")
    }
    public override children = Stream.create<never>(async function* () { })

    constructor(v: uni.comment.RawComment) {
      super(v)
      this.sender = v.sender
    }
  }
  export class CommentUser extends uni.user.User {
    override customUser = {}
    override $$plugin = pluginName
    constructor(v: uni.user.RawUser) {
      super(v)
    }
  }
}