import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/zillow_assessment/', // Set this to your repo name
  plugins: [react()],
})
