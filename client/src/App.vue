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
        <el-card class="welcome-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🖼️ 图片处理与 PDF 生成工具</span>
            </div>
          </template>
          
          <el-space direction="vertical" :size="20" fill style="width: 100%">
            <el-alert
              :title="statusMessage"
              :type="isElectronReady ? 'success' : 'info'"
              :closable="false"
              show-icon
            />
            
            <el-divider content-position="center">功能测试</el-divider>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-button 
                  type="primary" 
                  size="large" 
                  @click="testPing"
                  :loading="loading"
                  style="width: 100%"
                >
                  <el-icon><Connection /></el-icon>
                  测试 IPC 通信
                </el-button>
              </el-col>
              <el-col :span="12">
                <el-button 
                  type="success" 
                  size="large" 
                  @click="showInfo"
                  style="width: 100%"
                >
                  <el-icon><InfoFilled /></el-icon>
                  系统信息
                </el-button>
              </el-col>
            </el-row>
            
            <el-collapse v-model="activeCollapse">
              <el-collapse-item title="通信结果" name="result" v-if="result">
                <el-result
                  :icon="resultSuccess ? 'success' : 'error'"
                  :title="resultSuccess ? '通信成功' : '通信失败'"
                  :sub-title="result"
                />
              </el-collapse-item>
            </el-collapse>
          </el-space>
        </el-card>
        
        <el-card class="feature-card" shadow="hover" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>📋 功能列表</span>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8" v-for="feature in features" :key="feature.title">
              <el-card shadow="hover" class="feature-item">
                <el-icon :size="40" :color="feature.color">
                  <component :is="feature.icon" />
                </el-icon>
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.desc }}</p>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-main>
      
      <el-footer class="footer">
        <span>IMG Processor © 2024 | Powered by Vue 3 + Element Plus + Electron</span>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 状态
const isElectronReady = ref(false)
const platform = ref('')
const loading = ref(false)
const result = ref('')
const resultSuccess = ref(false)
const activeCollapse = ref([])

// 功能列表
const features = [
  { title: 'PDF 生成', desc: '将图片批量转换为 PDF 文档', icon: 'Document', color: '#409EFF' },
  { title: '图片压缩', desc: '智能压缩图片，保持高质量', icon: 'PictureFilled', color: '#67C23A' },
  { title: '批量处理', desc: '支持文件夹批量处理', icon: 'FolderOpened', color: '#E6A23C' }
]

// 计算属性
const statusMessage = computed(() => {
  if (isElectronReady.value) {
    return `应用已准备就绪，运行平台: ${platform.value}`
  }
  return '当前运行在 Web 模式，部分功能可能受限'
})

// 生命周期
onMounted(() => {
  checkElectron()
})

// 方法
function checkElectron() {
  if (window.electronAPI) {
    isElectronReady.value = true
    platform.value = window.electronAPI.platform
  }
}

async function testPing() {
  if (!window.electronAPI) {
    ElMessage.warning('Electron API 不可用，请在桌面应用中运行')
    return
  }
  
  loading.value = true
  try {
    const response = await window.electronAPI.ping()
    result.value = `IPC 响应: ${response}`
    resultSuccess.value = true
    activeCollapse.value = ['result']
    ElMessage.success('IPC 通信成功！')
  } catch (error) {
    result.value = `错误: ${error.message}`
    resultSuccess.value = false
    activeCollapse.value = ['result']
    ElMessage.error('IPC 通信失败')
  } finally {
    loading.value = false
  }
}

function showInfo() {
  const info = isElectronReady.value
    ? `平台: ${platform.value}\nElectron: 已启用\nVue: 3.x\nElement Plus: 已加载`
    : '当前运行在 Web 浏览器模式'
  
  ElMessageBox.alert(info, '系统信息', {
    confirmButtonText: '确定',
    type: 'info'
  })
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

.welcome-card, .feature-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.feature-item {
  text-align: center;
  padding: 20px;
  transition: transform 0.3s;
}

.feature-item:hover {
  transform: translateY(-4px);
}

.feature-item h3 {
  margin: 12px 0 8px;
  color: #303133;
}

.feature-item p {
  color: #909399;
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
</style>
