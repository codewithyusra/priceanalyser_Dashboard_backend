# Project Decisions: AI-Powered Dynamic Pricing Engine

As the owner and lead developer of this project, I made several critical design and architectural choices to ensure we delivered a production-ready, multi-tenant AI system within the 5-day timeline. This document details the "why" behind our implementation.

---

## 1. Which option did you choose and why?
I chose to build the **AI-Powered Dynamic Pricing Engine** (Option B). 

**Rationale**: In the modern e-commerce landscape, "static pricing" is a liability. I wanted to solve a problem where multiple variables—inventory levels, competitor moves, and demand signals—clash. This option allowed me to showcase a sophisticated **Multi-Agent System** where AI doesn't just "chat," but performs structured reasoning to impact a business's bottom line.

---

## 2. Why this tech stack? What alternatives did you consider?
- **Node.js & Express**: I chose this for its non-blocking I/O. Since the agents often wait for LLM responses, Node's concurrency model felt more natural than a synchronous Python setup.
- **MongoDB (Mongoose)**: I considered PostgreSQL, but I opted for MongoDB because AI-generated recommendations often have varying structures (different agents might provide different types of metadata). Mongo's document model allowed us to iterate on our "Rationale" schema without migrating the database every 6 hours.
- **Groq (Llama 3.3)**: I initially looked at OpenAI (GPT-4), but for a pricing engine, **latency is everything**. Groq's sub-second inference speeds allowed me to run 4 agents in sequence and still return a result to the user in under 3 seconds.

---

## 3. How did you approach multi-tenancy?
I implemented a **Shared Database, Shared Schema** pattern using an `organizationId` discriminator.

**Why this pattern?**
- **Speed**: In a 5-day sprint, managing separate databases for each tenant adds significant dev-ops overhead.
- **Isolation**: I ensured security by building a custom Mongoose middleware that automatically appends the `organizationId` to every single query. This means even if a developer forgets to filter by organization in a new route, the database driver enforces it at the root.

---

## 4. How did you design the AI integration?
I moved away from a "Single-Prompt" approach to a **Multi-Agent Specialist Flow**.

**Prompt Engineering Decisions:**
- **Role Specialization**: Instead of asking one LLM to "be an expert," I created separate prompts for the *Market Intelligence Agent*, *Demand Agent*, and *Inventory Agent*.
- **JSON Mode**: I forced all agents to communicate via strict JSON schemas. This eliminated the "I'm sorry, as an AI..." conversational fluff and ensured the backend could parse the data 100% of the time.
- **Context Injection**: I designed the "Strategist" agent to receive the summarized outputs of specialists rather than raw data, reducing token noise and focusing the LLM on the final calculation.

---

## 5. What trade-offs did you make given the 5-day timeline?
1. **Synthetic Data vs. Real Scraping**: I decided to use high-quality synthetic "Mock Scrapers" for competitor prices. Building a robust anti-bot bypass for real-time scraping (like Amazon or eBay) would have taken the entire 5 days alone.
2. **Sequential vs. Parallel Agents**: Currently, agents run one after another. While parallelization would be faster, sequential flow was easier to debug and ensure data consistency during the initial build.
3. **Simple Auth**: I chose JWT-based email/password login over complex SSO (Single Sign-On) to prioritize the core AI logic.

---

## 6. What would you improve with 2 more weeks?
1. **Parallel Orchestration**: I would refactor the Agent Controller to use `Promise.all()` for specialist agents, likely cutting latency by another 50%.
2. **Real-time Competitor Connectors**: I'd integrate with APIs like BrightData or ScrapingBee to pull live market data.
3. **Strategy A/B Testing**: I would allow organizations to run two different "Pricing Personalities" (e.g., "Aggressive Growth" vs. "Margin Protection") and compare their performance in a dashboard.

---

## 7. What was the hardest part and how did you solve it?
The hardest part was **hallucination management** in the Pricing Strategy Agent. Sometimes the agent would suggest prices *below* our COGS (Cost of Goods Sold), which is a business disaster.

**The Solution**: I implemented a **Hard Guardrail Middleware**. After the AI produces a recommendation, a standard Javascript function (non-AI) checks the proposed price against the `cogs` and `marginFloor` defined in the database. If the AI fails the test, the recommendation is automatically flagged for manual review with a "Policy Violation" warning. We combined AI "creativity" with rigid business logic.

---

## 8. Bonus Features Implemented
To demonstrate production-readiness, I implemented several 'Bonus' features:
- **Docker Compose**: One-command setup for the entire stack (Frontend, Backend, MongoDB).
- **CI/CD Pipeline**: Automated GitHub Actions for linting and build checks.
- **Rate Limiting**: Protected the API from abuse using 'express-rate-limit'.
- **Health Checks**: Added a '/health' observability endpoint for monitoring system status.
- **Export Feature**: Built a CSV export tool for pricing recommendations.
- **Keep-Awake Service**: Custom logic to prevent Render's free tier from sleeping.
