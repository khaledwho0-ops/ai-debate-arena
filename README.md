# ⚔️ AI Debate Arena

> **Two AIs Enter. One Wins. You Judge.**

A real-time multi-agent AI debate platform where two AI agents argue opposing sides of any topic, with live scoring, fallacy detection, and audience voting.

## 🚀 Features

- **Dual AI Agents** — PRO and CON agents with memory of all previous rounds
- **Real-Time Streaming** — Arguments appear word-by-word via WebSocket
- **Adaptive Intelligence** — Losing AI changes strategy based on audience votes
- **Scoring Engine** — Logic, Evidence, and Rhetoric scored 0-100 by AI Judge
- **Fallacy Detection** — Ad Hominem, Strawman, False Equivalence, and 7 more
- **Audience Voting** — Live voting shifts AI behavior
- **Bilingual** — Full Arabic (Egyptian) + English support
- **Multi-API Fallback** — Gemini → Groq → GitHub Models → NVIDIA NIM
- **Dark/Light Theme** — Premium glassmorphism design
- **Debate History** — SQLite persistence, all debates saved

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, CSS3 (custom properties, grid, animations) |
| Backend | Node.js, Express.js |
| Real-time | WebSocket (ws) |
| Database | SQLite (sql.js) |
| AI Primary | Google Gemini API |
| AI Fast | Groq (Llama 3.3 70B) |
| AI Fallback | GitHub Models, NVIDIA NIM |
| Security | express-rate-limit, .env, server-side API proxy |

## 📦 Setup & Deployment

### Option A: Make it "Work by Itself" 24/7 (Cloud Deployment)
Since the code is on your GitHub, the absolute easiest way to make it run permanently by itself in the cloud (for free) is to use Render.

1. Go to **[Render.com Dashboard](https://dashboard.render.com/)** and sign in with GitHub.
2. Click the **"New +"** button in the top right and select **"Web Service"**.
3. Select **"Build and deploy from a Git repository"** and choose your `ai-debate-arena` repository.
4. Fill in the deployment settings:
   - **Name:** ai-debate-arena
   - **Language:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Select the **Free** tier.
5. Expand **"Advanced"** and click **"Add Environment Variable"**. Add your keys:
   - Key: `GEMINI_API_KEY` | Value: `your_gemini_key_here`
   - Key: `GROQ_API_KEY` | Value: `your_groq_key_here`
6. Click **Create Web Service**. 
*Your app will now run 24/7 by itself without needing your computer on!*

### Option B: Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Add your API keys to .env
cp .env.example .env
# Edit .env with your keys

# 3. Start the server
npm run dev

# 4. Open http://localhost:3000
```

## 🔑 API Keys (All Free)

| Provider | Get Key | Used For |
|----------|---------|----------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com/apikey) | Primary AI engine |
| Groq | [console.groq.com](https://console.groq.com/keys) | Fast streaming |
| GitHub Models | [github.com/marketplace/models](https://github.com/marketplace/models) | Fallback |
| NVIDIA NIM | [build.nvidia.com](https://build.nvidia.com/) | Fallback |

## 🔬 Scientific Foundation

- **Toulmin Model** — Claim → Data → Warrant argument structure
- **Cialdini's 6 Principles** — Rhetoric scoring framework
- **Game Theory** — Adaptive adversarial dynamics
- **Informal Logic (Copi)** — 10-type fallacy detection taxonomy
- **NLP Sentiment Analysis** — Audience voting pattern analysis

## 🇪🇬 Egyptian Use Cases

- Arabic debate mode with Egyptian dialect support
- Islamic jurisprudence (فقه) discussions
- Egyptian law and business debate topics
- Egyptian political and historical perspective battles

## 📁 Project Structure

```
ai-debate-arena/
├── package.json
├── .env                          # API keys (not committed)
├── server/
│   ├── index.js                  # Express + WebSocket server
│   ├── db.js                     # SQLite database layer
│   ├── routes/
│   │   └── debates.js            # REST API routes
│   └── services/
│       ├── ai-provider.js        # Multi-API fallback system
│       ├── debate-engine.js      # State machine + logic
│       └── prompts.js            # AI system prompts
├── public/
│   ├── index.html                # SPA entry point
│   ├── css/
│   │   └── styles.css            # Design system
│   └── js/
│       └── app.js                # Frontend application
└── data/
    └── debates.db                # SQLite database (auto-created)
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Next Round |
| `P` | Vote PRO |
| `C` | Vote CON |
| `Enter` | Start Debate (when in topic input) |

---

Built with ❤️ for the 10-Hour Emergency Project Challenge
