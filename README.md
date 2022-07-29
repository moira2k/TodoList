[TOC]

# 'Todo-List' development notes

## Key

````
Azure Bot: hk_todolist_test
AAD App: 
````



## Running

## Local Debug

因为teams toolkit不支持tab with adaptive cards的一键运行本地debug。所以要现在azure上注册azure bot，然后开启本地服务。

可以参考这个教程 [Build Tab with Adaptive Cards](https://docs.microsoft.com/en-us/microsoftteams/platform/sbs-tab-with-adaptive-cards) 一步一步在azure portal注册azure bot服务和bot service connection。然后在 manifest.json 和 .env 中修改"validDomains", "BotId", "BotPassword"。

然后返回本地 project (floder)里，在 terminal 里输入以下命令，开启服务。

```shell
# windows
# Add your authtoken to the default ngrok.yml configuration file. This will grant you access to more features and longer session times
# my authtoken is 2BZ32U8zwt0uQNetoO9MXdoz13j_5T1c9CuQnxN66x2QNpCi
ngrok config add-authtoken <your authtoken>
# 
ngrok http --host-header=localhost 3978
cd bot
npm run build
# package.json 中加入"dev:local"命令：{"scripts"：{..., "dev:local": "env-cmd --silent -f .env.local npm run dev"},...}
npm run dev:local
```



## Design Front-end (Adaptive card)

`design online(generate .json file)`[Designer | Adaptive Cards](https://adaptivecards.io/designer/)

### some points of attention

1. adaptive card online designer莫名会死机，刷新后没有了之前的内容。VSCode 插件 Adaptive Card Studio显示不了''$data": "${xxx}". `$data` is a method to provide the data as **Inline within the template payload**. You can provide the data inline within the template payload. To do so, simply add a attribute to the root object.



## Develop Back-end

1. 每次更改`manifest.json`都需要更改"id"，否则upload an app后，teams仍然会加载最开始的app。

### Fetch to adaptive card

1. 插入有颜色的空组件，美化adaptive card，这个在本地adaptive card调试和在线designer都是允许的操作，但是在`TeamsActivityHandler`中会引发 <BotError>Unable to process invoke from bot 错误
