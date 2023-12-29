module.exports = {
    apps: [{
        name: "wechat-pal",
        script: "./index.js",
        cwd: "./",
        log_file: "./logs/pm2.log",
        restart_delay: 10000,
        env: {
            WECHATY_PUPPET_SERVICE_AUTHORITY: "token-service-discovery-test.juzibot.com",
            WECHATY_SERVICE_DISCOVERY_ENDPOINT: "https://token-service-discovery-test.juzibot.com",
            WECHATY_PUPPET_SERVICE_NO_TLS_INSECURE_CLIENT: "true"
        }
    }, {
        name: "wechat-pal-log-watcher",
        script: "./log-watcher.js",
        cwd: "./",
        log_file: "./logs/log-watcher.log",
        restart_delay: 1000,
        env: {}
    }]
}