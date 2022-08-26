import { User } from "./user";


export interface TodoItem {
    taskId?: number;
    dueDate?: string;
    currentStatus?: string;
    taskContent?: string;
    creator?: User;
    viewers?: User[];
}

