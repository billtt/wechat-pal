const utils = require('./utils');
const messageStorage = require('./messageStorage');
const wechatyManager = require('./wechatyManager');
const openAIManager = require('./openAIManager');

utils.init();
messageStorage.init();
wechatyManager.init();
openAIManager.init();
