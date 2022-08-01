export class TabFetchResponse {
    data : {
        tab: {
            type: string;
            value: {
                cards: {
                    card: any
                }[];
            };
        }
    }
    constructor(cards: any) {
        console.log(cards);
        this.data.tab.value.cards = cards;
        console.log(this.data);
    }
}

export class User {
    data : {
        userId: string,
        name: string,
        profileImage: string
    }
    constructor(userId: string, name: string, profileImage: string) {
        this.data.userId = userId
        this.data.name = name
        this.data.profileImage = profileImage
    }
}

export class Task {
    data : {
        task_id: string;
        taskTime: string;
        taskStatus: string;
        taskContent: string;
        creator: User;
        participants: User[];
    }
    constructor(task_id: string, taskTime: string, taskStatus: string, taskContent: string, creator: User, participants: User[]) {
        this.data.task_id = task_id;
        this.data.taskTime = taskTime;
        this.data.taskStatus = taskStatus;
        this.data.taskContent = taskContent;
        this.data.creator = creator;
        this.data.participants = participants;
    }
}

export class TodoListCard {
    data : {
        message: string;
        enquirer: User;
        enquireDdate: string;
        tasks: Task[];
    }
    constructor(message: string, enquirer: User, enquireDdate: string, tasks: Task[]) {
        this.data.message  = message;
        this.data.enquirer = enquirer;
        this.data.enquireDdate = enquireDdate;
        this.data.tasks = tasks;
    }
}