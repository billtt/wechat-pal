const fs = require('fs');
const { spawn } = require('child_process');
const utils = require('./utils');

const LOG_FILE = './logs/pm2.log';
const SERVICE_NAME = 'wechat-pal';
const KEYWORD = 'token does not exist';

utils.init();

fs.watchFile(LOG_FILE, { interval: 3000 }, (curr, prev) => {
    if (curr && prev && curr.size > prev.size) {
        const stream = fs.createReadStream(LOG_FILE, { start: prev.size, end: curr.size });
        let newContent = '';
        stream.on('data', (chunk) => {
            newContent += chunk;
        });
        stream.on('end', () => {
            stream.close();
            if (newContent.includes(KEYWORD)) {
                utils.logInfo(`Keyword '${KEYWORD}' found in log. Restarting service.`);
                spawn('pm2', ['restart', SERVICE_NAME], { stdio: 'inherit' });
            }
        });
    }
});

utils.logInfo(`Started watching log file ${LOG_FILE}`)
