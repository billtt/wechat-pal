const OpenAI = require('openai');
const tiktoken = require("@dqbd/tiktoken");
const config = require('config');
const utils = require('./utils');
const messageStorage = require('./messageStorage');

let _openai = null;
let _encoder = null;

async function sendToOpenAI() {
    const messages = messageStorage.getRecentMessages();
    const response = await _openai.chat.completions.create({
        model: config.get('openAI.model'),
        messages: composeMessages(messages),
        max_tokens: config.get('openAI.maxCompletionTokens')
    });

    const usage = response.usage;
    let price = usage.prompt_tokens * config.get('openAI.inputPrice') / 1000
            + usage.completion_tokens * config.get('openAI.outputPrice') / 1000;
    utils.logDebug(`Usage: ${JSON.stringify(usage)} Price: $${price.toFixed(2)}`);

    if (response.choices && response.choices.length > 0) {
        let reply = response.choices[0].message.content;
        if (reply.startsWith('[x]')) {
            utils.logInfo(`[Internal] ${reply}`);
            return null;
        } else {
            return reply;
        }
    }
}

function composeMessages(messages) {
    const result = [{
        role: 'system',
        content: config.get('assistant.systemPrompt')
    }];

    let promptTokens = countTokens(result[0]);
    const maxPromptTokens = config.get('openAI.maxPromptTokens');

    for (let i = messages.length-1; i >= 0; i--) {
        const message = messages[i];
        const aiMsg = {role: (message.bot ? 'assistant' : 'user')};
        const timeStr = new Date(message.time).toLocaleString('zh-CN', {
            weekday: 'short', // long, short, narrow
            day: 'numeric', // numeric, 2-digit
            year: 'numeric', // numeric, 2-digit
            month: 'short', // numeric, 2-digit, long, short, narrow
            hour: 'numeric', // numeric, 2-digit
            minute: 'numeric',
            timeZone: 'Asia/Shanghai'
        });
        const prefix = `${timeStr} ${message.sender}: `;

        if (message.text) {
            if (message.bot) {
                aiMsg.content = [{type: 'text', text: message.text}];
            } else {
                aiMsg.content = [{type: 'text', text: prefix + message.text}];
            }
        } else if (message.image) {
            aiMsg.content = [
                { type: 'text', text: prefix },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${message.image}` } }
            ];
        }

        let tokens = countTokens(aiMsg);
        if (tokens + promptTokens > maxPromptTokens) {
            utils.logDebug(`Prompt token limit reached: ${promptTokens} + ${tokens} > ${maxPromptTokens}, stop at message ${timeStr}`);
            break;
        }
        promptTokens += tokens;
        // insert at index 1, just after the system prompt
        result.splice(1, 0, aiMsg);
    }
    return result;
}

function countTokens(message) {
    if (typeof (message.content) === 'string') {
        return _encoder.encode(message.content).length;
    }
    let count = 0;
    for (let i= 0; i < message.content.length; i++) {
        const content = message.content[i];
        if (content.type === 'text') {
            count += _encoder.encode(content.text).length;
        } else if (content.type === 'image_url') {
            // assuming images are no larger than 512x512, need to adjust if otherwise
            count += 255;
        }
    }
    return count;
}

function init() {
    _openai = new OpenAI({ apiKey: config.get('openAI.apiKey') });
    _encoder = tiktoken.get_encoding("cl100k_base");
}

module.exports = { sendToOpenAI, init };