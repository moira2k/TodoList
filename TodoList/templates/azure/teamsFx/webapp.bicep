// Auto generated content, please customize files under provision folder

@secure()
param provisionParameters object
param provisionOutputs object
@secure()
param currentAppSettings object

var botWebAppName = split(provisionOutputs.webAppOutput.value.resourceId, '/')[8]

var m365ClientId = provisionParameters['m365ClientId']

var m365ClientSecret = provisionParameters['m365ClientSecret']

var m365TenantId = provisionParameters['m365TenantId']
var m365OauthAuthorityHost = provisionParameters['m365OauthAuthorityHost']

var m365ApplicationIdUri = 'api://botid-${botId}'

var botAadAppClientId = provisionParameters['botAadAppClientId']

var botAadAppClientSecret = provisionParameters['botAadAppClientSecret']

var botId = provisionParameters['botAadAppClientId']

resource botWebAppSettings 'Microsoft.Web/sites/config@2021-02-01' = {
  name: '${botWebAppName}/appsettings'
  properties: union({
    M365_AUTHORITY_HOST: m365OauthAuthorityHost // AAD authority host
    M365_CLIENT_ID: m365ClientId // Client id of AAD application
    M365_CLIENT_SECRET: m365ClientSecret // Client secret of AAD application
    M365_TENANT_ID: m365TenantId // Tenant id of AAD application
    M365_APPLICATION_ID_URI: m365ApplicationIdUri // Application ID URI of AAD application
    BOT_ID: botAadAppClientId // ID of your bot
    BOT_PASSWORD: botAadAppClientSecret // Secret of your bot
    SQL_DATABASE_NAME: provisionOutputs.azureSqlOutput.value.databaseName // SQL database name
    SQL_ENDPOINT: provisionOutputs.azureSqlOutput.value.sqlEndpoint // SQL server endpoint
    IDENTITY_ID: provisionOutputs.identityOutput.value.identityClientId // User assigned identity id, the identity is used to access other Azure resources
    ConnectionName: 'todolist_v4' //Oauth Connection Name
  }, currentAppSettings)
}
