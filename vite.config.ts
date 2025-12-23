
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Chatbot-vasstos/', // Deve ser igual ao nome do repositório no GitHub
})
// export default defineConfig({
//  plugins: [react()],
//  base: './', // Garante que o script funcione em qualquer subpasta do GitHub Pages
//  build: {
 //   outDir: 'dist',
 //   rollupOptions: {
  //    output: {
 //       entryFileNames: `assets/[name].js`,
 //       chunkFileNames: `assets/[name].js`,
//        assetFileNames: `assets/[name].[ext]`
//      }
//    }
//  }
// });
