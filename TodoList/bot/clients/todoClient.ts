import { Request, TYPES } from "tedious";
import { User } from "../dataModels/user";
import { TodoItem } from "../dataModels/todoItem";
import dbRun from "./databaseClient";
import { getUserDetailsFromGraph } from "./graphClient";
import { convertTimeString } from "../utils/utils";


export async function getTodoListData(aadObjectId: string): Promise<Array<TodoItem>> {
    let todoList = new Array<TodoItem>();

    const query: string = `SELECT taskId, dueDate, currentStatus, taskContent, creatorId
    FROM Todo.Tasks WHERE creatorId = @userId order by dueDate asc, taskId asc`;
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
    let sharedTodoList = new Array<TodoItem>();

    const query: string = `SELECT Todo.Tasks.taskId, Todo.Tasks.dueDate, Todo.Tasks.currentStatus, Todo.Tasks.taskContent, Todo.Tasks.creatorId
    FROM Todo.Tasks INNER JOIN (SELECT taskId FROM Todo.SharedItems WHERE userId = @userId) AS A ON Todo.Tasks.taskId = A.taskId 
    order by Todo.Tasks.dueDate asc, Todo.Tasks.taskId asc`;
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

export async function addTodoItem(aadObjectId: string, data: TodoItem): Promise<void> {
    const query = `INSERT INTO Todo.Tasks (dueDate, taskContent, creatorId) VALUES (@date, @content, @userId)`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });

    request.addParameter("date", TYPES.DateTime, data.dueDate);
    request.addParameter("content", TYPES.NVarChar, data.taskContent);
    request.addParameter("userId", TYPES.UniqueIdentifier, aadObjectId);
    
    try {
        await dbRun(request);

    } catch (err) {
        console.log(err);
    };
}

export async function updateTodoItem(data: TodoItem): Promise<void> {
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

    try {
        await dbRun(request);

    } catch (err) {
        console.log(err);
    };
}

export async function deleteTodoItem(taskId: number): Promise<void> {
    const query = `DELETE FROM Todo.Tasks WHERE taskId = @taskId`;
    const request = new Request(query, (err) => {
        if (err) {
            throw new Error(err.message);
        }
    });
    
    request.addParameter("taskId", TYPES.Int, taskId);

    try {
        await dbRun(request);

    } catch (err) {
        console.log(err);
    };
}

export async function shareTodoItem(taskId: number, rawSharedUsers: string): Promise<void> {
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

    try {
        await dbRun(request);

    } catch (err) {
        console.log(err);
    };
}