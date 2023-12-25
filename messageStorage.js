const fs = require('fs');
const path = require('path');
const config = require('config');

const storagePath = path.join(__dirname, 'messages.json');
let messageQueue = [];

function storeMessage() {
    fs.writeFileSync(storagePath, JSON.stringify(messageQueue));
}

function addMessage(message) {
    messageQueue.push(message);
    storeMessage();
}

function getRecentMessages() {
    const period = config.get('assistant.messageBatchPeriodDays') * 24 * 3600 * 1000; // Convert to milliseconds
    const startTime = Date.now() - period;
    return messageQueue.filter(message => new Date(message.time).getTime() >= startTime);
}

function init() {
    if (fs.existsSync(storagePath)) {
        messageQueue = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
    } else {
        messageQueue = [];
    }
}

module.exports = { init, addMessage, getRecentMessages };