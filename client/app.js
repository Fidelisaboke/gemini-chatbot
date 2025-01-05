/* This script is used to send a POST request directly to the GPT-3 API's 
endpoint and display the response on the webpage. */

import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";


const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.getElementById("toggle-theme-button");
const deleteChatButton = document.getElementById("delete-chat-button");

/**
 * Load the chat history and theme from local storage.
 */
function loadLocalStorageData() {
  const chatHistory = localStorage.getItem("chatHistory");
  const theme = localStorage.getItem("theme");
  const isLightMode = theme === "light" || !theme;

  // Set the theme and chat history
  document.body.classList.toggle("light-theme", isLightMode);
  toggleThemeButton.textContent = isLightMode ? "dark_mode" : "light_mode";
  chatList.innerHTML = chatHistory || "";

  document.body.classList.toggle("hide-header", chatHistory);
  chatList.scrollTo(0, chatList.scrollHeight);
}

loadLocalStorageData();

const promptForm = document.getElementById("prompt-form");

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleOutgoingMessage();
});

/**
 *  Handle the outgoing message entered by the user.
 */
function handleOutgoingMessage() {
  let prompt = document.getElementById("prompt").value.trim();
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

  chatList.scrollTo(0, chatList.scrollHeight);
  document.body.classList.add("hide-header");

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

      return handlePromptResults(prompt, API_URL);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      let loadingMessage = document.querySelector(".loading");
      loadingMessage.remove();
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

  return fetch(API_URL, options)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const apiResponse = data?.candidates[0].content.parts[0].text;
      const incomingMessageDiv = handleIncomingMessage();
      showTypingEffect(apiResponse, incomingMessageDiv);
    })
    .catch((error) => {
      console.log(error);
    });
}

/**
 * Display the response from the GPT-3 API
 * @param {*} response - The response from the GPT-3 API
 */
function handleIncomingMessage() {
  let html = `
      <div class="message-content">
        <img src="images/gemini.svg" alt="Gemini Avatar" class="avatar" />
        <p class="text"></p>
      </div>
      <span title="Copy to clipboard" class="icon material-symbols-rounded">content_copy</span>
  `;
  const incomingMessageDiv = createMessageElement(html, "incoming");
  chatList.appendChild(incomingMessageDiv);

  // Event listener for the copy icon
  const copyIcon = incomingMessageDiv.querySelector(".icon");
  copyIcon.addEventListener("click", () => {
    copyToClipboard(copyIcon);
  });

  return incomingMessageDiv;
}

/**
 * Copy the response to the clipboard
 * @param {*} copyIcon
 */
function copyToClipboard(copyIcon) {
  const messageText = copyIcon.parentElement.querySelector(".text").textContent;
  navigator.clipboard.writeText(messageText);
  copyIcon.textContent = "done";
  setTimeout(() => {
    copyIcon.textContent = "content_copy";
  }, 1000);
}

/**
 * Show typing effect
 * @param {*} response - The response from the GPT-3 API
 * @param {*} incomingMessageDiv - The incoming message div
 */
function showTypingEffect(response, incomingMessageDiv) {
  const textElement = incomingMessageDiv.querySelector(".text");
  const copyIcon = incomingMessageDiv.querySelector(".icon");
  const words = response.split(" ");
  const typingSpeed = 20;
  let i = 0;

  const interval = setInterval(() => {
    if (i === words.length) {
      clearInterval(interval);
      copyIcon.classList.remove("hide");
      localStorage.setItem("chatHistory", chatList.innerHTML);
      return;
    }

    textElement.textContent += " " + words[i];
    i++;
    copyIcon.classList.add("hide");

  }, typingSpeed);
}

// Theme toggle functionality
toggleThemeButton.addEventListener("click", () => {
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-theme") ? "dark" : "light"
  );
  const isLightMode = document.body.classList.toggle("light-theme");
  toggleThemeButton.textContent = isLightMode ? "dark_mode" : "light_mode";
});

// Delete chat history functionality
deleteChatButton.addEventListener("click", () => {
  if(confirm("Are you sure you want to delete the chat history?")) {
    localStorage.removeItem("chatHistory");
    loadLocalStorageData();
  }
});
