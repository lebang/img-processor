import { createApp } from 'vue'
import { Picture, FolderOpened, Document } from '@element-plus/icons-vue'
// Element Plus 样式按需导入（组件由 unplugin 自动导入）
import 'element-plus/es/components/footer/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/progress/style/css'
// 全局样式
import './styles/global.css'
import App from './App.vue'

const app = createApp(App)
app.component('Picture', Picture)
app.component('FolderOpened', FolderOpened)
app.component('Document', Document)
app.mount('#app')
