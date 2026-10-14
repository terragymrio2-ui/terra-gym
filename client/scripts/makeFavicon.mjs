import sharp from 'sharp'

const SRC = 'src/assets/terragym-logo-dark.png'

// Región de la T7 como fracciones de la imagen (estimada a ojo desde la vista previa)
const REGION = { left: 0.33, top: 0.06, width: 0.35, height: 0.65 }

const { width, height } = await sharp(SRC, { density: 144 }).metadata()
const extract = {
    left: Math.round(width * REGION.left),
    top: Math.round(height * REGION.top),
    width: Math.round(width * REGION.width),
    height: Math.round(height * REGION.height),
}

await sharp(SRC, { density: 144 })
    .extract(extract)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('public/terragym-logo-dark.png')

console.log('Listo: public/terragym-logo-dark.png', extract)