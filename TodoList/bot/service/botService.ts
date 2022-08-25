import { CardFactory, TabResponse, TaskModuleTaskInfo } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import {
    getTodoListData,
    getTodoItemData,
    getSharedTodoListData,
    handleTodoListAction,
    handleNewItemAction,
} from "../api/handleData"
import {
    convertTimeString,
    repalceHtmlToText
} from "../utils/utils"
import rawHeadingCard from "../adaptiveCards/heading.json"
import rawTodoListCard from "../adaptiveCards/todoList.json"
import rawTodoItemCard from "../adaptiveCards/todoItem.json"
import rawSharedTodoListCard from "../adaptiveCards/sharedTodoList.json"
import rawSharedTodoItemCard from "../adaptiveCards/sharedTodoItem.json"
import rawSignOutCard from "../adaptiveCards/signOut.json"
import rawNewItemCard from "../adaptiveCards/newItem.json"
import rawActionStatusCard from "../adaptiveCards/actionStatus.json"
import { User } from "../api/constant";


// Tab Response
export function createAuthResponse(signInLink: string) {
    console.log("Create Auth response")
    const authResp: TabResponse = {
            tab: {
                type: "auth",
                suggestedActions: {
                    actions: [
                        {
                            type: "openUrl",
                            value: signInLink,
                            title: "Sign in to this app",
                        },
                    ],
                },
            },
    };
    return authResp;
}

export function createSignOutResponse() {
    console.log("Create Sign Out response")
    const signOutResp: TabResponse = {
            tab: {
                type: "continue",
                value: {
                    cards: [
                        {
                            "card": rawSignOutCard,
                        },
                    ],
                },
            },
    };
    return signOutResp;
}

export async function createMyTodosResponse(user: User, IsFectchTodoItem: boolean, taskId?: number, token?: string): Promise<TabResponse> {
    const myTodosResp: TabResponse = {
        tab: {
            type: "continue",
            value: {
                cards: [],
            },
        },
    };
    const time = convertTimeString(new Date());;
    const headingTemplate = new ACData.Template(rawHeadingCard);
    const headingPayload = headingTemplate.expand({
        $root: {
            enquirer: user,
            time: time,
        },
    });

    const todoListData = await getTodoListData(user.aadObjectId);
    // Create a Template instance from the template payload
    const todoListTemplate = new ACData.Template(rawTodoListCard);
    // Expand the template with your `$root` data object.
    // This binds it to the data and produces the final Adaptive Card payload
    const todoListPayload = todoListTemplate.expand({
        $root: {
            tasks: todoListData,
            time: time,
        },
    });
    myTodosResp.tab.value.cards = [
        {"card": headingPayload}, 
        {"card": todoListPayload},
    ];

    if (IsFectchTodoItem) {
        const todoItemData = await getTodoItemData(taskId, token, true);
        const todoItemTemplate = new ACData.Template(rawTodoItemCard);
        const todoItemPayload = todoItemTemplate.expand({
            $root: {
                task: todoItemData,
                time: time,
            },
        });
        myTodosResp.tab.value.cards.push({"card": todoItemPayload});
    }

    return myTodosResp;
}

export async function createSharedwithMeResponse(user: User, token: string, IsFectchTodoItem: boolean, taskId?: number): Promise<TabResponse> {
    const sharedwithMeResp: TabResponse = {
        tab: {
            type: "continue",
            value: {
                cards: [],
            },
        },
    };

    const time = convertTimeString(new Date());;
    const headingTemplate = new ACData.Template(rawHeadingCard);
    const headingPayload = headingTemplate.expand({
        $root: {
            enquirer: user,
            time: time,
        },
    });

    const sharedTodoListData = await getSharedTodoListData(user.aadObjectId, token);
    const sharedTodoListTemplate = new ACData.Template(rawSharedTodoListCard);
    const sharedTodoListPayload = sharedTodoListTemplate.expand({
        $root: {tasks: sharedTodoListData},
    });
    sharedwithMeResp.tab.value.cards = [
        {"card": headingPayload}, 
        {"card": sharedTodoListPayload},
    ];

    if (IsFectchTodoItem) {
        const sharedTodoItemData = await getTodoItemData(<number> taskId, token, false);
        const sharedTodoItemTemplate = new ACData.Template(rawSharedTodoItemCard);
        const sharedTodoItemPayload = sharedTodoItemTemplate.expand({
            $root: {task: sharedTodoItemData},
        });
        sharedwithMeResp.tab.value.cards.push({"card": sharedTodoItemPayload});
    }
    return sharedwithMeResp;
}

// Task Module Task Info
export function createNewItemTaskInfo(content: string = ""): TaskModuleTaskInfo {
    const taskInfo: TaskModuleTaskInfo = {
        width: 400,
    }
    const time = convertTimeString(new Date());;
    const newItemTemplate = new ACData.Template(rawNewItemCard);
    var content:string = repalceHtmlToText(content);

    const newItemPayload = newItemTemplate.expand({
        $root: {
            content: content,
            time: time,
        },
    });
    taskInfo.card = CardFactory.adaptiveCard(newItemPayload);
    return taskInfo;
}

export function createActionStatusTaskInfo(content: string = ""): TaskModuleTaskInfo {
    const taskInfo: TaskModuleTaskInfo = {
        width: 300,
        height: 100,
    }
    var content: string;

    const actionStatusTemplate = new ACData.Template(rawActionStatusCard);
    const actionStatusPayload = actionStatusTemplate.expand({
        $root: {content: content}
    });
    taskInfo.card = CardFactory.adaptiveCard(actionStatusPayload);
    return taskInfo;
}