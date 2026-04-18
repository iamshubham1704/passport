// background.js - Service Worker v6 (no API needed)

chrome.runtime.onInstalled.addListener(() => {
  console.log("Context Passport v6 installed!");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "SAVE_MESSAGES") {
    chrome.storage.local.set({
      lastMessages: msg.messages,
      lastSite: msg.site,
      lastUrl: msg.url,
      lastTimestamp: msg.timestamp
    });
  }
  return true;
});
