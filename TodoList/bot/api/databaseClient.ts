import { Connection, Request } from "tedious";
import { TeamsFx, getTediousConnectionConfig } from "@microsoft/teamsfx";

export default async function dbRun(request: Request): Promise<Array<any>> {
    let connection: Connection;
    try {
        // Equivalent to:
        // const sqlConnectConfig = new DefaultTediousConnectionConfiguration({
        //    sqlServerEndpoint: process.env.SQL_ENDPOINT,
        //    sqlUsername: process.env.SQL_USER_NAME,
        //    sqlPassword: process.env.SQL_PASSWORD,
        // });
        const teamsfx = new TeamsFx();
        connection = await getSQLConnection(teamsfx);
        // Execute SQL through TeamsFx server SDK generated connection and return result
        const res = await execQuery(request, connection);
        return res;

    } catch (err) {
        console.log("error", err);
        throw new Error("Failed to execute query in SQL Database.");
    }
    finally {
        if (connection) {
            connection.close();
        }
    }
}

async function getSQLConnection(teamsfx: TeamsFx): Promise<Connection> {
    // If there's only one SQL database
    const config = await getTediousConnectionConfig(teamsfx);
    const connection = new Connection(config);
    connection.connect();
    return new Promise((resolve, reject) => {
        connection.on('connect', err => {
            if (err) {
                reject(err);
            }
            resolve(connection);
        })
    })
}

async function execQuery(request: Request, connection: Connection): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
        const res = [];

        request.on('row', columns => {
            const row = {};
            columns.forEach(column => {
                row[column.metadata.colName] = column.value;
            });
            res.push(row);
        });

        request.on('requestCompleted', () => {
            resolve(res)
        });

        request.on("error", err => {
            reject(err);
        });

        connection.execSql(request);
    })
}
