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

### Option A — Run with Docker

1. Unzip the folder anywhere on your machine.
2. Open a terminal in the unzipped folder (the one containing `docker-compose.yml`).
3. Run:

```bash
docker-compose up --build
```

4. Open `http://localhost:5173`

That's it — the `.env`, `frontend/.env.local`, and `services/core-api/COArchive.API/appsettings.Development.json` files needed to connect to our Azure SQL database and Entra ID are already included in this zip. No additional setup required.

### Option B — View the live deployment

No setup required — the project is already deployed and running on Azure:

🔗 **https://frontend.politeglacier-fb6c27b1.canadacentral.azurecontainerapps.io**

Sign in with the test credentials provided separately to explore the archive as either a Staff or Admin user.

### Option C — Run without Docker

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
