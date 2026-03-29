const express = require('express')
const router = express.Router()
const { adminKeyVerify } = require('../middlewares/authorization')
const usageStats = require('../utils/usage-stats')
const { logger } = require('../utils/logger')

router.get('/usage-stats', adminKeyVerify, async (req, res) => {
  try {
    const data = await usageStats.getStats()
    res.json(data)
  } catch (error) {
    logger.error('读取使用统计失败', 'USAGE', '', error)
    res.status(500).json({ error: error.message })
  }
})

router.post('/usage-stats/reset', adminKeyVerify, async (req, res) => {
  try {
    await usageStats.reset()
    res.json({ message: '使用统计已清空' })
  } catch (error) {
    logger.error('清空使用统计失败', 'USAGE', '', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
