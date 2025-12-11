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

    const result = await processScheduledMessages()
    
    if (!result.success) {
      throw createError({ statusCode: 500, statusMessage: 'Error processing schedules', data: result.error })
    }

    return result

  } catch (error) {
    console.error('API cron/process-schedules:', error)
    throw error
  }
})
