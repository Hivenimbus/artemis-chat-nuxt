interface StorageFile {
  path: string
  name: string
  type: string
  size?: number
  url?: string
}

interface UploadOptions {
  cacheControl?: string
  contentType?: string
  upsert?: boolean
}

export class StorageManager {
  private supabase: any
  private bucketName: string = 'whatsapp-media'

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  async ensureBucketExists(): Promise<boolean> {
    try {
      // Verificar se o bucket já existe
      const { data: buckets } = await this.supabase.storage.listBuckets()
      const bucketExists = buckets?.some((bucket: any) => bucket.name === this.bucketName)

      if (!bucketExists) {
        console.log('Criando bucket para mídias do WhatsApp:', this.bucketName)

        // Criar o bucket
        const { data, error } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false, // Privado por padrão, acessível via signed URLs
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/3gpp',
            'video/quicktime',
            'audio/mpeg',
            'audio/mp4',
            'audio/amr',
            'audio/ogg',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
          ],
          fileSizeLimit: 10485760 // 10MB
        })

        if (error) {
          console.error('Erro ao criar bucket:', error)
          return false
        }

        console.log('Bucket criado com sucesso:', data)
      } else {
        console.log('Bucket já existe:', this.bucketName)
      }

      return true
    } catch (error) {
      console.error('Erro ao verificar/criar bucket:', error)
      return false
    }
  }

  async uploadFile(
    file: Buffer | string,
    path: string,
    options: UploadOptions = {}
  ): Promise<{ success: boolean, data?: any, error?: any }> {
    try {
      // Garantir que o bucket existe
      await this.ensureBucketExists()

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          cacheControl: options.cacheControl || '3600',
          contentType: options.contentType,
          upsert: options.upsert || false
        })

      if (error) {
        console.error('Erro no upload:', error)
        return { success: false, error }
      }

      console.log('Upload realizado com sucesso:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Erro no upload:', error)
      return { success: false, error }
    }
  }

  async getPublicUrl(path: string): Promise<string> {
    try {
      const { data } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path)

      return data.publicUrl
    } catch (error) {
      console.error('Erro ao obter URL pública:', error)
      throw error
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<{ success: boolean, url?: string, error?: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(path, expiresIn)

      if (error) {
        console.error('Erro ao criar URL assinada:', error)
        return { success: false, error }
      }

      return { success: true, url: data.signedUrl }
    } catch (error) {
      console.error('Erro ao criar URL assinada:', error)
      return { success: false, error }
    }
  }

  async downloadFile(path: string): Promise<{ success: boolean, data?: any, error?: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(path)

      if (error) {
        console.error('Erro no download:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro no download:', error)
      return { success: false, error }
    }
  }

  async deleteFile(path: string): Promise<{ success: boolean, error?: any }> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([path])

      if (error) {
        console.error('Erro ao deletar arquivo:', error)
        return { success: false, error }
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      return { success: false, error }
    }
  }

  async listFiles(prefix?: string): Promise<{ success: boolean, data?: any, error?: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(prefix || '')

      if (error) {
        console.error('Erro ao listar arquivos:', error)
        return { success: false, error }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao listar arquivos:', error)
      return { success: false, error }
    }
  }

  generateMediaPath(atendimentoId: string, messageId: string, fileName: string, mediaType: string): string {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const extension = fileName.split('.').pop() || 'bin'
    const typeFolder = this.getMediaTypeFolder(mediaType)

    return `${atendimentoId}/${date}/${messageId}/${typeFolder}/${fileName}`
  }

  private getMediaTypeFolder(mediaType: string): string {
    if (mediaType.startsWith('image/')) return 'images'
    if (mediaType.startsWith('video/')) return 'videos'
    if (mediaType.startsWith('audio/')) return 'audios'
    return 'documents'
  }

  async uploadFromUrl(
    url: string,
    path: string,
    options: UploadOptions = {}
  ): Promise<{ success: boolean, data?: any, error?: any }> {
    try {
      // Fazer download da URL
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`)
      }

      const buffer = await response.arrayBuffer()
      const fileBuffer = Buffer.from(buffer)

      // Fazer upload do buffer
      return await this.uploadFile(fileBuffer, path, {
        ...options,
        contentType: options.contentType || response.headers.get('content-type') || undefined
      })
    } catch (error) {
      console.error('Erro no upload a partir de URL:', error)
      return { success: false, error }
    }
  }

  async getFileInfo(path: string): Promise<{ success: boolean, data?: any, error?: any }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(path.split('/').slice(0, -1).join('/'))

      if (error) {
        console.error('Erro ao obter informações do arquivo:', error)
        return { success: false, error }
      }

      const fileName = path.split('/').pop()
      const fileInfo = data?.find((file: any) => file.name === fileName)

      if (!fileInfo) {
        return { success: false, error: 'Arquivo não encontrado' }
      }

      return { success: true, data: fileInfo }
    } catch (error) {
      console.error('Erro ao obter informações do arquivo:', error)
      return { success: false, error }
    }
  }
}

// Função helper para criar instância do StorageManager
export function createStorageManager(supabaseClient: any): StorageManager {
  return new StorageManager(supabaseClient)
}

// Funções utilitárias para mídias
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideoType(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function isAudioType(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'video/quicktime': 'mov',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/amr': 'amr',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt'
  }

  return mimeToExt[mimeType] || 'bin'
}