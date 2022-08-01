import { Connection, Request } from "tedious"
import { TeamsFx, getTediousConnectionConfig } from "@microsoft/teamsfx"
import {db} from "../index"
export class DBClient {
    config: {
        authentication: {
            options: {
                userName: string; // update me
                password: string; // update me
            }; type: string;
        }; server: string; // update me
        options: {
            database: string; //update me
            encrypt: boolean;
        };
    };
    connection: any;

    constructor() {
        const teamsfx = new TeamsFx();
        // If there's only one SQL database
        const config = await getTediousConnectionConfig(teamsfx);
        // If there are multiple SQL databases
        const config2 = await getTediousConnectionConfig(teamsfx "your database name");
        const connection = new Connection(config);
        connection.on("connect", (error) => {
        if (error) {
            console.log(error);
        }
        });
        // Create connection to database
        this.config = {
            authentication: {
                options: {
                    userName: process.env.SQL_USER_NAME, // update me
                    password: process.env.SQL_PASSWORD // update me
                },
                type: "default"
            },
            server: process.env.SQL_ENDPOINT, // update me
            options: {
                database: process.env.SQL_DATABASE_NAME, //update me
                encrypt: true
            }
        };
        this.connection = new Connection(this.config);
          // Attempt to connect and execute queries if connection goes through
        this.connection.on("connect", err => {
            if (err) {
                console.error(err.message);
            } else {
        queryDatabase();
        }
        });
        this.connection.connect();
    }
    
}


export function queryDatabase() {
    console.log("Reading rows from the Table...");

    // Read all rows from table
    const request = new Request(
        `SELECT * FROM [Todo].[Users]`,
        (err, rowCount) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log(`${rowCount} row(s) returned`);
            }
        }
    );

    request.on("row", columns => {
        columns.forEach(column => {
            console.log("%s\t%s", column.metadata.colName, column.value);
        });
    });

    db.connection.execSql(request);
}