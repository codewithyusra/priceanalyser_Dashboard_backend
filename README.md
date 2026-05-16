# AI-Powered Dynamic Pricing Backend

An intelligent, multi-agent pricing engine designed to analyze market trends, competitor data, and inventory levels to provide real-time, high-confidence pricing recommendations for e-commerce platforms.

## 🚀 The Chosen Solution: Multi-Agent Dynamic Pricing
I chose to implement a **Multi-Agent Orchestration Architecture** because pricing is a multi-dimensional problem. A single LLM prompt often fails to account for the nuances of inventory cost, demand elasticity, and aggressive competitor shifts. 

By splitting responsibilities into specialized agents (Market Intelligence, Demand, Inventory, and Strategy), the system achieves:
- **Higher Accuracy**: Each agent focuses on a specific data domain.
- **Better Explainability**: The "Rationale" provided to the user is a synthesis of expert outputs.
- **Scalability**: New data sources (like seasonal trends or shipping costs) can be added as new agents without refactoring the entire engine.

---

## 🛠️ Tech Stack & Rationale

| Technology | Role | Rationale |
| :--- | :--- | :--- |
| **Node.js & Express** | Runtime & API | Lightweight, asynchronous, and handles concurrent agent requests efficiently. |
| **MongoDB & Mongoose** | Database | Flexible schema for diverse product categories and unstructured AI audit logs. |
| **Groq (Llama 3.3)** | LLM Engine | Chosen for sub-second inference speeds (critical for real-time pricing) and high context window. |
| **JWT & Bcrypt** | Security | Robust multi-tenant authentication and password hashing. |
| **SendGrid** | Notifications | Industry-standard reliability for automated pricing alerts. |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Groq API Key

### Installation

1. **Navigate to the server directory:**
   ```bash
   cd code/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the `server` root (copy from `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   SENDGRID_API_KEY=your_sendgrid_key
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   The API will be live at `http://localhost:5000`.

---

## 📸 Application Preview (Screenshots)

> [!NOTE]
> Screenshots below represent the integrated frontend interacting with this backend.

1. **AI Strategy Dashboard**: Overview of all SKUs and their current market standing.
2. **Agent Reasoning View**: Detailed breakdown of how the Market, Demand, and Inventory agents reached a conclusion.
3. **Product Inventory Management**: Real-time stock levels and COGS tracking.
4. **Pricing Recommendations**: A list of "Pending" price changes waiting for human approval.
5. **Audit Logs**: Full history of who changed what price and why.
6. **Multi-Tenant Settings**: Organization-level configuration for margin floors and strategy aggressiveness.

---

## 🚧 Known Limitations & Future Roadmap

- **Mocked Scrapers**: Currently uses synthetic data for competitor prices. Integration with real-time web scrapers or APIs (e.g., BrightData) is planned.
- **Cold Starts**: Initial LLM reasoning can take 1-2 seconds; implementing a caching layer for static market data would improve UI responsiveness.
- **Sequential Flow**: Agents currently run in sequence. Moving to a parallel execution model would reduce latency by 40%.
- **Human-in-the-loop**: High-risk price changes (>20% shift) currently require manual approval; automated guardrails are in development.
