import { processScheduledMessages } from '~/server/lib/scheduler'

export default defineEventHandler(async (event) => {
  try {
    // Security check: require CRON_SECRET if set
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const authHeader = getHeader(event, 'authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      }
    }

    const messagesResult = await processScheduledMessages()

    if (!messagesResult.success) {
      console.error('Error processing messages:', messagesResult.error)
    }

    return {
      success: true,
      messages: messagesResult
    }

  } catch (error) {
    console.error('API cron/process-schedules:', error)
    throw error
  }
})
