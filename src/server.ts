import app from "./app";
import { envVars } from "./config/env";
import { prisma } from "./lib/prisma";

async function main() {
  try {
    await prisma.$connect();
    app.listen(envVars.PORT, () => {
      console.log(`Example app listening on port ${envVars.PORT}`);
    });
  } catch (err) {
    console.log(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
