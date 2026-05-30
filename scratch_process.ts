import { enrichAll } from "./lib/email-finder";

async function test() {
  const people = [
    { name: "Abhilasha Jain", company: "IDFC FIRST Bank", domain: "idfcfirstbank.com" },
    { name: "Kishor Sonar", company: "IDFC FIRST Bank", domain: "idfcfirstbank.com" }
  ];

  const results = await enrichAll(people, "c9dff947f42d6e4cc5ffa72f84cc4a545a07e708", "");
  console.log(JSON.stringify(results, null, 2));
}

test();
