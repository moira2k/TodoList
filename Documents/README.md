[TOC]

# 'Todo-List' development notes

## Local-Debug Key

````
Azure Bot: hk_todolist_test
AAD App: 
Azure Database: todoDatabase
UserName: azureuser
Password: 1234qwer!
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

1. 每次更改`manifest.json`都需要更改"version"，否则upload an app后，teams仍然会加载最开始的app。

### Fetch to adaptive card

1. 插入有颜色的空组件，美化adaptive card，这个在本地adaptive card调试和在线designer都是允许的操作，但是在`TeamsActivityHandler`中会引发 `<BotError>Unable to process invoke from bot`

3.  People Picker 

   [People Picker in Adaptive Cards - Teams | Microsoft Docs](https://docs.microsoft.com/en-us/microsoftteams/platform/task-modules-and-cards/cards/people-picker?tabs=desktop#dataset)

   [Fluent UI - Controls - React - PeoplePicker (microsoft.com)](https://developer.microsoft.com/en-us/fluentui#/controls/web/peoplepicker)

4.  the Comparison of SDKs 

|   | adaptivecards | npm install adaptivecards-templating | adaptivecards-fabric | @microsoft/adaptivecards-tools |
| --------  | ------------- | ------------------------------------ | -------------------- | ------------------------------ |
|   |               |                                      |                      |                                |

   references to: [Adaptive Cards Overview - Adaptive Cards | Microsoft Docs](https://docs.microsoft.com/en-us/adaptive-cards/)

Response for adaptive card

[Application development overview - SQL Database & SQL Managed Instance](https://docs.microsoft.com/en-us/azure/azure-sql/database/develop-overview?view=azuresql)

1. "adaptivecards-templating"  "adaptivecards" "@microsoft/adaptivecards-tools"

### Azure SQL Database

1. [TeamsFx SDK - Teams | Microsoft Docs](https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/teamsfx-sdk) 官方sample采用的是低版本的tedious。使用最新版本的tedious，需要加`connection.connect()`。
2. 使用 vscode teams toolkit add features 加入 Azure SQL Database。会自动加入 Azure Function 和 BOTSSO，没有考虑用户只是想要增加一个 Azure SQL Database。
3. 使用Provision in the cloud，第一次由于某些原因创建失败某个 resources，在解决问题后，再次 provision，会出现某个资源无法创建，已经存在重名的资源。需要重命名`resourceBaseName`或者进入用户进入 azure 人工删除资源。
4. Azure SQL Database可能会出现SQL.DatabaseUserCreateError错误。需要参考 [TeamsFx/sql-help.md at main · OfficeDev/TeamsFx (github.com)](https://github.com/OfficeDev/TeamsFx/blob/main/docs/fx-core/sql-help.md) 进行解决。
