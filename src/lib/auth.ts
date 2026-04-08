import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oAuthProxy } from "better-auth/plugins";
import { prisma } from "./prisma";
import { envVars } from "../config/env";
import { Role } from "../generated/prisma/enums";
// If your Prisma file is located elsewhere, you can change the path

export const auth = betterAuth({
    secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),

    // Server issuing sessions (Express). Client may use Next.js rewrite to the same origin.
    baseURL: envVars.BETTER_AUTH_URL,
    trustedOrigins: [
      envVars.FRONTEND_URL,
      envVars.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ],

    //...other options
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
      google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
      },
      facebook: {
        clientId: envVars.FACEBOOK_CLIENT_ID,
        clientSecret: envVars.FACEBOOK_CLIENT_SECRET,
      },
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
    


    plugins: [oAuthProxy()],
}); 