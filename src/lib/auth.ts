import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oAuthProxy, role } from "better-auth/plugins";
import { prisma } from "./prisma";
import { envVars } from "../config/env";
import { Role } from "../generated/prisma/enums";
// If your Prisma file is located elsewhere, you can change the path



export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),

    baseURL: envVars.APP_URL,
    trustedOrigins: [envVars.APP_URL],

    //...other options
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false, // Don't require from client
                defaultValue: Role.USER
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    return {
                        data: {
                            ...user,
                            role: Role.USER // Force role to USER ignoring client input!
                        }
                    };
                }
            }
        }
    },


    // account: { skipStateCookieCheck: true }, // solved redirect issue
    advanced: {
        cookies: {
            session_token: {
                name: "session_token", // Force this exact name
                attributes: {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    partitioned: true,
                },
            },
            state: {
                name: "session_token", // Force this exact name
                attributes: {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    partitioned: true,
                },
            },
        },
    },

    plugins: [oAuthProxy()],
}); 