const OpenAI = require('openai');
const config = require('config');
const utils = require('./utils');
const messageStorage = require('./messageStorage');

const openai = new OpenAI({ apiKey: config.get('openAI.apiKey') });

async function sendToOpenAI() {
    const messages = messageStorage.getRecentMessages();
    const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: composeMessages(messages),
        max_tokens: config.get('openAI.maxTokens')
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
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const aiMsg = {role: (message.bot ? 'assistant' : 'user')};
        const timeStr = new Date(message.time).toLocaleString('zh-CN', {
            weekday: 'short', // long, short, narrow
            day: 'numeric', // numeric, 2-digit
            year: 'numeric', // numeric, 2-digit
            month: 'short', // numeric, 2-digit, long, short, narrow
            hour: 'numeric', // numeric, 2-digit
            minute: 'numeric'
        });
        const prefix = `${timeStr} ${message.sender}: `;

        if (message.text) {
            if (message.bot) {
                aiMsg.content = message.text;
            } else {
                aiMsg.content = prefix + message.text;
            }
        } else if (message.image) {
            aiMsg.content = [
                { type: 'text', text: prefix },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${message.image}` } }
            ];
        }
        result.push(aiMsg);
    }
    return result;
}

module.exports = { sendToOpenAI };