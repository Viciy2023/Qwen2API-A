const path = require('path')

const resolvePath = (targetPath, fallbackPath) => {
  if (targetPath && targetPath.trim()) {
    return path.resolve(targetPath)
  }

  return path.resolve(fallbackPath)
}

const dataDir = resolvePath(process.env.DATA_DIR, path.join(__dirname, '../../data'))
const cacheDir = resolvePath(process.env.CACHE_DIR, path.join(__dirname, '../../caches'))
const logDir = resolvePath(process.env.LOG_DIR, path.join(__dirname, '../../logs'))

module.exports = {
  dataDir,
  cacheDir,
  logDir,
  dataFilePath: path.join(dataDir, 'data.json')
}
