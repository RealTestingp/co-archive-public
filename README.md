# Calgary Opera Archive

A centralized, full-stack microservices web application built for the **Calgary Opera**. This system modernizes over 50 years of physical performance history into a high-performance relational cloud archive paired with an AI chatbot engine.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend Services:** ASP.NET Core (C#)
- **Database:** Azure SQL Database via Entity Framework Core
- **Authentication/RBAC:** Microsoft Entra ID (Admin and Staff roles)
- **Containerization:** Docker, deployed to Azure Container Apps
- **Media Storage:** Azure Blob Storage (scanned program PDFs and images)
- **Reporting:** QuestPDF (PDF) and ClosedXML (Excel)
- **AI:** Azure OpenAI Service + Azure AI Search

## 🗂️ Repository Structure

co-archive/

├── frontend/ # React/TypeScript app

│ ├── src/

│ ├── Dockerfile

│ └── nginx.conf

├── services/

│ ├── core-api/ # ASP.NET Core REST API

│ │ ├── COArchive/ # Domain models & data layer

│ │ ├── COArchive.API/ # Controllers & API config

│ │ └── Dockerfile

│ ├── chatbot-service/ # Coming soon

│ └── reports-service/ # Coming soon

├── gateway/ # Coming soon

├── docker-compose.yml

└── co-archive.sln

## 🚀 Local Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [.NET SDK 8.0](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Option A — Run with Docker (recommended)

1. Clone the repo
2. Create a `.env` file at the repo root:
   DB_CONNECTION_STRING=your-azure-sql-connection-string
   
   AZURE_TENANT_ID=your-entra-tenant-id
   
   AZURE_CLIENT_ID=your-entra-client-id
   
4. Create `frontend/.env.local`:
   VITE_ENTRA_CLIENT_ID=your-entra-client-id
   
   VITE_ENTRA_TENANT_ID=your-entra-tenant-id
   
6. Create `services/core-api/COArchive.API/appsettings.Development.json` (never commit this):

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "Audience": "your-client-id"
  },
  "ConnectionStrings": {
    "DefaultConnection": "your-azure-sql-connection-string"
  }
}
```

5. Run:

```bash
docker-compose up --build
```

6. Open `http://localhost:5173`

### Option B — Run without Docker

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Backend:**

```bash
cd services/core-api
dotnet run --project COArchive.API
```

### Authentication

All users must sign in with a Microsoft account that has been granted access to the Calgary Opera Archive app. Contact the project admin to be added.

## 👥 Our Team

| Name          | Role                              |
| ------------- | --------------------------------- |
| Verity Boyd   | Project Manager & DBA             |
| Aurora Choban | Front-End Developer & UX Designer |
| Jenna Hackett | Cloud & AI Architect              |
| Dylan Khuu    | Back-End Developer & QA           |
