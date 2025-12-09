import { createApp } from 'vue'
// Element Plus 样式按需导入（组件由 unplugin 自动导入）
import 'element-plus/dist/index.css'
// 全局样式
import './styles/global.css'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
