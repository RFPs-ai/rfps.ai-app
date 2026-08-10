import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function main() {
  const email = "deploy@rfps.ai";
  const password = "Password123!";
  const name = "Deploy User";

  console.log(`Attempting to register user: ${email}...`);

  try {
    const { auth } = await import("../lib/auth");
    const user = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    console.log("Success! User created:", user);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    process.exit(0);
  }
}

main();
