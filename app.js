async function searchWhip() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  try {
    const response = await fetch(`https://equipment-search-tool.onrender.com/api/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
      <h2>Specs for ${data.model}</h2>
      <p>Weight: ${data.weight}</p>
      <p>Engine: ${data.engine}</p>
      <p>Capacity: ${data.operating_capacity}</p>
    `;
  } catch (error) {
    console.error("Error fetching vehicle data:", error);
  }
}
