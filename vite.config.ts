import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        headers: { 'User-Agent': BROWSER_UA },
      },
      '/api/maya': {
        target: 'https://mayaapi.tase.co.il',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/maya/, ''),
        headers: {
          'User-Agent': BROWSER_UA,
          'X-Maya-With': 'allow',
          'Accept-Language': 'en-US',
        },
      },
      '/api/boi': {
        target: 'https://boi.org.il',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/boi/, ''),
        headers: { 'User-Agent': BROWSER_UA },
      },
    },
  },
})
