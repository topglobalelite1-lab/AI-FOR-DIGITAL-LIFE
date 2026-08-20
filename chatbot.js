// Gemini-powered Smart Chatbot Logic
document.addEventListener("DOMContentLoaded", () => {

  // ⚠️ PASTE YOUR GOOGLE GEMINI API KEY HERE ⚠️
  // Example: const apiKey = 'AIzaSyA_abc123...';
  const apiKey = 'AQ.Ab8RN6Ky_PDNZGDef_K5vZ-iL23yTGAKwW75q4jInL4sl1LWvg';

  // Inject HTML into the body
  const chatbotHTML = `
    <div class="chatbot-container">
      <button class="chatbot-toggle" id="chatbotToggle" aria-label="Open Chat">
        💬
      </button>
      <div class="chatbot-window" id="chatbotWindow">
        
        <div class="chatbot-header">
          <h3>AI Assistant</h3>
          <div class="chatbot-header-actions">
            <button class="chatbot-action-btn" id="chatbotClearBtn" aria-label="Clear Chat" title="Clear Chat">
              🗑️
            </button>
            <button class="chatbot-action-btn" id="chatbotClose" aria-label="Close Chat">&times;</button>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbotMessages">
          <div class="chat-msg bot">Hi there! I am a smart AI assistant powered by Gemini. You can ask me anything about this website in any language!</div>
        </div>
        
        <form class="chatbot-input-area" id="chatbotForm">
          <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Type your question..." autocomplete="off" required />
          <button type="submit" class="chatbot-send" id="chatbotSend" aria-label="Send">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);

  const toggleBtn = document.getElementById('chatbotToggle');
  const chatWindow = document.getElementById('chatbotWindow');
  const closeBtn = document.getElementById('chatbotClose');
  const chatForm = document.getElementById('chatbotForm');
  const chatInput = document.getElementById('chatbotInput');
  const sendBtn = document.getElementById('chatbotSend');
  const messagesContainer = document.getElementById('chatbotMessages');
  const clearBtn = document.getElementById('chatbotClearBtn');

  // State
  let chatHistory = []; // Stores the actual conversation for the API
  let websiteContext = "";

  // Initialize
  if (apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
    setTimeout(() => {
      appendMessage("⚠️ The website owner hasn't set up the API key yet. Please edit chatbot.js and paste your Gemini API Key at the top of the file.", 'bot');
    }, 1000);
  }

  // Extract website context silently to feed to the AI
  extractWebsiteContext();

  // Toggle Chat
  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
      chatInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });

  // Clear Chat Logic
  clearBtn.addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    chatHistory = [];
    appendMessage("Chat cleared! How can I help you?", 'bot');
  });

  // Form Submit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    if (apiKey === 'YOUR_API_KEY_HERE' || apiKey === '') {
      appendMessage("⚠️ API key is missing. Please edit chatbot.js and add your API key at the top.", 'bot');
      return;
    }

    // Add user message to UI
    appendMessage(userMsg, 'user');
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
      const responseText = await fetchGeminiResponse(userMsg);
      removeTypingIndicator(typingId);
      appendMessage(responseText, 'bot', true);
    } catch (error) {
      removeTypingIndicator(typingId);
      console.error("Chatbot API Error:", error);
      appendMessage("Oops! Error: " + error.message + " (Check if your API key is correct!)", 'bot');
    } finally {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

  function extractWebsiteContext() {
    const title = document.title;
    const descMeta = document.querySelector('meta[name="description"]');
    const desc = descMeta ? descMeta.content : '';

    // Grab all readable text, limiting to a reasonable amount to save tokens
    const textContent = document.body.innerText.replace(/\s+/g, ' ').substring(0, 5000);

    websiteContext = `You are a helpful, smart AI assistant placed on this website. Answer user questions based on the following context about this website. You can answer in any language the user speaks. If asked to write a paragraph about the website, do so creatively and professionally. \n\nWebsite Title: ${title}\nDescription: ${desc}\nPage Content: ${textContent}\n\nBe concise, friendly, and helpful.`;
  }

  async function fetchGeminiResponse(userText) {
    // Add user message to history
    chatHistory.push({
      "role": "user",
      "parts": [{ "text": userText }]
    });

    const requestBody = {
      "systemInstruction": {
        "parts": [{ "text": websiteContext }]
      },
      "contents": chatHistory,
      "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 800,
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error Details:", errorData);
      throw new Error(errorData.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    let botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // Add bot response to history
    chatHistory.push({
      "role": "model",
      "parts": [{ "text": botText }]
    });

    return botText;
  }

  function appendMessage(text, sender, parseMarkdown = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender);

    if (parseMarkdown) {
      // Basic markdown parsing for bold and line breaks
      let parsed = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      msgDiv.innerHTML = parsed;
    } else {
      msgDiv.textContent = text;
    }

    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('chat-typing');
    typingDiv.id = id;
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    const typingDiv = document.getElementById(id);
    if (typingDiv) {
      typingDiv.remove();
    }
  }
});
