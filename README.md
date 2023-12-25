## WechatPal
以下是项目的简易说明，欢迎联系作者。

### 简介
这是一个简单的整合OpenAI和微信（企业微信，基于Wechaty）的Node.js服务，可将群聊中收到的消息以一定时间间隔的批次提交给OpenAI作为输入，然后将其输出发送至群聊。

通过设定System Prompt，可以实现群聊的AI助手功能。即在Prompt中设定好AI的身份以及详细说明其在群中需要做的事情，它可以响应群聊内容并按照设定的身份作出回应。

目前可配置使用PadLocal和WorkPro其中一个Puppet，分别用于个人微信和企业微信。

### 安装运行说明
将项目Clone至本地，然后在项目路径下执行：
```bash
npm install
cp config/default.sample.json config/default.json
```

然后修改`config/default.json`中的配置项：
- `wechaty.puppetToken` Wechaty的PuppetToken，根据需要填写WorkPro或者PadLocal的Token
- `wechaty.puppetType` 填写`padlocal`或`workpro`
- `openAI.APIKey` OpenAI Key
- `openAI.maxTokens` 单次OpenAI请求的token限制。注意：目前不会对请求prompt进行处理，如果token数超了可能会影响返回内容的效果
- `assistant.idleTimeSeconds` AI助手的等待时间（秒），即多久没有收到消息后会触发AI助手的回复。此设定是为了减少OpenAI的调用频率，尤其当群里消息比较密集时。但如果有人@AI助手，它会立即回复。
- `assistant.messageBatchPeriodDays` 每次向OpenAI发送的消息数量（天），即每次会发送这么多天内的消息给AI。此数值越大，AI能获取的信息量也越大，但也会增加成本，以及超token限制的风险。
- `assistant.systemPrompt` AI助手的System Prompt，此prompt每次都会发送给AI，可以在此对AI的身份和功能进行设定。
- `assistant.groupTopic` 群名。只有该群的消息才会被发送给AI。
- `assistant.imageDimension` 发送给AI的图片尺寸。群内的图片会被缩小到此尺寸（最长边）后发送给AI。

然后在项目路径下执行以下命令即可启动服务：
```bash
npm run <padlocal|workpro>
```
### 其他说明
- 目前程序中设定当AI返回内容以`[x]`开头时，此内容不会被发到群里。如果需要该设定生效，请在systemPrompt中说明此条规则。
