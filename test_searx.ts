async function testSearx() {
  const query = 'site:linkedin.com/in "SalarySe" ("product manager" OR "platform" OR "cards" OR "human resources")';
  const url = `https://searx.be/search?q=${encodeURIComponent(query)}&format=json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data.results, null, 2));
  } catch (e) {
    console.error(e);
  }
}
testSearx();
