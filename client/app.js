/* This script is used to send a POST request directly to the GPT-3 API's 
endpoint and display the response on the webpage. */

import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let prompt = null;
let isResponseGenerating = false;

const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.getElementById("toggle-theme-button");
const deleteChatButton = document.getElementById("delete-chat-button");

/**
 * Load the chat history and theme from local storage.
 */
function loadLocalStorageData() {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  const theme = localStorage.getItem("theme");
  const isLightMode = theme === "light" || !theme;

  // Set the theme and chat history
  document.body.classList.toggle("light-theme", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Display the chat history
  chatList.innerHTML = "";
  chatHistory.forEach((chat) => {
    const prompt = chat.userMessage;
    const rawApiResponse =
      chat.apiResponse?.candidates[0].content.parts[0].text;
    const parsedApiResponse = marked.parse(rawApiResponse);

    let outgoingHtml = `
      <div class="message-content">
        <img src="images/user.svg" alt="User Avatar" class="avatar" />
          <p class="text">${prompt}</p>
      </div>
      `;

    const outgoingMessageDiv = createMessageElement(outgoingHtml, "outgoing");
    chatList.appendChild(outgoingMessageDiv);

    let incomingHtml = `
      <div class="message-content">
        <img src="images/gemini.svg" alt="Gemini Avatar" class="avatar" />
        <p class="text"></p>
      </div>
      <span title="Copy to clipboard" class="icon material-symbols-rounded">content_copy</span>
    `;

    const incomingMessageDiv = createMessageElement(incomingHtml, "incoming");
    chatList.appendChild(incomingMessageDiv);

    const textElement = incomingMessageDiv.querySelector(".text");
    textElement.innerHTML = parsedApiResponse;
    hljs.highlightAll();
    addCopyIconToCodeBlocks();
  });

  document.body.classList.toggle("hide-header", chatHistory.length > 0);
  chatList.scrollTo(0, chatList.scrollHeight);
}

// Load the chat history and theme from local storage on page load
loadLocalStorageData();

const promptForm = document.getElementById("prompt-form");

promptForm.addEventListener("submit", (event) => {
  event.preventDefault();
  prompt = document.getElementById("prompt").value.trim();
  handleOutgoingMessage();
});

/**
 *  Handle the outgoing message entered by the user.
 */
function handleOutgoingMessage() {
  if (!prompt || isResponseGenerating) return;

  isResponseGenerating = true;

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
      isResponseGenerating = false;

      // Display an error message
      const incomingMessageDiv = handleIncomingMessage();
      const textElement = incomingMessageDiv.querySelector(".text");
      textElement.innerText =
        `An error occurred while processing the request. Error: ${error.message}`.trim();
      textElement.classList.add("error");
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

  // Send a POST request to the GPT-3 API
  return fetch(API_URL, options)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const rawApiResponse = data?.candidates[0].content.parts[0].text;
      const parsedApiResponse = marked.parse(rawApiResponse);
      const incomingMessageDiv = handleIncomingMessage();
      showTypingEffect(rawApiResponse, incomingMessageDiv, parsedApiResponse);

      // Save the chat history to local storage
      let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
      chatHistory.push({ userMessage: prompt, apiResponse: data });
      localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    })
    .catch((error) => {
      console.error(error);
      isResponseGenerating = false;

      // Display an error message
      const incomingMessageDiv = handleIncomingMessage();
      const textElement = incomingMessageDiv.querySelector(".text");
      textElement.innerText =
        `An error occurred while processing the request. Error: ${error.message}`.trim();
      textElement.classList.add("error");
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
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => {
    copyIcon.innerText = "content_copy";
  }, 1000);
}

/**
 * Add copy icon to code blocks and add language label
 */
function addCopyIconToCodeBlocks() {
  const codeBlocks = document.querySelectorAll("pre");

  codeBlocks.forEach((codeBlock) => {
    // Add language label to code block
    const codeElement = codeBlock.querySelector("code");
    let language =
      [...codeElement.classList]
        .find((cls) => cls.startsWith("language-"))
        ?.replace("language-", "") || "plaintext";
    const languageLabel = document.createElement("div");
    languageLabel.innerText =
      language.charAt(0).toUpperCase() + language.slice(1);
    languageLabel.classList.add("code-language-label");
    codeBlock.appendChild(languageLabel);

    // Add copy icon to code block
    const copyIcon = document.createElement("span");
    copyIcon.className = "icon material-symbols-rounded";
    copyIcon.innerText = "content_copy";
    copyIcon.title = "Copy to clipboard";
    copyIcon.addEventListener("click", () => {
      navigator.clipboard.writeText(codeElement.innerText);
      copyIcon.innerText = "done";
      setTimeout(() => {
        copyIcon.innerText = "content_copy";
      }, 1000);
    });
    codeBlock.appendChild(copyIcon);
  });
}

/**
 * Show typing effect
 * @param {*} response - The response from the GPT-3 API
 * @param {*} incomingMessageDiv - The incoming message div
 */
function showTypingEffect(response, incomingMessageDiv, parsedText) {
  const textElement = incomingMessageDiv.querySelector(".text");
  const copyIcon = incomingMessageDiv.querySelector(".icon");
  copyIcon.classList.add("hide");

  const words = response.split(" ");
  const typingSpeed = 20;
  let currWordIndex = 0;

  // Interval to simulate typing effect
  const interval = setInterval(() => {
    textElement.innerText +=
      (currWordIndex === 0 ? "" : " ") + words[currWordIndex++];
    if (currWordIndex === words.length) {
      clearInterval(interval);
      isResponseGenerating = false;
      textElement.innerHTML = parsedText;
      hljs.highlightAll();
      addCopyIconToCodeBlocks();
      copyIcon.classList.remove("hide");
      return;
    }
  }, typingSpeed);
}

// Event listeners for the suggestions on suggestions list
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    prompt = suggestion.querySelector(".text").innerText;
    handleOutgoingMessage();
  });
});

// Theme toggle functionality
toggleThemeButton.addEventListener("click", () => {
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-theme") ? "dark" : "light"
  );
  const isLightMode = document.body.classList.toggle("light-theme");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Delete chat history functionality
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete the chat history?")) {
    localStorage.removeItem("chatHistory");
    loadLocalStorageData();
    prompt = null;
    isResponseGenerating = false;
  }
});
