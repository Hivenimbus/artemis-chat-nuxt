import { processScheduledMessages } from '~/server/lib/scheduler'

export default defineNitroPlugin((nitroApp) => {
  console.log('🕒 Initializing internal scheduler plugin...')

  // Run immediately on startup (optional, good for testing)
  // setTimeout(async () => {
  //   console.log('🚀 Running initial schedule check...')
  //   await processScheduledMessages()
  // }, 5000)

  // Run every 60 seconds
  const interval = setInterval(async () => {
    console.log('⏰ Running scheduled message check...')
    try {
      const result = await processScheduledMessages()
      if (result.processed > 0) {
        console.log(`✅ Processed ${result.processed} scheduled messages`)
      }
    } catch (error) {
      console.error('❌ Error in scheduled message check:', error)
    }
  }, 60000)

  // Clear interval on shutdown (although Nuxt/Nitro usually kills the process)
  nitroApp.hooks.hook('close', () => {
    clearInterval(interval)
    console.log('🛑 Scheduler stopped')
  })
})

