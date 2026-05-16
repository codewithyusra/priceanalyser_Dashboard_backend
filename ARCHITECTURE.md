# System Architecture: AI-Powered Dynamic Pricing Engine

This document outlines the technical architecture, data flow, and design patterns used in the AI-Powered Dynamic Pricing Engine.

## 1. System Architecture Diagram
The system follows a modern decoupled architecture with a focus on security, scalability, and AI orchestration.

```mermaid
graph TD
    subgraph Client Layer
        UI[Next.js Frontend]
    end

    subgraph API Layer
        GW[Express.js API Gateway]
        Auth[JWT & RBAC Middleware]
        Tenant[Tenant Isolation Middleware]
    end

    subgraph AI Intelligence Layer
        AgentBase[BaseAgent Class]
        Groq[Groq Llama 3.3 Engine]
        
        subgraph Multi-Agent System
            MIA[Market Intelligence Agent]
            DFA[Demand Forecasting Agent]
            ICA[Inventory Agent]
            PSA[Pricing Strategy Agent]
        end
    end

    subgraph Data Layer
        DB[(MongoDB Atlas)]
        SGrid[SendGrid Mailer]
    end

    UI <--> Auth
    Auth --> Tenant
    Tenant --> GW
    GW <--> DB
    GW --> MIA
    MIA --> PSA
    DFA --> PSA
    ICA --> PSA
    PSA <--> Groq
    PSA --> SGrid
```

---

## 2. Data Flow Diagram
Tracing a user's request from input to persistent output.

```mermaid
sequenceDiagram
    participant User as User (UI)
    participant API as Express API
    participant Mid as Auth/Tenant Middleware
    participant Agent as Pricing Agents (Groq)
    participant DB as MongoDB

    User->>API: POST /api/pricing/generate/:id
    API->>Mid: Validate JWT & Extract org_id
    Mid-->>API: organizationId: "65b..."
    API->>DB: Fetch Product details (filtered by org_id)
    DB-->>API: Product { SKU, COGS, Stock }
    API->>Agent: Trigger Orchestration (SKU Data)
    Agent->>Agent: Market + Demand + Inventory Analysis
    Agent->>API: Structured JSON Recommendation
    API->>DB: Save Recommendation & Audit Log
    DB-->>API: Success
    API-->>User: Rendered Recommendation (UI)
```

---

## 3. Database Schema (ER Diagram)
The system uses a document-oriented model optimized for multi-tenancy.

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : "manages"
    ORGANIZATION ||--o{ PRODUCT : "owns"
    ORGANIZATION ||--o{ RECOMMENDATION : "generates"
    PRODUCT ||--o{ RECOMMENDATION : "receives"
    RECOMMENDATION ||--o{ AUDIT_LOG : "tracks"

    ORGANIZATION {
        ObjectId id
        String name
        Date createdAt
    }

    USER {
        ObjectId id
        String email
        String password
        String role "Admin | Pricing Analyst"
        ObjectId organizationId
    }

    PRODUCT {
        ObjectId id
        String sku
        String name
        Number currentPrice
        Number cogs
        Number stockLevel
        ObjectId organizationId
    }

    RECOMMENDATION {
        ObjectId id
        Number proposedPrice
        Number confidence
        String rationale
        String status "PENDING | APPROVED | REJECTED"
        ObjectId productId
        ObjectId organizationId
    }

    AUDIT_LOG {
        ObjectId id
        String action
        String details
        ObjectId userId
        ObjectId organizationId
    }
```

---

## 4. AI Orchestration Flow (Option B: Multi-Agent)
The orchestration is handled through a sequential agentic flow where a "Strategist" synthesizes inputs from specialized "Specialists".

1.  **Context Assembly**: The `PricingStrategyAgent` gathers raw data from the `MarketIntelligenceAgent` (competitors) and `InventoryAgent` (stock levels).
2.  **Specialist Prompts**: Each specialist agent generates a domain-specific analysis using the Groq Llama 3.3 engine.
3.  **Synthesis**: The strategy agent receives these outputs and performs a "Chain of Thought" reasoning to calculate the final `proposedPrice`.
4.  **Structured Output**: The LLM uses **JSON Mode** to return a schema-validated object containing `price`, `confidence`, and `rationale`.

---

## 5. Multi-Tenant Data Flow (Security Boundaries)
Tenant isolation is enforced at the middleware layer, ensuring no cross-organization data leakage.

```mermaid
graph LR
    Req[Incoming Request] --> Auth[Auth Middleware]
    Auth --> |Extract orgId from JWT| Tenant[Tenant Isolation]
    Tenant --> |Inject orgId into req.user| Query[Mongoose Query]
    Query --> |find organizationId: req.user.orgId| DB[(Shared Database)]
    DB --> |Filtered Results| Resp[Response]
```

---

## 6. API Design
Key endpoints for the pricing engine and user management.

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | POST | None | Registers a new User and Organization. |
| `/api/auth/login` | POST | None | Authenticates user and returns JWT. |
| `/api/products` | GET | User | Fetches all products for the current tenant. |
| `/api/products` | POST | Admin | Adds a new SKU to the catalog. |
| `/api/pricing/generate/:id` | POST | User | Triggers the AI multi-agent pricing analysis. |
| `/api/pricing/recommendations` | GET | User | Retrieves all historical recommendations. |
| `/api/pricing/recommendation/:id` | PATCH | User | Updates status (Approve/Reject) of a price. |
| `/api/pricing/export` | GET | User | Exports all recommendations as a CSV file. |
| `/api/pricing/audit` | GET | User | Fetches system-wide audit logs for the tenant. |
| `/health` | GET | None | System health check (Uptime, DB status, API status). |

---

## 7. Performance & Scalability
- **AI Latency**: Reduced by using Groq's high-speed inference.
- **Database**: Indexed on `organizationId` and `sku` for O(1) lookups in high-traffic scenarios.
- **Extensibility**: The agent system is modular, allowing for "Competitor Agent" or "Seasonal Trend Agent" to be swapped without affecting the core API.
