import dbRun from "./databaseClient";

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

export const getUserDetails = async (AADId: string, data: any) => {
    console.log("Reading User Details From DB.");
    var query:string = `SELECT * FROM Todo.Users WHERE AADId = '${AADId}'`;
    var req = await dbRun(query);
    // console.log(JSON.stringify(req.body.content, null, 2))
    if (req.body.content.length == 0) {
        query = `INSERT INTO Todo.Users (AADId, userId, userName) VALUES ('${data.aadObjectId}', '${data.id}', '${data.name}'); SELECT * FROM Todo.Users WHERE AADId = '${AADId}';`;
        req = await dbRun(query);
    }
    if (req.status == 200) {
        return req.body.content[0];
        // If the user do not exist, ...
    }
}

export const getTodoListData = async (AADId: string) => {
    console.log("Reading Todo List From DB.");
    const todoListResp:  TodoListResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        tasks: []
    };

    // var query:string = `SELECT Todo.Tasks.taskId, Todo.Tasks.taskTime, Todo.Tasks.taskStatus, Todo.Tasks.taskContent,
    //     A.userId AS creatorId, A.AADId AS creatorAADId , A.userName AS creatorName, A.profileImage AS creatorImage,
    //     B.userId AS participantId, B.AADId AS participantAADId, B.userName AS participantName, B.profileImage AS participantImage
    // FROM (Todo.Tasks INNER JOIN (SELECT userId, AADId, userName, profileImage FROM Todo.Users WHERE AADId = '${AADId}') AS A ON Todo.Tasks.creatorAADId = A.AADId)
    //     LEFT JOIN (Todo.Participants INNER JOIN Todo.Users AS B ON Todo.Participants.participantAADId = B.AADId) ON Todo.Tasks.taskId = Todo.Participants.taskId`;
    var query:string = `SELECT Todo.Tasks.taskId, Todo.Tasks.taskTime, Todo.Tasks.taskStatus, Todo.Tasks.taskContent,
        A.userId AS creatorId, A.AADId AS creatorAADId , A.userName AS creatorName, A.profileImage AS creatorImage
    FROM (Todo.Tasks INNER JOIN (SELECT userId, AADId, userName, profileImage FROM Todo.Users WHERE AADId = '${AADId}') AS A ON Todo.Tasks.creatorAADId = A.AADId)`;
    var req = await dbRun(query);
    if (req.status != 200) {
        todoListResp.message = "failure"
        return todoListResp;
    }
    var taskMap = {};
    for (let i:number = 0; i < req.body.content.length; ++i) {
        if (!(req.body.content[i].taskId in taskMap)) {
            let creator = {
                userId: req.body.content[i].creatorId,
                AADId: req.body.content[i].creatorAADId,
                userName: req.body.content[i].creatorName,
                profileImage: req.body.content[i].creatorImage
            }
            taskMap[req.body.content[i].taskId] = {
                taskId: req.body.content[i].taskId,
                taskTime: req.body.content[i].taskTime,
                taskStatus: req.body.content[i].taskStatus,
                taskContent: req.body.content[i].taskContent,
                creator: creator,
                // participants: []
            }
        }
        // let participant = {
        //     userId: req.body.content[i].participantId,
        //     AADId: req.body.content[i].participantAADId,
        //     userName: req.body.content[i].participantName,
        //     profileImage: req.body.content[i].participantImage
        // }
        // taskMap[req.body.content[i].taskId].participants.push(participant);
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

export const getTodoItemData = async (taskId: number) => {
    console.log("Reading Todo Item From DB.");
    const todoItemResp:  TodoItemResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        task: {}
    };

    // var query:string = `SELECT Task.taskId, Task.taskTime, Task.taskStatus, Task.taskContent,
    //     A.userId AS creatorId, A.AADId AS creatorAADId , A.userName AS creatorName, A.profileImage AS creatorImage,
    //     B.userId AS participantId, B.AADId AS participantAADId, B.userName AS participantName, B.profileImage AS participantImage 
    // FROM ((SELECT taskId, taskTime, taskStatus, taskContent, creatorAADId FROM Todo.Tasks WHERE taskId = ${taskId}) AS Task INNER JOIN Todo.Users AS A ON Task.creatorAADId = A.AADId)
    //     LEFT JOIN ((SELECT taskId, participantAADId FROM Todo.Participants WHERE taskId = ${taskId}) AS C INNER JOIN Todo.Users AS B ON C.participantAADId = B.AADId) ON Task.taskId = C.taskId`;
    var query:string = `SELECT Task.taskId, Task.taskTime, Task.taskStatus, Task.taskContent,
        A.userId AS creatorId, A.AADId AS creatorAADId , A.userName AS creatorName, A.profileImage AS creatorImage,
        B.userId AS viewerId, B.AADId AS viewerAADId, B.userName AS viewerName, B.profileImage AS viewerImage 
    FROM ((SELECT taskId, taskTime, taskStatus, taskContent, creatorAADId FROM Todo.Tasks WHERE taskId = ${taskId}) AS Task INNER JOIN Todo.Users AS A ON Task.creatorAADId = A.AADId)
        LEFT JOIN ((SELECT taskId, userAADId FROM Todo.SharedTabs WHERE taskId = ${taskId}) AS C INNER JOIN Todo.Users AS B ON C.userAADId = B.AADId) ON Task.taskId = C.taskId`;
    var req = await dbRun(query);
    if (req.status != 200) {
        todoItemResp.message = "failure"
        return todoItemResp;
    }

    var creator = {
        userId: req.body.content[0].creatorId,
        AADId: req.body.content[0].creatorAADId,
        userName: req.body.content[0].creatorName,
        profileImage: req.body.content[0].creatorImage
    }
    todoItemResp.task = {
        taskId: req.body.content[0].taskId,
        taskTime: req.body.content[0].taskTime,
        taskStatus: req.body.content[0].taskStatus,
        taskContent: req.body.content[0].taskContent,
        creator: creator,
        viewers: []
    }

    for (let i:number = 0; i < req.body.content.length; ++i) {
        let viewer = {
            userId: req.body.content[i].viewerId,
            AADId: req.body.content[i].viewerAADId,
            userName: req.body.content[i].viewerName,
            profileImage: req.body.content[i].viewerImage
        }
        todoItemResp.task.viewers.push(viewer);
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
    console.log(query);
    const req = await dbRun(query);
    return req.status;
}

export const getTaskSharedData = async(AADId: string) => {
    console.log("Reading Tasks Shared From DB.");
    const taskSharedResp:  TodoListResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        tasks: []
    };

    // var query:string = `SELECT Todo.Tasks.taskId, Todo.Tasks.taskTime, Todo.Tasks.taskStatus, Todo.Tasks.taskContent,
    //     A.userId AS creatorId, A.AADId AS creatorAADId , A.userName As creatorName, A.profileImage AS creatorImage,
    //     B.userId AS participantId, B.AADId AS participantAADId, B.userName AS participantName, B.profileImage AS participantImage
    // FROM ((Todo.Tasks INNER JOIN (SELECT taskId FROM Todo.SharedTabs WHERE userAADId = '${AADId}') AS C ON Todo.Tasks.taskId = C.taskId)
    //     INNER JOIN Todo.Users AS A ON Todo.Tasks.creatorAADId = A.AADId)`;
    var query:string = `SELECT Todo.Tasks.taskId, Todo.Tasks.taskTime, Todo.Tasks.taskStatus, Todo.Tasks.taskContent,
    A.userId AS creatorId, A.AADId AS creatorAADId , A.userName As creatorName, A.profileImage AS creatorImage
FROM (Todo.Tasks INNER JOIN (SELECT taskId FROM Todo.SharedTabs WHERE userAADId = '${AADId}') AS C ON Todo.Tasks.taskId = C.taskId)
    INNER JOIN Todo.Users AS A ON Todo.Tasks.creatorAADId = A.AADId`;
    var req = await dbRun(query);
    if (req.status != 200) {
        taskSharedResp.message = "failure"
        return taskSharedResp;
    }
    var taskMap = {};
    for (let i:number = 0; i < req.body.content.length; ++i) {
        if (!(req.body.content[i].taskId in taskMap)) {
            let creator = {
                userId: req.body.content[i].creatorId,
                AADId: req.body.content[i].creatorAADId,
                userName: req.body.content[i].creatorName,
                profileImage: req.body.content[i].creatorImage
            }
            taskMap[req.body.content[i].taskId] = {
                taskId: req.body.content[i].taskId,
                taskTime: req.body.content[i].taskTime,
                taskStatus: req.body.content[i].taskStatus,
                taskContent: req.body.content[i].taskContent,
                creator: creator,
                // participants: []
            }
        }
        // let participant = {
        //     userId: req.body.content[i].participantId,
        //     AADId: req.body.content[i].participantAADId,
        //     userName: req.body.content[i].participantName,
        //     profileImage: req.body.content[i].participantImage
        // }
        // taskMap[req.body.content[i].taskId].participants.push(participant);
    }

    for (let task of Object.values(taskMap)) {
        taskSharedResp.tasks.push(task);
    }
    // console.log(JSON.stringify(res, null,2));
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