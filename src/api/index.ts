
import { _ehTranslate } from './translate'
import { _ehComic } from './comic'

import { _ehApiSearch } from './api/search'
import { _ehApiComic } from './api/comic'
export namespace eh {
  export import comic = _ehComic
  export import translate = _ehTranslate
}
export namespace eh.api {
  export import search = _ehApiSearch
  export import comic = _ehApiComic
}
window.$api.eh = eh