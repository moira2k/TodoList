import { default as axios } from "axios";
import * as querystring from "querystring";
import {
    TeamsActivityHandler,
    TurnContext,
    BotFrameworkAdapter,
} from "botbuilder";
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
import {
    createAuthResponse,
    createSignOutResponse,
    createMyTodosResponse,
    createSharedwithMeResponse,
    createNewItemTaskInfo,
    createActionStatusTaskInfo,
    handleTodoListAction,
    handleNewItemAction,
    createTabFetchTaskInfo
} from "./services/botService";


export class TeamsBot extends TeamsActivityHandler {

    constructor() {
        super();
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

        let tabResp: TabResponse;
        
        switch (tabRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                tabResp = await createMyTodosResponse(context, false);
                break;
            }
            case "SharedwithMe": {
                tabResp = await createSharedwithMeResponse(context, tokenResponse.token, false);
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

        switch (tabSubmit.tabContext.tabEntityId) {
            case "MyTodos": {
                await handleTodoListAction(context.activity.from.aadObjectId, tabSubmit.data);
                tabResp = await createMyTodosResponse(
                    context,
                    this.checkFectchTodoItem(<string> tabSubmit.data.action),
                    <number> tabSubmit.data.taskId,
                    tokenResponse.token);
                break;
            }
            case "SharedwithMe": {
                tabResp = await createSharedwithMeResponse(
                    context,
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

        let taskInfo: TaskModuleTaskInfo;

        switch (action.commandId) {
            case "createTodo": {
                var content: string;
                try {
                    await handleNewItemAction(context.activity.from.aadObjectId, action.data);
                    content = "Success! Please check \"My Todos\" Tab";
                } catch (error) {
                    content = "Fail. Please check and have a retry.";
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
                taskInfo = createTabFetchTaskInfo(taskModuleRequest.data);
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

        switch (taskModuleRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                var content: string;
                try {
                    await handleNewItemAction(context.activity.from.aadObjectId, taskModuleRequest.data);
                    content = "Success! Please refresh \"My Todos\" Tab";
                } catch (error) {
                    content = "Fail. Please check and have a retry.";
                }
                taskInfo = createActionStatusTaskInfo(content);
                break;
            }
        }

        taskModuleResp.task.value = taskInfo;
        
        return taskModuleResp;
    }
}
