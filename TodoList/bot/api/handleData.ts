import { Request, TYPES } from "tedious";
import { TabResponse } from "botbuilder";
import dbRun from "./databaseClient";
import graphRun from "./graphClient";

export function repalceHtmlToText(str: string) {
    str = str.replace(/<\/?.+?>/g, "");
    str = str.replace(/&nbsp;/g, "");
    return str;
}

function convertInt2String(timeInt: number) {
    var res: string;
    if (timeInt < 10) {
        res = "0" + timeInt;
    } else {
        res = timeInt.toString();
    }
    return res;
}

function getTimezone(time: Date) {
    const bias = Math.abs(time.getTimezoneOffset() / 60);
    var timezone: string = convertInt2String(bias) + ":00";

    if (bias == 0) {
        timezone = "Z";
    } else if (bias > 0) {
        timezone = "-" + timezone;
    } else {
        timezone = "+" + timezone;
    }
    
    return timezone;
}

export function convertTimeString(time: Date) {
    /**
     * Adaptive Cards offers DATE() and TIME() formatting functions to automatically localize the time on the target device.
     * Date/Time function rules: 1.CASE SENSITIVE, 2.NO SPACES, 3.STRICT RFC 3389 FORMATTING, 4.MUST BE a valid date and time
     * Valid formats:
     * 2017-02-14T06:08:00Z
     * 2017-02-14T06:08:00-07:00
     * 2017-02-14T06:08:00+07:00
     */

    var res: string;
    const year = time.getFullYear();
    const month = convertInt2String(time.getMonth());
    const date = convertInt2String(time.getDate());
    const hour = convertInt2String(time.getHours());
    const minute = convertInt2String(time.getMinutes());
    const second = convertInt2String(time.getSeconds());
    res = `${year}-${month}-${date}T${hour}:${minute}:${second}${getTimezone(time)}`;

    return res;
}

export interface User {
    userName: string;
    aadObjectId: string;
    profileImage: string;
}

export interface TodoItem {
    taskId?: number;
    dueDate?: string;
    currentStatus?: string;
    taskContent?: string;
    creator?: User;
    viewers?: User[];
}

export function createAuthResponse(signInLink) {
    console.log("Create Auth response")
    const res: TabResponse = {
            tab: {
                type: "auth",
                // type: "silentAuth",
                suggestedActions: {
                    actions: [
                        {
                            type: "openUrl",
                            value: signInLink,
                            title: "Sign in to this app"
                        }
                    ]
                }
            }
    };
    return res;
};

export async function getUserDetails(aadObjectId: string, token: string) {
    console.log("Reading User Details From MS Graph.");
    const user: User = {
        userName: "",
        aadObjectId: aadObjectId,
        profileImage: ""
    };
    
    try {
        const resp = await graphRun(aadObjectId, token);

        user.userName = resp.profile.displayName;
        user.aadObjectId = resp.profile.id;
        user.profileImage = resp.profileImage;

    } catch (err) {
        console.log(err);
    }
    return user;
}

interface TodoListResponse {
    title: string;
    time: string;
    tasks: TodoItem[];
}

export async function getTodoListData(aadObjectId: string) {
    console.log("Reading Todo List From Azure SQL Database.");
    const todoListResp: TodoListResponse = {
        title: "TodoList",
        time: "",
        tasks: []
    };

    const query:string = `SELECT taskId, dueDate, currentStatus, taskContent, creatorId
    FROM Todo.Tasks WHERE creatorId = @userId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    request.addParameter('userId', TYPES.UniqueIdentifier, aadObjectId);
    
    try {
        const resp = await dbRun(request);

        for (let i:number = 0; i < resp.body.length; ++i) {
            const task = {
                taskId: resp.body[i].taskId,
                dueDate: convertTimeString(resp.body[i].dueDate),
                currentStatus: resp.body[i].currentStatus,
                taskContent: resp.body[i].taskContent
            }
            todoListResp.tasks.push(task);
        }

    } catch (err) {
        console.log(err);
    }

    return todoListResp;
}

export async function getSharedTodoListData(aadObjectId: string, token: string) {
    console.log("Reading Tasks Shared From Azure SQL Database.");
    const sharedTodoListResp:  TodoListResponse = {
        title: "SharedTodoList",
        time: "",
        tasks: []
    };

    const query:string = `SELECT Todo.Tasks.taskId, Todo.Tasks.dueDate, Todo.Tasks.currentStatus, Todo.Tasks.taskContent, Todo.Tasks.creatorId
    FROM Todo.Tasks INNER JOIN (SELECT taskId FROM Todo.SharedItems WHERE userId = @userId) AS A ON Todo.Tasks.taskId = A.taskId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    request.addParameter('userId', TYPES.UniqueIdentifier, aadObjectId);
    
    try {
        const resp = await dbRun(request);

        sharedTodoListResp.tasks = await Promise.all(resp.body.map(async con => {
            let creator = await getUserDetails(con.creatorId, token);
            return {
                taskId: con.taskId,
                dueDate: convertTimeString(con.dueDate),
                currentStatus: con.currentStatus,
                taskContent: con.taskContent,
                creator: creator
            }
        }));

    } catch (err) {
        console.log(err);
    }

    return sharedTodoListResp;
}

interface TodoItemResponse {
    title: string;
    time: string;
    task: TodoItem;
}

export async function getTodoItemData(taskId: number, token: string, isViewer: boolean = false) {
    console.log("Reading Todo Item From Azure SQL Database.");
    const todoItemResp: TodoItemResponse = {
        title: "SharedTodoItem",
        time: "",
        task: {}
    };

    const query:string = `SELECT Task.taskId, Task.dueDate, Task.currentStatus, Task.taskContent, creatorId , A.userId AS viewerId
        FROM (SELECT taskId, dueDate, currentStatus, taskContent, creatorId FROM Todo.Tasks WHERE taskId = @taskId) AS Task
        LEFT JOIN (SELECT taskId, userId FROM Todo.SharedItems WHERE taskId = @taskId) AS A
        ON Task.taskId = A.taskId`;

    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    request.addParameter('taskId', TYPES.Int, taskId);
    
    try {
        const resp = await dbRun(request);

        const creator = await getUserDetails(resp.body[0].creatorId, token);
        todoItemResp.task = {
            taskId: resp.body[0].taskId,
            dueDate: convertTimeString(resp.body[0].dueDate),
            currentStatus: resp.body[0].currentStatus,
            taskContent: resp.body[0].taskContent,
            creator: creator,
            viewers: []
        }
        if (isViewer) {
            todoItemResp.title = "TodoItem";
            const viewers: User[] = await Promise.all(resp.body.map(async con => {
                if (con.viewerId != null ) {
                    let viewer =  await getUserDetails(con.viewerId, token);
                    return viewer;
                }
                return undefined;
            }));
    
            todoItemResp.task.viewers = viewers.filter(function(viewer) {
                return viewer != undefined;
            });
        }

    } catch (err) {
        console.log(err);
    }

    return todoItemResp;
}

export async function handleNewItemAction(aadObjectId: string, data: any) {
    console.log("Handling the Action Of Message Extension.");
    const task: TodoItem = {
        dueDate: data.addDate,
        taskContent: data.addContent
    }

    const request = addTodoItem(aadObjectId, task);
    
    try {
        await dbRun(request);

    } catch (err) {
        console.log(err);
    }
}

export async function handleTodoListAction(aadObjectId: string, data: any) {
    console.log("Handling the Action Of MyTab.");
    var request: Request;
    switch (data.action) {
        case "add": {
            const task: TodoItem = {
                dueDate: data.addDate,
                taskContent: data.addContent
            }
            request = addTodoItem(aadObjectId, task);
            break;
        }
        case "edit": {
            const task: TodoItem = {
                taskId: data.taskId,
                dueDate: data[`updateTime${data.id}`],
                currentStatus: data[`updateStatus${data.id}`],
                taskContent: data[`updateContent${data.id}`],
            }
            request = updateTodoItem(task);
            break;
        }
        case "del": {
            request = deleteTodoItem(data.taskId);
            break;
        }
        case "share": {
            request = shareTodoItem(data.taskId, data.sharedUsers);
            break;
        }
    }
    try {
        await dbRun(request);

    } catch (err) {
        console.log(err);
    }
}

function addTodoItem(aadObjectId: string, data: TodoItem) {
    const query = `INSERT INTO Todo.Tasks (dueDate, taskContent, creatorId) VALUES (@date, @content, @userId)`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });

    request.addParameter("date", TYPES.DateTime, data.dueDate);
    request.addParameter("content", TYPES.NVarChar, data.taskContent);
    request.addParameter("userId", TYPES.UniqueIdentifier, aadObjectId);
    
    return request;
    // await dbRun(request);
}

function updateTodoItem(data: TodoItem) {
    const query = `UPDATE Todo.Tasks SET dueDate = @date, currentStatus = @status, taskContent = @content WHERE taskId = @taskId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    
    request.addParameter("date", TYPES.DateTime, data.dueDate);
    request.addParameter("status", TYPES.NVarChar, data.currentStatus);
    request.addParameter("content", TYPES.NVarChar, data.taskContent);
    request.addParameter("taskId", TYPES.Int, data.taskId);

    return request;
}

function deleteTodoItem(taskId: number) {
    const query = `DELETE FROM Todo.Tasks WHERE taskId = @taskId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    
    request.addParameter("taskId", TYPES.Int, taskId);

    return request;
}

function shareTodoItem(taskId: number, rawSharedUsers: string) {
    var query: string = "";
    const sharedUsers = rawSharedUsers.split(',');

    for (let i: number = 0; i < sharedUsers.length; ++i) {
        query = query + `INSERT INTO Todo.SharedItems(userId, taskId) 
        SELECT @userId${i}, @taskId WHERE NOT EXISTS (SELECT * FROM Todo.SharedItems WHERE userId = @userId${i} AND taskId = @taskId); `;
    }

    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });

    request.addParameter("taskId", TYPES.Int, taskId);
    for (let i: number = 0; i < sharedUsers.length; ++i) {
        request.addParameter(`userId${i}`, TYPES.UniqueIdentifier, sharedUsers[i]);
    }

    return request;
}