// popup.js v3

let passportData = null;

// Save & load API key



const screens = {
  setup: document.getElementById("screen-setup"),
  edit: document.getElementById("screen-edit"),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function setSetupStatus(msg, type = "") {
  const el = document.getElementById("setupStatus");
  el.textContent = msg;
  el.className = "status " + type;
}

function setEditStatus(msg, type = "") {
  const el = document.getElementById("editStatus");
  el.textContent = msg;
  el.className = "status " + type;
}

// ---- Checklist helpers ----

function makeCheckItem(text, checked = true, listId) {
  const wrap = document.createElement("div");
  wrap.className = "check-item";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = checked;

  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "item-text";
  inp.value = text;
  inp.placeholder = "Item...";

  const del = document.createElement("button");
  del.className = "del-btn";
  del.textContent = "×";
  del.onclick = () => wrap.remove();

  wrap.appendChild(cb);
  wrap.appendChild(inp);
  wrap.appendChild(del);
  document.getElementById(listId).appendChild(wrap);
}

function makeDecisionItem(text) {
  const wrap = document.createElement("div");
  wrap.className = "decision-item";

  const dash = document.createElement("span");
  dash.textContent = "–";
  dash.style.cssText = "color:#555;font-size:11px;flex-shrink:0;";

  const inp = document.createElement("input");
  inp.type = "text";
  inp.className = "item-text";
  inp.value = text;
  inp.placeholder = "Decision...";

  const del = document.createElement("button");
  del.className = "del-btn";
  del.textContent = "×";
  del.onclick = () => wrap.remove();

  wrap.appendChild(dash);
  wrap.appendChild(inp);
  wrap.appendChild(del);
  document.getElementById("decisionList").appendChild(wrap);
}

function getCheckItems(listId) {
  const items = [];
  document.getElementById(listId).querySelectorAll(".check-item").forEach(item => {
    const text = item.querySelector(".item-text").value.trim();
    const checked = item.querySelector("input[type=checkbox]").checked;
    if (text) items.push({ text, checked });
  });
  return items;
}

function getDecisionItems() {
  const items = [];
  document.getElementById("decisionList").querySelectorAll(".decision-item").forEach(item => {
    const text = item.querySelector(".item-text").value.trim();
    if (text) items.push(text);
  });
  return items;
}

// ---- Add buttons ----

function setupAddBtn(inputId, btnId, listId, isDone) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);

  const add = () => {
    const val = input.value.trim();
    if (!val) return;
    makeCheckItem(val, isDone, listId);
    input.value = "";
    input.focus();
  };

  btn.onclick = add;
  input.addEventListener("keydown", e => { if (e.key === "Enter") add(); });
}

// ---- Generate ----

document.getElementById("generateBtn").addEventListener("click", async () => {
  const btn = document.getElementById("generateBtn");
  btn.disabled = true;
  btn.textContent = "Reading chat...";
  setSetupStatus("", "");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { type: "GET_CURRENT_CHAT" }, async (response) => {
      btn.disabled = false;
      btn.textContent = "Generate Passport";

      if (chrome.runtime.lastError || !response) {
        setSetupStatus("Not on a supported AI page", "error");
        return;
      }

      if (!response.messages || response.messages.length === 0) {
        setSetupStatus("No messages found — scroll up in chat", "error");
        return;
      }

            const projectName = document.getElementById("projectName").value.trim() || "My Project";
      const goalText = document.getElementById("goalText").value.trim();

      try {
        btn.disabled = true;
        btn.textContent = "Compressing...";
        btn.disabled = true;
        passportData = await compressToPassport(response.messages, projectName, goalText, response.site);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Generate Passport";
        setSetupStatus("Gemini API Error: " + err.message, "error");
        return;
      }

      // Populate edit screen
      document.getElementById("infoRow").innerHTML =
        `<span>${passportData.projectName}</span> &nbsp;·&nbsp; ${passportData.session}<br>
         <span style="color:#7c3aed;">${passportData.goal}</span>`;

      document.getElementById("doneList").innerHTML = "";
      document.getElementById("nextList").innerHTML = "";
      document.getElementById("decisionList").innerHTML = "";

      passportData.done.forEach(d => makeCheckItem(d, true, "doneList"));
      passportData.next.forEach(n => makeCheckItem(n, false, "nextList"));
      passportData.decisions.forEach(d => makeDecisionItem(d));

      document.getElementById("continueText").value = passportData.continueFrom;

      setupAddBtn("doneInput", "doneAddBtn", "doneList", true);
      setupAddBtn("nextInput", "nextAddBtn", "nextList", false);

      document.getElementById("decisionInput").addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const val = document.getElementById("decisionInput").value.trim();
          if (val) { makeDecisionItem(val); document.getElementById("decisionInput").value = ""; }
        }
      });
      document.getElementById("decisionAddBtn").onclick = () => {
        const val = document.getElementById("decisionInput").value.trim();
        if (val) { makeDecisionItem(val); document.getElementById("decisionInput").value = ""; }
      };

      showScreen("edit");
    });
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Generate Passport";
    setSetupStatus("Error: " + err.message, "error");
  }
});

document.getElementById("backBtn").addEventListener("click", () => showScreen("setup"));

// ---- Build final passport from current UI state ----

function buildFinalPassport() {
  const doneItems = getCheckItems("doneList");
  const nextItems = getCheckItems("nextList");
  const decisions = getDecisionItems();
  const continueFrom = document.getElementById("continueText").value.trim();

  const doneList = doneItems.length > 0
    ? doneItems.map(i => `[x] ${i.text}`).join("\n")
    : "[x] add manually";

  const nextList = nextItems.length > 0
    ? nextItems.map(i => `[ ] ${i.text}`).join("\n")
    : "[ ] add manually";

  const decisionList = decisions.length > 0
    ? decisions.map(d => `- ${d}`).join("\n")
    : "- add manually";

  return `=== CONTEXT PASSPORT ===
PROJECT: ${passportData.projectName}
GOAL: ${passportData.goal}
STACK: ${passportData.stack}
SESSION: ${passportData.session}

DONE:
${doneList}

NEXT:
${nextList}

DECISIONS:
${decisionList}

LAST: ${passportData.last}

CONTINUE: ${continueFrom}
=== END PASSPORT ===`;
}

// ---- Copy buttons ----

const toolPrefixes = {
  claude:  "Here is my project context from a previous session. Please continue from here:\n\n",
  chatgpt: "Continue from where we left off. Here is the context from our last session:\n\n",
  cursor:  "// Project context — read before making changes:\n\n",
  gemini:  "Here is context from my previous session. Please continue helping me:\n\n",
};

document.querySelectorAll(".tool-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!passportData) return;
    const tool = btn.dataset.tool;
    const text = (toolPrefixes[tool] || "") + buildFinalPassport();

    navigator.clipboard.writeText(text).then(() => {
      // Auto-inject into the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "INJECT_TEXT", text: text }, (response) => {
            if (chrome.runtime.lastError) {
              console.log("Injection failed or context not available.", chrome.runtime.lastError.message);
            } else if (response && response.success) {
              console.log("Injected successfully!");
            }
          });
        }
      });

      const orig = btn.textContent;
      btn.textContent = "Copied & Injected!";
      btn.classList.add("copied");
      setEditStatus("Pasted into active " + tool + " chat!", "success");
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove("copied");
      }, 2000);
    }).catch(() => setEditStatus("Copy failed", "error"));
  });
});
