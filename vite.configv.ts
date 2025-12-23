import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // ou o plugin do framework que você usa

export default defineConfig({
  plugins: [react()],
  base: '/Chatbot-vasstos/', // substitua exatamente pelo nome do seu repositório
})
