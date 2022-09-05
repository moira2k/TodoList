// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { Client, ResponseType }from "@microsoft/microsoft-graph-client"
import { User } from "../dataModels/user";


export async function getUserDetailFromGraph(aadObjectId: string, token: string, IsImage: boolean = false): Promise<User> {
    if (!token || !token.trim()) {
        throw new Error("GraphClient: Empty token received.");
    }

    const user: User = {
        userName: "",
        aadObjectId: aadObjectId,
        mail: "",
        profileImage: ""
    };
    
    try {
        // Get an Authenticated Microsoft Graph client using the token issued to the user.
        const graphClient = Client.init({
            authProvider: (done) => {
                done(null, token); // First parameter takes an error if you can't get an access token.
            },
        }); 
        
        const profile = await graphClient.api(`/users/${aadObjectId}`).get();
        user.userName = profile.displayName;
        user.aadObjectId = profile.id;
        user.mail = profile.mail;

        if (IsImage) {
            const photoBinary = await graphClient.api(`/users/${aadObjectId}/photos/48x48/$value`).responseType(ResponseType.ARRAYBUFFER).get();
            const buffer = Buffer.from(photoBinary);
            user.profileImage = "data:image/png;base64," + buffer.toString("base64");
        }
    } catch (err) {
        console.log("error", err);
        throw new Error("Failed to retrieve user profile from Microsoft Graph. The application may not be authorized.");
    }
    return user;
}