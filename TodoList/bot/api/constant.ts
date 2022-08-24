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

