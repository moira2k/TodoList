import { default as axios } from "axios";
import * as querystring from "querystring";
import {
    TeamsActivityHandler,
    CardFactory,
    TurnContext,
    BotFrameworkAdapter,
} from "botbuilder";
import { ComponentDialog } from "botbuilder-dialogs";
import {
    TabRequest,
    TabSubmit, 
    TabResponse,
    TaskModuleRequest,
    TaskModuleResponse,
    TaskModuleTaskInfo,
    MessagingExtensionAction, 
    MessagingExtensionActionResponse,
} from "botbuilder-core";
import rawWelcomeCard from "./adaptiveCards/welcome.json";
// import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import * as ACData from "adaptivecards-templating";
import rawHeadingCard from "./adaptiveCards/heading.json"
import rawTodoListCard from "./adaptiveCards/todoList.json"
import rawTodoItemCard from "./adaptiveCards/todoItem.json"
import rawSharedTodoListCard from "./adaptiveCards/sharedTodoList.json"
import rawSharedTodoItemCard from "./adaptiveCards/sharedTodoItem.json"
import rawSignOutCard from "./adaptiveCards/signOut.json"
import rawNewItemCard from "./adaptiveCards/newItem.json"
import rawActionStatusCard from "./adaptiveCards/actionStatus.json"
import {
    getTodoListData,
    getTodoItemData,
    getSharedTodoListData,
    handleTodoListAction,
    handleNewItemAction,
} from "./api/handleData"
import {
    convertTimeString,
    repalceHtmlToText
} from "./utils/utils"
import {
    createAuthResponse
} from "./service/botService"
// const AdaptiveCardsTools = require("@microsoft/adaptivecards-tools").AdaptiveCards

export class TeamsBot extends TeamsActivityHandler {

    constructor() {
        super();
        this.onMessage(async (context, next) => {
            console.log("Running dialog with Message Activity.");

            let txt = context.activity.text;
            const removedMentionText = TurnContext.removeRecipientMention(context.activity);
            if (removedMentionText) {
                // Remove the line break
                txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
            }

            // Trigger command by IM text
            switch (txt) {
                case "welcome": {
                    // const card = AdaptiveCardsTools.declareWithoutData(rawWelcomeCard).render();
                    const WelcomeTemplate = new ACData.Template(rawWelcomeCard);
                    const WelcomePayload = WelcomeTemplate.expand({ $root: {} });
                    await context.sendActivity({ attachments: [CardFactory.adaptiveCard(WelcomePayload)] });
                    break;
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    // Message extension Code
    async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction) {
        console.log("handleTeamsMessagingExtensionFetchTask", JSON.stringify(action, null, 2));
        const MEActionResp: MessagingExtensionActionResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };
        
        const taskInfo: TaskModuleTaskInfo = {
            width: 400
        }
        switch (action.commandId) {
            case "createTodo": {
                const time = convertTimeString(new Date());;
                const newItemTemplate = new ACData.Template(rawNewItemCard);
                var content:string = repalceHtmlToText(action.messagePayload.body.content);

                const newItemPayload = newItemTemplate.expand({
                    $root: {content: content, time: time}
                });
                taskInfo.card = CardFactory.adaptiveCard(newItemPayload);
                break;
            }
        }

        MEActionResp.task.value = taskInfo;
        return MEActionResp;
    }

    // Handle submits from Messaging Extension.
    async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction) {
        console.log("handleTeamsMessagingExtensionSubmitAction", JSON.stringify(action, null, 2));
        const MEActionResp: MessagingExtensionActionResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };

        const taskInfo: TaskModuleTaskInfo = {
            width: 300,
            height: 100
        }

        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };
        
        switch (action.commandId) {
            case "createTodo": {
                var content: string;
                try {
                    await handleNewItemAction(user.userId, action.data);
                    content = "Success! Please check \"My Todos\" Tab"
                } catch (error) {
                    content = "Fail. Please check and have a retry."
                }

                const actionStatusTemplate = new ACData.Template(rawActionStatusCard);
                const actionStatusPayload = actionStatusTemplate.expand({
                    $root: {content: content}
                });
                taskInfo.card = CardFactory.adaptiveCard(actionStatusPayload);
                break;
            }
        }
        
        MEActionResp.task.value = taskInfo;
        return MEActionResp;
    }

    // Fetch Adaptive Card to render to a tab.
    async handleTeamsTabFetch(context: TurnContext, tabRequest: TabRequest): Promise<TabResponse> {
        console.log('Trying To Fetch Tab Content');
        // When the Bot Service Auth flow completes, context will contain a magic code used for verification.
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : '';
        // Getting the tokenResponse for the user
        const tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            process.env.ConnectionName,
            magicCode
        );
        if (!tokenResponse || !tokenResponse.token) {
            // Token is not available, hence we need to send back the auth response
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
        const headingTemplate = new ACData.Template(rawHeadingCard);
        const headingPayload = headingTemplate.expand({
            $root: {enquirer: user, time: time}
        });
        tabFetchResp.tab.value.cards = [{"card": headingPayload}];
        switch (tabRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                const todoListData = await getTodoListData(user.userId);
                todoListData.time = time;
                // Create a Template instance from the template payload
                const todoListTemplate = new ACData.Template(rawTodoListCard);
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
                const sharedTodoListTemplate = new ACData.Template(rawSharedTodoListCard);
                const sharedTodoListPayload = sharedTodoListTemplate.expand({
                    $root: sharedTodoListData
                });
                tabFetchResp.tab.value.cards.push({"card": sharedTodoListPayload});
                break;
            }
        }
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
            tabSubmitResp.tab.value.cards = [{"card": rawSignOutCard}]
            return tabSubmitResp;
        }

        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };
        const time = convertTimeString(new Date());

        const headingTemplate = new ACData.Template(rawHeadingCard);
        const headingPayload = headingTemplate.expand({
            $root: {enquirer: user, time: time}
        });
        tabSubmitResp.tab.value.cards = [{"card": headingPayload}];
        // console.log("headingPayload", JSON.stringify(headingPayload).length)

        switch (tabSubmit.tabContext.tabEntityId) {
            case "MyTodos": {
                if (tabSubmit.data.action != "show") {
                    await handleTodoListAction(user.userId, tabSubmit.data);
                }
                const todoListData = await getTodoListData(user.userId);
                todoListData.time = time;
                const todoListTemplate = new ACData.Template(rawTodoListCard);
                const todoListPayload = todoListTemplate.expand({
                    $root: todoListData
                });
                tabSubmitResp.tab.value.cards.push({"card": todoListPayload});
                // console.log("todoListPayload", JSON.stringify(todoListPayload).length);
                // if (todoListPayload.length >= 3) {
                //     console.log("todoListPayloadItem", JSON.stringify(todoListPayload.body[3]).length);
                // }
                if (tabSubmit.data.action == "show" || tabSubmit.data.action == "share") {
                    const todoItemData = await getTodoItemData(<number> tabSubmit.data.taskId, tokenResponse.token, true);
                    const todoItemTemplate = new ACData.Template(rawTodoItemCard);
                    const todoItemPayload = todoItemTemplate.expand({
                        $root: todoItemData
                    });
                    tabSubmitResp.tab.value.cards.push({"card": todoItemPayload});
                    // console.log("todoItemPayload", JSON.stringify(todoItemPayload).length);
                }
                break;
            }
            case "SharedwithMe": {
                const sharedTodoListData = await getSharedTodoListData(user.userId, tokenResponse.token);
                const sharedTodoListTemplate = new ACData.Template(rawSharedTodoListCard);
                const sharedTodoListPayload = sharedTodoListTemplate.expand({
                    $root: sharedTodoListData
                });
                tabSubmitResp.tab.value.cards.push({"card": sharedTodoListPayload});

                if (tabSubmit.data.action == "show") {
                    const sharedTodoItemData = await getTodoItemData(<number> tabSubmit.data.taskId, tokenResponse.token, false);
                    const sharedTodoItemTemplate = new ACData.Template(rawSharedTodoItemCard);
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

    // Fetch Task Module From Adaptive Cards Tab
    async handleTeamsTaskModuleFetch(context: TurnContext, taskModuleRequest: TaskModuleRequest) {
        console.log("handleTeamsTaskModuleFetch", JSON.stringify(taskModuleRequest, null, 2));
        const taskModuleResp: TaskModuleResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };

        const taskInfo: TaskModuleTaskInfo = {
            width: 400
        };

        switch (taskModuleRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                if (taskModuleRequest.data.action == "add") {
                    const time = convertTimeString(new Date());;
                    const newItemTemplate = new ACData.Template(rawNewItemCard);
            
                    const newItemPayload = newItemTemplate.expand({
                        $root: {content: "", time: time}
                    });
                    taskInfo.card = CardFactory.adaptiveCard(newItemPayload);
                }
            }
        }

        taskModuleResp.task.value = taskInfo;
        
        return taskModuleResp;
    }

    // Handle Task Module From Adaptive Cards Tab
    async handleTeamsTaskModuleSubmit(context: TurnContext, taskModuleRequest: TaskModuleRequest) {
        console.log("handleTeamsTaskModuleSubmit", JSON.stringify(taskModuleRequest, null, 2));
        const user = {
            userId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };

        var content: string;
        try {
            await handleNewItemAction(user.userId, taskModuleRequest.data);
            content = "Success! Please check \"My Todos\" Tab"
        } catch (error) {
            content = "Fail. Please check and have a retry."
        }

        const actionStatusTemplate = new ACData.Template(rawActionStatusCard);
        const actionStatusPayload = actionStatusTemplate.expand({
            $root: {content: content}
        });

        const taskModuleResp: TaskModuleResponse = {
            task: {
                type: "continue",
                value: {
                    card: CardFactory.adaptiveCard(actionStatusPayload),
                    width: 300,
                    height: 100
                },
            },
        };

        return taskModuleResp;
    }
}