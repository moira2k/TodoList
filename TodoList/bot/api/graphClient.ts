// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { TeamsFx, createMicrosoftGraphClient, IdentityType } from "@microsoft/teamsfx";
import { Client, ResponseType }from "@microsoft/microsoft-graph-client"

interface UserGraphResponse {
    profile: { [key: string]: any };
    profileImage: string;
}

export default async function graphRun(aadObjectId: string, token: string) {
    // Initialize response.
    const res: UserGraphResponse = {
        profile: {},
        profileImage: "",
    };
    console.log("grapg aadId", aadObjectId);
    if (!token || !token.trim()) {
        throw new Error("GraphClient: Empty token received.");
    }
    try {
        // Get an Authenticated Microsoft Graph client using the token issued to the user.
        const graphClient = Client.init({
            authProvider: (done) => {
                done(null, token); // First parameter takes an error if you can't get an access token.
            },
        }); 
        res.profile = await graphClient.api(`/users/${aadObjectId}`).get();

        const photoBinary = await graphClient.api(`/users/${aadObjectId}/photos/48x48/$value`).responseType(ResponseType.ARRAYBUFFER).get();
        const buffer = Buffer.from(photoBinary);
        res.profileImage = "data:image/png;base64," + buffer.toString("base64");
        console.log("profileImageSize", res.profileImage.length);
    } catch (err) {
        console.log("error", err);
        throw new Error("Failed to retrieve user profile from Microsoft Graph. The application may not be authorized.");
    }
    return res;
}