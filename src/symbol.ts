import { declareDepType, type DependDefine } from '@delta-comic/plugin'
import type { LayoutLib } from 'delta-comic-plugin-layout'
export const LayoutPlugin: DependDefine<LayoutLib> = declareDepType<LayoutLib>('layout')

export const pluginName = 'ehentai'