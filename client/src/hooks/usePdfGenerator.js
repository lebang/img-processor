/**
 * PDF 生成 Hook
 * 管理 PDF 生成逻辑、选项和进度
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import electron from '@/bridge/electronBridge'

export function usePdfGenerator() {
  const isGenerating = ref(false)
  
  // PDF 选项
  const pdfOptions = reactive({
    fitToImage: false,  // false = A4 尺寸, true = 按图片原始尺寸
    pageSize: 'A4'
  })

  // 生成进度
  const progress = ref({
    current: 0,
    total: 0,
    percent: 0
  })

  // 设置进度监听
  function setupProgressListener() {
    electron.onPdfProgress((data) => {
      progress.value = {
        current: data.current,
        total: data.total,
        percent: data.percent
      }
    })
  }

  // 进度格式化
  function progressFormat(percent) {
    return `${percent}%`
  }

  // 生成 PDF
  async function generatePdf(images) {
    if (!electron.isAvailable()) {
      ElMessage.warning('Electron API 不可用')
      return
    }

    if (images.length === 0) {
      ElMessage.warning('请先选择图片目录')
      return
    }

    try {
      // 第一步：显示保存对话框，让用户选择保存位置
      const dialogResult = await electron.showSavePdfDialog()
      
      if (dialogResult.canceled || !dialogResult.filePath) {
        ElMessage.info('已取消保存')
        return
      }

      // 第二步：用户确认保存后，开始显示蒙层和进度
      isGenerating.value = true
      progress.value = {
        current: 0,
        total: images.length,
        percent: 0
      }

      // 将 Vue 响应式数组转换为普通数组，避免 IPC 序列化失败
      const plainImages = images.map(img => ({
        name: img.name,
        path: img.path,
        relativePath: img.relativePath
      }))

      // 第三步：调用PDF生成（使用新的直接生成API）
      const result = await electron.generatePdfDirect(plainImages, dialogResult.filePath, {
        fitToImage: pdfOptions.fitToImage,
        pageSize: pdfOptions.pageSize
      })

      if (result.success) {
        ElNotification({
          title: 'PDF 生成成功',
          message: `已保存到: ${dialogResult.filePath}`,
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

  // 生命周期
  onMounted(() => {
    setupProgressListener()
  })

  return {
    isGenerating,
    pdfOptions,
    progress,
    progressFormat,
    generatePdf
  }
}
