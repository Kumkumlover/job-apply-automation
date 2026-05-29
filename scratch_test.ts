import { validateEmail } from "./lib/pipeline/validate";

async function run() {
  const email = "abhishek.goyal@salaryse.com";
  console.log("Validating:", email);
  try {
    const result = await validateEmail(email);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
