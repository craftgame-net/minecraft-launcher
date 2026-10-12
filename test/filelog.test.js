process.env.NODE_ENV = 'test'

const test = require('node:test')
const assert = require('node:assert')
const os = require('os')
const path = require('path')
const fs = require('fs')

// Resolve the log directory into a throwaway home before loading the module.
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'cgn-filelog-'))
process.env.HOME = home
process.env.APPDATA = path.join(home, 'AppData')

const FileLog = require('../app/assets/js/util/FileLog')

const MAX_BYTES = 2 * 1024 * 1024

test('writes lines to the active log file', () => {
    FileLog.write('hello\n')
    FileLog.write('world\n')
    const content = fs.readFileSync(path.join(FileLog.LOG_DIR, 'launcher.log'), 'utf8')
    assert.strictEqual(content, 'hello\nworld\n')
})

test('rotates at 2 MB and keeps at most 5 files', () => {
    const line = 'x'.repeat(1023) + '\n'
    for (let i = 0; i < 11000; i++) {
        FileLog.write(line)
    }
    const files = fs.readdirSync(FileLog.LOG_DIR).sort()
    assert.strictEqual(files.length, 5)
    assert.ok(files.includes('launcher.log'))
    assert.ok(files.includes('launcher.log.4'))
    for (const file of files) {
        assert.ok(fs.statSync(path.join(FileLog.LOG_DIR, file)).size <= MAX_BYTES, `${file} exceeds the limit`)
    }
})
