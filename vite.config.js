import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/nl-search': {
          target: 'https://www.nl.go.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nl-search/, '/NL/search/openApi/search.do'),
        },
        '/api/kakao-book': {
          target: 'https://dapi.kakao.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/kakao-book/, '/v3/search/book'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `KakaoAK ${env.VITE_KAKAO_API_KEY}`);
            });
          },
        },
      },
    },
  }
})
