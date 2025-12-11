import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需导入
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    electron([
      {
        // 主进程入口
        entry: 'electron/main.js',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              // Node.js 原生模块需要作为外部依赖，避免被 Vite 打包
              external: ['electron', 'pdfkit', 'sharp', 'woff2-encoder']
            }
          }
        }
      },
      {
        // 预加载脚本
        entry: 'electron/preload.js',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron'
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 构建优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'], // 移除 console.log
      },
      format: {
        comments: true // 删除注释
      }
    },
    // 分包策略优化
    rollupOptions: {
      output: {
        // 静态资源分类打包
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // 图片文件
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash][extname]'
          }
          // 字体文件
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'fonts/[name]-[hash][extname]'
          }
          // CSS 文件
          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash][extname]'
          }
          // 其他资源
          return 'assets/[name]-[hash][extname]'
        },
        // 分包策略
        manualChunks: (id) => {
          // node_modules 中的依赖
          if (id.includes('node_modules')) {
            // Element Plus 单独打包
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            // Element Plus 图标单独打包
            if (id.includes('@element-plus/icons-vue')) {
              return 'element-icons'
            }
            // Vue 相关库打包在一起
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vue-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }
        }
      }
    },
    // 代码分割优化
    chunkSizeWarningLimit: 1000, // 提高警告阈值到 1000KB
    // 压缩配置
    cssCodeSplit: true, // CSS 代码分割
    sourcemap: false, // 生产环境不生成 sourcemap
    // 优化依赖预构建
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
