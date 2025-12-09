<template>
  <Teleport to="body">
    <Transition name="overlay-fade">
      <div v-if="visible" class="loading-overlay">
        <div class="loading-content">
          <!-- 图标 -->
          <div class="loading-icon">
            <el-icon :size="48" class="spinning" v-if="type === 'loading'">
              <Loading />
            </el-icon>
            <el-icon :size="48" color="#409EFF" v-else>
              <Document />
            </el-icon>
          </div>
          
          <!-- 标题 -->
          <h3 class="loading-title">{{ title }}</h3>
          
          <!-- 进度条 -->
          <div class="progress-wrapper">
            <el-progress 
              :percentage="percentage" 
              :stroke-width="12"
              :format="formatProgress"
              :color="progressColor"
            />
          </div>
          
          <!-- 描述文字 -->
          <p class="loading-desc">{{ description }}</p>
          
          <!-- 提示 -->
          <p class="loading-tip">请勿关闭窗口...</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { Loading, Document } from '@element-plus/icons-vue'

const props = defineProps({
  // 是否显示
  visible: {
    type: Boolean,
    default: false
  },
  // 类型: 'loading' 加载中, 'generating' 生成中
  type: {
    type: String,
    default: 'loading'
  },
  // 当前进度
  current: {
    type: Number,
    default: 0
  },
  // 总数
  total: {
    type: Number,
    default: 0
  },
  // 百分比（如果直接传百分比）
  percent: {
    type: Number,
    default: 0
  }
})

// 计算百分比
const percentage = computed(() => {
  if (props.percent > 0) return props.percent
  if (props.total === 0) return 0
  return Math.round((props.current / props.total) * 100)
})

// 标题
const title = computed(() => {
  return props.type === 'generating' ? '正在生成 PDF' : '正在加载图片'
})

// 描述
const description = computed(() => {
  if (props.type === 'generating') {
    if (props.total === 0) return '准备中...'
    return `正在处理第 ${props.current} / ${props.total} 张图片`
  }
  // loading 类型
  if (props.total === 0) return '正在扫描目录...'
  return `已加载 ${props.current} / ${props.total} 张缩略图`
})

// 进度条颜色
const progressColor = computed(() => {
  return props.type === 'generating' ? '#67C23A' : '#409EFF'
})

// 格式化进度
const formatProgress = (percentage) => {
  return `${percentage}%`
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 60px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 500px;
}

.loading-icon {
  margin-bottom: 20px;
}

.spinning {
  animation: spin 1.5s linear infinite;
  color: #409EFF;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.progress-wrapper {
  margin-bottom: 16px;
}

.loading-desc {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.loading-tip {
  font-size: 12px;
  color: #909399;
}

/* 过渡动画 */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-active .loading-content,
.overlay-fade-leave-active .loading-content {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.overlay-fade-enter-from .loading-content,
.overlay-fade-leave-to .loading-content {
  transform: scale(0.9);
  opacity: 0;
}
</style>
