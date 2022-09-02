import { CardFactory, TabResponse, TaskModuleTaskInfo, TurnContext } from "botbuilder";
import * as ACData from "adaptivecards-templating";
import { User } from "../dataModels/user";
import { TodoItem } from "../dataModels/todoItem";
import {
    getTodoListData,
    getTodoItemData,
    getSharedTodoListData,
    addTodoItem,
    updateTodoItem,
    deleteTodoItem,
    shareTodoItem
} from "../clients/todoClient"
import {
    convertTimeString,
    repalceHtmlToText
} from "../utils/utils"
import rawHeadingCard from "../adaptiveCards/heading.json"
import rawTodoListCard from "../adaptiveCards/todoList.json"
import rawTodoItemCard from "../adaptiveCards/todoItem.json"
import rawSharedTodoListCard from "../adaptiveCards/sharedTodoList.json"
import rawSignOutCard from "../adaptiveCards/signOut.json"
import rawNewItemCard from "../adaptiveCards/newItem.json"
import rawActionStatusCard from "../adaptiveCards/actionStatus.json"
import rawTaskViewersCard from "../adaptiveCards/taskViewers.json"
import rawTodoMessCard from "../adaptiveCards/todoMess.json"


// Tab Response
export function createAuthResponse(signInLink: string) {
    console.log("Create Auth response.");

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
    console.log("Create Sign Out response.");

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

export async function createMyTodosResponse(context: TurnContext, pageNow: number, IsFectchTodoItem: boolean, taskId?: number, token?: string): Promise<TabResponse> {
    console.log("Create MyTodos Tab response.");

    const myTodosResp: TabResponse = {
        tab: {
            type: "continue",
            value: {
                cards: [],
            },
        },
    };
    
    const user: User = {
        aadObjectId: context.activity.from.aadObjectId,
        userName: context.activity.from.name
    };

    const time = convertTimeString(new Date());;
    const headingTemplate = new ACData.Template(rawHeadingCard);
    const headingPayload = headingTemplate.expand({
        $root: {
            enquirer: user,
            time: time,
        },
    });

    myTodosResp.tab.value.cards = [{"card": headingPayload}];

    if (IsFectchTodoItem) {
        const todoItemData = await getTodoItemData(taskId, token, false);
        const todoItemTemplate = new ACData.Template(rawTodoItemCard);
        const todoItemPayload = todoItemTemplate.expand({
            $root: {
                task: todoItemData,
                pageNow: pageNow
            },
        });
        myTodosResp.tab.value.cards.push({"card": todoItemPayload});
    } else {
        const todoListData = await getTodoListData(user.aadObjectId);
        const pageNum: number = Math.max(1, Math.ceil(todoListData.length / 10));
        pageNow = Math.min(pageNow, pageNum);
        // Create a Template instance from the template payload
        const todoListTemplate = new ACData.Template(rawTodoListCard);
        // Expand the template with your `$root` data object.
        // This binds it to the data and produces the final Adaptive Card payload
        const todoListPayload = todoListTemplate.expand({
            $root: {
                tasks: todoListData.slice((pageNow - 1) * 10, Math.min(pageNow * 10, todoListData.length)),
                time: time,
                pageNow: pageNow,
                pageNum: pageNum,
                taskNum: todoListData.length,
            },
        });
        myTodosResp.tab.value.cards.push({"card": todoListPayload});
    }
    console.log(JSON.stringify(myTodosResp).length);
    return myTodosResp;
}

export async function createSharedwithMeResponse(context: TurnContext, pageNow: number, token: string): Promise<TabResponse> {
    console.log("Create SharedwithMe Tab response.");

    const sharedwithMeResp: TabResponse = {
        tab: {
            type: "continue",
            value: {
                cards: [],
            },
        },
    };

    const user: User = {
        aadObjectId: context.activity.from.aadObjectId,
        userName: context.activity.from.name
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
    const pageNum: number = Math.max(1, Math.ceil(sharedTodoListData.length / 10));
    pageNow = Math.min(pageNow, pageNum);

    const sharedTodoListTemplate = new ACData.Template(rawSharedTodoListCard);
    const sharedTodoListPayload = sharedTodoListTemplate.expand({
        $root: {
            tasks: sharedTodoListData.slice((pageNow - 1) * 10, Math.min(pageNow * 10, sharedTodoListData.length)),
            pageNow: pageNow,
            pageNum: pageNum,
            taskNum: sharedTodoListData.length,
        },
    });
    sharedwithMeResp.tab.value.cards = [
        {"card": headingPayload}, 
        {"card": sharedTodoListPayload},
    ];
    console.log(JSON.stringify(sharedwithMeResp).length)
    return sharedwithMeResp;
}

// Task Module Task Info
export async function createMyTodosFetchTaskInfo(data: any, token: string): Promise<TaskModuleTaskInfo> {
    console.log("Create MyTodos Fetch TaskInfo response.");

    let taskInfo: TaskModuleTaskInfo;
    switch (data.action) {
        case "showViewers": {
            taskInfo = await createTaskViewersTaskInfo(data.taskId, token);
            break;
        }
    }
    return taskInfo;
}

export async function createSharedwithMeFetchTaskInfo(data: any, token: string): Promise<TaskModuleTaskInfo> {
    console.log("Create SharedwithMe Fetch TaskInfo response.");

    let taskInfo: TaskModuleTaskInfo;
    switch (data.action) {
        case "showMess": {
            taskInfo = await createTodoMessTaskInfo(data.taskId, token);
            break;
        }
    }
    return taskInfo;
}

export function createNewItemTaskInfo(content: string = ""): TaskModuleTaskInfo {
    console.log("Create NewItem TaskInfo response.");
    
    const taskInfo: TaskModuleTaskInfo = {
        width: 400,
    }

    const time = convertTimeString(new Date());;
    const newItemTemplate = new ACData.Template(rawNewItemCard);
    // the type of message content is html
    var content:string = repalceHtmlToText(content);

    const newItemPayload = newItemTemplate.expand({
        $root: {
            content: content,
            time: time
        },
    });
    taskInfo.card = CardFactory.adaptiveCard(newItemPayload);
    return taskInfo;
}

export function createActionStatusTaskInfo(content: string = ""): TaskModuleTaskInfo {
    console.log("Create ActionStatus TaskInfo response.");

    const taskInfo: TaskModuleTaskInfo = {
        width: 350,
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

export async function createTaskViewersTaskInfo(taskId: number, token: string): Promise<TaskModuleTaskInfo> {
    console.log("Create TaskViewers TaskInfo response.");

    const taskInfo: TaskModuleTaskInfo = {
        width: 400,
    }
    const todoItemData = await getTodoItemData(taskId, token, true);
    if (todoItemData.viewers.length > 0) {
        const taskViewerTemplate = new ACData.Template(rawTaskViewersCard);
        const taskViewerPayload = taskViewerTemplate.expand({
            $root: {
                task: todoItemData,
            },
        });
        taskInfo.card = CardFactory.adaptiveCard(taskViewerPayload);
        return taskInfo;
    } else {
        return createActionStatusTaskInfo("No viewer now.");
    }
}

export async function createTodoMessTaskInfo(taskId: number, token: string): Promise<TaskModuleTaskInfo> {
    console.log("Create TodoMess TaskInfo response.");

    const taskInfo: TaskModuleTaskInfo = {
        width: 400,
    }

    const todoItemData = await getTodoItemData(taskId, token, false);

    const todoMessTemplate = new ACData.Template(rawTodoMessCard);
    const todoMessPayload = todoMessTemplate.expand({
        $root: {
            task: todoItemData,
        },
    });
    taskInfo.card = CardFactory.adaptiveCard(todoMessPayload);
    return taskInfo;
}

// handle the action
export async function handleNewItemAction(aadObjectId: string, data: any): Promise<void> {
    console.log("Handling the Action Of Task Module.");

    switch (data.action) {
        case "add": {
            const task: TodoItem = {
                dueDate: data.addDate,
                taskContent: data.addContent
            }
            await addTodoItem(aadObjectId, task);
            break;
        }
    }
}

export async function handleMyTodosAction(aadObjectId: string, data: any): Promise<number> {
    console.log("Handling the Action Of MyTodos Tab.");

    let pageNow: number;
    switch (data.action) {
        // located in to-do list
        case "add": {
            const task: TodoItem = {
                dueDate: data.addDate,
                taskContent: data.addContent,
            }
            await addTodoItem(aadObjectId, task);
            pageNow = data.pageNow;
            break;
        }
        case "delete": {
            await deleteTodoItem(data.taskId);
            pageNow = data.pageNow;
            break;
        }
        case "show": {
            pageNow = data.pageNow;
            break;
        }
        case "go": {
            pageNow = data.jumpedpage;
            break;
        }
        case "previous": {
            pageNow = data.pageNow - 1;
            break;
        }
        case "next": {
            pageNow = data.pageNow + 1;
            break;
        }
        // located in to-do item
        case "edit": {
            const task: TodoItem = {
                taskId: data.taskId,
                dueDate: data.dueDate,
                currentStatus: data.currentStatus,
                taskContent: data.taskContent,
            }
            await updateTodoItem(task);
            pageNow = data.pageNow;
            break;
        }
        case "share": {
            await shareTodoItem(data.taskId, data.sharedUsers);
            pageNow = data.pageNow;
            break;
        }
        case "return": {
            pageNow = data.pageNow;
            break;
        }
    }

    return pageNow;
}

export function handleSharedwithMeAction(data: any): number {
    console.log("Handling the Action Of SharedwithMe Tab.");

    let pageNow: number;
    switch (data.action) {
        case "go": {
            pageNow = data.jumpedpage
            break;
        }
        case "previous": {
            pageNow = data.pageNow - 1;
            break;
        }
        case "next": {
            pageNow = data.pageNow + 1;
            break;
        }
    }

    return pageNow;
}