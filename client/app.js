/* This script is used to send a POST request directly to the GPT-3 API's 
endpoint and display the response on the webpage. */

import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Custom renderer for marked.js
const renderer = new marked.Renderer();
renderer.paragraph = (text) => {
  return `<p class="text">${text}</p>`;
};

let promptForm = document.getElementById("prompt-form");

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleOutgoingMessage();
});

/**
 *  Handle the outgoing message entered by the user.
 */
function handleOutgoingMessage() {
  let prompt = document.getElementById("prompt").value.trim();
  let chatList = document.querySelector(".chat-list");
  if (!prompt) return;
  let html = `
      <div class="message-content">
        <img src="images/user.svg" alt="User Avatar" class="avatar" />
          <p class="text">${prompt}</p>
      </div>
  `;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  chatList.appendChild(outgoingMessageDiv);
  promptForm.reset();

  setTimeout(showLoadingAnimation, 500);
  processPrompt(prompt);
}

/**
 * Create a message element and append it to the chat window.
 * @param {*} message - The message to be displayed
 * @param {*} type - The type of message (incoming or outgoing)
 * @param  {...any} classes - Additional classes to be added to the message element
 */
function createMessageElement(html, ...classes) {
  let messageDiv = document.createElement("div");
  messageDiv.classList.add("message", ...classes);
  messageDiv.innerHTML = html;
  return messageDiv;
}

/**
 * Show a loading animation while the response is being fetched.
 */
function showLoadingAnimation() {
  let chatList = document.querySelector(".chat-list");
  let html = `
      <div class="message-content">
        <img src="images/gemini.svg" alt="Gemini Avatar" class="avatar" />
          <p class="text"></p>
          <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
          </div>
      </div>
  `;
  const loadingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(loadingMessageDiv);
}

/**
 * Process the prompt entered by the user.
 * @param {*} prompt - The prompt entered by the user
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

      handlePromptResults(prompt, API_URL);
    })
    .catch((error) => {
      console.error(error);
    });
}

/**
 * Get the response from the GPT-3 API
 * @param {*} prompt - The prompt entered by the user
 * @param {*} API_URL - The URL of the GPT-3 API
 */
function handlePromptResults(prompt, API_URL) {
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
      const apiResponse = data?.candidates[0].content.parts[0].text;
      const textElement = handleIncomingMessage(apiResponse);
      showTypingEffect(apiResponse, textElement);
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      let loadingMessage = document.querySelector(".loading");
      loadingMessage.remove();
    });
}

/**
 * Display the response from the GPT-3 API
 * @param {*} response - The response from the GPT-3 API
 */
function handleIncomingMessage(response) {
  let chatList = document.querySelector(".chat-list");
  let html = `
      <div class="message-content">
        <img src="images/gemini.svg" alt="Gemini Avatar" class="avatar" />
        <p class="text">${response}</p>
      </div>
      <span class="icon material-symbols-rounded">content_copy</span>
  `;
  const incomingMessageDiv = createMessageElement(html, "incoming");
  chatList.appendChild(incomingMessageDiv);

  const textElement = incomingMessageDiv.querySelector(".text");
  return textElement;
}

/**
 * Show typing effect
 * @param {*} response - The response from the GPT-3 API
 * @param {*} textElement - The text element to display the response
 */
function showTypingEffect(response, textElement) {
  const words = response.split(" ");
  const typingSpeed = 100;
  let i = 0;

  const interval = setInterval(() => {
    if (i === words.length) {
      clearInterval(interval);
      return;
    }
    textElement.textContent += " " + words[i];
    i++;
  }, typingSpeed);
}
