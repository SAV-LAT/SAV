async function test() {
  try {
    const res = await fetch('https://api.github.com/zen');
    const text = await res.text();
    console.log('GitHub API test:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}
test();
