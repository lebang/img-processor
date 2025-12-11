<template>
  <div class="images-preview">
    <draggable 
      v-model="localImages"
      item-key="path"
      class="images-grid"
      ghost-class="ghost"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <div class="image-item">
          <div class="image-index">{{ index + 1 }}</div>
          <div class="drag-handle">
            <el-icon><Rank /></el-icon>
          </div>
          <div class="delete-btn" @click.stop="deleteImage(index)">
            <el-icon><Delete /></el-icon>
          </div>
          <div v-if="!element.thumbnail" class="thumbnail-placeholder">
            <el-icon :size="32"><Picture /></el-icon>
            <span>加载中...</span>
          </div>
          <img v-else :src="element.thumbnail" :alt="element.name" />
          <div class="image-name" :title="element.relativePath || element.name">
            {{ element.relativePath || element.name }}
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { Rank, Delete, Picture } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  images: {
    type: Array,
    required: true,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:images', 'order-changed', 'image-deleted'])

// 本地副本用于拖拽
const localImages = ref([...props.images])

// 监听外部 images 变化，同步到本地
watch(() => props.images, (newImages) => {
  localImages.value = [...newImages]
}, { deep: true })

// 拖拽结束时触发
function onDragEnd() {
  emit('update:images', localImages.value)
  emit('order-changed', localImages.value)
}

// 删除图片
function deleteImage(index) {
  const deletedImage = localImages.value[index]
  localImages.value.splice(index, 1)
  emit('update:images', localImages.value)
  emit('image-deleted', deletedImage, index)
}
</script>

<style scoped>
.images-preview {
  width: 100%;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  max-height: 460px;
  overflow-y: auto;
  padding: 8px;
  padding-right: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.image-item {
  position: relative;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: grab;
}

.image-item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-item:active {
  cursor: grabbing;
}

.image-index {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(64, 158, 255, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  z-index: 2;
}

.drag-handle {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 32px;
  background: rgba(245, 108, 108, 0.9);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
  cursor: pointer;
}

.delete-btn:hover {
  background: rgba(220, 38, 38, 1);
}

.image-item:hover .drag-handle,
.image-item:hover .delete-btn {
  opacity: 1;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  color: #909399;
  gap: 8px;
}

.thumbnail-placeholder span {
  font-size: 12px;
}

.image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.image-name {
  padding: 8px;
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

/* 拖拽时的占位符样式 */
.ghost {
  opacity: 0.5;
  background: #c8e6c9;
  border: 2px dashed #4caf50;
}

</style>
