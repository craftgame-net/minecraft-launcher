const fs = require('fs')
const path = require('path')
const { dataPath } = require('../configmanager/paths')

// Size-based ring: launcher.log + launcher.log.1 .. launcher.log.4.
// Once the active file exceeds MAX_BYTES it is rotated and the oldest
// archive is dropped, keeping the total footprint bounded (MAX_FILES).
const LOG_DIR = path.join(dataPath, 'logs')
const ACTIVE_FILE = 'launcher.log'
const MAX_BYTES = 2 * 1024 * 1024
const MAX_FILES = 5

let currentSize = -1

function activePath() {
    return path.join(LOG_DIR, ACTIVE_FILE)
}

function archivePath(index) {
    return path.join(LOG_DIR, `${ACTIVE_FILE}.${index}`)
}

function rotate() {
    // Drop the oldest archive (launcher.log.MAX_FILES-1) and shift the rest up.
    fs.rmSync(archivePath(MAX_FILES - 1), { force: true })
    for (let i = MAX_FILES - 2; i >= 1; i--) {
        const src = archivePath(i)
        if (fs.existsSync(src)) {
            fs.renameSync(src, archivePath(i + 1))
        }
    }
    fs.renameSync(activePath(), archivePath(1))
    currentSize = 0
}

/**
 * Append a line to the rotating launcher log. Never throws: logging must
 * not be able to break the launcher.
 *
 * @param {string} line The fully formatted log line (including newline).
 */
function write(line) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true })
        const bytes = Buffer.byteLength(line)
        if (currentSize < 0) {
            currentSize = fs.existsSync(activePath()) ? fs.statSync(activePath()).size : 0
        }
        if (currentSize + bytes > MAX_BYTES) {
            rotate()
        }
        fs.appendFileSync(activePath(), line)
        currentSize += bytes
    } catch {
        // Ignore: the log file is best-effort.
    }
}

module.exports = { write, LOG_DIR }
