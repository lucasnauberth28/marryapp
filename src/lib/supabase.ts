import "server-only"
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Uploads acontecem apenas no servidor, com a service key. Nunca cair para a chave anônima.
// SUPABASE_SERVICE_ROLE_KEY é o nome que a integração Supabase da Vercel cria.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'gifts'

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export type UploadResult = { success: true; url: string } | { success: false; error: string }

/**
 * Confere a assinatura binária (magic bytes) para não confiar só no Content-Type enviado pelo cliente.
 */
function detectImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (ascii(4, 8) === 'ftyp' && ascii(8, 12).startsWith('avi')) return 'image/avif'
  return null
}

async function uploadImageBytes(bytes: Uint8Array, folder: string): Promise<UploadResult> {
  if (bytes.byteLength === 0) return { success: false, error: 'Arquivo de imagem vazio.' }
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { success: false, error: 'Imagem acima do limite de 5 MB.' }

  const contentType = detectImageType(bytes)
  if (!contentType) return { success: false, error: 'Formato de imagem não suportado (use JPG, PNG, WEBP ou AVIF).' }

  if (!supabase) {
    console.warn('[Supabase] Credenciais não configuradas para upload.')
    return { success: false, error: 'Armazenamento de imagens não configurado.' }
  }

  const filePath = `${folder}/${Date.now()}-${randomUUID()}.${ALLOWED_IMAGE_TYPES[contentType]}`
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, bytes, { contentType, upsert: false })

  if (error) {
    console.error('[Supabase Upload Error]:', error)
    return { success: false, error: 'Falha ao enviar a imagem.' }
  }

  const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)
  return { success: true, url: publicUrl }
}

export async function uploadImageFile(file: File, folder: string): Promise<UploadResult> {
  if (file.size > MAX_IMAGE_BYTES) return { success: false, error: 'Imagem acima do limite de 5 MB.' }
  return uploadImageBytes(new Uint8Array(await file.arrayBuffer()), folder)
}

export async function uploadGiftImage(file: File): Promise<UploadResult> {
  return uploadImageFile(file, 'gifts')
}

/**
 * Recebe uma imagem em data URL (enviada pelos formulários públicos), valida e envia ao storage.
 * Sem storage configurado (ambiente local), devolve a própria data URL já validada.
 */
export async function uploadImageDataUrl(dataUrl: string, folder: string): Promise<UploadResult> {
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim())
  if (!match) return { success: false, error: 'Imagem inválida.' }

  const bytes = new Uint8Array(Buffer.from(match[2], 'base64'))
  if (!supabase) {
    if (bytes.byteLength > MAX_IMAGE_BYTES) return { success: false, error: 'Imagem acima do limite de 5 MB.' }
    const type = detectImageType(bytes)
    if (!type) return { success: false, error: 'Formato de imagem não suportado (use JPG, PNG, WEBP ou AVIF).' }
    return { success: true, url: `data:${type};base64,${match[2]}` }
  }
  return uploadImageBytes(bytes, folder)
}
