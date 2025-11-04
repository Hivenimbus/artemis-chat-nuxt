// Sistema de logging para webhooks e eventos do sistema

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  service: string
  event: string
  message: string
  data?: any
  error?: any
  userId?: string
  instanceId?: string
  contactPhone?: string
  atendimentoId?: string
}

class Logger {
  private serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, service, event, message } = entry
    return `[${timestamp}] ${level.toUpperCase()} [${service}] ${event}: ${message}`
  }

  private log(level: LogLevel, event: string, message: string, data?: any, error?: any, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      event,
      message,
      data,
      error,
      ...context
    }

    const formattedMessage = this.formatMessage(entry)

    // Enviar para console
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '')
        break
      case LogLevel.INFO:
        console.info(formattedMessage, data || '')
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '')
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, error || '')
        break
    }

    // TODO: Enviar para sistema de logs externo (ex: Datadog, New Relic, etc.)
    // this.sendToLogService(entry)
  }

  debug(event: string, message: string, data?: any, context?: any) {
    this.log(LogLevel.DEBUG, event, message, data, undefined, context)
  }

  info(event: string, message: string, data?: any, context?: any) {
    this.log(LogLevel.INFO, event, message, data, undefined, context)
  }

  warn(event: string, message: string, data?: any, context?: any) {
    this.log(LogLevel.WARN, event, message, data, undefined, context)
  }

  error(event: string, message: string, error?: any, data?: any, context?: any) {
    this.log(LogLevel.ERROR, event, message, data, error, context)
  }

  // Métodos específicos para webhooks
  logWebhookReceived(event: string, instanceId: string, data?: any) {
    this.info('webhook.received', `Webhook recebido: ${event}`, data, { instanceId })
  }

  logWebhookProcessed(event: string, instanceId: string, result: any) {
    this.info('webhook.processed', `Webhook processado com sucesso: ${event}`, result, { instanceId })
  }

  logWebhookError(event: string, instanceId: string, error: any, data?: any) {
    this.error('webhook.error', `Erro ao processar webhook: ${event}`, error, data, { instanceId })
  }

  logContactCreated(contactId: string, phone: string, name: string, empresaId: string) {
    this.info('contact.created', `Novo contato criado: ${name}`, { contactId, phone, empresaId })
  }

  logAtendimentoCreated(atendimentoId: string, contatoId: string, inboxId: string) {
    this.info('atendimento.created', `Novo atendimento criado`, { atendimentoId, contatoId, inboxId })
  }

  logMessageReceived(mensagemId: string, atendimentoId: string, contatoPhone: string) {
    this.info('message.received', `Nova mensagem recebida`, { mensagemId, atendimentoId, contatoPhone })
  }

  logInboxNotFound(instanceId: string) {
    this.warn('inbox.not_found', `Inbox não encontrada para instance: ${instanceId}`, { instanceId })
  }

  logContactProcessing(phone: string, name: string, empresaId: string) {
    this.debug('contact.processing', `Processando contato: ${name}`, { phone, empresaId })
  }
}

// Criar instâncias para diferentes serviços
export const webhookLogger = new Logger('webhook')
export const atendimentoLogger = new Logger('atendimento')
export const contatoLogger = new Logger('contato')
export const messageLogger = new Logger('message')

export default Logger