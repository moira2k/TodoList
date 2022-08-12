import { default as axios } from "axios";
import * as querystring from "querystring";
import {
    TeamsActivityHandler,
    CardFactory,
    TurnContext,
    BotFrameworkAdapter
} from "botbuilder";
import rawWelcomeCard from "./adaptiveCards/welcome.json";
// import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import * as ACData from "adaptivecards-templating";
import * as AdaptiveCards from "adaptivecards";
import rawheadingCard from "./adaptiveCards/heading.json"
import rawtodoListCard from "./adaptiveCards/todoList.json"
import rawtodoItemCard from "./adaptiveCards/todoItem.json"
import rawtaskSharedCard from "./adaptiveCards/taskShared.json"
import rawtodoMessCard from "./adaptiveCards/todoMess.json"
import rawsignOutCard from "./adaptiveCards/signOut.json"
import {
    getTodoListData,
    getUserDetails,
    getTodoItemData,
    getTaskSharedData,
    handleTodoListAction,
    createAuthResponse,
    getCurrentTimeString
} from "./api/handleData"

const AdaptiveCardsTools = require("@microsoft/adaptivecards-tools").AdaptiveCards

// export interface DataInterface {
//     likeCount: number;
// }

// User Configuration property name
const USER_CONFIGURATION = 'userConfigurationProperty';

export class TeamsBot extends TeamsActivityHandler {
    connectionName: string;
    // userConfigurationProperty: any;
    // userState: any;
    /**
     *
     * @param {UserState} User state to persist configuration settings
     */
    constructor() {
        super();

        // Creates a new user property accessor.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
        // this.userConfigurationProperty = userState.createProperty(
        //     USER_CONFIGURATION
        // );
        // this.userState = userState;
        this.connectionName = "todolist_v4";


        this.onMessage(async (context, next) => {
            console.log("Running with Message Activity.");

            let txt = context.activity.text;
            const removedMentionText = TurnContext.removeRecipientMention(context.activity);
            if (removedMentionText) {
                // Remove the line break
                txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
            }

            // Trigger command by IM text
            switch (txt) {
                case "welcome": {
                    const card = AdaptiveCardsTools.declareWithoutData(rawWelcomeCard).render();
                    await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
                    break;
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

     /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
    //   async run(context: TurnContext) {
    //     await super.run(context);

    //     // Save state changes
    //     await this.userState.saveChanges(context);
    // }

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
            // console.log(JSON.stringify(createAuthResponse(signInLink), null, 2));
            return createAuthResponse(signInLink);
        }
        // console.log("token", tokenResponse.token);
        const tabFetchResp = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            },
            responseType: "tab"
        };

        const user = await getUserDetails(context.activity.from.aadObjectId, tokenResponse.token);

        const headingTemplate = new ACData.Template(rawheadingCard);
        const headingPayload = headingTemplate.expand({
            $root: {enquirer: user, enquiredDate: getCurrentTimeString()}
        });

        switch (tabRequest.tabContext.tabEntityId) {
            // the first tab: MyTab
            case "MyTab": {
                // the first card: TodoList
                const todoListData = await getTodoListData(user.AADId, tokenResponse.token);
                todoListData.enquirer = user;
                // Create a Template instance from the template payload
                const todoListTemplate = new ACData.Template(rawtodoListCard);
                // Expand the template with your `$root` data object.
                // This binds it to the data and produces the final Adaptive Card payload
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabFetchResp.tab.value.cards = [{"card": headingPayload}, {"card": todoListPayload}];
                break;
            }
            // the second tab: SharedTab
            case "SharedTab": {
                const taskSharedData = await getTaskSharedData(user.AADId, tokenResponse.token);
                taskSharedData.enquirer = user;
                const taskSharedTemplate = new ACData.Template(rawtaskSharedCard);
                const taskSharedPayload = taskSharedTemplate.expand({
                    $root: taskSharedData
                });
                tabFetchResp.tab.value.cards = [{"card": headingPayload}, {"card": taskSharedPayload}];
                break;
            }
        }
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
        if (!tokenResponse || !tokenResponse.token) {
            const signInLink = await (<BotFrameworkAdapter> context.adapter).getSignInLink(
                context,
                this.connectionName
            );
            return createAuthResponse(signInLink);
        }
        
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

        const user = await getUserDetails(context.activity.from.aadObjectId, tokenResponse.token);

        const headingTemplate = new ACData.Template(rawheadingCard);
        const headingPayload = headingTemplate.expand({
            $root: {enquirer: user, enquiredDate: getCurrentTimeString()}
        });

        switch (tabRequest.tabContext.tabEntityId) {
            // the first tab: MyTab
            case "MyTab": {
                if (tabRequest.data.action != "show") {
                    const handleStatus = await handleTodoListAction(user.AADId, tabRequest.data);
                    if (handleStatus != 200) {
                        break;
                    }
                }
                // Todo: get from static resources, if action is "show"
                const todoListData = await getTodoListData(user.AADId, tokenResponse.token);
                todoListData.enquirer = user;
                const todoListTemplate = new ACData.Template(rawtodoListCard);
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabSubmitResp.tab.value.cards = [{"card": headingPayload}, {"card": todoListPayload}]

                if (tabRequest.data.action == "show" || tabRequest.data.action == "share") {
                    const todoItemData = await getTodoItemData(tabRequest.data.taskId, tokenResponse.token);
                    todoItemData.enquirer = user;
                    const todoItemTemplate = new ACData.Template(rawtodoItemCard);
                    const todoItemPayload = todoItemTemplate.expand({
                        $root: todoItemData
                    });
                    tabSubmitResp.tab.value.cards.push({"card": todoItemPayload});
                }
                break;
            }
            // the second tab: SharedTab
            case "SharedTab": {
                // Todo: get from static resources, if action is "show"
                const taskSharedData = await getTaskSharedData(user.AADId, tokenResponse.token);
                taskSharedData.enquirer = user;
                const taskSharedTemplate = new ACData.Template(rawtaskSharedCard);
                const taskSharedPayload = taskSharedTemplate.expand({
                    $root: taskSharedData
                });
                tabSubmitResp.tab.value.cards = [{"card": headingPayload}, {"card": taskSharedPayload}];

                if (tabRequest.data.action == "show") {
                    const todoMessData = await getTodoItemData(tabRequest.data.taskId, tokenResponse.token);
                    todoMessData.enquirer = user;
                    const todoMessTemplate = new ACData.Template(rawtodoMessCard);
                    const todoMessPayload = todoMessTemplate.expand({
                        $root: todoMessData
                    });
                    tabSubmitResp.tab.value.cards.push({"card": todoMessPayload});
                }
                break;
            }
        }
        return tabSubmitResp;
    }

}