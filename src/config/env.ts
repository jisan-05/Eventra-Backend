import dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });

interface EnvConfig {
  NODE_ENV: string;
  FRONTEND_URL:string;
  PORT: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET:string,
  BETTER_AUTH_URL:string,
  STRIPE_SECRET_KEY:string,
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FACEBOOK_CLIENT_ID: string;
  FACEBOOK_CLIENT_SECRET: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requireEnvVariable = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "FRONTEND_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "STRIPE_SECRET_KEY",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "FACEBOOK_CLIENT_ID",
    "FACEBOOK_CLIENT_SECRET",
  ];

  requireEnvVariable.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(`Environment variable ${variable} is required but not set in .env file`);
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    FRONTEND_URL:process.env.FRONTEND_URL as string,
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_SECRET:process.env.BETTER_AUTH_SECRET as string,
    BETTER_AUTH_URL:process.env.BETTER_AUTH_URL as string,
    STRIPE_SECRET_KEY:process.env.STRIPE_SECRET_KEY as string,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID as string,
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET as string,
  };
};

export const envVars = loadEnvVariables();
