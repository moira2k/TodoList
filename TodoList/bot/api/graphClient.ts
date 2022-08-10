// Import polyfills for fetch required by msgraph-sdk-javascript.
import "isomorphic-fetch";
import { TeamsFx, createMicrosoftGraphClient, IdentityType } from "@microsoft/teamsfx";
import { Client, ResponseType }from "@microsoft/microsoft-graph-client"

interface GraphResponse {
    status: number;
    body: { [key: string]: any };
}

export default async function graphRun(AADId: string, token: string) {
    console.log("Getting profile and photo from graphClient. ")
    // Initialize response.
    const res: GraphResponse = {
        status: 200,
        body: {},
    };

    if (!token || !token.trim()) {
        throw new Error('SimpleGraphClient: Invalid token received.');
    }
    
    // Get an Authenticated Microsoft Graph client using the token issued to the user.
    const graphClient = Client.init({
        authProvider: (done) => {
            done(null, token); // First parameter takes an error if you can't get an access token.
        },
    }); 
    res.body.profile = await graphClient.api(`/users/${AADId}`).get();
    // res.body.photo =  await graphClient.api('/me/photo/$value').responseType(ResponseType.BLOB).get();
    // const photoUrl = URL.createObjectURL(res.body.photo);
    // console.log(photoUrl);
    const photoBinary = await graphClient.api(`/users/${AADId}/photos/96x96/$value`).responseType(ResponseType.ARRAYBUFFER).get();
    const buffer = Buffer.from(photoBinary);
    res.body.photo = "data:image/png;base64," + buffer.toString("base64");
    // try {
    //     const teamsfx = new TeamsFx(IdentityType.App);
    //     const graphClient = createMicrosoftGraphClient(teamsfx, ["User.Read"]);
    //     // Initializes MS Graph SDK using our MsGraphAuthProvider
    //     // res.body.profile = await graphClient.api(`/users/${AADId}`).get();
    //     // res.body.photo = await graphClient.api(`/users/${AADId}/photo/$value`).get();
    //     res.body.profile = await graphClient.api(`/me`).get();
    //     res.body.photo = await graphClient.api(`me/photo/$value`).get();
    // } catch (error) {
    //     console.log(error);
    //     res.status = 500;
    //     res.body = {error: "Failed to retrieve user profile from Microsoft Graph. The application may not be authorized."};
    // }
    return res;
}