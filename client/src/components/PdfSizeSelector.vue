<template>
  <div class="pdf-size-dropdown" v-click-outside="closeDropdown">
    <button 
      class="dropdown-trigger"
      @click="showDropdown = !showDropdown"
    >
      <span>{{ currentLabel }}</span>
      <el-icon :class="{ 'rotate-180': showDropdown }"><ArrowDown /></el-icon>
    </button>
    
    <transition name="dropdown">
      <div class="dropdown-menu" v-if="showDropdown">
        <button 
          class="dropdown-item"
          :class="{ active: !modelValue }"
          @click="selectSize(false)"
        >
          A4 标准尺寸
        </button>
        <button 
          class="dropdown-item"
          :class="{ active: modelValue }"
          @click="selectSize(true)"
        >
          图片原始尺寸
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

// 定义props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// 定义emits
const emit = defineEmits(['update:modelValue'])

// 下拉菜单状态
const showDropdown = ref(false)

// 当前选中项的显示文本
const currentLabel = computed(() => {
  return props.modelValue ? '图片原始尺寸' : 'A4 标准尺寸'
})

// 选择尺寸
const selectSize = (fitToImage) => {
  emit('update:modelValue', fitToImage)
  showDropdown.value = false
}

// 关闭下拉菜单
const closeDropdown = () => {
  showDropdown.value = false
}

// 自定义指令：点击外部关闭
const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.pdf-size-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  justify-content: space-between;
}

.dropdown-trigger:hover {
  border-color: #409eff;
  color: #409eff;
}

.dropdown-trigger .el-icon {
  transition: transform 0.3s ease;
}

.dropdown-trigger .el-icon.rotate-180 {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
  overflow: hidden;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  color: #606266;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.dropdown-item.active {
  background: #409eff;
  color: white;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>