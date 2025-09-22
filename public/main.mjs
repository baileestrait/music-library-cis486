const btn = document.getElementById("fetchBtn");
const out = document.getElementById("output");

btn.addEventListener("click", async () => {
  out.textContent = "Fetching...";
  try {
    const res = await fetch("/hello");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    out.textContent = `Error: ${err.message}`;
  }
});