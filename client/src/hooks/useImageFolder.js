/**
 * 图片目录管理 Hook
 * 管理图片目录选择、图片列表和加载状态
 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import electron from '@/api/electronBridge'

export function useImageFolder() {
  const selectedFolder = ref('')
  const images = ref([])
  const isLoading = ref(false)

  // 选择图片目录
  async function selectImageFolder() {
    if (!electron.isAvailable()) {
      ElMessage.warning('Electron API 不可用')
      return
    }

    try {
      // 先打开目录选择对话框
      const result = await electron.selectImageFolder()

      if (result.canceled) {
        return
      }

      // 用户选择了目录后，开始显示 loading
      isLoading.value = true

      // 使用 nextTick 确保 UI 更新后再处理结果
      await new Promise(resolve => setTimeout(resolve, 100))

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
    } finally {
      isLoading.value = false
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

  return {
    selectedFolder,
    images,
    isLoading,
    selectImageFolder,
    updateImages,
    onImageOrderChanged
  }
}
