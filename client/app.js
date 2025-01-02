/* This script is used to send a POST request directly to the GPT-3 API's 
endpoint and display the response on the webpage. */

import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let promptForm = document.getElementById("prompt-form");
let results = document.getElementById("results");

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  let prompt = document.getElementById("prompt").value;

  processPrompt(prompt);
});

/**
 * Process the prompt entered by the user.
 * @param {*} prompt
 */
function processPrompt(prompt) {
  // Get the API key from the server
  fetch("http://127.0.0.1:3000/api/config")
    .then((response) => response.json())
    .then((data) => {
      const API_KEY = data.API_KEY;
      if (!API_KEY) {
        throw new Error("API key not found");
      }

      // API endpoint
      const baseUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/";
      const modelName = "gemini-1.5-flash:generateContent";
      const API_URL = `${baseUrl}${modelName}?key=${API_KEY}`;

      getPromptResults(prompt, API_URL);
    })
    .catch((error) => {
      console.error(error);
    });
}

/**
 * Get the response from the GPT-3 API
 * @param {*} prompt
 * @param {*} API_URL
 */
function getPromptResults(prompt, API_URL) {
  const data = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  fetch(API_URL, options)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      let responses = data.candidates[0].content.parts;
      responses.forEach((response) => {
        let responseText = marked.parse(response.text);
        results.innerHTML += responseText;
        console.log(response.text);
      });
    })
    .catch((error) => {
      results.innerHTML = error;
      console.log(error);
    });
}
