/**
 * 图片目录管理 Hook
 * 管理图片目录选择、图片列表和加载状态
 */
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import electron from '@/api/electronBridge'

export function useImageFolder() {
  const selectedFolder = ref('')
  const images = ref([])
  const isLoading = ref(false)
  const loadingProgress = ref({ processed: 0, total: 0, progress: 0 })

  // 注册事件监听
  function setupListeners() {
    // 图片扫描完成（立即显示列表，无缩略图）
    electron.onImagesScanned(({ images: scannedImages, total }) => {
      images.value = scannedImages
      loadingProgress.value = { processed: 0, total, progress: 0 }
    })

    // 缩略图批次完成（逐步更新缩略图）
    electron.onThumbnailsBatch(({ images: batchImages, progress }) => {
      // 更新对应图片的缩略图
      batchImages.forEach(batchImg => {
        const index = images.value.findIndex(img => img.path === batchImg.path)
        if (index !== -1) {
          images.value[index] = { ...images.value[index], thumbnail: batchImg.thumbnail }
        }
      })
      loadingProgress.value = progress
    })

    // 缩略图全部完成
    electron.onThumbnailsComplete(() => {
      isLoading.value = false
      ElMessage.success(`成功加载 ${images.value.length} 张图片`)
    })
  }

  // 移除事件监听
  function removeListeners() {
    electron.removeImageListeners()
  }

  // 选择图片目录（优化后的分步加载）
  async function selectImageFolder() {
    if (!electron.isAvailable()) {
      ElMessage.warning('Electron API 不可用')
      return
    }

    try {
      // 第一步：打开目录选择对话框
      const result = await electron.selectFolder()

      if (result.canceled) {
        return
      }

      // 用户选择了目录，立即显示 loading
      isLoading.value = true
      selectedFolder.value = result.folderPath
      images.value = [] // 清空旧图片
      loadingProgress.value = { processed: 0, total: 0, progress: 0 }

      // 注册事件监听
      setupListeners()

      // 第二步：开始加载图片（会通过事件分批返回）
      const loadResult = await electron.loadImages(result.folderPath)

      if (!loadResult.success) {
        isLoading.value = false
        ElMessage.error(`读取目录失败: ${loadResult.error}`)
        return
      }

      if (loadResult.total === 0) {
        isLoading.value = false
        ElMessage.warning('所选目录中没有找到支持的图片文件')
      }

    } catch (error) {
      isLoading.value = false
      ElMessage.error(`选择目录失败: ${error.message}`)
    }
  }

  // 更新图片列表
  function updateImages(newImages) {
    images.value = newImages
  }

  // 图片顺序变化回调
  function onImageOrderChanged(newImages) {
    console.log('图片顺序已更新', newImages.map(img => img.name))
  }

  // 组件卸载时移除监听
  onUnmounted(() => {
    removeListeners()
  })

  return {
    selectedFolder,
    images,
    isLoading,
    loadingProgress,
    selectImageFolder,
    updateImages,
    onImageOrderChanged
  }
}
