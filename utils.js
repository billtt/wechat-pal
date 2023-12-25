const config = require('config');
const log4js = require('log4js');

let _logger = null;

function init() {
    _logger = log4js.getLogger();
    _logger.level = config.get('debug') ? 'debug' : 'info';
}

function logInfo(message) {
    _logger.info(message);
}

function logDebug(message) {
    _logger.debug(message);
}

function logError(message) {
    _logger.error(message);
}

module.exports = { init, logInfo, logDebug, logError };
