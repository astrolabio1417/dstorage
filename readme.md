# Discord Storage

A lightweight file storage service powered by Discord as the backend.

## Features

- File storage and retrieval via REST API
- Node.js file streaming
- Large file support with automatic chunking
- Auto-renewal of expired links
- Demo UI for viewing, uploading, and creating folders

## Requirements

- **Docker & Docker Compose**
- **Discord Channel Webhook(s)**
- **Discord Authorization Token**

### How to get a Discord Channel Webhook

1. Go to **Server Settings**
2. Open **Integrations**
3. Click **Webhooks**
4. Select **New Webhook**
5. **Copy Webhook URL**

### How to get your Discord Authorization Token

> Keep your token private.  
> Do **not** share or commit it to GitHub.

Paste this snippet into your browser console:

```javascript
const iframe = document.createElement('iframe')
console.log('Token: %c%s', 'font-size:16px;', JSON.parse(document.body.appendChild(iframe).contentWindow.localStorage.token))
iframe.remove()
```

## Setup and Run

### 1. Configure Environment Variables

Create an `.env` file:

```
DATABASE_URL="postgresql://postgres:password@db:5432"
WEBHOOKS="https://discord.com/api/webhooks/xxxx/xxxxx"
LOG_LEVEL='debug'
AUTHORIZATION="xxxxx.xxxxx.xxxxxx"
ADMIN_PASSWORD="xxxxxxxx"
```

### 2. Start the service

Via Docker Compose

```
docker compose up --build
```

Or via Docker

```
docker build -t dstorage .
docker run -p 3000:3000 dstorage
```

## Usage

### Login

**Endpoint:** `POST /api/auth/login`

**JSON Request:**

- `password` (string) — your admin password

**Response:**

```
{
    "createdToken": string,
    "token": string
}
```

### Logout

**Endpoint:** POST /api/auth/logout

**Headers:**
**Authorization**: <token>

**Response:**

```
{
  "createdAt": string,
  "id": number,
  "token": string
}
```

### Get Folder/File List

**Endpoint:** `GET /api/nodes/`

**Query Parameters:**

- `parent` (string, optional) — ID of the parent folder. Use `null` for root.

**Response:**

```json
[
  {
    "id": 1,
    "name": "Documents",
    "parent": null,
    "type": "FOLDER",
    "createdAt": "2025-12-05T10:00:00.000Z",
    "updatedAt": "2025-12-05T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "example.txt",
    "parent": 1,
    "type": "FILE",
    "createdAt": "2025-12-05T10:05:00.000Z",
    "updatedAt": null
  }
]
```

### Create Folder

**Endpoint:** `POST /api/nodes/`

**Request Body (JSON):**

```json
{
  "name": "New Folder",
  "parent": 1 // optional, ID of parent folder. Omit or null for root.
}
```

- name (string, required) — folder name, at least 1 character
- parent (number, optional) — ID of the parent folder

**Response:**

```
{
    "id": 2,
    "name": "New Folder",
    "parent": 1,
    "type": "FOLDER",
    "createdAt": "2025-12-05T10:00:00.000Z",
    "updatedAt": "2025-12-05T10:00:00.000Z"
}
```

### Upload File

**Endpoint:** `POST /api/nodes/upload`

**Form Data:**

- `files` — file(s) to upload
- `parent` (number, optional) — ID of the parent folder. Defaults to `null` for root.

```json
[
  {
    "id": 3,
    "name": "document.pdf",
    "parent": null,
    "type": "FILE",
    "createdAt": "2025-12-05T10:00:00.000Z",
    "updatedAt": "2025-12-05T10:00:00.000Z"
  },
  {
    "id": 4,
    "name": "example.png",
    "parent": null,
    "type": "FILE",
    "createdAt": "2025-12-05T10:10:00.000Z",
    "updatedAt": null
  }
]
```

### Retrieve File/Folder

**Endpoint:** `GET /api/nodes/:id`

**Path Parameter:**

- `id` (number, required) — ID of the File/Folder to retrieve

**Response (single file):**

```json
{
  "id": 3,
  "name": "document.pdf",
  "parent": null,
  "type": "FILE",
  "createdAt": "2025-12-05T10:10:00.000Z",
  "updatedAt": null
}
```

### Delete File/Folder

**Endpoint:** `DELETE /api/nodes/:id`

**Path Parameter:**

- `id` (number, required) — ID of the file or folder to delete

**Response:**

```json
{
  "deleted": [3]
}
```

### Download File

**Endpoint:** `GET /api/nodes/:id/download`

**Path Parameter:**

- `id` (number, required) — ID of the file to download

**Response:**

- Returns the file as a **stream**.

**Example (cURL):**

```bash
curl -O http://localhost:3000/api/nodes/3/download
```
