import { _ehApiComic } from './api/comic'
import { _ehApiSearch } from './api/search'
import { _ehComic } from './comic'
import { _ehImage } from './image'
import { _ehPage } from './page'
export namespace eh {
  export import comic = _ehComic
  export import page = _ehPage
  export import image = _ehImage
}
export namespace eh.api {
  export import search = _ehApiSearch
  export import comic = _ehApiComic
}
window.$api.eh = eh