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

### Make it "Work by Itself" 24/7 for FREE (Hugging Face Spaces)
Because Render now requires a credit card even for free tiers, the **absolute best completely free** option (no credit card required) is **Hugging Face Spaces**! 

I have already configured the `Dockerfile` specifically for Hugging Face.

1. Create a free account at **[huggingface.co/join](https://huggingface.co/join)** (No credit card needed).
2. Go to **[huggingface.co/new-space](https://huggingface.co/new-space)**.
3. Fill out the form:
   - **Space name:** `ai-debate-arena`
   - **License:** `mit`
   - **Select the Space SDK:** Choose **Docker** -> **Blank**.
   - **Space Hardware:** Free
   - Click **Create Space**.
4. You will see a setup screen. At the very top right, click **Settings**.
5. Scroll down to **Variables and secrets**. Click **New secret** and add your keys:
   - Name: `GEMINI_API_KEY` | Value: `your_gemini_key_here`
   - Name: `GROQ_API_KEY` | Value: `your_groq_key_here`
6. Go back to the **App** tab. In the setup instructions, you'll see a link to "clone" or upload files.
7. You can simply drag and drop the files from your computer into the Hugging Face files section, or click **"Files"** at the top, click **"Add file"** -> **"Upload files"**, and select all the files from this folder.
8. Commit the changes. The Space will automatically build and launch your Arena forever!

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
