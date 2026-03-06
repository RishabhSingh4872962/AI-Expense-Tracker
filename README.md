# AI Expense Tracker

A full-stack expense tracking app that uses AI to parse natural language input like *"spent 850 on lunch at Taj"* into structured expense data — automatically.

Built by: **Rishabh Singh**
GitHub: https://github.com/RishabhSingh4872962/AI-Expense-Tracker
Time to build: **2.3 hours** (with AI assistance)

---

## 🎥 Demo

[Link to your screen recording]
https://www.loom.com/share/dd2b203d252448baafaba4d2c2ef7c28

---

## 🛠️ Tech Stack

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Mobile   | React Native, Expo (Bare Workflow), TypeScript |
| Backend  | Node.js, Express, TypeScript                   |
| Database | SQLite                                         |
| AI       | Groq / OpenAI / Gemini API                     |

---

## 🚀 Setup Instructions

### Prerequisites

* Node.js 18+
* npm or yarn
* Expo CLI (`npm install -g expo-cli`)
* AI Service API key

---

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your AI API key to .env
npm run dev
# Server runs on http://localhost:3000
```

---

### Mobile

```bash
cd mobile
npm install
# Set your machine's LAN IP in src/config/api.ts
npm start
# Scan QR code with Expo Go, or run on emulator
```

> ⚠️ Use your machine's **local Wi-Fi IP** (e.g. `192.168.x.x`) in `src/config/api.ts` — not `localhost` — when running on a physical device.

---

## 📁 Project Structure

```
AI-Expense-Tracker/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server entry point
│   │   ├── routes/
│   │   │   └── expenses.ts   # POST /api/expenses, GET, DELETE
│   │   ├── services/
│   │   │   └── aiParser.ts   # Natural language → structured expense
│   │   └── db/
│   │       └── database.ts   # SQLite setup & queries
│   └── .env.example
└── mobile/
    ├── App.tsx                # Navigation setup (Bottom Tabs)
    └── src/
        ├── config/api.ts      # Base URL config
        ├── types/index.ts     # Expense type definitions
        ├── constants/index.ts # Colors, categories, icons
        ├── api/expenses.ts    # API call functions
        └── screens/
            ├── HomeScreen.tsx         # Dashboard with summary cards
            ├── AddExpenseScreen.tsx   # Smart NL + Manual form
            ├── ExpenseListScreen.tsx  # Filterable expense list
            └── AnalyticsScreen.tsx    # Charts & category breakdown
```

---

## 🤖 AI Prompt Design

**System Prompt Used:**

```
You are an expense parser. Extract structured data from natural language expense descriptions.
Always return valid JSON with: amount (number), currency (string, default "INR"),
category (one of: Food & Dining, Transport, Shopping, Entertainment, Health,
Bills & Utilities, Other), description (string), merchant (string).
Never include explanation — return only the JSON object.
```

### Why This Approach

* Constraining the model to return raw JSON with a fixed category enum eliminates hallucinated categories.
* Enforcing strict structure makes parsing deterministic.
* Defaulting to INR avoids extra prompt round-trips for Indian users.

---

## ⏱️ Time Breakdown

| Task               | Time           |
| ------------------ | -------------- |
| Project setup      | 10 min         |
| Backend + DB       | 35 min         |
| AI integration     | 20 min         |
| API testing (curl) | 10 min         |
| Mobile app         | 50 min         |
| Testing & polish   | 15 min         |
| **Total**          | **~2.3 hours** |

---

## 🔮 What I'd Add With More Time

* [ ] Voice input for hands-free expense logging
* [ ] Monthly budget limits with overspend alerts
* [ ] Export expenses to CSV / PDF
* [ ] Multi-currency support with live conversion
* [ ] Receipt photo scanning via OCR
* [ ] Recurring expense detection

---

## 📝 AI Tools Used

* **Claude (Anthropic):** Backend architecture, API design, React Native screen code, debugging
* **Groq / OpenAI / Gemini:** Natural language expense parsing at runtime

Most helpful prompt:

> "Parse this expense description and return only a JSON object with amount, currency, category, description, and merchant fields."

---

## 📜 License

MIT — Feel free to use this for your own projects.


