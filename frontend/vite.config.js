import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ✅ 1. เพิ่มขีดจำกัดการเตือนเป็น 1000 KB (1MB) เพื่อให้ Warning หายไป
    chunkSizeWarningLimit: 1000,
    
    // ✅ 2. (แนะนำเพิ่มเติม) ช่วยแยก Library ใหญ่ๆ ออกมาเพื่อให้โหลดเร็วขึ้น
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
