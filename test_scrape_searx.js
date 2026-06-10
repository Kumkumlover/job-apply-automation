async function testSearx() {
  const query = 'site:linkedin.com/in "Zenskar"';
  const url = `https://searx.be/search?q=${encodeURIComponent(query)}&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
        console.error('HTTP', res.status);
        return;
    }
    const data = await res.json();
    console.log(`Found ${data.results.length} results.`);
    console.log(data.results.slice(0, 2));
  } catch (e) {
    console.error(e);
  }
}
testSearx();
