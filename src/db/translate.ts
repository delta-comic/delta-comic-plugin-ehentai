import type { Selectable } from 'kysely'

export namespace Tag {
  export interface Table {
    group: string
    raw: string
    translate: string
    description: string
  }
  export type Item = Selectable<Table>
}

export namespace Group {
  export interface Table {
    raw: string
    translate: string
  }
  export type Item = Selectable<Table>
}

export interface EHTDatabase {
  head: {
    author: { name: string; email: string; when: string }
    committer: { name: string; email: string; when: string }
    sha: string
    message: string
  }
  version: number
  repo: string
  data: EHTNamespace[]
}

export enum EHTNamespaceName {
  Row = 'rows',
  ReClass = 'reclass',
  Language = 'language',
  Parody = 'parody',
  Character = 'character',
  Group = 'group',
  Artist = 'artist',
  Cosplayer = 'cosplayer',
  Male = 'male',
  Female = 'female',
  Mixed = 'mixed',
  Other = 'other',
  Location = 'location',
  Temp = 'temp'
}

export enum EHTNamespaceNameShort {
  Row = '',
  ReClass = 'r',
  Language = 'l',
  Parody = 'p',
  Character = 'c',
  Group = 'g',
  Artist = 'a',
  Cosplayer = 'cos',
  Male = 'm',
  Female = 'f',
  Mixed = 'x',
  Other = 'o',
  Location = 'loc',
  Temp = 't'
}

export interface EHTNamespace {
  namespace: EHTNamespaceName
  count: number
  data: Record<string, EHTTag>
}

export interface EHTTag {
  name: string
  intro: string
  links: string
}