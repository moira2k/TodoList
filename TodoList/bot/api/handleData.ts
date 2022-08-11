import dbRun from "./databaseClient";
import graphRun from "./graphClient";

interface TodoListResponse {
    message: string;
    enquirer: { [key: string]: any };
    enquiredDate: string;
    tasks: { [key: string]: any }[];
}

export const getCurrentTimeString = () => {
    // 2017-02-14T06:08:00Z
    // 2017-02-14T06:08:00-07:00
    // 2017-02-14T06:08:00+07:00
    var res: string;

    const time = new Date()
    const timeGmt = time.toISOString()
    const offest = time.getTimezoneOffset()

    var tmp: string;
    const timezone = Math.abs(offest / 60);
    if (timezone < 10) {
        tmp = "0" + timezone + ":00";
    } else {
        tmp = timezone + ":00";
    }

    if (offest == 0) {
        res = timeGmt.slice(0, timeGmt.length - 5) + "Z";
    } else if (offest > 0) {
        res = timeGmt.slice(0, timeGmt.length - 5) + `-` + tmp;
    } else {
        res = timeGmt.slice(0, timeGmt.length - 5) + `+` + tmp;
    }
    return res;
}

export const getUserDetails = async (AADId: string, token: string) => {
    console.log("Reading User Details From MS Graph.");
    const user = {
        userName: "",
        AADId: "",
        profileImage: ""
    };

    const req = await graphRun(AADId, token);
    if (req.status == 200) {
        user.userName = req.body.profile.displayName;
        user.AADId = req.body.profile.id;
        user.profileImage = req.body.profileImage;
    }
    return user;
}

export const getTodoListData = async (AADId: string, token: string) => {
    console.log("Reading Todo List From Azure SQL Database.");
    const todoListResp:  TodoListResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        tasks: []
    };

    const query:string = `SELECT taskId, taskTime, taskStatus, taskContent, creatorAADId
    FROM Todo.Tasks WHERE creatorAADId = '${AADId}'`;
    const req = await dbRun(query);
    if (req.status != 200) {
        todoListResp.message = "failure"
        return todoListResp;
    }
    const creator = await getUserDetails(AADId, token);

    var taskMap = {};
    for (let i:number = 0; i < req.body.content.length; ++i) {
        if (!(req.body.content[i].taskId in taskMap)) {
            taskMap[req.body.content[i].taskId] = {
                taskId: req.body.content[i].taskId,
                taskTime: req.body.content[i].taskTime,
                taskStatus: req.body.content[i].taskStatus,
                taskContent: req.body.content[i].taskContent,
                creator: creator
            }
        }
    }
    for (let task of Object.values(taskMap)) {
        todoListResp.tasks.push(task);
    }

    return todoListResp;
}

interface TodoItemResponse {
    message: string;
    enquirer: { [key: string]: any };
    enquiredDate: string;
    task: { [key: string]: any };
}

export const getTodoItemData = async (taskId: number, token: string) => {
    console.log("Reading Todo Item From Azure SQL Database.");
    const todoItemResp:  TodoItemResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        task: {}
    };

    const query:string = `SELECT Task.taskId, Task.taskTime, Task.taskStatus, Task.taskContent, creatorAADId , A.userAADId AS viewerAADId
    FROM (SELECT taskId, taskTime, taskStatus, taskContent, creatorAADId FROM Todo.Tasks WHERE taskId = ${taskId}) AS Task
        LEFT JOIN (SELECT taskId, userAADId FROM Todo.SharedTabs WHERE taskId = ${taskId}) AS A ON Task.taskId = A.taskId`;
    
    const req = await dbRun(query);
    if (req.status != 200) {
        todoItemResp.message = "failure"
        return todoItemResp;
    }

    const creator = await getUserDetails(req.body.content[0].creatorAADId, token);
    todoItemResp.task = {
        taskId: req.body.content[0].taskId,
        taskTime: req.body.content[0].taskTime,
        taskStatus: req.body.content[0].taskStatus,
        taskContent: req.body.content[0].taskContent,
        creator: creator,
        viewers: []
    }

    var viewerMap = {};
    for (let i:number = 0; i < req.body.content.length; ++i) {
        if (req.body.content[i].viewerAADId != null && !(req.body.content[i].viewerAADId in viewerMap)) {
            let viewer =  await getUserDetails(req.body.content[i].viewerAADId, token);
            viewerMap[req.body.content[i].viewerAADId] = 1;
            todoItemResp.task.viewers.push(viewer);
        }
    }

    return todoItemResp;
}

export const handleTodoListAction = async(AADId: string, data: any) => {
    console.log("Handling the Action Of MyTab.");
    var query:string;
    switch (data.action) {
        case "add": {
            const addTime = data.addDate + "T00:00:00Z";
            query = `INSERT INTO Todo.Tasks (taskTime, taskStatus, taskContent, creatorAADId) VALUES ('${addTime}', 'Not Started', '${data.addContent}', '${AADId}')`;
            // get taskId
            // insert Todo.Participants
            break;
        }
        case "edit": {
            const updateTime = data[`updateTime${data.id}`] + "T00:00:00Z";
            query = `UPDATE Todo.Tasks SET taskTime = '${updateTime}', taskStatus = '${data[`updateStatus${data.id}`]}', taskContent = '${data[`updateContent${data.id}`]}' WHERE taskId = ${data.taskId}`;
            break;
        }
        case "del": {
            query = `DELETE FROM Todo.Tasks WHERE taskId = ${data.taskId}`;
            break;
        }
        case "share": {
            const sharedUsers = data.sharedUsers.split(',');
            query = 'INSERT INTO Todo.SharedTabs (userAADId, taskId) VALUES ';
            for (let i: number = 0; i < sharedUsers.length; ++i) {
                if (i != 0) query = query + ',';
                query = query + ` ('${sharedUsers[i]}', ${data.taskId})`;
            }
            break;
        }
    }
    const req = await dbRun(query);
    return req.status;
}

export const getTaskSharedData = async(AADId: string, token: string) => {
    console.log("Reading Tasks Shared From Azure SQL Database.");
    const taskSharedResp:  TodoListResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        tasks: []
    };

    const query:string = `SELECT Todo.Tasks.taskId, Todo.Tasks.taskTime, Todo.Tasks.taskStatus, Todo.Tasks.taskContent, Todo.Tasks.creatorAADId
    FROM Todo.Tasks INNER JOIN (SELECT taskId FROM Todo.SharedTabs WHERE userAADId = '${AADId}') AS A ON Todo.Tasks.taskId = A.taskId`;

    const req = await dbRun(query);
    if (req.status != 200) {
        taskSharedResp.message = "failure"
        return taskSharedResp;
    }
    var taskMap = {};
    for (let i:number = 0; i < req.body.content.length; ++i) {
        if (!(req.body.content[i].taskId in taskMap)) {
            let creator = await getUserDetails(req.body.content[i].creatorAADId, token);
            taskMap[req.body.content[i].taskId] = {
                taskId: req.body.content[i].taskId,
                taskTime: req.body.content[i].taskTime,
                taskStatus: req.body.content[i].taskStatus,
                taskContent: req.body.content[i].taskContent,
                creator: creator
            }
        }
    }

    for (let task of Object.values(taskMap)) {
        taskSharedResp.tasks.push(task);
    }
    return taskSharedResp;
}

// Card response for authentication
export const createAuthResponse = (signInLink) => {
    console.log("Create Auth response")
    const res = {
            tab: {
                type: "auth",
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