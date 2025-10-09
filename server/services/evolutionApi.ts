/**
 * Evolution API v2 Service
 * 
 * This service handles all interactions with the Evolution API for WhatsApp integration.
 * It provides methods for instance creation, connection management, messaging, and status checks.
 * 
 * @see https://doc.evolution-api.com/v2
 */

import type { H3Event } from 'h3'

// Types for Evolution API
export interface EvolutionInstance {
  instanceName: string
  number?: string
  qrcode?: boolean
  integration: 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS' | 'EVOLUTION'
  token?: string
  webhook?: string
  webhookByEvents?: boolean
  webhookBase64?: boolean
  events?: string[]
}

export interface EvolutionInstanceStatus {
  instance: {
    instanceName: string
    status: string
  }
  hash?: {
    apikey?: string
  }
  qrcode?: {
    pairingCode?: string
    code?: string
    base64?: string
  }
}

export interface EvolutionConnectionState {
  instance: string
  state: 'open' | 'close' | 'connecting'
}

export interface EvolutionSendTextMessage {
  number: string
  text: string
  delay?: number
}

export interface EvolutionWebhookEvent {
  event: string
  instance: string
  data: any
  destination?: string
  date_time?: string
  server_url?: string
  apikey?: string
}

/**
 * Evolution API Client Class
 * Handles all HTTP requests to the Evolution API
 */
export class EvolutionApiClient {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
  }

  /**
   * Make an authenticated request to Evolution API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Evolution API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * Create a new WhatsApp instance
   * 
   * @param config - Instance configuration
   * @returns Instance details including QR code if requested
   */
  async createInstance(config: EvolutionInstance): Promise<EvolutionInstanceStatus> {
    return this.request<EvolutionInstanceStatus>('/instance/create', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  /**
   * Fetch instance connection status
   * 
   * @param instanceName - Name of the instance
   * @returns Connection state information
   */
  async fetchInstance(instanceName: string): Promise<EvolutionConnectionState> {
    return this.request<EvolutionConnectionState>(
      `/instance/connectionState/${instanceName}`,
      { method: 'GET' }
    )
  }

  /**
   * Get all instances
   * 
   * @returns Array of all instances
   */
  async fetchAllInstances(): Promise<any[]> {
    return this.request<any[]>('/instance/fetchInstances', {
      method: 'GET',
    })
  }

  /**
   * Delete an instance
   * 
   * @param instanceName - Name of the instance to delete
   */
  async deleteInstance(instanceName: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      `/instance/delete/${instanceName}`,
      { method: 'DELETE' }
    )
  }

  /**
   * Logout an instance (disconnect WhatsApp)
   * 
   * @param instanceName - Name of the instance
   */
  async logoutInstance(instanceName: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(
      `/instance/logout/${instanceName}`,
      { method: 'DELETE' }
    )
  }

  /**
   * Restart an instance
   * 
   * @param instanceName - Name of the instance
   */
  async restartInstance(instanceName: string): Promise<EvolutionInstanceStatus> {
    return this.request<EvolutionInstanceStatus>(
      `/instance/restart/${instanceName}`,
      { method: 'PUT' }
    )
  }

  /**
   * Set webhook for an instance
   * 
   * @param instanceName - Name of the instance
   * @param webhookUrl - Webhook URL
   * @param events - Array of events to listen to
   * @param webhookByEvents - Whether to send separate webhook per event
   */
  async setWebhook(
    instanceName: string,
    webhookUrl: string,
    events: string[] = [],
    webhookByEvents: boolean = false
  ): Promise<{ webhook: any }> {
    return this.request<{ webhook: any }>(
      `/webhook/set/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          url: webhookUrl,
          webhookByEvents,
          webhook_base64: false,
          events,
        }),
      }
    )
  }

  /**
   * Send a text message
   * 
   * @param instanceName - Name of the instance
   * @param message - Message configuration
   */
  async sendTextMessage(
    instanceName: string,
    message: EvolutionSendTextMessage
  ): Promise<any> {
    return this.request<any>(
      `/message/sendText/${instanceName}`,
      {
        method: 'POST',
        body: JSON.stringify(message),
      }
    )
  }

  /**
   * Get instance QR code
   * 
   * @param instanceName - Name of the instance
   * @returns QR code data
   */
  async getQRCode(instanceName: string): Promise<{ qrcode: { base64: string; code: string } }> {
    return this.request<{ qrcode: { base64: string; code: string } }>(
      `/instance/qrcode/${instanceName}`,
      { method: 'GET' }
    )
  }
}

/**
 * Get Evolution API client instance from runtime config
 */
export function useEvolutionApi(event?: H3Event): EvolutionApiClient {
  const config = useRuntimeConfig(event)
  
  const baseUrl = config.public.evolutionApiUrl || config.evolutionApiUrl
  const apiKey = config.evolutionApiKey

  if (!baseUrl) {
    throw new Error('Evolution API URL not configured. Set EVOLUTION_API_URL in .env')
  }

  if (!apiKey) {
    throw new Error('Evolution API Key not configured. Set EVOLUTION_API_KEY in .env')
  }

  return new EvolutionApiClient(baseUrl, apiKey)
}

/**
 * Get webhook events for inboxes
 * These are the events we want to listen to for WhatsApp inbox functionality
 */
export function getDefaultWebhookEvents(): string[] {
  return [
    'QRCODE_UPDATED',           // When QR code is generated/updated
    'CONNECTION_UPDATE',        // When connection state changes
    'MESSAGES_UPSERT',          // When new message is received
    'MESSAGES_UPDATE',          // When message is updated (read, delivery, etc)
    'MESSAGES_DELETE',          // When message is deleted
    'SEND_MESSAGE',             // When message is sent
    'CONTACTS_UPSERT',          // When contact is added/updated
    'CHATS_UPSERT',             // When chat is created/updated
  ]
}
