[toc]

# To-do List with Adaptive Card Tabs

This App talks about the Teams tab Adaptive card with Node JS. This feature shown in this sample is in Public Developer Preview and is supported in desktop and mobile.

## Key Features





## Prerequisite

1. A Microsoft 365 account. If you do not have Microsoft 365 account, apply one from [Microsoft 365 developer program](https://developer.microsoft.com/en-us/microsoft-365/dev-program).

2. An [Azure subscription](https://azure.microsoft.com/en-us/free/).

3. [NodeJS](https://nodejs.org/en/download/). The version used in the project is v16.15.1.

   ```
   # determine node version
   node --version
   ```

4. Latest [Teams Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) or [TeamsFx CLI](https://aka.ms/teamsfx-cli).

5. [Ngrok](https://ngrok.com/). Teams Toolkit cannot create and update Azure Bot service during local debug. To test locally, you'll need [Ngrok](https://ngrok.com/) installed on your development machine. Ngrok will tunnel requests from the Internet to your local computer and terminate the SSL connection from Teams.

   ```powershell
   # windows
   # Add your authtoken to the default ngrok.yml configuration file. This will grant you access to more features and longer session times
   ngrok config add-authtoken <your authtoken>
   # Run ngrok - point to port 3978
   ngrok http --host-header=localhost 3978
   ```

> NOTE: The free ngrok plan will generate a new URL every time you run it, which requires you to update your Azure AD registration, the Teams app manifest, and the project configuration. A paid account with a permanent ngrok URL is recommended.

## What you will learn in this sample:

- How to use Adaptive Card to build a Tab.
- How to create and configure resources on Azure during local debug.
- How to connect to Azure SQL DB and how to do CRUD operations in DB.
- How to use MS graph client to get access to Microsoft 365 data.

## To try this sample

### Local Debug

#### Register Azure AD applications

##### Azure Bot

###### Bot registration

- Sign into the [Azure portal](https://portal.azure.com/).

- Click **Create a resource** in Azure services panel and then search **Azure Bot** and click **Create**.

  <img src=".\Pictures\azure bot entry.png" alt="image-20220916113638136" style="zoom: 50%;" />

  - Input **bot handle** and select your **subscription** and **resource group**.
  - **Type of App** is selected as **Multi Tenant**. 
  - Click **Review + create**.

- Go to resources. 

- Open Configuration, record the **Microsoft App ID** as `BOT_ID`.

- Open **Channels** and select **Microsoft Teams**:

  - Read and agree to the terms of service.

  - On the **Messaging** tab, select the cloud environment for your bot.

  - Select **Apply**.

<img src=".\Pictures\enable the Teams Channel.png" alt="image-20220916143927452" style="zoom:50%;" />

- Return **Home** and Click **APP registrations** and search your bot handle.
- Open it, select **Certificates & secrets** to create a secret for your application.
  - Under **Client secrets**, select **New client secret**.
  - Add a description to identify this secret from others you might need to create for this app.
  - For **Expires**, choose a length of time after which the secret will expire.
  - Select **Add**.
  - Before leaving **Certificates & secrets**, record the secret as `BOT_PASSWORD`.

###### AAD app registration

- Return **Home** and Click **APP registrations** and then click **New registrations**. For reference please check [Create the Azure AD identity provider](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication?view=azure-bot-service-4.0&tabs=multitenant%2Caadv2%2Ccsharp#create-the-azure-ad-identity-provider).

  - Select **supported account types**:  Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)

  - The App requires the Delegated permissions of Microsoft Graph: **User.Read**, **User.ReadBasic.All**

  <img src=".\Pictures\AAD app registration.png" alt="image-20220916163248771" style="zoom: 67%;" />

###### Register the Azure AD identity provider with the bot

- Please [Register the Azure AD identity provider with the bot](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-authentication?view=azure-bot-service-4.0&tabs=multitenant%2Caadv2%2Ccsharp#register-the-azure-ad-identity-provider-with-the-bot).
- For **Scopes**, enter `User.ReadBasic.All`

<img src=".\Pictures\Register the Azure AD identity provider with the bot.png" alt="image-20220916164348227" style="zoom: 67%;" />

##### Azure SQL Database

- Please [Create a single database](https://docs.microsoft.com/en-us/azure/azure-sql/database/single-database-create-quickstart?view=azuresql&tabs=azure-portal#create-a-single-database).

- After creating the resources, Open the SQL database. Select **Query editor (preview)** and enter the following query in the Query editor pane.

  ```sql
  CREATE SCHEMA Todo;
  
  CREATE TABLE Todo.Tasks (
      taskId INT IDENTITY PRIMARY KEY,
      dueDate DATETIME NOT NULL,
      currentStatus NVARCHAR(16) NOT NULL default 'New',
      taskContent NVARCHAR(256) NOT NULL,
      creatorId UNIQUEIDENTIFIER NOT NULL
  );
  
  CREATE TABLE Todo.SharedItems (
      taskId INT NOT NULL,
      userId UNIQUEIDENTIFIER NOT NULL,
      CONSTRAINT SharedWith PRIMARY KEY (taskId, userId),
      FOREIGN KEY (taskId) REFERENCES Todo.Tasks(taskId) ON DELETE CASCADE 
  );
  ```

##### .env.local file

```shell
BOT_ID=<bot id>
BOT_PASSWORD=<bot password>
SQL_ENDPOINT=<sql server name>.database.windows.net
SQL_DATABASE_NAME=<sql database name>
SQL_USER_NAME=
SQL_PASSWORD=
ConnectionName=<OAuth connection name>
```

#### Run

- In the Configuration of your azure bot, update the `Messaging endpoint` with `<the ngrok URL>/api/messages`

- Clone the repo to your local workspace or directly download the source code.

- Install modules & Run the `NodeJS` Server

  - Server will run on PORT: `3978`
  - Open a terminal and navigate to project root directory

- ```shell
  cd bot
  npm run build
  # Add the "dev:local" command to package.json：{"scripts"：{..., "dev:local": "env-cmd --silent -f .env.local npm run dev"},...}
  npm run dev:local
  ```

- This step is specific to Teams.

  - **Copy** the `manifest.json` contained in the `./template/appPackage` folder and edit it. Replace your Microsoft App Id (that was created when you registered your bot earlier) *everywhere* you see the place holder string `<<YOUR-BOT-ID>>` (depending on the scenario the Microsoft App Id may occur multiple times in the `manifest.json`) also update the `<<DOMAIN-NAME>>` with the ngrok URL.
  - **Zip** up the contents of the `manifest` and the `resources` folder to create a `manifest.zip`
  - Upload the `manifest.zip` to Teams (in the Apps view click "Upload a custom app")
    - Go to Microsoft Teams. From the lower left corner, select Apps
    - From the lower left corner, choose Upload a custom App

### Launch Remote

- Clone the repo to your local workspace or directly download the source code.

- Download [Visual Studio Code](https://code.visualstudio.com/) and install [Teams Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit).

- Open the project in Visual Studio Code.

- Open the command palette and select `Teams: Provision in the cloud`. You will be asked to input admin name and password of SQL. The toolkit will help you to provision Azure SQL.

- Once provision is completed, open the command palette and select `Teams: Deploy to the cloud`.

- Open **.fx/states/state.dev.json** file, you could get the database name in `databaseName` setting. [Set IP address of your computer into server-level IP firewall rule from the database overview page](https://docs.microsoft.com/en-us/azure/azure-sql/database/firewall-configure#from-the-database-overview-page).

- In Azure portal, find the database by `<databaseName>` and use query editor to create a table.

- Once deployment is completed, you can preview the app running in Azure. In Visual Studio Code, open `Run and Debug` and select `Launch Remote (Edge)` or `Launch Remote (Chrome)` in the dropdown list and Press `F5` or green arrow button to open a browser.

### Azure Storage

- If you want to upload images yourself, please refer to [upload icons to Azure Account](https://techcommunity.microsoft.com/t5/microsoft-365-pnp-blog/display-images-in-adaptive-cards/ba-p/3036435).