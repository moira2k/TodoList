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
    createAuthResponse,
    createSignOutResponse,
    createMyTodosResponse,
    createSharedwithMeResponse,
    createNewItemTaskInfo,
    createActionStatusTaskInfo,
} from "./service/botService"
import { User } from "./api/constant";
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

    checkFectchTodoItem(action: string): boolean {
        const actions = ["show", "share"];
        return actions.includes(action) ? true : false;
    }

    // Fetch Adaptive Card to render to a tab.
    async handleTeamsTabFetch(context: TurnContext, tabRequest: TabRequest): Promise<TabResponse> {
        console.log("Trying To Fetch Tab Content");
        // When the Bot Service Auth flow completes, context will contain a magic code used for verification.
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : "";
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
        
        const user: User = {
            aadObjectId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };

        let tabResp: TabResponse;
        switch (tabRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                tabResp = await createMyTodosResponse(user, false);
                break;
            }
            case "SharedwithMe": {
                tabResp = await createSharedwithMeResponse(user, tokenResponse.token, false);
                break;
            }
        }

        return tabResp;
    }

    // Handle submits from Adaptive Card.
    async handleTeamsTabSubmit(context: TurnContext, tabSubmit: TabSubmit): Promise<TabResponse> {
        console.log("Trying To Submit Tab Content");

        // authentication
        const magicCode =
        context.activity.value && context.activity.value.state
            ? context.activity.value.state
            : "";
        const tokenResponse = await (<BotFrameworkAdapter> context.adapter).getUserToken(
            context,
            process.env.ConnectionName,
            magicCode
        );

        let tabResp: TabResponse;
        
        if (tabSubmit.data.action == "signout") {
            await (<BotFrameworkAdapter> context.adapter).signOutUser(context, process.env.ConnectionName);
            tabResp = createSignOutResponse();
            return tabResp;
        }

        const user: User = {
            aadObjectId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };

        switch (tabSubmit.tabContext.tabEntityId) {
            case "MyTodos": {
                await handleTodoListAction(user.aadObjectId, tabSubmit.data);
                tabResp = await createMyTodosResponse(
                    user,
                    this.checkFectchTodoItem(<string> tabSubmit.data.action),
                    <number> tabSubmit.data.taskId,
                    tokenResponse.token);
                break;
            }
            case "SharedwithMe": {
                tabResp = await createSharedwithMeResponse(
                    user,
                    tokenResponse.token,
                    this.checkFectchTodoItem(<string> tabSubmit.data.action),
                    <number> tabSubmit.data.taskId);
                break;
            }
        }

        return tabResp;
    }

    // Message extension Code
    async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        console.log("Trying To Fetch Task Module From Messaging Extension");
        const MEActionResp: MessagingExtensionActionResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };
        
        let taskInfo: TaskModuleTaskInfo;
        switch (action.commandId) {
            case "createTodo": {
                taskInfo = createNewItemTaskInfo(action.messagePayload.body.content);
                break;
            }
        }

        MEActionResp.task.value = taskInfo;
        
        return MEActionResp;
    }

    // Handle submits from Messaging Extension.
    async handleTeamsMessagingExtensionSubmitAction(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        console.log("Trying To Submit Task Module From Messaging Extension");
        const MEActionResp: MessagingExtensionActionResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };

        const user: User = {
            aadObjectId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };

        let taskInfo: TaskModuleTaskInfo;
        switch (action.commandId) {
            case "createTodo": {
                var content: string;
                try {
                    await handleNewItemAction(user.aadObjectId, action.data);
                    content = "Success! Please check \"My Todos\" Tab"
                } catch (error) {
                    content = "Fail. Please check and have a retry."
                }
                taskInfo = createActionStatusTaskInfo(content);
                break;
            }
        }

        MEActionResp.task.value = taskInfo;

        return MEActionResp;
    }

    // Fetch Task Module From Adaptive Cards Tab
    async handleTeamsTaskModuleFetch(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        console.log("Trying To Fetch Task Module From Adaptive Cards Tab");
        const taskModuleResp: TaskModuleResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };

        let taskInfo: TaskModuleTaskInfo;

        switch (taskModuleRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                if (taskModuleRequest.data.action == "add") {
                    taskInfo = createNewItemTaskInfo();
                }
            }
        }

        taskModuleResp.task.value = taskInfo;
        
        return taskModuleResp;
    }

    // Handle Task Module From Adaptive Cards Tab
    async handleTeamsTaskModuleSubmit(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        console.log("Trying To Submit Task Module From Adaptive Cards Tab");
        const taskModuleResp: TaskModuleResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };

        let taskInfo: TaskModuleTaskInfo;
        const user: User = {
            aadObjectId: context.activity.from.aadObjectId,
            userName: context.activity.from.name
        };

        switch (taskModuleRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                if (taskModuleRequest.data.action == "add") {
                    var content: string;
                    try {
                        await handleNewItemAction(user.aadObjectId, taskModuleRequest.data);
                        content = "Success! Please refresh \"My Todos\" Tab"
                    } catch (error) {
                        content = "Fail. Please check and have a retry."
                    }
                    taskInfo = createActionStatusTaskInfo(content);
                }
            }
        }

        taskModuleResp.task.value = taskInfo;
        
        return taskModuleResp;
    }
}
