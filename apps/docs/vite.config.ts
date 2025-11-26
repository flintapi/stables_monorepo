import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import mdx from 'fumadocs-mdx/vite';
import {nitro} from "nitro/vite"
// import {cloudflare} from "@cloudflare/vite-plugin"

const config = defineConfig({
  plugins: [
    mdx(await import("./source.config")),
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    // cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      sitemap: {
        enabled: false
      },
    }),
    nitro({
      preset: "vercel"
    }),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
})

export default config
