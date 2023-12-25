const {PuppetPadlocal} = require("wechaty-puppet-padlocal");
const openAIManager = require('./openAIManager');
const messageStorage = require('./messageStorage');
const config = require('config');
const sharp = require('sharp');
const qrcodeTerminal = require('qrcode-terminal');
const readline = require('readline-sync');
const utils = require('./utils');

const targetGroupTopic = config.get('assistant.groupTopic');
const idleTime = config.get('assistant.idleTimeSeconds') * 1000; // Convert to milliseconds
const INSTANT_DELAY = 3000;
let instantReply = false;
let triggerId = null;
let _room = null;
let _bot = null;

function init() {
    const isWorkPro = config.get('wechaty.puppetType') === 'workpro';
    const {WechatyBuilder} = require(isWorkPro ? '@juzi/wechaty' : 'wechaty');
    const token = config.get('wechaty.puppetToken');
    if (isWorkPro) {
        _bot = WechatyBuilder.build({ name: 'WeChatPal', puppet: '@juzi/wechaty-puppet-service', puppetOptions: {token} });
    } else {
        const puppet = new PuppetPadlocal({token});
        _bot = WechatyBuilder.build({ name: 'WeChatPal', puppet });
    }
    _bot
        .on('scan', (qrcode, status) => {
            utils.logInfo(`Scan QR Code to login: ${status}`);
            qrcodeTerminal.generate(qrcode);
        })
        .on('verify-code', async (id, message, scene, status) => {
            let code = readline.question(message);
            if (code && code.length === 6) {
                try {
                    await _bot.enterVerifyCode(id, code);
                    return;
                } catch (e) {
                    utils.logInfo(`Failed to verify code: ${e.message}`);
                }
            }
        })
        .on('login', (user) => utils.logInfo(`User ${user} logged in`))
        .on('message', handleMessage)
        .start();
}

async function handleMessage(message) {
    const room = message.room();
    const from = message.talker();
    const text = message.text();

    utils.logDebug(`Message received: ${message}`);

    // Check if message is from the target group
    if (from && room && (await room.topic()) === targetGroupTopic) {
        _room = room;
        if (message.type() === _bot.Message.Type.Text) {
            messageStorage.addMessage({ bot: message.self(), sender: from.name(), time: message.date(), text });
        } else if (message.type() === _bot.Message.Type.Image) {
            try {
                const image = message.toImage();
                const file = await image.hd();
                const buffer = await file.toBuffer();
                let dimension = config.get('assistant.imageDimension');
                const resizedBuffer = await sharp(buffer).resize({ width: dimension, height: dimension, fit: sharp.fit.inside, withoutEnlargement: true }).jpeg().toBuffer();
                const base64Data = resizedBuffer.toString('base64');
                messageStorage.addMessage({ bot: message.self(), sender: from.name(), time: message.date(), image: base64Data });
            } catch (e) {
                utils.logError(`Error: ${e}`);
                return;
            }
        }

        // Re-schedule the OpenAI call if no instant reply is scheduled
        if (!message.self() && !instantReply) {
            if (triggerId) {
                clearTimeout(triggerId);
                triggerId = null;
            }
            let delay = idleTime;
            if (await message.mentionSelf()) {
                delay = INSTANT_DELAY;
                instantReply = true;
            }
            triggerId = setTimeout(triggerOpenAICall, delay);
        }
    }
}

async function triggerOpenAICall() {
    if (triggerId) {
        clearTimeout(triggerId);
        triggerId = null;
    }
    instantReply = false;
    const reply = await openAIManager.sendToOpenAI();
    if (reply && _room) {
        utils.logDebug(`Sending message: ${reply}`);

        // add message to storage here because workpro puppet won't receive message sent by itself
        if (config.get('wechaty.puppetType') === 'workpro') {
            messageStorage.addMessage({ bot: true, sender: '', time: new Date(), text: reply });
        }

        _room.say(reply);
    }
}

module.exports = { init };