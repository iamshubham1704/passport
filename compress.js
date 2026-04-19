// compress.js - Context Passport v8

const TECH_KEYWORDS = [
  "react","next.js","nextjs","python","node","nodejs","express","postgres","postgresql",
  "mongodb","redis","docker","aws","typescript","tailwind","prisma","stripe",
  "firebase","supabase","graphql","fastapi","django","laravel","vue","angular",
  "flutter","swift","kotlin","mysql","sqlite","javascript","chrome","html","css",
  "api","jwt","auth","vite","webpack","vercel","netlify","svelte","nuxt","expo",
  "redux","zustand","trpc","socket","websocket","framer","motion","manifest",
  "gemini","claude","openai","tailwindcss","npm","yarn","pnpm","mui","chakra"
];

const CODE_SIGNALS = [
  "=>", "->", "();", ".then(", ".catch(", "import ", "export ",
  "const ", "let ", "var ", "function ", "return ", "console.",
  "className=", "//", "/*", "*/", "<div", "</", "/>",
  "useState", "useEffect", "npm ", "pip ", "http://", "https://",
  "px;", "rem;", ": #", "border:", "margin:", "padding:"
];

function isCode(text) {
  let hits = 0;
  for (const s of CODE_SIGNALS) {
    if (text.includes(s)) hits++;
    if (hits >= 3) return true;
  }
  return (text.match(/[{}\[\]()=><;`]/g) || []).length >= 8;
}

function clean(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[#*_~]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectStack(text) {
  const found = new Set();
  const lower = text.toLowerCase();
  TECH_KEYWORDS.forEach(t => { if (lower.includes(t)) found.add(t); });
  return [...found].slice(0, 6).join(", ") || "not detected";
}

function detectPlatform(site) {
  return {
    claude: "claude.ai", chatgpt: "chatgpt.com",
    gemini: "gemini.google.com", cursor: "cursor.sh"
  }[site] || site || "unknown";
}

// Split text into clean sentences
function toSentences(text) {
  return clean(text)
    .split(/[.\n!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8 && s.length < 140 && !isCode(s));
}

// DONE — user said something is complete
function extractDone(userMsgs, limit) {
  const results = [];
  const seen = new Set();
  const doneRx = /\b(done|ho gaya|ban gaya|complete(d)?|finished|built|fixed|working now|added|created|implemented|mil gaya|set up|ho gayi|solved|resolved|chal gaya|mast chal raha|perfect)\b/i;

  for (const msg of userMsgs) {
    for (const s of toSentences(msg.content)) {
      if (!doneRx.test(s)) continue;
      // Strip the keyword prefix
      const cleaned = s.replace(/^(done|completed|finished|built|fixed|added|created|implemented|ho gaya|ban gaya)[:\s-]*/i, "").trim();
      const key = cleaned.toLowerCase();
      if (cleaned.length > 5 && !seen.has(key)) {
        seen.add(key);
        results.push(cleaned.substring(0, 100));
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

// NEXT — user requests, questions, intentions
function extractNext(userMsgs, limit) {
  const results = [];
  const seen = new Set();
  const nextRx = /\b(chahiye|banana hai|add karo|fix karo|improve|want to|need to|how to|how do|what should|should i|kaise|batao|help me|can you|please|baaki|abhi|pending|next|karna hai|soch raha|bana do|issue)\b/i;

  for (const msg of userMsgs) {
    for (const s of toSentences(msg.content)) {
      if (!nextRx.test(s) && !s.trim().endsWith("?")) continue;
      const cleaned = s.replace(/^(next[:\s]*|todo[:\s]*|pending[:\s]*)/i, "").trim();
      const key = cleaned.toLowerCase();
      if (cleaned.length > 5 && !seen.has(key)) {
        seen.add(key);
        results.push(cleaned.substring(0, 120));
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

// DECISIONS — scan ALL messages for architecture/tech choices
function extractDecisions(messages, limit) {
  const results = [];
  const seen = new Set();
  const decRx = /\b(we('re| are)? using|using\s+\w+\s+(for|as|to)|decided to use|chose|going with|switched to|instead of|manifest v[23]|architecture is|built (with|on|using)|will use|let's use|finalized)\b/i;

  for (const msg of messages) {
    for (const s of toSentences(msg.content)) {
      if (!decRx.test(s)) continue;
      // Clean heading-like prefixes
      let cleaned = s.replace(/^.*?\b(We are|I chose|We use|Using|Decided|Chose|Going with|Built with|Switched to|Architecture is|Will use|Let's use)/i, "$1").trim();
      cleaned = cleaned.replace(/^[^a-zA-Z]+/, "").trim();
      const key = cleaned.toLowerCase();
      if (cleaned.length > 8 && !seen.has(key)) {
        seen.add(key);
        results.push(cleaned.substring(0, 100));
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

// CONTINUE — last non-code user message
function getLastMeaningfulUser(userMessages) {
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const t = clean(userMessages[i].content);
    if (!isCode(t) && t.length > 8) return t.substring(0, 120);
  }
  return "continue from last point";
}

// GOAL - infer project goal if user left it blank
function inferGoal(userMsgs) {
  const goalRx = /\b(build(ing)?|create|make|help me with|working on|develop(ing)?|goal is to|want to|need to|plan is to|mera goal|bana rahe|socha hai)\b/i;
  for (let i = 0; i < Math.min(6, userMsgs.length); i++) {
    for (const s of toSentences(userMsgs[i].content)) {
      if (goalRx.test(s)) {
        let cleaned = s.replace(/^.*?(build(ing)?|create|make|develop(ing)?|working on|goal is to)\s+/i, "$1 ").trim();
        if (cleaned.length > 10) return cleaned.substring(0, 100);
      }
    }
  }
  return "";
}

// PROJECT NAME - infer project name from text
function inferProjectName(userMsgs) {
  const nameRx = /\b(?:project|app|website|extension|tool) (?:called|named|is|for) ([A-Za-z0-9 ]{3,20})\b/i;
  for (let i = 0; i < Math.min(8, userMsgs.length); i++) {
    const match = userMsgs[i].content.match(nameRx);
    if (match && match[1]) return match[1].trim();
  }
  return "";
}

async function compressToPassport(messages, projectName, goalText, site) {
  const userMsgs = messages.filter(m => m.role === "user");
  const asstMsgs = messages.filter(m => m.role === "assistant");

  let projName = projectName.trim();
  if (!projName || projName === "My Project") {
    projName = inferProjectName(userMsgs) || "My Project";
  }

  let goal = goalText.trim();
  if (!goal) {
    goal = inferGoal(userMsgs);
  }
  goal = goal || "add manually";

  // (userMsgs and asstMsgs already filtered above)
  const allText = messages.map(m => m.content).join("\n");

  const stack = detectStack(allText);
  const sessionNum = Math.ceil(messages.length / 20);
  const platform = detectPlatform(site);

  // Dynamic limits scaling based on chat size
  const limitScale = Math.floor(messages.length / 15);
  const done = extractDone(userMsgs, 5 + limitScale);
  const next = extractNext(userMsgs, 4 + limitScale);
  const decisions = extractDecisions(messages, 3 + limitScale);

  const last = asstMsgs.length > 0
    ? clean(asstMsgs[asstMsgs.length - 1].content).substring(0, 120)
    : "not available";

  const continueFrom = getLastMeaningfulUser(userMsgs);

  return {
    projectName: projName, goal, stack,
    session: `#${sessionNum} | ${messages.length} msgs | ${platform}`,
    done, next, decisions, last, continueFrom
  };
}

function formatPassport(data) {
  const dl = data.done.length > 0 ? data.done.map(d => `[x] ${d}`).join("\n") : "[x] add manually";
  const nl = data.next.length > 0 ? data.next.map(n => `[ ] ${n}`).join("\n") : "[ ] add manually";
  const dcl = data.decisions.length > 0 ? data.decisions.map(d => `- ${d}`).join("\n") : "- add manually";

  return `=== CONTEXT PASSPORT ===
PROJECT: ${data.projectName}
GOAL: ${data.goal}
STACK: ${data.stack}
SESSION: ${data.session}

DONE:
${dl}

NEXT:
${nl}

DECISIONS:
${dcl}

LAST: ${data.last}

CONTINUE: ${data.continueFrom}
=== END PASSPORT ===`;
}
