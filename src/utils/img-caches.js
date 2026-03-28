const fs = require('fs')
const path = require('path')
const config = require('../config')
const { logger } = require('./logger')

class imgCacheManager {
  constructor() {
    this.cacheMap = new Map()
  }

  getCachePath(signature) {
    return path.join(config.cacheDir, `${signature}.txt`)
  }

  cacheIsExist(signature) {
    try {
      if (config.cacheMode === 'default') {
        return this.cacheMap.has(signature)
      } else {
        const cachePath = this.getCachePath(signature)
        return fs.existsSync(cachePath)
      }
    } catch (e) {
      logger.error('缓存检查失败', 'CACHE', '', e)
      return false
    }
  }

  addCache(signature, url) {
    try {
      const isExist = this.cacheIsExist(signature)

      if (isExist) {
        return false
      } else {

        if (config.cacheMode === 'default') {
          this.cacheMap.set(signature, url)
        } else {
          const cachePath = this.getCachePath(signature)
          fs.mkdirSync(config.cacheDir, { recursive: true })
          fs.writeFileSync(cachePath, url)
        }

        return true

      }
    } catch (e) {
      logger.error('添加缓存失败', 'CACHE', '', e)
      return false
    }
  }

  getCache(signature) {
    try {
      const cachePath = this.getCachePath(signature)
      const isExist = this.cacheIsExist(signature)

      if (isExist) {
        if (config.cacheMode === 'default') {
          return {
            status: 200,
            url: this.cacheMap.get(signature)
          }
        } else {
          const data = fs.readFileSync(cachePath, 'utf-8')
          return {
            status: 200,
            url: data
          }
        }
      } else {
        return {
          status: 404,
          url: null
        }
      }
    } catch (e) {
      logger.error('获取缓存失败', 'CACHE', '', e)
      return {
        status: 500,
        url: null
      }
    }
  }
}

module.exports = imgCacheManager
