// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { Client, ResponseType }from "@microsoft/microsoft-graph-client"
import { User } from "../dataModels/user";


export async function getUserFromGraph(aadObjectId: string, token: string): Promise<User> {
    const user: User = {
        userName: "",
        aadObjectId: aadObjectId,
        mail: ""
    };

    const graphClient = getGraphClient(token);

    try {
        const profile = await graphClient.api(`/users/${aadObjectId}`).get();
        user.userName = profile.displayName;
        user.aadObjectId = profile.id;
        user.mail = profile.mail;

    } catch (err) {
        console.log("error", err);
        throw new Error("Failed to retrieve user profile from Microsoft Graph. The application may not be authorized.");
    }
    
    return user;
}

export async function getUserwithImageFromGraph(aadObjectId: string, token: string): Promise<User> {
    const user: User = {
        userName: "",
        aadObjectId: aadObjectId,
        mail: "",
        profileImage: ""
    };

    const graphClient = getGraphClient(token);

    try {
        const profile = await graphClient.api(`/users/${aadObjectId}`).get();
        user.userName = profile.displayName;
        user.aadObjectId = profile.id;
        user.mail = profile.mail;

        const photoBinary = await graphClient.api(`/users/${aadObjectId}/photos/48x48/$value`).responseType(ResponseType.ARRAYBUFFER).get();
        const buffer = Buffer.from(photoBinary);
        user.profileImage = "data:image/png;base64," + buffer.toString("base64");

    } catch (err) {
        console.log("error", err);
        throw new Error("Failed to retrieve user profile from Microsoft Graph. The application may not be authorized.");
    }

    return user;
}

function getGraphClient(token: string): Client {
    if (!token || !token.trim()) {
        throw new Error("GraphClient: Empty token received.");
    }
    
    // Get an Authenticated Microsoft Graph client using the token issued to the user.
    const graphClient = Client.init({
        authProvider: (done) => {
            done(null, token); // First parameter takes an error if you can't get an access token.
        },
    }); 
    
    return graphClient;
}