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
import {
    getTodoListData,
    getTodoItemData,
    getSharedTodoListData,
    handleTodoListAction,
    createAuthResponse,
    convertTimeString
} from "./api/handleData"

const AdaptiveCardsTools = require("@microsoft/adaptivecards-tools").AdaptiveCards

// User Configuration property name
const USER_CONFIGURATION = 'userConfigurationProperty';

export class TeamsBot extends TeamsActivityHandler {
    connectionName: string;
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
        // this.connectionName = "todolist_v4";
        this.connectionName = process.env.ConnectionName;
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

        this._ssoOAuthHelper = new SsoOAuthHelpler(this.connectionName, conversationState);

        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');
            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);
            // console.log("Running with Message Activity.");

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
    // Fetch Adaptive Card to render to a tab.
    async handleTeamsTabFetch(context: TurnContext, tabRequest: any): Promise<any> {
        // When the Bot Service Auth flow completes, context will contain a magic code used for verification.
        // console.log("TurnContext", JSON.stringify(context, null, 2));
        // console.log("tabRequest", JSON.stringify(tabRequest, null, 2));
        // authentication
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : '';
        // Getting the tokenResponse for the user
        const tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            this.connectionName,
            magicCode
        );

        if (!tokenResponse || !tokenResponse.token) {
            // Token is not available, hence we need to send back the auth response

            // Retrieve the OAuth Sign in Link.
            const signInLink = await (<BotFrameworkAdapter> context.adapter).getSignInLink(
                context,
                this.connectionName
            );

            // Generating and returning auth response.
            return createAuthResponse(signInLink);
        }
        
        const tabFetchResp = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            },
            responseType: "tab"
        };

        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };
        const time = convertTimeString(new Date());

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
                // console.log(JSON.stringify(tabFetchResp, null, 2));
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
        // console.log(tabFetchResp);
        return tabFetchResp;
    }

    // Handle submits from Adaptive Card.
    async handleTeamsTabSubmit(context: TurnContext, tabRequest: any): Promise<any> {
        console.log('Trying to submit tab content');

        // authentication
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : '';
        var tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            this.connectionName,
            magicCode
        );

        const tabSubmitResp = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            },
            responseType: "tab"
        };
        
        if (tabRequest.data.action == "signout") {
            await (<BotFrameworkAdapter> context.adapter).signOutUser(context, this.connectionName);
    
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

        switch (tabRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                if (tabRequest.data.action != "show") {
                    await handleTodoListAction(user.userId, tabRequest.data);
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
                console.log("todoListPayloadItem", JSON.stringify(todoListPayload.body[3]).length);
                if (tabRequest.data.action == "show" || tabRequest.data.action == "share") {
                    const todoItemData = await getTodoItemData(tabRequest.data.taskId, tokenResponse.token, true);
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

                if (tabRequest.data.action == "show") {
                    const sharedTodoItemData = await getTodoItemData(tabRequest.data.taskId, tokenResponse.token, false);
                    const sharedTodoItemTemplate = new ACData.Template(rawsharedTodoItemCard);
                    const sharedTodoItemPayload = sharedTodoItemTemplate.expand({
                        $root: sharedTodoItemData
                    });
                    tabSubmitResp.tab.value.cards.push({"card": sharedTodoItemPayload});
                }
                break;
            }
        }
        return tabSubmitResp;
    }

}