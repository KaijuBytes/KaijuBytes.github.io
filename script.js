document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const searchEntry = document.getElementById("searchEntry");
  const results = document.getElementById("results");

  searchButton.addEventListener("click", async () => {
    const user_input = searchEntry.value.trim();
    if (!user_input) {
      results.textContent = "Please enter a search query.";
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8002/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_input })
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