/**
 * 菜单事件 Hook
 * 管理 Electron 应用菜单事件监听
 */
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import electron from '@/api/electronBridge'

export function useMenuEvents({ onOpenFolder, onExportPdf, getImages }) {
  // 设置菜单事件监听
  function setupMenuListeners() {
    // 监听菜单"打开目录"事件
    electron.onMenuOpenFolder(() => {
      if (onOpenFolder) {
        onOpenFolder()
      }
    })

    // 监听菜单"导出 PDF"事件
    electron.onMenuExportPdf(() => {
      const images = getImages ? getImages() : []
      if (images.length > 0) {
        if (onExportPdf) {
          onExportPdf()
        }
      } else {
        ElMessage.warning('请先选择图片目录')
      }
    })
  }

  // 生命周期
  onMounted(() => {
    setupMenuListeners()
  })
}
