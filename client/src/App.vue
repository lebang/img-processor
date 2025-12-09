<template>
  <div class="app-container">
    <el-container class="main-container">
      <el-header class="header">
        <div class="logo">
          <el-icon :size="32" color="#409EFF"><Picture /></el-icon>
          <h1>IMG Processor</h1>
        </div>
        <div class="status-bar">
          <el-tag :type="isElectronReady ? 'success' : 'warning'" effect="dark">
            <el-icon><Monitor /></el-icon>
            {{ isElectronReady ? `Electron 已就绪 (${platform})` : 'Web 模式' }}
          </el-tag>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <!-- PDF 生成功能卡片 -->
        <el-card class="pdf-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span> PDF 生成</span>
            </div>
          </template>
          
          <el-space direction="vertical" :size="20" fill style="width: 100%">
            <!-- 选择目录区域 -->
            <div class="folder-select-area">
              <el-button 
                type="primary" 
                size="large" 
                @click="selectImageFolder"
                :disabled="!isElectronReady || isGenerating"
              >
                <el-icon><FolderOpened /></el-icon>
                选择图片目录
              </el-button>
              
              <div v-if="selectedFolder" class="folder-info">
                <el-tag type="info" effect="plain">
                  <!-- <el-icon><Folder /></el-icon> -->
                  {{ selectedFolder }}
                </el-tag>
                <el-tag type="success" effect="plain">
                  共 {{ images.length }} 张图片
                </el-tag>
              </div>
            </div>
            
            <!-- 图片预览区域（可拖拽排序） -->
            <ImagePreview 
              v-if="images.length > 0" 
              :images="images"
              @update:images="images = $event"
              @order-changed="onImageOrderChanged"
            />
            
            <!-- 选项设置 -->
            <div v-if="images.length > 0" class="pdf-options">
              <el-divider content-position="left">
                <el-icon><Setting /></el-icon> 生成选项
              </el-divider>
              
              <el-form :model="pdfOptions" label-width="120px">
                <el-form-item label="页面尺寸">
                  <el-radio-group v-model="pdfOptions.fitToImage">
                    <el-radio :value="false">A4 标准尺寸（图片自适应居中）</el-radio>
                    <el-radio :value="true">按图片原始尺寸</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-form>
            </div>
            
            <!-- 进度条 -->
            <div v-if="isGenerating" class="progress-area">
              <el-progress 
                :percentage="progress.percent" 
                :stroke-width="20"
                :format="progressFormat"
              />
              <p class="progress-text">
                正在处理第 {{ progress.current }} / {{ progress.total }} 张图片...
              </p>
            </div>
            
            <!-- 生成按钮 -->
            <el-button
              v-if="images.length > 0"
              type="success"
              size="large"
              @click="generatePdf"
              :loading="isGenerating"
              :disabled="!isElectronReady"
              style="width: 100%"
            >
              <el-icon><Document /></el-icon>
              {{ isGenerating ? '正在生成...' : '生成 PDF' }}
            </el-button>
            
            <!-- 提示信息 -->
            <el-alert
              v-if="!isElectronReady"
              title="请在桌面应用中使用此功能"
              type="warning"
              :closable="false"
              show-icon
            />
          </el-space>
        </el-card>
        

      </el-main>
      
      <el-footer class="footer">
        <span>IMG Processor © 2024 | Powered by Vue 3 + Element Plus + Electron</span>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import ImagePreview from './components/ImagePreview.vue'

// 状态
const isElectronReady = ref(false)
const platform = ref('')
const selectedFolder = ref('')
const images = ref([])
const isGenerating = ref(false)
const progress = reactive({
  current: 0,
  total: 0,
  percent: 0
})

// PDF 选项
const pdfOptions = reactive({
  fitToImage: false,  // false = A4 尺寸, true = 按图片原始尺寸
  pageSize: 'A4'
})



// 生命周期
onMounted(() => {
  checkElectron()
  setupProgressListener()
})

onUnmounted(() => {
  if (window.electronAPI?.removePdfProgressListener) {
    window.electronAPI.removePdfProgressListener()
  }
})

// 方法
function checkElectron() {
  if (window.electronAPI) {
    isElectronReady.value = true
    platform.value = window.electronAPI.platform
  }
}

function setupProgressListener() {
  if (window.electronAPI?.onPdfProgress) {
    window.electronAPI.onPdfProgress((data) => {
      progress.current = data.current
      progress.total = data.total
      progress.percent = data.percent
    })
  }
}

function progressFormat(percent) {
  return `${percent}%`
}

// 选择图片目录
async function selectImageFolder() {
  if (!window.electronAPI) {
    ElMessage.warning('Electron API 不可用')
    return
  }
  
  try {
    const result = await window.electronAPI.selectImageFolder()
    
    if (result.canceled) {
      return
    }
    
    if (result.error) {
      ElMessage.error(`读取目录失败: ${result.error}`)
      return
    }
    
    if (result.images.length === 0) {
      ElMessage.warning('所选目录中没有找到支持的图片文件')
      return
    }
    
    selectedFolder.value = result.folderPath
    images.value = result.images
    
    ElMessage.success(`成功加载 ${result.images.length} 张图片`)
  } catch (error) {
    ElMessage.error(`选择目录失败: ${error.message}`)
  }
}

// 图片顺序变化
function onImageOrderChanged(newImages) {
  console.log('图片顺序已更新', newImages.map(img => img.name))
}

// 生成 PDF
async function generatePdf() {
  if (!window.electronAPI) {
    ElMessage.warning('Electron API 不可用')
    return
  }
  
  if (images.value.length === 0) {
    ElMessage.warning('请先选择图片目录')
    return
  }
  
  isGenerating.value = true
  progress.current = 0
  progress.total = images.value.length
  progress.percent = 0
  
  try {
    // 将 Vue 响应式数组转换为普通数组，避免 IPC 序列化失败
    const plainImages = images.value.map(img => ({
      name: img.name,
      path: img.path,
      relativePath: img.relativePath
    }))
    
    const result = await window.electronAPI.generatePdf(plainImages, {
      fitToImage: pdfOptions.fitToImage,
      pageSize: pdfOptions.pageSize
    })
    
    if (result.canceled) {
      ElMessage.info('已取消保存')
      return
    }
    
    if (result.success) {
      ElNotification({
        title: 'PDF 生成成功',
        message: `已保存到: ${result.outputPath}`,
        type: 'success',
        duration: 5000
      })
    } else {
      ElMessage.error(`生成失败: ${result.error}`)
    }
  } catch (error) {
    ElMessage.error(`生成 PDF 失败: ${error.message}`)
  } finally {
    isGenerating.value = false
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-container {
  height: 100%;
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
  padding: 24px;
  overflow-y: auto;
}

.pdf-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.folder-select-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.folder-info {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}



.pdf-options {
  width: 100%;
}

.progress-area {
  width: 100%;
}

.progress-text {
  text-align: center;
  color: #909399;
  margin-top: 8px;
  font-size: 14px;
}



.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  color: #606266;
  font-size: 14px;
}

/* 全局滚动条美化 */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
