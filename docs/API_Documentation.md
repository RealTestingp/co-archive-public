# Calgary Opera Archive — API Documentation

**Base URL (local development):** `https://localhost:7136`  
**Chatbot Base URL (local development):** `http://localhost:5194`  
**Format:** All requests and responses use JSON.  
**Authentication:** Microsoft Entra ID (coming soon — currently open for development)

---

## Table of Contents

1. [Productions](#productions)
2. [Persons](#persons)
3. [Characters](#characters)
4. [Appearances](#appearances)
5. [Reports](#reports)
6. [Lookup Endpoints](#lookup-endpoints)
7. [AI Chatbot](#ai-chatbot)

---

## Productions

### GET /api/productions

Returns a list of all productions. Optionally filter by search term.

**Query Parameters**

| Parameter | Type   | Required | Description                                     |
| --------- | ------ | -------- | ----------------------------------------------- |
| `search`  | string | No       | Filter by production title (max 100 characters) |

**Response `200 OK`**

```json
[
  {
    "id": 1,
    "title": "La Traviata",
    "season": "2023-2024",
    "eventType": "Main Stage",
    "opera": "La Traviata",
    "venue": "Southern Alberta Jubilee Auditorium"
  }
]
```

---

### GET /api/productions/{id}

Returns full details for a single production including cast, crew, and performances.

**Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Production ID |

**Response `200 OK`**

```json
{
  "id": 1,
  "title": "La Traviata",
  "runtimeMinutes": 150,
  "programPdfUrl": "https://...",
  "notes": "Opening night gala",
  "season": "2023-2024",
  "eventType": "Main Stage",
  "venue": "Southern Alberta Jubilee Auditorium",
  "opera": "La Traviata",
  "composers": ["Giuseppe Verdi"],
  "librettists": ["Francesco Maria Piave"],
  "writtenLanguage": "Italian",
  "sungLanguage": "Italian",
  "performances": [
    { "id": 1, "date": "2024-01-15T00:00:00" }
  ],
  "cast": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "contributorType": "Artist",
      "character": "Violetta",
      "position": null
    }
  ],
  "creative": [...],
  "crew": [...],
  "orchestra": [...],
  "chorus": [...]
}
```

**Response `404 Not Found`** — Production does not exist.

---

### POST /api/productions

Creates a new production.

**Request Body**

```json
{
  "title": "La Traviata",
  "seasonId": 1,
  "eventTypeId": 2,
  "venueId": 3,
  "operaId": 4,
  "writtenLanguageId": 5,
  "sungLanguageId": 5,
  "runtimeMinutes": 150,
  "programPdfUrl": "https://...",
  "notes": "Optional notes"
}
```

**Response `201 Created`** — Returns the created production object.

---

### PUT /api/productions/{id}

Updates an existing production.

**Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Production ID |

**Request Body** — Same fields as POST, plus `id`.

**Response `204 No Content`** — Update successful.  
**Response `400 Bad Request`** — ID in URL does not match ID in body.  
**Response `404 Not Found`** — Production does not exist.

---

### DELETE /api/productions/{id}

Deletes a production.

**Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Production ID |

**Response `204 No Content`** — Deletion successful.  
**Response `404 Not Found`** — Production does not exist.

---

## Persons

### GET /api/persons

Returns a list of all persons. Optionally filter by search term.

**Query Parameters**

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| `search`  | string | No       | Filter by first or last name (max 100 characters) |

**Response `200 OK`**

```json
[
  {
    "id": 1,
    "firstName": "Jane",
    "lastName": "Smith",
    "isActive": true,
    "voiceType": "Soprano",
    "contributorTypes": ["Artist", "Creative"]
  }
]
```

---

### GET /api/persons/{id}

Returns full profile for a single person including their appearance history.

**Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Person ID   |

**Response `200 OK`**

```json
{
  "id": 1,
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "isActive": true,
  "profileImageUrl": "https://...",
  "voiceType": "Soprano",
  "nationalities": ["Canadian"],
  "contributorTypes": ["Artist"],
  "appearances": [
    {
      "productionId": 1,
      "productionTitle": "La Traviata",
      "season": "2023-2024",
      "eventType": "Main Stage",
      "roles": [
        {
          "contributorType": "Artist",
          "character": "Violetta",
          "position": null
        }
      ]
    }
  ],
  "mainStageProductionCount": 5,
  "performanceCount": 12
}
```

**Response `404 Not Found`** — Person does not exist.

---

### POST /api/persons

Creates a new person.

**Request Body**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "middleName": "Marie",
  "email": "jane@example.com",
  "voiceTypeId": 1,
  "profileImageUrl": "https://...",
  "isActive": true,
  "nationalityIds": [1, 2]
}
```

**Response `201 Created`** — Returns `{ "id": 1 }`.

---

### PUT /api/persons/{id}

Updates an existing person.

**Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Person ID   |

**Request Body** — Same fields as POST, plus `id`.

**Response `204 No Content`** — Update successful.  
**Response `400 Bad Request`** — ID mismatch.  
**Response `404 Not Found`** — Person does not exist.

---

### DELETE /api/persons/{id}

Deletes a person.

**Path Parameters**

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Person ID   |

**Response `204 No Content`** — Deletion successful.  
**Response `404 Not Found`** — Person does not exist.

---

## Characters

### GET /api/characters

Returns a list of all characters. Optionally filter by search term or opera.

**Query Parameters**

| Parameter | Type    | Required | Description                                   |
| --------- | ------- | -------- | --------------------------------------------- |
| `search`  | string  | No       | Filter by character name (max 100 characters) |
| `operaId` | integer | No       | Filter by opera ID                            |

**Response `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Violetta",
    "opera": "La Traviata",
    "operaId": 4
  }
]
```

---

### GET /api/characters/{id}

Returns full details for a single character including production history.

**Path Parameters**

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Character ID |

**Response `200 OK`**

```json
{
  "id": 1,
  "name": "Violetta",
  "opera": "La Traviata",
  "operaId": 4,
  "productionHistory": [
    {
      "productionId": 1,
      "productionTitle": "La Traviata",
      "season": "2023-2024",
      "performers": [
        {
          "firstName": "Jane",
          "lastName": "Smith",
          "contributorType": "Artist"
        }
      ]
    }
  ]
}
```

**Response `404 Not Found`** — Character does not exist.

---

### POST /api/characters

Creates a new character.

**Request Body**

```json
{
  "name": "Violetta",
  "operaId": 4
}
```

**Response `201 Created`** — Returns `{ "id": 1 }`.

---

### PUT /api/characters/{id}

Updates an existing character.

**Path Parameters**

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Character ID |

**Request Body**

```json
{
  "id": 1,
  "name": "Violetta",
  "operaId": 4
}
```

**Response `204 No Content`** — Update successful.  
**Response `400 Bad Request`** — ID mismatch.  
**Response `404 Not Found`** — Character does not exist.

---

### DELETE /api/characters/{id}

Deletes a character.

**Path Parameters**

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Character ID |

**Response `204 No Content`** — Deletion successful.  
**Response `404 Not Found`** — Character does not exist.

---

## Appearances

An appearance links a person to a production in a specific role.

### GET /api/appearances

Returns appearances filtered by production or person.

**Query Parameters**

| Parameter      | Type    | Required | Description             |
| -------------- | ------- | -------- | ----------------------- |
| `productionId` | integer | No       | Filter by production ID |
| `personId`     | integer | No       | Filter by person ID     |

**Response `200 OK`**

```json
[
  {
    "id": 1,
    "person": { "firstName": "Jane", "lastName": "Smith" },
    "production": "La Traviata",
    "contributorType": "Artist",
    "position": null,
    "character": "Violetta"
  }
]
```

---

### POST /api/appearances

Creates a new appearance linking a person to a production.

**Request Body**

```json
{
  "personId": 1,
  "productionId": 1,
  "contributorTypeId": 1,
  "positionId": null,
  "characterId": 1
}
```

**Response `201 Created`** — Returns `{ "id": 1 }`.  
**Response `400 Bad Request`** — Person, production, contributor type, position, or character not found.  
**Response `409 Conflict`** — This appearance already exists.

---

### DELETE /api/appearances/{id}

Deletes an appearance.

**Path Parameters**

| Parameter | Type    | Required | Description   |
| --------- | ------- | -------- | ------------- |
| `id`      | integer | Yes      | Appearance ID |

**Response `204 No Content`** — Deletion successful.  
**Response `404 Not Found`** — Appearance does not exist.

---

## Reports

### POST /api/reportsquery/query

Queries appearances with multiple optional filters for generating reports.

**Request Body** — All fields optional.

```json
{
  "seasonId": 1,
  "contributorTypeId": 1,
  "positionId": null,
  "characterId": null,
  "productionId": null,
  "eventTypeId": null,
  "voiceTypeId": null,
  "nationalityId": null
}
```

**Response `200 OK`**

```json
{
  "rows": [
    {
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "contributorType": "Artist",
      "position": null,
      "character": "Violetta",
      "production": "La Traviata",
      "season": "2023-2024",
      "nationality": "Canadian",
      "voiceType": "Soprano"
    }
  ],
  "totalCount": 1
}
```

---

## Lookup Endpoints

These endpoints return reference data used to populate dropdowns in the UI. All are `GET` requests with no parameters.

| Endpoint                    | Description                                     | Response Fields                   |
| --------------------------- | ----------------------------------------------- | --------------------------------- |
| `GET /api/seasons`          | All seasons                                     | `id`, `label`                     |
| `GET /api/venues`           | All venues                                      | `id`, `name`                      |
| `GET /api/eventtypes`       | All event types                                 | `id`, `name`, `trackMilestones`   |
| `GET /api/voicetypes`       | All voice types                                 | `id`, `name`                      |
| `GET /api/nationalities`    | All nationalities                               | `id`, `name`                      |
| `GET /api/contributortypes` | All contributor types                           | `id`, `name`, `trackPerformances` |
| `GET /api/operas`           | All operas                                      | `id`, `title`                     |
| `GET /api/languages`        | All languages                                   | `id`, `name`                      |
| `GET /api/positions`        | All positions (filter by `?contributorTypeId=`) | `id`, `name`, `contributorTypeId` |

### POST /api/operas

Creates a new opera.

**Request Body**

```json
{
  "title": "La Traviata",
  "composerIds": [1],
  "librettistIds": [2]
}
```

**Response `201 Created`** — Returns `{ "id": 1, "title": "La Traviata" }`.  
**Response `400 Bad Request`** — Title is required.  
**Response `409 Conflict`** — An opera with this title already exists.

### PUT /api/operas/{id}

Updates an existing opera including composers and librettists.

**Request Body**

```json
{
  "id": 1,
  "title": "La Traviata",
  "composerIds": [1],
  "librettistIds": [2]
}
```

**Response `204 No Content`** — Update successful.  
**Response `409 Conflict`** — Title already taken by another opera.

---

## AI Chatbot

The AI chatbot service is a separate microservice running on its own port. It uses Azure OpenAI (GPT-5.4-mini) via Azure AI Foundry to answer natural language questions about the Calgary Opera Archive.

**Base URL (local development):** `http://localhost:5194`  
**Authentication:** Azure CLI credential (local dev) / Managed Identity (deployed)  
**Note:** The chatbot answers based on grounded knowledge from the archive. It will not invent or fabricate information not present in the archive data.

---

### POST /api/chat

Sends a natural language message to the AI assistant and returns a response.

**Request Body**

```json
{
  "message": "Who sang the role of Violetta in La Traviata?"
}
```

| Field     | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `message` | string | Yes      | The natural language query from the user |

**Response `200 OK`**

```json
{
  "reply": "Based on the archive, the role of Violetta in La Traviata was performed by Jane Smith in the 2023-2024 season."
}
```

**Response `400 Bad Request`** — Message is empty or missing.  
**Response `500 Internal Server Error`** — Error communicating with Azure OpenAI.

**Example questions the chatbot can handle:**

- `"What productions did Calgary Opera stage in the 2019-2020 season?"`
- `"Give me a summary of Jane Smith's career at Calgary Opera"`
- `"Who was the stage director for Carmen?"`
- `"Which productions has the character Figaro appeared in?"`

**What the chatbot will not do:**

- Add, edit, or delete archive records
- Answer questions unrelated to the Calgary Opera Archive
- Fabricate information not in the archive

---

## Error Reference

| Status Code                 | Meaning                                   |
| --------------------------- | ----------------------------------------- |
| `200 OK`                    | Request successful                        |
| `201 Created`               | Resource created successfully             |
| `204 No Content`            | Update or delete successful               |
| `400 Bad Request`           | Invalid input or ID mismatch              |
| `404 Not Found`             | Resource does not exist                   |
| `409 Conflict`              | Duplicate resource detected               |
| `500 Internal Server Error` | Unexpected server error (chatbot service) |
