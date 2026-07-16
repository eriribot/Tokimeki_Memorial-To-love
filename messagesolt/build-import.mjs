import fs from 'node:fs';
import path from 'node:path';
import webpack from 'webpack';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
const buildDir = path.join(import.meta.dirname, '.bridge-build');
const outputFile = path.join(import.meta.dirname, '导入到酒馆中', 'ToLove对话槽.json');

const stats = await new Promise((resolve, reject) => {
  webpack(
    {
      mode: 'none',
      target: 'web',
      devtool: false,
      entry: path.join(import.meta.dirname, 'index.ts'),
      output: {
        path: buildDir,
        filename: 'bridge.js',
        iife: true,
        clean: true,
      },
      module: {
        rules: [
          {
            test: /\.ts$/u,
            exclude: /node_modules/u,
            use: {
              loader: 'ts-loader',
              options: {
                configFile: path.join(repoRoot, 'tsconfig.json'),
                transpileOnly: true,
              },
            },
          },
        ],
      },
      resolve: {
        extensions: ['.ts', '.js'],
      },
      optimization: {
        minimize: false,
      },
      performance: {
        hints: false,
      },
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      if (!result || result.hasErrors()) {
        reject(new Error(result?.toString({ all: false, errors: true }) ?? '对话档桥打包失败'));
        return;
      }
      resolve(result);
    },
  );
});

if (!stats) throw new Error('对话档桥没有生成构建结果');

const content = fs.readFileSync(path.join(buildDir, 'bridge.js'), 'utf8').trim();
const manifest = {
  type: 'script',
  enabled: true,
  id: 'b3d8f44a-6f87-4c4c-9811-88ba21871ea2',
  name: 'ToLove对话槽',
  content,
  info: '绑定当前角色卡。为每个 ToLove 游戏存档保存对应的 User prompt 与 Assistant 正文。',
  button: {
    enabled: false,
    buttons: [],
  },
  data: {},
  export_with: {
    data: false,
    button: false,
  },
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.rmSync(buildDir, { recursive: true, force: true });
console.info(`已生成 ${outputFile}`);
