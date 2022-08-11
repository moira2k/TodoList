// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { TeamsFx, createMicrosoftGraphClient, IdentityType } from "@microsoft/teamsfx";
import { Client, ResponseType }from "@microsoft/microsoft-graph-client"

interface GraphResponse {
    status: number;
    body: { [key: string]: any };
}

export default async function graphRun(AADId: string, token: string) {
    // Initialize response.
    const res: GraphResponse = {
        status: 200,
        body: {},
    };
    if (!token || !token.trim()) {
        throw new Error('SimpleGraphClient: Invalid token received.');
    }
    try {
        // Get an Authenticated Microsoft Graph client using the token issued to the user.
        const graphClient = Client.init({
            authProvider: (done) => {
                done(null, token); // First parameter takes an error if you can't get an access token.
            },
        }); 
        res.body.profile = await graphClient.api(`/users/${AADId}`).get();

        const photoBinary = await graphClient.api(`/users/${AADId}/photos/96x96/$value`).responseType(ResponseType.ARRAYBUFFER).get();
        const buffer = Buffer.from(photoBinary);
        res.body.profileImage = "data:image/png;base64," + buffer.toString("base64");
    } catch (error) {
        console.log(error);
        res.status = 500;
        res.body = {error: "Failed to retrieve user profile from Microsoft Graph. The application may not be authorized."};
    }
    return res;
}