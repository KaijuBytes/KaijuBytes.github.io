document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const searchEntry = document.getElementById("searchEntry");
  const results = document.getElementById("results");

  searchButton.addEventListener("click", async () => {
    const query = searchEntry.value.trim();
    if (!query) {
      results.textContent = "Please enter a search query.";
      return;
    }

    try {
      const response = await fetch("https://business-lookup-assistant.onrender.com/api/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error("Server error: " + response.status);
      }

      const data = await response.json();
      results.textContent = data.message;
    } catch (error) {
      results.textContent = "Error: " + error.message;
    }
  });
});