import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function uploadGiftImage(file: File): Promise<string | null> {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Supabase] Credenciais não configuradas para upload.')
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const filePath = `gifts/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('gifts')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gifts')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('[Supabase Gift Upload Error]:', error)
    return null
  }
}

export async function uploadVendorMedia(file: File, folder = 'vendors'): Promise<string | null> {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[Supabase] Credenciais não configuradas para upload.')
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('gifts')
      .upload(fileName, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gifts')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('[Supabase Vendor Upload Error]:', error)
    return null
  }
}
