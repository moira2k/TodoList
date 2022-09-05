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
    InvokeResponse,
} from "botbuilder-core";
import {
    createAuthResponse,
    createSignOutResponse,
    createMyTodosResponse,
    createSharedwithMeResponse,
    createNewItemTaskInfo,
    createActionStatusTaskInfo,
    handleMyTodosAction,
    handleSharedwithMeAction,
    handleNewItemAction,
    createMyTodosFetchTaskInfo,
    createSharedwithMeFetchTaskInfo
} from "./services/botService";


export class TeamsBot extends TeamsActivityHandler {

    constructor() {
        super();
    }

    checkFectchTodoItem(action: string): boolean {
        const actions = ["show", "share", "edit"];
        return actions.includes(action) ? true : false;
    }

    async getUserToken(context: TurnContext) {
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
        return tokenResponse;
    }

    // Fetch Adaptive Card to render to a tab.
    async handleTeamsTabFetch(context: TurnContext, tabRequest: TabRequest): Promise<TabResponse> {
        console.log("Trying To Fetch Tab Content.");

        const tokenResponse = await this.getUserToken(context);

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
                tabResp = await createMyTodosResponse(context, 1, false);
                break;
            }
            case "SharedwithMe": {
                tabResp = await createSharedwithMeResponse(context, 1, tokenResponse.token);
                break;
            }
        }

        return tabResp;
    }

    // Handle submits from Adaptive Card.
    async handleTeamsTabSubmit(context: TurnContext, tabSubmit: TabSubmit): Promise<TabResponse> {
        console.log("Trying To Submit Tab Content.");

        const tokenResponse = await this.getUserToken(context);

        let tabResp: TabResponse;
        
        if (tabSubmit.data.action == "signout") {
            await (<BotFrameworkAdapter> context.adapter).signOutUser(context, process.env.ConnectionName);
            tabResp = createSignOutResponse();
            return tabResp;
        }

        switch (tabSubmit.tabContext.tabEntityId) {
            case "MyTodos": {
                const pageNow: number = await handleMyTodosAction(context.activity.from.aadObjectId, tabSubmit.data);
                tabResp = await createMyTodosResponse(
                    context,
                    pageNow,
                    this.checkFectchTodoItem(<string> tabSubmit.data.action),
                    <number> tabSubmit.data.taskId,
                    tokenResponse.token);
                break;
            }
            case "SharedwithMe": {
                const pageNow: number = handleSharedwithMeAction(tabSubmit.data);
                tabResp = await createSharedwithMeResponse(context, pageNow, tokenResponse.token);
                break;
            }
        }

        return tabResp;
    }

    // Message extension Code
    async handleTeamsMessagingExtensionFetchTask(context: TurnContext, action: MessagingExtensionAction): Promise<MessagingExtensionActionResponse> {
        console.log("Trying To Fetch Task Module From Messaging Extension.");

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
        console.log("Trying To Submit Task Module From Messaging Extension.");

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
                    content = "Success! Please go back to \"My Todos\" Tab.";
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
        console.log("Trying To Fetch Task Module From Adaptive Cards Tab.");

        const taskModuleResp: TaskModuleResponse = {
            task: {
                type: "continue",
                value: {},
            },
        };

        const tokenResponse = await this.getUserToken(context);

        let taskInfo: TaskModuleTaskInfo;

        switch (taskModuleRequest.tabContext.tabEntityId) {
            case "MyTodos": {
                taskInfo = await createMyTodosFetchTaskInfo(taskModuleRequest.data, tokenResponse.token);
                break;
            }
            case "SharedwithMe": {
                taskInfo = await createSharedwithMeFetchTaskInfo(taskModuleRequest.data, tokenResponse.token);
            }
        }
        taskModuleResp.task.value = taskInfo;
        
        return taskModuleResp;
    }

    // Handle Task Module From Adaptive Cards Tab
    async handleTeamsTaskModuleSubmit(context: TurnContext, taskModuleRequest: TaskModuleRequest): Promise<TaskModuleResponse> {
        console.log("Trying To Submit Task Module From Adaptive Cards Tab.");

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
                    content = "Success! Please refresh \"My Todos\" Tab.";
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
