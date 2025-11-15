<script setup lang='ts'>
import { bikaStore } from '@/store'
import { MD5 } from 'crypto-js'
import { Comp, PluginConfigSearchTabbar, Utils } from 'delta-comic-core'
import { computed } from 'vue'
const $props = defineProps<{
  isActive: boolean
  tabbar: PluginConfigSearchTabbar
}>()
const dataSource = computed(() => Utils.data.PromiseContent.resolve(
  bikaStore.collections.value
    .find(v => MD5(v.title).toString() == $props.tabbar.id)?.$comics ?? []
))
</script>

<template>
  <Comp.Waterfall :source="{ data: dataSource, isEnd: true }" v-slot="{ item }" ref="list">
    <Card :item free-height type="small" />
  </Comp.Waterfall>
</template>