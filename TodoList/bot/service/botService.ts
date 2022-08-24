import { TabResponse } from "botbuilder";

export function createAuthResponse(signInLink) {
    console.log("Create Auth response")
    const res: TabResponse = {
            tab: {
                type: "auth",
                suggestedActions: {
                    actions: [
                        {
                            type: "openUrl",
                            value: signInLink,
                            title: "Sign in to this app"
                        }
                    ]
                }
            }
    };
    return res;
};