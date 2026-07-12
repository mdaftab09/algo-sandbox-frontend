import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // note for me  THE BULLETPROOF FIX: Vite "import hoisting" trap
  // it tells Vite to replace every instance of 'global' with 'window' during the build.
  define: {
    global: 'window',
  },
})