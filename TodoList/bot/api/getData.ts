import dbRun from "./databaseClient";

export const getTodoListData = (userId: number) => {
    const query = `SELECT * FROM Todo.Tasks WHERE creatorId = '${userId}'`;
    const req = dbRun(query);
    console.log(req);
}