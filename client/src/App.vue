<template>
  <div class="app-container">
      <el-header class="header">
        <div class="logo">
          <el-icon :size="32" color="#409EFF"><Picture /></el-icon>
          <h1>IMG Processor</h1>
        </div>
        <div class="status-bar">
          <el-tag :type="isElectronReady ? 'success' : 'warning'" effect="dark">
            {{ isElectronReady ? `Electron 已就绪 (${platform})` : 'Web 模式' }}
          </el-tag>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <div class="card-header-area">
          <div class="folder-opts">
            <el-button 
              size="large" 
              @click="selectImageFolder"
              :disabled="!isElectronReady || isGenerating || isLoading"
              :loading="isLoading"
            >
              <el-icon v-if="!isLoading"><FolderOpened /></el-icon>
              {{ loadingButtonText }}
            </el-button>

            <PdfSizeSelector 
              v-if="images.length" 
              v-model="pdfOptions.fitToImage"
            />
            
            <el-button
              v-if="images.length"
              type="primary"
              size="large"
              @click="handleGeneratePdf"
              :loading="isGenerating"
              :disabled="!isElectronReady"
            >
              <el-icon><Document /></el-icon>
              {{ isGenerating ? '正在生成...' : '生成 PDF 文件' }}
            </el-button>
            <div v-if="selectedFolder" class="folder-info">
              <el-tag type="info" effect="plain">{{ selectedFolder }}</el-tag>
              <el-tag type="success" effect="plain">共 {{ images.length }} 张图片</el-tag>
            </div>
          </div>
          
          <el-alert
            v-if="!isElectronReady"
            title="请在桌面应用中使用此功能"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
        <div class="card-preview-area">
          <el-card> 
            <ImagePreview 
              v-if="images.length" 
              :images="images"
              @update:images="handleImagesUpdate"
              @order-changed="onImageOrderChanged"
            />
            <div v-else class="empty-placeholder">
              <el-empty description="请选择图片目录" />
            </div>
          </el-card>
        </div>
      </el-main>
      
      <el-footer class="footer">
        <span>IMG Processor © 2024 | Powered by Vue 3 + Element Plus + Electron</span>
      </el-footer>
    
    <!-- 进度蒙层 -->
    <LoadingOverlay v-bind="overlayConfig" />
  </div>
</template>

<script setup>
import ImagePreview from './components/ImagePreview.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import PdfSizeSelector from './components/PdfSizeSelector.vue'

// 引入 Hooks
import { useElectron } from '@/hooks/useElectron'
import { useImageFolder } from '@/hooks/useImageFolder'
import { usePdfGenerator } from '@/hooks/usePdfGenerator'
import { useMenuEvents } from '@/hooks/useMenuEvents'

// 使用 Hooks
const { isElectronReady, platform } = useElectron()

const { 
  selectedFolder, 
  images, 
  isLoading, 
  loadingProgress,
  selectImageFolder, 
  updateImages,
  onImageOrderChanged 
} = useImageFolder()

const { 
  isGenerating, 
  pdfOptions, 
  progress, 
  generatePdf 
} = usePdfGenerator()

import { computed } from 'vue'

// 加载按钮文案
const loadingButtonText = computed(() => {
  if (!isLoading.value) return '选择图片目录'
  if (loadingProgress.value.total === 0) return '正在扫描目录...'
  return `正在加载缩略图 ${loadingProgress.value.progress}%`
})

// 蒙层配置（统一管理两种进度状态）
const overlayConfig = computed(() => {
  // PDF生成进度优先级更高
  if (isGenerating.value) {
    return {
      visible: true,
      type: 'generating',
      current: progress.value.current,
      total: progress.value.total,
      percent: progress.value.percent
    }
  }
  // 图片加载进度 - isLoading为true时立即显示蒙层
  if (isLoading.value) {
    return {
      visible: true,
      type: 'loading',
      current: loadingProgress.value.processed,
      total: loadingProgress.value.total,
      percent: loadingProgress.value.progress
    }
  }
  // 隐藏状态
  return { visible: false }
})

// 设置菜单事件（需要传入回调）
useMenuEvents({
  onOpenFolder: selectImageFolder,
  onExportPdf: () => generatePdf(images.value),
  getImages: () => images.value
})

// 事件处理
const handleImagesUpdate = updateImages
const handleGeneratePdf = () => generatePdf(images.value)
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo h1 {
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-content {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header-area {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.folder-opts {
  display: flex;
  gap: 12px;
  align-items: center;
}

.card-preview-area {
  flex: 1;
  min-height: 50px;
}


.folder-info {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

/* 空状态占位 */
.empty-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer {
  padding: 12px;
  text-align: center;
  color: #606266;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
}
</style>
