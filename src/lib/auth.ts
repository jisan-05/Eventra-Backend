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

    // Server issuing sessions (Express). Client may use Next.js rewrite to the same origin.
    baseURL: envVars.BETTER_AUTH_URL,
    trustedOrigins: [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL],

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
            },
            isDeleted: {
                type: "boolean",
                required: false, // Don't require from client
                defaultValue: false
            },
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