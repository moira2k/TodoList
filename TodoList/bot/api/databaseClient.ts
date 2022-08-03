import { Connection, Request } from "tedious";
import { TeamsFx, getTediousConnectionConfig } from "@microsoft/teamsfx";

interface DBResponse {
    status: number;
    body: { [key: string]: any };
}

export default async function dbRun(query: string): Promise<DBResponse> {
    console.log("Processing a query")
    // Initialize response.
    const res: DBResponse = {
        status: 200,
        body: {},
    };
    let connection;
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
        const content = await execQuery(query, connection);
        res.body = {content: content};
        // console.log(res.body);
        return res;
    }
    catch (err) {
        res.status = 500;
        res.body = {error: err.message};
        return res;
    }
    // finally {
    //     if (connection) {
    //         connection.close();
    //     }
    // }
}

async function getSQLConnection(teamsfx) {
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
        // connection.on('debug', function (err) {
        //     console.log('debug:', err);
        // });
    })
}

async function execQuery(query: string, connection: { execSql: (arg0: Request) => void; }) {
    // console.log("query: ", query);
    return new Promise((resolve, reject) => {
        const res = [];
        const request = new Request(query, (err) => {
            if (err) {
                reject(err);
            }
        });

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
