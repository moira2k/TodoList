import { default as axios } from "axios";
import * as querystring from "querystring";
import {
    TeamsActivityHandler,
    CardFactory,
    TurnContext,
    BotFrameworkAdapter,
    tokenExchangeOperationName,
    ConversationState,
    UserState
} from "botbuilder";
import {
    TabRequest, TabSubmit, TabResponse,
    MessagingExtensionAction,
    MessagingExtensionActionResponse,
} from "botbuilder-core";
import { ComponentDialog } from "botbuilder-dialogs";
import { SsoOAuthHelpler } from "./api/ssoOauthHelpler"
import rawWelcomeCard from "./adaptiveCards/welcome.json";
// import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import * as ACData from "adaptivecards-templating";
import * as AdaptiveCards from "adaptivecards";
import rawheadingCard from "./adaptiveCards/heading.json"
import rawtodoListCard from "./adaptiveCards/todoList.json"
import rawtodoItemCard from "./adaptiveCards/todoItem.json"
import rawsharedTodoListCard from "./adaptiveCards/sharedTodoList.json"
import rawsharedTodoItemCard from "./adaptiveCards/sharedTodoItem.json"
import rawsignOutCard from "./adaptiveCards/signOut.json"
import rawnewItemCard from "./adaptiveCards/newItem.json"
import rawMEstatusCard from "./adaptiveCards/MEStatus.json"
import {
    getTodoListData,
    getTodoItemData,
    getSharedTodoListData,
    handleTodoListAction,
    handleNewItemAction,
    createAuthResponse,
    convertTimeString,
    repalceHtmlToText
} from "./api/handleData"

const AdaptiveCardsTools = require("@microsoft/adaptivecards-tools").AdaptiveCards
import * as z from 'zod';
import { ExtendedUserTokenProvider} from 'botbuilder-core';
const ExtendedUserTokenProviderT = z.custom<ExtendedUserTokenProvider>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (val: any) =>
        typeof val.exchangeToken === 'function' &&
        typeof val.getSignInResource === 'function' &&
        typeof val.getUserToken === 'function' &&
        typeof val.signOutUser === 'function',
    {
        message: 'ExtendedUserTokenProvider',
    }
);

// User Configuration property name
const USER_CONFIGURATION = 'userConfigurationProperty';

export class TeamsBot extends TeamsActivityHandler {
    conversationState: any;
    userState: any;
    userConfigurationProperty: any;
    dialog: any;
    dialogState: any;
    private _ssoOAuthHelper: any;
    // userConfigurationProperty: any;
    // userState: any;
    /**
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState: ConversationState, userState: UserState, dialog: ComponentDialog) {
        super();

        // Creates a new user property accessor.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        this.userConfigurationProperty = userState.createProperty(
            USER_CONFIGURATION
        );

        this._ssoOAuthHelper = new SsoOAuthHelpler(process.env.ConnectionName, conversationState);

        this.onMessage(async (context, next) => {
            console.log("Running dialog with Message Activity.");
            // Run the Dialog with the new message Activity.
            console.log(context.activity);
            await this.dialog.run(context, this.dialogState);

            // let txt = context.activity.text;
            // const removedMentionText = TurnContext.removeRecipientMention(context.activity);
            // if (removedMentionText) {
            //     // Remove the line break
            //     txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
            // }

            // // Trigger command by IM text
            // switch (txt) {
            //     case "welcome": {
            //         const card = AdaptiveCardsTools.declareWithoutData(rawWelcomeCard).render();
            //         await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
            //         break;
            //     }
            // }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

     /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context: TurnContext) {
        await super.run(context);
        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    async handleTeamsSigninVerifyState(context, state) {
        await this.dialog.run(context, this.dialogState);
    }

    async onSignInInvoke(context: TurnContext) {
        if (context.activity && context.activity.name === tokenExchangeOperationName) {
            // The Token Exchange Helper will attempt the exchange, and if successful, it will cache the result
            // in TurnState.  This is then read by SsoOAuthPrompt, and processed accordingly.
            if (!await this._ssoOAuthHelper.shouldProcessTokenExchange(context)) {
                // If the token is not exchangeable, do not process this activity further.
                // (The Token Exchange Helper will send the appropriate response if the token is not exchangeable)
                return;
            }
        }
        await this.dialog.run(context, this.dialogState);
    }
    
    onTokenResponseEvent(context) {
        // Run the Dialog with the new Token Response Event Activity.
        this.dialog.run(context, this.dialogState);
        return this;
    }

    async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction) {
        // console.log("ME", JSON.stringify(action, null, 2));
        const time = convertTimeString(new Date());;
        const newItemTemplate = new ACData.Template(rawnewItemCard);
        var content:string = repalceHtmlToText(action.messagePayload.body.content);

        const newItemPayload = newItemTemplate.expand({
            $root: {content: content, time: time}
        });

        const MEActionResp: MessagingExtensionActionResponse = {
            task: {
                type: "continue",
                value: {
                    card: CardFactory.adaptiveCard(newItemPayload),
                    width: 400
                },
            },
        };

        return MEActionResp;
    }
    async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction) {
        // console.log("ME", JSON.stringify(action, null, 2));
        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };

        var content: string;
        try {
            await handleNewItemAction(user.userId, action.data);
            content = "Success! Please check \"My Todos\" Tab"
        } catch (error) {
            content = "Fail. Please check and have a retry."
        }

        const MEstatusTemplate = new ACData.Template(rawMEstatusCard);
        const MEstatusPayload = MEstatusTemplate.expand({
            $root: {content: content}
        });

        const MEActionResp: MessagingExtensionActionResponse = {
            task: {
                type: "continue",
                value: {
                    card: CardFactory.adaptiveCard(MEstatusPayload),
                    width: 300
                },
            },
        };

        return MEActionResp;
    }


    
    async getUserToken2(context: TurnContext,  connectionName, magicCode: string): Promise<any> {
        const userTokenClient = context.turnState.get(Symbol('TokenApiClientCredentials'));
        if (userTokenClient) {
            return userTokenClient.getUserToken(
                context.activity?.from?.id,
                connectionName,
                context.activity?.channelId,
                magicCode
            );
        } else if (ExtendedUserTokenProviderT.check(context.adapter)) {
            return context.adapter.getUserToken(context, connectionName, magicCode, undefined);
        } else {
            throw new Error('OAuth prompt is not supported by the current adapter');
        }
    }

    // Fetch Adaptive Card to render to a tab.
    async handleTeamsTabFetch(context: TurnContext, tabRequest: TabRequest): Promise<TabResponse> {
        // console.log("context", JSON.stringify(context, null, 2));
        console.log('Trying To Fetch Tab Content');
        // When the Bot Service Auth flow completes, context will contain a magic code used for verification.
        // console.log("TurnContext", JSON.stringify(context, null, 2));
        // console.log("tabRequest", JSON.stringify(tabRequest, null, 2));
        // authentication
        // const magicCode =
        // context.activity.value && context.activity.value.state
        //     ? context.activity.value.state
        //     : '';
        var token = await this.getUserToken2(context, process.env.ConnectionName, undefined);
        console.log("token", token);
        
        console.log(context.activity.value);
        console.log("OAuth state", context.activity.value, tabRequest.state);
        const magicCode = tabRequest.state && Number.isInteger(Number(tabRequest.state)) ? tabRequest.state : '';
        // Getting the tokenResponse for the user
        console.log("context.turnState.TokenApiClientCredentials", context.turnState.get(Symbol('TokenApiClientCredentials')));
        const tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            process.env.ConnectionName,
            magicCode
        );
        console.log("context.turnState.TokenApiClientCredentials", context.turnState.get(Symbol('TokenApiClientCredentials')));
        console.log("token2", token);
        if (!tokenResponse || !tokenResponse.token) {
            // Token is not available, hence we need to send back the auth response

            // Retrieve the OAuth Sign in Link.
            const signInLink = await (<BotFrameworkAdapter> context.adapter).getSignInLink(
                context,
                process.env.ConnectionName
            );

            // Generating and returning auth response.
            return createAuthResponse(signInLink);
        }
        
        const tabFetchResp: TabResponse = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            }
        };

        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };
        const time = convertTimeString(new Date());;
        const headingTemplate = new ACData.Template(rawheadingCard);
        const headingPayload = headingTemplate.expand({
            $root: {enquirer: user, time: time}
        });
        tabFetchResp.tab.value.cards = [{"card": headingPayload}];
        switch (tabRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                const todoListData = await getTodoListData(user.userId);
                todoListData.time = time;
                // Create a Template instance from the template payload
                const todoListTemplate = new ACData.Template(rawtodoListCard);
                // Expand the template with your `$root` data object.
                // This binds it to the data and produces the final Adaptive Card payload
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabFetchResp.tab.value.cards.push({"card": todoListPayload});
                break;
            }
            case "SharedwithMe": {
                const sharedTodoListData = await getSharedTodoListData(user.userId, tokenResponse.token);
                const sharedTodoListTemplate = new ACData.Template(rawsharedTodoListCard);
                const sharedTodoListPayload = sharedTodoListTemplate.expand({
                    $root: sharedTodoListData
                });
                tabFetchResp.tab.value.cards.push({"card": sharedTodoListPayload});
                break;
            }
        }
        // console.log(JSON.stringify(tabFetchResp, null, 2));
        return tabFetchResp;
    }

    // Handle submits from Adaptive Card.
    async handleTeamsTabSubmit(context: TurnContext, tabSubmit: TabSubmit): Promise<TabResponse> {
        console.log('Trying To Submit Tab Content');

        // authentication
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : '';
        // const magicCode = tabSubmit.state && Number.isInteger(Number(tabSubmit.state)) ? tabSubmit.state : '';
        var tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            process.env.ConnectionName,
            magicCode
        );

        const tabSubmitResp: TabResponse = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            }
        };
        
        if (tabSubmit.data.action == "signout") {
            await (<BotFrameworkAdapter> context.adapter).signOutUser(context, process.env.ConnectionName);
    
            // Generating and returning submit response.
            tabSubmitResp.tab.value.cards = [{"card": rawsignOutCard}]
            return tabSubmitResp;
        }

        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };
        const time = convertTimeString(new Date());

        const headingTemplate = new ACData.Template(rawheadingCard);
        const headingPayload = headingTemplate.expand({
            $root: {enquirer: user, time: time}
        });
        tabSubmitResp.tab.value.cards = [{"card": headingPayload}];
        console.log("headingPayload", JSON.stringify(headingPayload).length)

        switch (tabSubmit.tabContext.tabEntityId) {
            case "MyTodos": {
                if (tabSubmit.data.action != "show") {
                    await handleTodoListAction(user.userId, tabSubmit.data);
                }
                // Todo: get from static resources, if action is "show"
                const todoListData = await getTodoListData(user.userId);
                todoListData.time = time;
                const todoListTemplate = new ACData.Template(rawtodoListCard);
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabSubmitResp.tab.value.cards.push({"card": todoListPayload});
                console.log("todoListPayload", JSON.stringify(todoListPayload).length);
                if (todoListPayload.length >= 3) {
                    console.log("todoListPayloadItem", JSON.stringify(todoListPayload.body[3]).length);
                }
                if (tabSubmit.data.action == "show" || tabSubmit.data.action == "share") {
                    const todoItemData = await getTodoItemData(<number> tabSubmit.data.taskId, tokenResponse.token, true);
                    const todoItemTemplate = new ACData.Template(rawtodoItemCard);
                    const todoItemPayload = todoItemTemplate.expand({
                        $root: todoItemData
                    });
                    tabSubmitResp.tab.value.cards.push({"card": todoItemPayload});
                    console.log("todoItemPayload", JSON.stringify(todoItemPayload).length);
                }
                break;
            }
            case "SharedwithMe": {
                // Todo: get from static resources, if action is "show"
                const sharedTodoListData = await getSharedTodoListData(user.userId, tokenResponse.token);
                const sharedTodoListTemplate = new ACData.Template(rawsharedTodoListCard);
                const sharedTodoListPayload = sharedTodoListTemplate.expand({
                    $root: sharedTodoListData
                });
                tabSubmitResp.tab.value.cards.push({"card": sharedTodoListPayload});

                if (tabSubmit.data.action == "show") {
                    const sharedTodoItemData = await getTodoItemData(<number> tabSubmit.data.taskId, tokenResponse.token, false);
                    const sharedTodoItemTemplate = new ACData.Template(rawsharedTodoItemCard);
                    const sharedTodoItemPayload = sharedTodoItemTemplate.expand({
                        $root: sharedTodoItemData
                    });
                    tabSubmitResp.tab.value.cards.push({"card": sharedTodoItemPayload});
                }
                break;
            }
        }
        // console.log(JSON.stringify(tabSubmitResp, null, 2));
        return tabSubmitResp;
    }

    async onInvokeActivity(context: TurnContext) {
        console.log("onInvoke, ", context.activity.name);
        console.log("query", context.activity.value);
        // console.log("context", JSON.stringify(context, null, 2));
        const valueObj = context.activity.value;
        if (valueObj.authentication) {
            const authObj = valueObj.authentication;
            if (authObj.token) {
                // If the token is NOT exchangeable, then do NOT deduplicate requests.
                if (await this.tokenIsExchangeable(context)) {
                    return await super.onInvokeActivity(context);
                } else {
                    const response = {
                        status: 412
                    };
                    return response;
                }
            }
        }
        return await super.onInvokeActivity(context);
    }

    async tokenIsExchangeable(context: TurnContext) {
        let tokenExchangeResponse = null;
        try {
            const valueObj = context.activity.value;
            const tokenExchangeRequest = valueObj.authentication;
            console.log("tokenExchangeReques", context.activity.value.authentication);
            tokenExchangeResponse = await (<BotFrameworkAdapter> context.adapter).exchangeToken(context,
                process.env.connectionName,
                context.activity.from.id,
                { token: tokenExchangeRequest.token });
        } catch (err) {
            console.log('tokenExchange error: ' + err);
            // Ignore Exceptions
            // If token exchange failed for any reason, tokenExchangeResponse above stays null , and hence we send back a failure invoke response to the caller.
        }
        if (!tokenExchangeResponse || !tokenExchangeResponse.token) {
            return false;
        }
        return true;
    }

}