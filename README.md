# Context Passport

**Never lose your AI chat context again.**

Context Passport is a Chrome extension that compresses any AI conversation into a structured "passport" — a compact summary you can paste into any new chat to instantly continue where you left off.

---

## The Problem

Every AI tool has a context limit. When it's hit:
- You start a new chat
- The AI remembers nothing
- You waste 10 minutes re-explaining everything

This happens on Claude, ChatGPT, Gemini, Cursor — every tool.

---

## The Solution

Context Passport automatically reads your conversation and generates a structured summary completely locally:

```text
=== CONTEXT PASSPORT ===
PROJECT: Ecommerce App
GOAL: Build a Next.js store with Stripe payments
STACK: next.js, typescript, stripe, postgres
SESSION: #2 | 43 msgs | claude.ai

DONE:
[x] Auth system with JWT
[x] Product listing page
[x] Cart functionality

NEXT:
[ ] Stripe payment integration
[ ] Order confirmation email

DECISIONS:
- Using Postgres over MongoDB for relational data
- Server-side rendering for product pages

LAST: Here's the Stripe webhook handler you need...

CONTINUE: how do i handle failed payments
=== END PASSPORT ===
```

Paste this into any new chat → AI instantly has full context → continue in seconds.

---

## What's New in v8 (Smart Local Engine)

- **Massive Chat Support:** Seamlessly parses up to 200 messages natively. Automatically scales extraction limits dynamically so huge conversations are fully summarized without truncating data.
- **Auto-Detect Project & Goal:** No typing required. The engine intelligently infers your Project Name and Goal directly from your initial chat messages.
- **Hinglish & English Dual Support:** Upgraded offline keyword dictionaries now natively understand conversational Hinglish (e.g., `ho gaya`, `banana hai`, `mast chal raha`, `issue`) alongside English (`done`, `fixed`, `need to`, `resolved`).
- **Resilient AI Web Support:** Employs vastly improved DOM selectors with cascading fallbacks to accurately parse ChatGPT, Claude, and Gemini even if they silently update their interfaces.

---

## Supported Platforms

| Platform | Status |
|---|---|
| Claude (claude.ai) | ✅ |
| ChatGPT (chatgpt.com) | ✅ |
| Gemini (gemini.google.com) | ✅ |
| Cursor | Coming soon |
| Copilot | Coming soon |

---

## Installation

### From ZIP (Developer Mode)

1. Download `context-passport.zip` and extract it
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the extracted `context-passport` folder
6. The extension icon appears in your toolbar

---

## How to Use

1. Open any AI chat and have a conversation
2. Click the **Context Passport** icon in your toolbar
3. Optionally fill in your **Project name** and **Goal** (leave them blank and they will auto-detect!)
4. Click **Generate Passport**
5. Review and edit the detected items in the checklist
6. Click **Claude / ChatGPT / Cursor / Gemini** to copy for your target tool
7. Paste into a new chat — done!

---

## What Gets Extracted

| Field | What it captures |
|---|---|
| **PROJECT** | Auto-inferred project name from chat text |
| **GOAL** | Auto-inferred user objective or task |
| **STACK** | Tech keywords detected in the conversation |
| **DONE** | Tasks the user marked as complete |
| **NEXT** | User's requests, questions, and pending items |
| **DECISIONS** | Architecture and tech choices made |
| **LAST** | Summary of the last AI response |
| **CONTINUE** | The last meaningful thing you asked |

---

## Privacy

- All processing happens **locally in your browser**
- No data is sent to any server
- No API keys required
- No account needed

---

## Files

```text
context-passport/
├── manifest.json       # Extension config (Manifest V3)
├── background.js       # Service worker
├── content.js          # UI scraping and smart payload truncation
├── compress.js         # Local compression engine & auto-detect AI
├── popup.html          # Extension UI
├── popup.js            # UI logic
└── icons/              # Extension icons
```

---

## Roadmap

- [ ] Chrome Web Store listing
- [ ] Cursor + GitHub Copilot support
- [ ] Auto-detect when context limit is near (80% warning)
- [ ] Save passport history per project
- [ ] Team shared context (share passport with teammates)
- [ ] Dedicated desktop app with cross-tool memory sync

---

## The Bigger Vision

Context Passport extension is **Phase 1**.

The end goal is a universal AI memory layer — a dedicated app that maintains shared context across every AI tool you use, automatically, without any copy-pasting. One memory, every tool.

---

## Built With

- Vanilla JavaScript
- Chrome Extension APIs (Manifest V3)
- No external dependencies
- No backend

---

## Contributing

This is an early-stage project. Issues, ideas, and PRs welcome.

---

*Built because losing AI context mid-project is genuinely painful.*
