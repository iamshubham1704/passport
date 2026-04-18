// content.js v7 - Runs on AI sites

function detectSite() {
  const host = window.location.hostname;
  if (host.includes("claude.ai")) return "claude";
  if (host.includes("chatgpt.com")) return "chatgpt";
  if (host.includes("gemini.google.com")) return "gemini";
  return null;
}

function extractMessages() {
  const site = detectSite();
  const messages = [];

  if (site === "claude") {
    const turns = document.querySelectorAll('[data-testid="human-turn"], [data-testid="assistant-turn"]');
    turns.forEach((el) => {
      const isHuman = el.getAttribute("data-testid") === "human-turn";
      const text = el.innerText.trim();
      if (text.length > 5) {
        messages.push({
          role: isHuman ? "user" : "assistant",
          content: text.substring(0, 1500),
        });
      }
    });

  } else if (site === "chatgpt") {
    const turns = document.querySelectorAll("[data-message-author-role]");
    turns.forEach((el) => {
      const role = el.getAttribute("data-message-author-role");
      // Only accept valid roles — skip anything else
      if (role !== "user" && role !== "assistant") return;
      const text = el.innerText.trim();
      if (text.length > 5) {
        messages.push({ role, content: text.substring(0, 1500) });
      }
    });

  } else if (site === "gemini") {
    // Try multiple possible Gemini selectors
    const userTurns = document.querySelectorAll(".user-query, [data-turn-role='user'], .human-turn");
    const asstTurns = document.querySelectorAll(".model-response, [data-turn-role='model'], .ai-turn");

    // If structured selectors found
    if (userTurns.length > 0 || asstTurns.length > 0) {
      const allTurns = document.querySelectorAll(".conversation-turn, .turn");
      if (allTurns.length > 0) {
        allTurns.forEach(el => {
          const isUser = el.querySelector(".user-query, [data-turn-role='user']");
          const text = el.innerText.trim();
          if (text.length > 5) {
            messages.push({ role: isUser ? "user" : "assistant", content: text.substring(0, 1500) });
          }
        });
      } else {
        userTurns.forEach(el => messages.push({ role: "user", content: el.innerText.trim().substring(0, 1500) }));
        asstTurns.forEach(el => messages.push({ role: "assistant", content: el.innerText.trim().substring(0, 1500) }));
      }
    }
  }

  // Fallback — if nothing found, try generic paragraph extraction
  if (messages.length === 0) {
    const paras = document.querySelectorAll("p");
    paras.forEach((p) => {
      const text = p.innerText.trim();
      if (text.length > 30) {
        messages.push({ role: "unknown", content: text.substring(0, 800) });
      }
    });
  }

  return messages;
}

// Sync to background
function syncMessages() {
  const messages = extractMessages();
  if (messages.length === 0) return;
  chrome.runtime.sendMessage({
    type: "SAVE_MESSAGES",
    site: detectSite(),
    messages,
    url: window.location.href,
    timestamp: Date.now(),
  });
}

// Handle popup request
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_CURRENT_CHAT") {
    const messages = extractMessages();
    sendResponse({ messages, site: detectSite() });
  }
  return true;
});

setTimeout(syncMessages, 2000);
setInterval(syncMessages, 30000);
