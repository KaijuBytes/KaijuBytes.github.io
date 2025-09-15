document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const searchEntry = document.getElementById("searchEntry");
  const results = document.getElementById("results");

  searchButton.addEventListener("click", async () => {
    const userInput = searchEntry.value.trim();
    if (!userInput) {
      results.textContent = "Please enter a search query.";
      return;
    }

    try {
      const response = await fetch("https://business-lookup-assistant.onrender.com/lookup", { // Corrected URL
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_input: userInput }) // Ensure this matches the pydantic model in main.py
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