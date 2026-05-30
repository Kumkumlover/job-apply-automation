import { validateEmail } from "./lib/pipeline/validate";

async function test() {
  const dom1 = await validateEmail("sahil.gupta@idfcfirst.com");
  console.log("idfcfirst.com:", dom1);

  const dom2 = await validateEmail("sahil.gupta@idfcfirstbank.com");
  console.log("idfcfirstbank.com:", dom2);
}

test().catch(console.error);
