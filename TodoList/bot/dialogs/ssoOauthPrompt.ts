import { OAuthPrompt } from "botbuilder-dialogs";
import { StatusCodes, ActivityTypes } from "botbuilder";

/**
 * Response body returned for a token exchange invoke activity.
 */
class TokenExchangeInvokeResponse {
    id: any;
    connectionName: any;
    failureDetail: any;
    constructor(id, connectionName, failureDetail) {
        this.id = id;
        this.connectionName = connectionName;
        this.failureDetail = failureDetail;
    }
}

export class SsoOAuthPrompt extends OAuthPrompt {
    failureDetail: any;
    async continueDialog(dialogContext) {
        // If the token was successfully exchanged already, it should be cached in TurnState along with the TokenExchangeInvokeRequest
        const cachedTokenResponse = dialogContext.context.turnState.tokenResponse;

        if (cachedTokenResponse) {
            const tokenExchangeRequest = dialogContext.context.turnState.tokenExchangeInvokeRequest;
            if (!tokenExchangeRequest) {
                throw new Error('TokenResponse is present in TurnState, but TokenExchangeInvokeRequest is missing.');
            }

            // PromptRecognizerResult
            const result = {succeeded: false, value: {}};

            // TokenExchangeInvokeResponse
            const exchangeResponse = new TokenExchangeInvokeResponse(tokenExchangeRequest.id, process.env.ConnectionName, this.failureDetail);

            await dialogContext.context.sendActivity(
                {
                    type: ActivityTypes.InvokeResponse,
                    value:
                    {
                        status: StatusCodes.OK,
                        body: exchangeResponse
                    }
                });

            result.succeeded = true;
            // TokenResponse
            result.value = {
                channelId: cachedTokenResponse.channelId,
                connectionName: process.env.ConnectionName,
                token: cachedTokenResponse.token
            };

            return await dialogContext.endDialog(result.value);
        }

        return await super.continueDialog(dialogContext);
    }
}