# vite-plugin-compress-dist

一个用于在 Vite 构建完成后自动压缩 dist 目录的插件。

## 安装

```bash
npm install vite-plugin-compress-dist -D
# 或者
pnpm add vite-plugin-compress-dist -D
# 或者
yarn add vite-plugin-compress-dist -D
```

## 使用

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { viteCompressDist } from 'vite-plugin-compress-dist';

export default defineConfig({
  plugins: [
    viteCompressDist({
      // 配置选项
    }),
  ],
});
```

## 配置选项

| 选项                       | 类型                       | 默认值   | 描述                                                                                 |
| -------------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `fileName`                 | `string \| (() => string)` | `'dist'` | 输出的文件名（不包含后缀），支持字符串或返回字符串的函数                             |
| `distDir`                  | `string`                   | `'dist'` | 要打包的目录，相对于项目根目录                                                       |
| `outputDir`                | `string`                   | `''`     | 文件输出目录，相对于项目根目录，默认为项目根目录                                     |
| `deleteDistAfterCompress`  | `boolean`                  | `false`  | 是否在打包完成后删除原 dist 目录                                                     |
| `includeRoot`              | `boolean`                  | `false`  | 是否包含最外层目录。`true`: 内会有 `dist/index.html`；`false`: 内直接是 `index.html` |
| `deleteDistBeforeCompress` | `boolean`                  | `false`  | 是否在打包前删除 dist 目录                                                           |

## 示例

### 基础用法

```ts
viteCompressDist();
```

### 自定义文件名

```ts
viteCompressDist({
  fileName: 'my-app',
});
```

### 动态文件名

```ts
viteCompressDist({
  fileName: () => `dist-${Date.now()}`,
});
```

### 压缩后删除 dist 目录

```ts
viteCompressDist({
  deleteDistAfterCompress: true,
});
```

### 包含根目录

```ts
viteCompressDist({
  includeRoot: true,
});
```

### 自定义输出目录

```ts
viteCompressDist({
  outputDir: 'releases',
});
```

## License

[MIT](./LICENSE)
