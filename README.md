<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/WebSocket-Real--time-010101?style=for-the-badge&logo=socketdotio" alt="WebSocket" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/Groq-LLaMA-FF6F00?style=for-the-badge" alt="Groq" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" />
</p>

<h1 align="center">⚔️ AI Debate Arena</h1>

<p align="center">
  <strong>Two AIs Enter. One Wins. You Judge.</strong><br/>
  <em>A real-time multi-agent AI debate platform with live scoring and adaptive intelligence</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#setup">Setup</a> •
  <a href="#scientific-foundation">Science</a>
</p>

---

> **📌 Project Status:** This app runs fully locally with `npm run dev`. You need at least **one AI API key** (all are free tier) to start debates — see the [API Keys](#-api-keys-all-free) table below. The multi-provider fallback system means any single key is enough to get started.

---

## ✨ Features

- **Dual AI Agents** — PRO and CON agents with memory of all previous rounds
- **Real-Time Streaming** — Arguments appear word-by-word via WebSocket
- **Adaptive Intelligence** — Losing AI changes strategy based on audience votes
- **Scoring Engine** — Logic, Evidence, and Rhetoric scored 0-100 by AI Judge
- **Fallacy Detection** — Ad Hominem, Strawman, False Equivalence, and 7 more
- **Audience Voting** — Live voting shifts AI behavior dynamically
- **Bilingual** — Full Arabic (Egyptian) + English support
- **Multi-API Fallback** — Gemini → Groq → GitHub Models → NVIDIA NIM
- **Dark/Light Theme** — Premium glassmorphism design
- **Debate History** — SQLite persistence, all debates saved

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS, CSS3 (custom properties, grid, animations) |
| **Backend** | Node.js, Express.js |
| **Real-time** | WebSocket (ws) |
| **Database** | SQLite (sql.js) |
| **AI Primary** | Google Gemini API |
| **AI Fast** | Groq (Llama 3.3 70B) |
| **AI Fallback** | GitHub Models, NVIDIA NIM |
| **Security** | express-rate-limit, .env, server-side API proxy |

---

## 🚀 Setup

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/khaledwho0-ops/ai-debate-arena.git
cd ai-debate-arena

# 2. Install dependencies
npm install

# 3. Add your API keys to .env
cp .env.example .env
# Edit .env with your keys

# 4. Start the server
npm run dev

# 5. Open http://localhost:3000
```

### 🔑 API Keys (All Free)

| Provider | Get Key | Used For |
|----------|---------|----------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com/apikey) | Primary AI engine |
| Groq | [console.groq.com](https://console.groq.com/keys) | Fast streaming |
| GitHub Models | [github.com/marketplace/models](https://github.com/marketplace/models) | Fallback |
| NVIDIA NIM | [build.nvidia.com](https://build.nvidia.com/) | Fallback |

### Deploy to Hugging Face Spaces (Free, 24/7)

1. Create a free account at [huggingface.co/join](https://huggingface.co/join)
2. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
3. Choose **Docker → Blank**, name it `ai-debate-arena`
4. Add your API keys as **secrets** in Settings
5. Upload all files — it auto-builds and runs forever!

---

## 🔬 Scientific Foundation

- **Toulmin Model** — Claim → Data → Warrant argument structure
- **Cialdini's 6 Principles** — Rhetoric scoring framework
- **Game Theory** — Adaptive adversarial dynamics
- **Informal Logic (Copi)** — 10-type fallacy detection taxonomy
- **NLP Sentiment Analysis** — Audience voting pattern analysis

---

## 📁 Project Structure

```
ai-debate-arena/
├── server/
│   ├── index.js              # Express + WebSocket server
│   ├── db.js                 # SQLite database layer
│   ├── routes/debates.js     # REST API routes
│   └── services/
│       ├── ai-provider.js    # Multi-API fallback system
│       ├── debate-engine.js  # State machine + logic
│       └── prompts.js        # AI system prompts
├── public/
│   ├── index.html            # SPA entry point
│   ├── css/styles.css        # Design system
│   └── js/app.js             # Frontend application
├── data/debates.db           # SQLite (auto-created)
├── Dockerfile                # Hugging Face Spaces deployment
└── render.yaml               # Render deployment config
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next Round |
| `P` | Vote PRO |
| `C` | Vote CON |
| `Enter` | Start Debate |

---

<p align="center">
  Built with ❤️ by <strong>Khalid Sayed</strong>
</p>
