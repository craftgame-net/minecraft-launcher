// Shared renderer dependencies.
// This script must be loaded before any other renderer script so that
// `LoggerUtil` is available on the window global.
window.LoggerUtil = require('./assets/js/util/LoggerUtil').LoggerUtil

// Bootstrap line so a support log always states what was running.
const { app } = require('@electron/remote')
const os = require('os')
window.LoggerUtil.getLogger('Startup').info(
    `${app.getName()} ${app.getVersion()} | Electron ${process.versions.electron} | Node ${process.versions.node} | ${os.type()} ${os.release()} ${process.arch}`
)

// Persist uncaught failures so they end up in the on-disk launcher log.
// In the renderer these fire as DOM events, not on `process`.
const crashLog = window.LoggerUtil.getLogger('Process')
window.addEventListener('unhandledrejection', (event) => crashLog.error('Unhandled promise rejection', event.reason))
window.addEventListener('error', (event) => crashLog.error('Uncaught exception', event.error != null ? event.error : event.message))
