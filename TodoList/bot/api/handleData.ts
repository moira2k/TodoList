import { Request, TYPES } from "tedious";
import { User, TodoItem } from "./constant";
import dbRun from "./databaseClient";
import { getUserDetailsFromGraph} from "./graphClient";
import { convertTimeString } from "../utils/utils"


export async function getTodoListData(aadObjectId: string): Promise<Array<TodoItem>> {
    console.log("Reading Todo List From Azure SQL Database.");
    let todoList = new Array<TodoItem>();

    const query: string = `SELECT taskId, dueDate, currentStatus, taskContent, creatorId
    FROM Todo.Tasks WHERE creatorId = @userId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    request.addParameter('userId', TYPES.UniqueIdentifier, aadObjectId);
    
    try {
        const resp = await dbRun(request);

        for (let i: number = 0; i < resp.length; ++i) {
            const task = {
                taskId: resp[i].taskId,
                dueDate: convertTimeString(resp[i].dueDate),
                currentStatus: resp[i].currentStatus,
                taskContent: resp[i].taskContent
            }
            todoList.push(task);
        }
        
    } catch (err) {
        console.log(err);
    }

    return todoList;
}

export async function getSharedTodoListData(aadObjectId: string, token: string): Promise<Array<TodoItem>> {
    console.log("Reading Tasks Shared From Azure SQL Database.");
    let sharedTodoList = new Array<TodoItem>();

    const query: string = `SELECT Todo.Tasks.taskId, Todo.Tasks.dueDate, Todo.Tasks.currentStatus, Todo.Tasks.taskContent, Todo.Tasks.creatorId
    FROM Todo.Tasks INNER JOIN (SELECT taskId FROM Todo.SharedItems WHERE userId = @userId) AS A ON Todo.Tasks.taskId = A.taskId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    request.addParameter('userId', TYPES.UniqueIdentifier, aadObjectId);
    
    try {
        const resp = await dbRun(request);

        sharedTodoList = await Promise.all(resp.map(async con => {
            const creator = await getUserDetailsFromGraph(con.creatorId, token);
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

    return sharedTodoList;
}

export async function getTodoItemData(taskId: number, token: string, isViewer: boolean = false): Promise<TodoItem> {
    console.log("Reading Todo Item From Azure SQL Database.");
    let todoItem: TodoItem;

    const query: string = `SELECT Task.taskId, Task.dueDate, Task.currentStatus, Task.taskContent, creatorId , A.userId AS viewerId
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

        const creator = await getUserDetailsFromGraph(resp[0].creatorId, token);
        todoItem = {
            taskId: resp[0].taskId,
            dueDate: convertTimeString(resp[0].dueDate),
            currentStatus: resp[0].currentStatus,
            taskContent: resp[0].taskContent,
            creator: creator,
            viewers: []
        }
        if (isViewer) {
            const viewers: User[] = await Promise.all(resp.map(async con => {
                if (con.viewerId != null ) {
                    const viewer =  await getUserDetailsFromGraph(con.viewerId, token);
                    return viewer;
                }
                return undefined;
            }));
    
            todoItem.viewers = viewers.filter(function(viewer) {
                return viewer != undefined;
            });
        }

    } catch (err) {
        console.log(err);
    }

    return todoItem;
}

export async function handleNewItemAction(aadObjectId: string, data: any): Promise<void> {
    console.log("Handling the Action Of Task Module.");
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

export async function handleTodoListAction(aadObjectId: string, data: any): Promise<void> {
    console.log("Handling the Action Of MyTab.");
    if (data.action == "show")
        return;
    
    let request: Request;
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

function addTodoItem(aadObjectId: string, data: TodoItem): Request {
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
}

function updateTodoItem(data: TodoItem): Request {
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

function deleteTodoItem(taskId: number): Request {
    const query = `DELETE FROM Todo.Tasks WHERE taskId = @taskId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    
    request.addParameter("taskId", TYPES.Int, taskId);

    return request;
}

function shareTodoItem(taskId: number, rawSharedUsers: string): Request {
    let query: string = "";
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