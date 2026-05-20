import { mkdir } from "node:fs/promises"
import { basename, extname, join } from "node:path"

import sharp from "sharp"

export type ImageOptions = {
  width: number
  format?: "avif" | "webp" | "png" | "jpeg"
}

export async function image(src: string, options: ImageOptions) {
  const format = options.format ?? "webp"
  const name = basename(src, extname(src))
  const fileName = `${name}-${options.width}.${format}`
  const outDir = "dist/assets/images"
  const outFile = join(outDir, fileName)

  await mkdir(outDir, { recursive: true })

  const info = await sharp(src)
    .resize({ width: options.width, withoutEnlargement: true })
    .toFormat(format)
    .toFile(outFile)

  return {
    src: `/assets/images/${fileName}`,
    width: info.width,
    height: info.height,
  }
}
