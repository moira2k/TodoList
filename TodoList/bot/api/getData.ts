import dbRun from "./databaseClient";

export const getTodoListData = async (userId: number) => {
    // const query = `SELECT * FROM Todo.Tasks WHERE creatorId = '${userId}'`;
    var query:string = `SELECT * FROM Todo.Tasks`;
    const req = await dbRun(query);
    if (req.status == 200) {
        console.log(JSON.stringify(req.body, null,2));
        console.log(JSON.stringify(req.body, null,2));
    }
    console.log(req);
}