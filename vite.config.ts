import { defineConfig, loadEnv } from 'vite';
import { posix, resolve } from 'path';
import historyApiFallback from 'connect-history-api-fallback';
import mpaPlugin from 'vite-plugin-multiple-page';
import react from '@vitejs/plugin-react-swc';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default (config) => {
  const env = { ...process.env, ...loadEnv(config.mode, process.cwd()) };

  const app = env.VITE_APP_NAMES?.split(',');
  const extensions = env.VITE_APP_EXTENSIONS?.split(',') ?? [];

  const rewrites: historyApiFallback.Rewrite[] = [];

  const pages = app?.reduce((_pages, pageName, currentIndex) => {
    _pages[pageName] = {
      entry: `packages/${pageName}/src/main.${extensions[currentIndex]}`,
      filename: `/${pageName}.html`,
      template: `packages/${pageName}/index.html`,
      inject: {
        data: {
          title: `mpa-${pageName}`,
        },
      },
    };
    rewrites.push({
      from: `/${pageName}` as unknown as RegExp,
      to: posix.join('/', `/packages/${pageName}/index.html`),
    });
    return _pages;
  }, {});

  return defineConfig({
    plugins: [
      react(),
      vue(),
      mpaPlugin({
        pages,
        historyApiFallback: {
          rewrites,
        },
      }),
    ],
    resolve: {
      alias: app?.reduce((_paths, pathName) => {
        _paths[`@${pathName}`] = resolve(
          __dirname,
          `./packages/${pathName}/src`
        );

        _paths[`~${pathName}`] = resolve(__dirname, `./packages/${pathName}`);

        return _paths;
      }, {}),
    },
  });
};
