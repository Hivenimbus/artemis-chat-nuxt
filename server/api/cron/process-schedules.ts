import { processScheduledMessages, processScheduledCampaigns } from '~/server/lib/scheduler'

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
    const campaignsResult = await processScheduledCampaigns()

    if (!messagesResult.success) {
      console.error('Error processing messages:', messagesResult.error)
    }

    if (!campaignsResult.success) {
      console.error('Error processing campaigns:', campaignsResult.error)
    }

    return {
      success: true,
      messages: messagesResult,
      campaigns: campaignsResult
    }

  } catch (error) {
    console.error('API cron/process-schedules:', error)
    throw error
  }
})
