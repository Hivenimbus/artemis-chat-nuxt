interface EvolutionMessageOptions {
  number: string
  text?: string
  mediaUrl?: string
  mediaType?: string
  caption?: string
  quotedMessageId?: string
  linkPreview?: boolean
  mentionsEveryone?: boolean
  mentioned?: string[]
}

interface EvolutionInstance {
  instanceName: string
  status: 'open' | 'connecting' | 'connected' | 'disconnecting' | 'closed'
  profileName?: string
  profilePicUrl?: string
  owner?: boolean
}

interface EvolutionWebhook {
  enabled: boolean
  url: string
  events: string[]
  base64: boolean
  byEvents: boolean
}

interface EvolutionSettings {
  rejectCall: boolean
  msgCall: string
  groupsIgnore: boolean
  alwaysOnline: boolean
  readMessages: boolean
  syncFullHistory: boolean
  readStatus: boolean
}

export class EvolutionAPI {
  private apiUrl: string
  private apiKey: string
  private baseUrl: string

  constructor() {
    const config = useRuntimeConfig()
    this.apiUrl = config.evolutionApiUrl
    this.apiKey = config.evolutionApiKey
    this.baseUrl = `${this.apiUrl}/instance`
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`Evolution API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Instâncias
  async createInstance(
    instanceName: string,
    webhook: EvolutionWebhook,
    settings?: Partial<EvolutionSettings>,
    qrcode?: boolean
  ): Promise<any> {
    return this.makeRequest('/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        qrcode: qrcode !== false, // default true
        integration: 'WHATSAPP-BAILEYS',
        number: null,
        webhook,
        settings: {
          rejectCall: false,
          msgCall: '',
          groupsIgnore: true,
          alwaysOnline: false,
          readMessages: false,
          syncFullHistory: false,
          readStatus: false,
          ...settings
        }
      })
    })
  }

  async getInstance(instanceName: string): Promise<EvolutionInstance> {
    return this.makeRequest(`/find/${instanceName}`)
  }

  async connectInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/connect/${instanceName}`, {
      method: 'PUT'
    })
  }

  async disconnectInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/disconnect/${instanceName}`, {
      method: 'DELETE'
    })
  }

  async deleteInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/delete/${instanceName}`, {
      method: 'DELETE'
    })
  }

  // Mensagens
  async sendTextMessage(instanceName: string, number: string, text: string, options: Partial<EvolutionMessageOptions> = {}): Promise<any> {
    return this.makeRequest(`/sendMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number,
        text,
        linkPreview: options.linkPreview || false,
        mentionsEveryone: options.mentionsEveryone || false,
        mentioned: options.mentioned || []
      })
    })
  }

  async sendMediaMessage(
    instanceName: string,
    number: string,
    mediaUrl: string,
    mediaType: string,
    caption?: string,
    options: Partial<EvolutionMessageOptions> = {}
  ): Promise<any> {
    return this.makeRequest(`/sendMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number,
        mediatype: mediaType,
        mediaUrl,
        caption: caption || '',
        fileName: options.caption,
        quotedMessageId: options.quotedMessageId,
        mentionsEveryone: options.mentionsEveryone || false,
        mentioned: options.mentioned || []
      })
    })
  }

  async sendWhatsAppMessage(instanceName: string, messageData: any): Promise<any> {
    // Para mensagens formatadas do WhatsApp
    return this.makeRequest(`/sendMessage/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    })
  }

  // Contatos
  async getContact(instanceName: string, number: string): Promise<any> {
    return this.makeRequest(`/contact/${instanceName}?number=${number}`)
  }

  async getAllContacts(instanceName: string): Promise<any> {
    return this.makeRequest(`/contacts/${instanceName}`)
  }

  // Status
  async getConnectionState(instanceName: string): Promise<any> {
    return this.makeRequest(`/connectionState/${instanceName}`)
  }

  async getProfilePicture(instanceName: string, number: string): Promise<any> {
    return this.makeRequest(`/profilePicture/${instanceName}?number=${number}`)
  }

  // Presença
  async setPresence(instanceName: string, number: string, presence: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'): Promise<any> {
    return this.makeRequest(`/presence/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number,
        presence
      })
    })
  }

  // Leitura de mensagens
  async readMessages(instanceName: string, messageIds: string[]): Promise<any> {
    return this.makeRequest(`/read-messages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        readMessages: messageIds.map(id => ({ id }))
      })
    })
  }

  // Arquivos
  async fetchBase64(fileUrl: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/fetch/base64/${encodeURIComponent(fileUrl)}`, {
      method: 'GET',
      headers: {
        'apikey': this.apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch base64: ${response.status}`)
    }

    return response.json()
  }

  // Utilitários
  async logoutInstance(instanceName: string): Promise<any> {
    return this.makeRequest(`/logout/${instanceName}`, {
      method: 'DELETE'
    })
  }

  async reloadConnection(instanceName: string): Promise<any> {
    return this.makeRequest(`/reload/${instanceName}`, {
      method: 'PUT'
    })
  }
}

// Função helper para criar instância do cliente
export function createEvolutionClient(): EvolutionAPI {
  return new EvolutionAPI()
}

// Tipos úteis para o sistema
export type { EvolutionInstance, EvolutionWebhook, EvolutionSettings, EvolutionMessageOptions }

// Funções utilitárias para tratamento de números
export function formatPhoneNumberForWhatsApp(phone: string): string {
  // Remover todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')

  // Remover código do país se estiver presente (55 para Brasil)
  const phoneWithoutCountryCode = cleanPhone.startsWith('55') && cleanPhone.length > 12
    ? cleanPhone.substring(2)
    : cleanPhone

  // Remover 9 inicial se for um número de celular com DDD
  let formattedPhone = phoneWithoutCountryCode
  if (formattedPhone.length === 11 && formattedPhone.startsWith('9')) {
    formattedPhone = formattedPhone.substring(1)
  }

  // Adicionar código do Brasil (55)
  return `55${formattedPhone}@s.whatsapp.net`
}

export function extractPhoneNumberFromJid(jid: string): string {
  // Extrair número do JID (5511999998888@s.whatsapp.net)
  const match = jid.match(/^(\d+)@s\.whatsapp\.net$/)
  return match ? match[1] : jid
}

// Detectar tipo de mídia pelo mimetype
export function detectMediaType(mimetype: string): 'image' | 'video' | 'audio' | 'document' | 'sticker' {
  if (mimetype.startsWith('image/')) return 'image'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype.startsWith('audio/')) return 'audio'
  if (mimetype.includes('pdf') || mimetype.includes('document')) return 'document'
  if (mimetype.includes('webp')) return 'sticker'
  return 'document'
}