import {defineConfig} from "vite"
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
// import { cloudflare } from 'unenv'

export default defineConfig({
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart({
          target: 'cloudflare-worker',
      })
    ]
})
