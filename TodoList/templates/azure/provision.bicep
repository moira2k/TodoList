@secure()
param provisionParameters object
// Resources for identity
module userAssignedIdentityProvision './provision/identity.bicep' = {
  name: 'userAssignedIdentityProvision'
  params: {
    provisionParameters: provisionParameters
  }
}

output identityOutput object = {
  teamsFxPluginId: 'fx-resource-identity'
  identityName: userAssignedIdentityProvision.outputs.identityName
  identityResourceId: userAssignedIdentityProvision.outputs.identityResourceId
  identityClientId: userAssignedIdentityProvision.outputs.identityClientId
}
// Resources for bot
module webAppProvision './provision/webapp.bicep' = {
  name: 'webAppProvision'
  params: {
    provisionParameters: provisionParameters
    userAssignedIdentityId: userAssignedIdentityProvision.outputs.identityResourceId
  }
}

output webAppOutput object = {
  teamsFxPluginId: 'fx-resource-bot'
  skuName: webAppProvision.outputs.webAppSKU
  siteName: webAppProvision.outputs.webAppName
  validDomain: webAppProvision.outputs.webAppDomain
  appServicePlanName: webAppProvision.outputs.appServicePlanName
  resourceId: webAppProvision.outputs.webAppResourceId
  siteEndpoint: webAppProvision.outputs.webAppEndpoint
}
// Resources for bot
module botProvision './provision/botservice.bicep' = {
  name: 'botProvision'
  params: {
    provisionParameters: provisionParameters
    botEndpoint: webAppProvision.outputs.webAppEndpoint
  }
}

// Resources for Azure SQL
module azureSqlProvision './provision/azureSql.bicep' = {
  name: 'azureSqlProvision'
  params: {
    provisionParameters: provisionParameters
  }
}

output azureSqlOutput object = {
  teamsFxPluginId: 'fx-resource-azure-sql'
  sqlResourceId: azureSqlProvision.outputs.resourceId
  sqlEndpoint: azureSqlProvision.outputs.sqlEndpoint
  databaseName: azureSqlProvision.outputs.databaseName
}
// Resources for Azure Functions
module functionProvision './provision/function.bicep' = {
  name: 'functionProvision'
  params: {
    provisionParameters: provisionParameters
    userAssignedIdentityId: userAssignedIdentityProvision.outputs.identityResourceId
  }
}

output functionOutput object = {
  teamsFxPluginId: 'fx-resource-function'
  functionAppResourceId: functionProvision.outputs.functionAppResourceId
  functionEndpoint: functionProvision.outputs.functionEndpoint
}
// output for database with name suffix [48e825]
output azureSqlOutput_48e825 object = {
  teamsFxPluginId: 'fx-resource-azure-sql'
  databaseName_48e825: azureSqlProvision.outputs.databaseName_48e825
}