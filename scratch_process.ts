import { enrichAll } from "./lib/email-finder";

async function test() {
  const people = [
    { name: "John Doe", company: "A Completely Fake Company LLC", domain: "completelyfake12345.com" },
    { name: "Jane Smith", company: "A Completely Fake Company LLC", domain: "completelyfake12345.com" }
  ];

  // We pass an empty hunter key so it fails or we pass a fake domain so it fails.
  const results = await enrichAll(people, "fakekey", "");
  console.log(JSON.stringify(results, null, 2));
}

test();
