import { fileURLToPath, URL } from 'node:url'

import { DeltaComicUiResolver } from '@delta-comic/ui/vite'
import { deltaComic } from '@delta-comic/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'
import { NaiveUiResolver, VantResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, type UserConfigExport } from 'vite'
// import dts from 'vite-plugin-dts'

import _package from './package.json'

export default defineConfig(
  ({ command }) =>
    ({
      plugins: [
        // dts({ include: ['./src'], outDir: './type', tsconfigPath: './tsconfig.json' }),
        vue(),
        vueJsx(),
        Components({
          dts: true,
          resolvers: [NaiveUiResolver(), VantResolver(), DeltaComicUiResolver()]
        }),
        tailwindcss(),
        deltaComic(
          {
            name: 'bika',
            displayName: '哔咔漫画',
            supportCoreVersion: '^1',
            version: _package.version,
            author: _package.author.name,
            description: _package.description,
            require: [
              'core',
              { id: 'layout', download: 'gh:delta-comic/delta-comic-plugin-layout' }
            ]
          },
          command,
          _package
        )
      ],
      resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
      css: {
        transformer: 'lightningcss',
        lightningcss: {
          targets: browserslistToTargets(browserslist('> 1%, last 2 versions, not ie <= 8'))
        }
      },
      server: { port: 6173, host: true },
      base: '/'
    }) satisfies UserConfigExport
)