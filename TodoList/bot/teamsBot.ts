import { default as axios } from "axios";
import * as querystring from "querystring";
import {
    TeamsActivityHandler,
    CardFactory,
    TurnContext,
    AdaptiveCardInvokeValue,
    AdaptiveCardInvokeResponse,
    BotFrameworkAdapter,
    BotAdapter
} from "botbuilder";
import rawWelcomeCard from "./adaptiveCards/welcome.json";
// import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import * as ACData from "adaptivecards-templating";
import * as AdaptiveCards from "adaptivecards";
import rawtodoListCard from "./adaptiveCards/todoList.json"
import rawtodoItemCard from "./adaptiveCards/todoItem.json"
import rawtaskSharedCard from "./adaptiveCards/taskShared.json"
import rawtodoMessCard from "./adaptiveCards/todoMess.json"
import graphRun from "./api/graphClient";
// test data
import testCard from "./adaptiveCards/test.json"
import rawtodoListData from "./adaptiveCards/todoList.data.json"
import rawtodoItemData from "./adaptiveCards/todoItem.data.json"
import rawtaskSharedData from "./adaptiveCards/taskShared.data.json"
import rawtodoMessData from "./adaptiveCards/todoMess.data.json"
import {
    getTodoListData,
    getUserDetails,
    getTodoItemData,
    getTaskSharedData,
    handleTodoListAction,
    createAuthResponse
} from "./api/handleData"
import { ThisMemoryScope } from "botbuilder-dialogs";

const AdaptiveCardsTools = require("@microsoft/adaptivecards-tools").AdaptiveCards

// export interface DataInterface {
//     likeCount: number;
// }

// User Configuration property name
const USER_CONFIGURATION = 'userConfigurationProperty';

export class TeamsBot extends TeamsActivityHandler {
    // record the likeCount
    // likeCountObj: { likeCount: number };
    user: {[key: string]: any};
    userConfigurationProperty: any;
    connectionName: string;
    userState: any;
    /**
     *
     * @param {UserState} User state to persist configuration settings
     */
    constructor(userState) {
        super();

        // Creates a new user property accessor.
        // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
        this.userConfigurationProperty = userState.createProperty(
            USER_CONFIGURATION
        );
        this.connectionName = process.env.ConnectionName;
        this.userState = userState;


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
        //         case "learn": {
        //             this.likeCountObj.likeCount = 0;
        //             const card = AdaptiveCardsTools.declare<DataInterface>(rawLearnCard).render(this.likeCountObj);
        //             await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        //             break;
        //         }
        //         /**
        //          * case "yourCommand": {
        //          *   await context.sendActivity(`Add your response here!`);
        //          *   break;
        //          * }
        //          */
            }

        //     // By calling next() you ensure that the next BotHandler is run.
        //     await next();
        });

        // this.onMembersAdded(async (context, next) => {
        //     const membersAdded = context.activity.membersAdded;
        //     for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        //         if (membersAdded[cnt].id) {
        //             const card = AdaptiveCardsTools.declareWithoutData(rawWelcomeCard).render();
        //             await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
        //             break;
        //         }
        //     }
        //     await next();
        // });
    }

     /**
     * Override the ActivityHandler.run() method to save state changes after the bot logic completes.
     */
      async run(context: TurnContext) {
        await super.run(context);

        // Save state changes
        await this.userState.saveChanges(context);
    }
    
    // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
    // method handles that event.
    // async onAdaptiveCardInvoke(
    //     context: TurnContext,
    //     invokeValue: AdaptiveCardInvokeValue
    // ): Promise<AdaptiveCardInvokeResponse> {
    //     // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json
    //     if (invokeValue.action.verb === "userlike") {
    //         this.likeCountObj.likeCount++;
    //         const card = AdaptiveCards.declare<DataInterface>(rawLearnCard).render(this.likeCountObj);
    //         await context.updateActivity({
    //             type: "message",
    //             id: context.activity.replyToId,
    //             attachments: [CardFactory.adaptiveCard(card)],
    //         });
    //         return { statusCode: 200, type: undefined, value: undefined };
    //     }
    // }

    // Message extension Code
    // Action.
    // public async handleTeamsMessagingExtensionSubmitAction(
    //     context: TurnContext,
    //     action: any
    // ): Promise<any> {
    //     switch (action.commandId) {
    //         case "createCard":
    //             return createCardCommand(context, action);
    //         case "shareMessage":
    //             return shareMessageCommand(context, action);
    //         default:
    //             throw new Error("NotImplemented");
    //     }
    // }

    // Search.
    // public async handleTeamsMessagingExtensionQuery(context: TurnContext, query: any): Promise<any> {
    //     const searchQuery = query.parameters[0].value;
    //     const response = await axios.get(
    //         `http://registry.npmjs.com/-/v1/search?${querystring.stringify({
    //             text: searchQuery,
    //             size: 8,
    //         })}`
    //     );

    //     const attachments = [];
    //     response.data.objects.forEach((obj) => {
    //         const heroCard = CardFactory.heroCard(obj.package.name);
    //         const preview = CardFactory.heroCard(obj.package.name);
    //         preview.content.tap = {
    //             type: "invoke",
    //             value: { name: obj.package.name, description: obj.package.description },
    //         };
    //         const attachment = { ...heroCard, preview };
    //         attachments.push(attachment);
    //     });

    //     return {
    //         composeExtension: {
    //             type: "result",
    //             attachmentLayout: "list",
    //             attachments: attachments,
    //         },
    //     };
    // }

    // public async handleTeamsMessagingExtensionSelectItem(
    //     context: TurnContext,
    //     obj: any
    // ): Promise<any> {
    //     return {
    //         composeExtension: {
    //             type: "result",
    //             attachmentLayout: "list",
    //             attachments: [CardFactory.heroCard(obj.name, obj.description)],
    //         },
    //     };
    // }

    // Link Unfurling.
    // public async handleTeamsAppBasedLinkQuery(context: TurnContext, query: any): Promise<any> {
    //     const attachment = CardFactory.thumbnailCard("Image Preview Card", query.url, [query.url]);

    //     const result = {
    //         attachmentLayout: "list",
    //         type: "result",
    //         attachments: [attachment],
    //     };

    //     const response = {
    //         composeExtension: result,
    //     };
    //     return response;
    // }

    // Fetch Adaptive Card to render to a tab.
    async handleTeamsTabFetch(context: TurnContext, tabRequest: any): Promise<any> {
        // When the Bot Service Auth flow completes, context will contain a magic code used for verification.
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : '';

        // Getting the tokenResponse for the user
        const tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            process.env.connectionName,
            magicCode
        );
        console.log(magicCode);
        console.log(tokenResponse);
        if (!tokenResponse || !tokenResponse.token) {
            // Token is not available, hence we need to send back the auth response

            // Retrieve the OAuth Sign in Link.
            const signInLink = await (<BotFrameworkAdapter> context.adapter).getSignInLink(
                context,
                process.env.ConnectionName
            );
            console.log(signInLink);
            // Generating and returning auth response.
            return createAuthResponse(signInLink);
        }
        // "_activity"."from": {
        //     "id": "29:1kA70lko0omlG82UshStbT7vs7zUWLvuY8qUOazHzI0PFvzzf_XDuSSZcH_kizizDoINul3VU_G6r9aNaHQJTkw",
        //     "name": "Kun Huang",
        //     "aadObjectId": "293e2e1f-8167-44bf-b03f-74a48abf4ad3" // people picker
        // }
        // console.log("TurnContext", JSON.stringify(context, null,2));
        console.log(tabRequest);
        const tabFetchResp = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            },
            responseType: "tab"
        };

        // if account not in db, get photos graph client and insert into db

        // test account 1
        this.user = await getUserDetails(context.activity.from.aadObjectId, context.activity.from);
        // // test my account and graph client
        // this.user = context.activity.from;
        // this.user.AADId = context.activity.from.aadObjectId;

        // const mess = await graphRun();
        // console.log(JSON.stringify(mess, null, 2));
        switch (tabRequest.tabContext.tabEntityId) {
            // the first tab: MyTab
            case "MyTab": {
                // the first card: TodoList
                const todoListData = await getTodoListData(this.user.AADId);
                todoListData.enquirer = this.user;
                // Create a Template instance from the template payload
                const todoListTemplate = new ACData.Template(rawtodoListCard);
                // Expand the template with your `$root` data object.
                // This binds it to the data and produces the final Adaptive Card payload
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabFetchResp.tab.value.cards = [{"card": todoListPayload}];
                break;
            }
            // the second tab: SharedTab
            case "SharedTab": {
                const taskSharedData = await getTaskSharedData(this.user.AADId);
                taskSharedData.enquirer = this.user;
                console.log(JSON.stringify(taskSharedData, null, 2));
                const taskSharedTemplate = new ACData.Template(rawtaskSharedCard);
                const taskSharedPayload = taskSharedTemplate.expand({
                    $root: taskSharedData
                });
                tabFetchResp.tab.value.cards = [{"card": taskSharedPayload}];
                break;
            }
        }
        return tabFetchResp;
    }

    // Handle submits from Adaptive Card.
    async handleTeamsTabSubmit(context: TurnContext, tabRequest: any): Promise<any> {
        const tabSubmitResp = {
            tab: {
                type: "continue",
                value: {
                    cards: []
                },
            },
            responseType: "tab"
        };
        console.log(tabRequest);
        
        // test account 1
        this.user = await getUserDetails(context.activity.from.aadObjectId, context.activity.from);
        // // test my account and graph client
        // this.user = context.activity.from;
        // this.user.AADId = context.activity.from.aadObjectId;

        switch (tabRequest.tabContext.tabEntityId) {
            // the first tab: MyTab
            case "MyTab": {
                if (tabRequest.data.action != "show") {
                    const handleStatus = await handleTodoListAction(this.user.AADId, tabRequest.data);
                    if (handleStatus != 200) {
                        break;
                    }
                }
                // Todo: get from static resources, if action is "show"
                const todoListData = await getTodoListData(this.user.AADId);
                todoListData.enquirer = this.user;
                const todoListTemplate = new ACData.Template(rawtodoListCard);
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabSubmitResp.tab.value.cards = [{"card": todoListPayload}]

                if (tabRequest.data.action == "show" || tabRequest.data.action == "share") {
                    const todoItemData = await getTodoItemData(tabRequest.data.taskId);
                    todoItemData.enquirer = this.user;
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
                const taskSharedData = await getTaskSharedData(this.user.AADId);
                taskSharedData.enquirer = this.user;
                const taskSharedTemplate = new ACData.Template(rawtaskSharedCard);
                const taskSharedPayload = taskSharedTemplate.expand({
                    $root: taskSharedData
                });
                tabSubmitResp.tab.value.cards = [{"card": taskSharedPayload}];

                if (tabRequest.data.action == "show") {
                    const todoMessData = await getTodoItemData(tabRequest.data.taskId);
                    todoMessData.enquirer = this.user;
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

// async function createCardCommand(context: TurnContext, action: any): Promise<any> {
//     // The user has chosen to create a card by choosing the 'Create Card' context menu command.
//     const data = action.data;
//     const heroCard = CardFactory.heroCard(data.title, data.text);
//     heroCard.content.subtitle = data.subTitle;
//     const attachment = {
//         contentType: heroCard.contentType,
//         content: heroCard.content,
//         preview: heroCard,
//     };

//     return {
//         composeExtension: {
//             type: "result",
//             attachmentLayout: "list",
//             attachments: [attachment],
//         },
//     };
// }

// async function shareMessageCommand(context: TurnContext, action: any): Promise<any> {
//     // The user has chosen to share a message by choosing the 'Share Message' context menu command.
//     let userName = "unknown";
//     if (
//         action.messagePayload &&
//         action.messagePayload.from &&
//         action.messagePayload.from.user &&
//         action.messagePayload.from.user.displayName
//     ) {
//         userName = action.messagePayload.from.user.displayName;
//     }

//     // This Message Extension example allows the user to check a box to include an image with the
//     // shared message.  This demonstrates sending custom parameters along with the message payload.
//     let images = [];
//     const includeImage = action.data.includeImage;
//     if (includeImage === "true") {
//         images = [
//             "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQtB3AwMUeNoq4gUBGe6Ocj8kyh3bXa9ZbV7u1fVKQoyKFHdkqU",
//         ];
//     }
//     const heroCard = CardFactory.heroCard(
//         `${userName} originally sent this message:`,
//         action.messagePayload.body.content,
//         images
//     );

//     if (
//         action.messagePayload &&
//         action.messagePayload.attachment &&
//         action.messagePayload.attachments.length > 0
//     ) {
//         // This sample does not add the MessagePayload Attachments.  This is left as an
//         // exercise for the user.
//         heroCard.content.subtitle = `(${action.messagePayload.attachments.length} Attachments not included)`;
//     }

//     const attachment = {
//         contentType: heroCard.contentType,
//         content: heroCard.content,
//         preview: heroCard,
//     };

//     return {
//         composeExtension: {
//             type: "result",
//             attachmentLayout: "list",
//             attachments: [attachment],
//         },
//     };
// }