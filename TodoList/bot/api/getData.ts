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
    if (timezone < 10)
        tmp = "0" + timezone + ":00";
    else
        tmp = timezone + ":00";

    if (offest == 0) {
        res = timeGmt.slice(0, timeGmt.length - 5) + "Z";
    } else if (offest > 0) {
        res = timeGmt.slice(0, timeGmt.length - 5) + `-` + tmp;
    } else {
        res = timeGmt.slice(0, timeGmt.length - 5) + `+` + tmp;
    }
    // console.log(res);
    return res;
}

export const getUserDetails = async (userId: number) => {
    var query:string = `SELECT * FROM Todo.Users WHERE userId = ${userId}`;
    var req = await dbRun(query);
    if (req.status == 200) {
        return req.body.content[0];
        // If the user do not exist, ...
    }
}

export const getTodoListData = async (userId: number) => {
    const res:  TodoListResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        tasks: []
    };

    var query:string = 
        `SELECT Todo.Tasks.taskId, Todo.Tasks.taskTime, Todo.Tasks.taskStatus, Todo.Tasks.taskContent,
            A.userId as creatorId, A.AADId as creatorAADId , A.userName as creatorName, A.profileImage as creatorImage,
            B.userId as participantId, B.AADId as participantAADId, B.userName as participantName, B.profileImage as participantImage
        FROM ((Todo.Tasks INNER JOIN (SELECT userId, AADId, userName, profileImage FROM Todo.Users WHERE userId = ${userId}) as A on Todo.Tasks.creatorId = A.userId)
            INNER JOIN Todo.Participants ON Todo.Tasks.taskId = Todo.Participants.taskId) 
            INNER JOIN Todo.Users as B ON Todo.Participants.participantId = B.userId`;
    var req = await dbRun(query);
    if (req.status != 200) {
        res.message = "failure"
        return res;
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
                participants: []
            }
        }
        let participant = {
            userId: req.body.content[i].participantId,
            AADId: req.body.content[i].participantAADId,
            userName: req.body.content[i].participantName,
            profileImage: req.body.content[i].participantImage
        }
        taskMap[req.body.content[i].taskId].participants.push(participant);
    }

    for (let task of Object.values(taskMap)) {
        res.tasks.push(task);
    }
    // console.log(JSON.stringify(res, null,2));
    return res;
}

interface TodoItemResponse {
    message: string;
    enquirer: { [key: string]: any };
    enquiredDate: string;
    task: { [key: string]: any };
}

export const getTodoItemData = async (taskId: number) => {
    const res:  TodoItemResponse = {
        message: "success",
        enquiredDate: getCurrentTimeString(),
        enquirer: {},
        task: {}
    };

    var query:string = 
        `SELECT Task.taskId, Task.taskTime, Task.taskStatus, Task.taskContent,
            A.userId as creatorId, A.AADId as creatorAADId , A.userName as creatorName, A.profileImage as creatorImage,
            B.userId as participantId, B.AADId as participantAADId, B.userName as participantName, B.profileImage as participantImage
        FROM (((SELECT taskId, taskTime, taskStatus, taskContent, creatorId FROM Todo.Tasks WHERE taskId = ${taskId}) as Task INNER JOIN Todo.Users as A on Task.creatorId = A.userId)
            INNER JOIN Todo.Participants ON Task.taskId = Todo.Participants.taskId) 
            INNER JOIN Todo.Users as B ON Todo.Participants.participantId = B.userId`;
    var req = await dbRun(query);
    if (req.status != 200) {
        res.message = "failure"
        return res;
    }

    var creator = {
        userId: req.body.content[0].creatorId,
        AADId: req.body.content[0].creatorAADId,
        userName: req.body.content[0].creatorName,
        profileImage: req.body.content[0].creatorImage
    }
    res.task = {
        taskId: req.body.content[0].taskId,
        taskTime: req.body.content[0].taskTime,
        taskStatus: req.body.content[0].taskStatus,
        taskContent: req.body.content[0].taskContent,
        creator: creator,
        participants: []
    }

    for (let i:number = 0; i < req.body.content.length; ++i) {
        let participant = {
            userId: req.body.content[i].participantId,
            AADId: req.body.content[i].participantAADId,
            userName: req.body.content[i].participantName,
            profileImage: req.body.content[i].participantImage
        }
        res.task.participants.push(participant);
    }
    console.log(JSON.stringify(res, null,2));
    return res;
}