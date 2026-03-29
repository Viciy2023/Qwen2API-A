const fs = require('fs').promises
const path = require('path')
const config = require('../config')
const { logger } = require('./logger')

class UsageStats {
  constructor() {
    this.filePath = config.usageStatsFilePath
    this.writeQueue = Promise.resolve()
  }

  createEmptyStats() {
    return {
      summary: {
        requests: 0,
        success: 0,
        failed: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        updatedAt: null,
        today: {
          date: new Date().toISOString().slice(0, 10),
          requests: 0,
          success: 0,
          failed: 0,
          totalTokens: 0,
          hourly: []
        }
      },
      models: {}
    }
  }

  async ensureFileExists() {
    try {
      await fs.access(this.filePath)
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true })
      await fs.writeFile(this.filePath, JSON.stringify(this.createEmptyStats(), null, 2), 'utf-8')
    }
  }

  async readStats() {
    await this.ensureFileExists()
    try {
      const content = await fs.readFile(this.filePath, 'utf-8')
      if (!content.trim()) {
        return this.createEmptyStats()
      }
      const parsed = JSON.parse(content)
      if (!parsed.summary || !parsed.models) {
        return this.createEmptyStats()
      }
      return parsed
    } catch (error) {
      logger.warn(`使用统计文件读取失败，已回退为空统计: ${error.message}`, 'USAGE')
      return this.createEmptyStats()
    }
  }

  async writeStats(stats) {
    await fs.writeFile(this.filePath, JSON.stringify(stats, null, 2), 'utf-8')
  }

  async queueWrite(task) {
    this.writeQueue = this.writeQueue.then(task, task)
    return this.writeQueue
  }

  async track({ model, success, usage = {} }) {
    return this.queueWrite(async () => {
      try {
        const stats = await this.readStats()
        const modelId = model || 'unknown-model'
        const promptTokens = Math.max(0, usage.prompt_tokens || 0)
        const completionTokens = Math.max(0, usage.completion_tokens || 0)
        const totalTokens = Math.max(0, usage.total_tokens || (promptTokens + completionTokens))
        const now = new Date()
        const today = now.toISOString().slice(0, 10)

        if (!stats.summary.today || stats.summary.today.date !== today) {
          stats.summary.today = {
            date: today,
            requests: 0,
            success: 0,
            failed: 0,
            totalTokens: 0,
            hourly: []
          }
        }

        if (!stats.models[modelId]) {
          stats.models[modelId] = {
            model: modelId,
            requests: 0,
            success: 0,
            failed: 0,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            successRate: 0,
            lastUsedAt: null,
            today: {
              date: today,
              requests: 0,
              success: 0,
              failed: 0,
              totalTokens: 0
            }
          }
        }

        const modelStats = stats.models[modelId]
        if (!modelStats.today || modelStats.today.date !== today) {
          modelStats.today = {
            date: today,
            requests: 0,
            success: 0,
            failed: 0,
            totalTokens: 0
          }
        }

        modelStats.requests += 1
        modelStats.success += success ? 1 : 0
        modelStats.failed += success ? 0 : 1
        modelStats.promptTokens += promptTokens
        modelStats.completionTokens += completionTokens
        modelStats.totalTokens += totalTokens
        modelStats.successRate = modelStats.requests > 0 ? Number(((modelStats.success / modelStats.requests) * 100).toFixed(2)) : 0
        modelStats.lastUsedAt = now.toISOString()
        modelStats.today.requests += 1
        modelStats.today.success += success ? 1 : 0
        modelStats.today.failed += success ? 0 : 1
        modelStats.today.totalTokens += totalTokens

        stats.summary.requests += 1
        stats.summary.success += success ? 1 : 0
        stats.summary.failed += success ? 0 : 1
        stats.summary.promptTokens += promptTokens
        stats.summary.completionTokens += completionTokens
        stats.summary.totalTokens += totalTokens
        stats.summary.updatedAt = now.toISOString()
        stats.summary.today.requests += 1
        stats.summary.today.success += success ? 1 : 0
        stats.summary.today.failed += success ? 0 : 1
        stats.summary.today.totalTokens += totalTokens

        const hour = now.getHours()
        if (!Array.isArray(stats.summary.today.hourly)) {
          stats.summary.today.hourly = []
        }

        let hourlyItem = stats.summary.today.hourly.find(item => item.hour === hour)
        if (!hourlyItem) {
          hourlyItem = { hour, requests: 0, totalTokens: 0 }
          stats.summary.today.hourly.push(hourlyItem)
        }
        hourlyItem.requests += 1
        hourlyItem.totalTokens += totalTokens

        await this.writeStats(stats)
        logger.info(`使用统计已记录: model=${modelId}, success=${success}, totalTokens=${totalTokens}, file=${this.filePath}`, 'USAGE')
      } catch (error) {
        logger.error(`记录使用统计失败: model=${model || 'unknown-model'} file=${this.filePath}`, 'USAGE', '', error)
      }
    })
  }

  async getStats() {
    const stats = await this.readStats()
    const today = new Date().toISOString().slice(0, 10)

    if (!stats.summary.today || stats.summary.today.date !== today) {
      stats.summary.today = {
        date: today,
        requests: 0,
        success: 0,
        failed: 0,
        totalTokens: 0,
        hourly: []
      }
    }

    const models = Object.values(stats.models).sort((a, b) => b.totalTokens - a.totalTokens)
    const successRate = stats.summary.requests > 0 ? Number(((stats.summary.success / stats.summary.requests) * 100).toFixed(2)) : 0

    return {
      filePath: this.filePath,
      summary: {
        ...stats.summary,
        successRate
      },
      models
    }
  }

  async reset() {
    await this.writeStats(this.createEmptyStats())
  }
}

module.exports = new UsageStats()
