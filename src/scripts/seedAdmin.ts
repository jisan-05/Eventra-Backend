import { envVars } from "../config/env";
import { Role } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

async function seedAdmin() {
  try {
    const adminData = {
      name: "admin",
      email: "admin@gmail.com",
      role: Role.ADMIN,
      password: "12345678"
    };
    // check user exist on db or not
    const existingUser = await prisma.user.findUnique({
      where: {
        email: adminData.email,
      },
    });

    if (existingUser) {
      throw new Error("User already exists !");
    }

    const signUpAdmin = await fetch(
      "http://localhost:5000/api/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": envVars.FRONTEND_URL,
        },
        body: JSON.stringify(adminData),
      },
    );

    if(signUpAdmin.status === 200){
      await prisma.user.update({
        where:{
          email:adminData.email
        },
        data:{
          emailVerified:true
        }
      })
      console.log("Admin user created and verified successfully!");
    } else {
      const errorText = await signUpAdmin.text();
      console.error(`Failed to create admin. Status: ${signUpAdmin.status}. Response: ${errorText}`);
    }

  } catch (error) {
    console.log(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
