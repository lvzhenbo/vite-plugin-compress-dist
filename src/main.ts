import type { Plugin, ResolvedConfig } from 'vite';
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';
import { consola } from 'consola';
import { filesize } from 'filesize';
import fs from 'node:fs/promises';
import path from 'node:path';
import { rimraf } from 'rimraf';

export interface CompressDistOptions {
  /**
   * 输出的文件名（不包含后缀）
   *
   * 支持字符串或返回字符串的函数
   * @default 'dist'
   * @example
   * fileName: 'my-app'
   * fileName: () => `dist-${Date.now()}`
   */
  fileName?: string | (() => string);
  /**
   * 要打包的目录，相对于项目根目录
   * @default 'dist'
   */
  distDir?: string;
  /**
   * 文件输出目录，相对于项目根目录
   * @default 项目根目录
   */
  outputDir?: string;
  /**
   * 是否在打包完成后删除原 dist 目录
   * @default false
   */
  deleteDistAfterCompress?: boolean;
  /**
   * 是否包含最外层目录
   *
   * `true`: 文件内会有 dist/index.html
   *
   * `false`: 文件内直接是 index.html
   * @default false
   */
  includeRoot?: boolean;
  /**
   * 是否在打包前删除 dist 目录
   * @default false
   */
  deleteDistBeforeCompress?: boolean;
}

export function viteCompressDist(options: CompressDistOptions = {}): Plugin {
  let config: ResolvedConfig;

  const {
    fileName = 'dist',
    distDir = 'dist',
    outputDir = '',
    deleteDistAfterCompress = false,
    includeRoot = false,
    deleteDistBeforeCompress = false,
  } = options;

  return {
    name: 'vite-plugin-compress-dist',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async buildStart() {
      // 打包前删除 dist 目录
      if (deleteDistBeforeCompress) {
        const root = config.root;
        const distPath = path.resolve(root, distDir);
        try {
          await fs.access(distPath);
          await rimraf(distPath);
          consola.info(`[vite-plugin-compress-dist] 已删除 dist 目录: ${distPath}`);
        } catch {
          // 目录不存在，无需删除
        }
      }
    },
    async closeBundle() {
      const root = config.root;
      const distPath = path.resolve(root, distDir);
      const outputPath = path.resolve(root, outputDir);

      // 生成文件名
      const resolvedFileName = typeof fileName === 'function' ? fileName() : fileName;
      const zipFilePath = path.join(outputPath, `${resolvedFileName}.zip`);

      // 检查 dist 目录是否存在
      try {
        await fs.access(distPath);
      } catch {
        consola.warn(`[vite-plugin-compress-dist] 目录不存在: ${distPath}`);
        return;
      }

      consola.start(`[vite-plugin-compress-dist] 正在压缩 ${distPath}...`);

      try {
        // 收集所有文件
        const files = await collectFiles(distPath);

        // 创建 zip 文件
        const zipFileWriter = new BlobWriter('application/zip');
        const zipWriter = new ZipWriter(zipFileWriter);

        // 添加文件到 zip
        const rootDirName = path.basename(distPath);
        for (const file of files) {
          let relativePath = path.relative(distPath, file).replace(/\\/g, '/');
          // 如果需要包含最外层目录，则在路径前添加目录名
          if (includeRoot) {
            relativePath = `${rootDirName}/${relativePath}`;
          }
          const fileContent = await fs.readFile(file);
          const blob = new Blob([fileContent]);
          await zipWriter.add(relativePath, new BlobReader(blob));
        }

        // 关闭 zip writer 并获取数据
        const zipBlob = await zipWriter.close();

        // 将 Blob 转换为 Buffer 并写入文件
        const arrayBuffer = await zipBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 确保输出目录存在
        await fs.mkdir(outputPath, { recursive: true });

        await fs.writeFile(zipFilePath, buffer);

        consola.success(`[vite-plugin-compress-dist] 压缩完成: ${zipFilePath}`);
        consola.info(`[vite-plugin-compress-dist] 文件数量: ${files.length}`);
        consola.info(
          `[vite-plugin-compress-dist] 压缩包大小: ${filesize(buffer.length, { standard: 'jedec' })}`,
        );

        // 删除原 dist 目录
        if (deleteDistAfterCompress) {
          await fs.rm(distPath, { recursive: true, force: true });
          consola.info(`[vite-plugin-compress-dist] 已删除原目录: ${distPath}`);
        }
      } catch (error) {
        consola.error('[vite-plugin-compress-dist] 压缩失败:', error);
        throw error;
      }
    },
  };
}

/**
 * 递归收集目录下所有文件
 */
async function collectFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}
