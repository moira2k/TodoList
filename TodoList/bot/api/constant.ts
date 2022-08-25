export interface User {
    aadObjectId: string;
    userName: string;
    profileImage?: string;
}

export interface TodoItem {
    taskId?: number;
    dueDate?: string;
    currentStatus?: string;
    taskContent?: string;
    creator?: User;
    viewers?: User[];
}

