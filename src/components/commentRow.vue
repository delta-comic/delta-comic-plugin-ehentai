<script setup lang='ts'>
import { computed } from 'vue'
import { coreModule, requireDepend, uni } from 'delta-comic-core'
import { bika } from '@/api'
const $props = defineProps<{
  comment: uni.comment.Comment
  item: uni.item.Item
  parentComment?: uni.comment.Comment
}>()
const raw = computed<bika.comment.RawBaseComment>(() => $props.comment.$$meta!.raw)
const rawUploader = computed<bika.user.RawUser | undefined>(() => (<bika.comic.RawFullComic>$props.item.$$meta.comic)?._creator)
const $emit = defineEmits<{
  click: [c: uni.comment.Comment]
  clickUser: [u: uni.user.User]
}>()
defineSlots<{
  default(): void
}>()

const isUploader = computed(() => raw.value._user && rawUploader.value && rawUploader.value._id == raw.value._user._id)

const { comp } = requireDepend(coreModule)
</script>

<template>
  <comp.CommentRow @clickUser="$emit('clickUser', $event)" @click="$emit('click', $event)" :comment :parentComment
    :usernameHighlight="isUploader">
    <template #userExtra>
      <span class="mr-1 text-[11px] text-(--nui-primary-color) font-normal">Lv{{ raw._user?.level }}</span>
      <span class="bg-(--nui-primary-color) rounded text-white text-[9px] px-0.5 py-0.5 -translate-y-0.5"
        v-if="isUploader">UP</span>
    </template>
  </comp.CommentRow>
</template>