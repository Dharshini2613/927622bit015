# Average Calculator Microservice

A REST API microservice that calculates the average of different types of numbers fetched from a third-party server.

## Features

- Fetches numbers from a third-party server based on the requested type
- Maintains a window of unique numbers with configurable size
- Calculates the average of numbers in the window
- Responds within 500ms
- Handles timeouts and errors gracefully

## API Endpoints

### GET /numbers/:numberid

Fetches numbers of the specified type and calculates their average.

**Parameters:**
- `numberid` - The type of numbers to fetch. Valid values:
  - `p` - Prime numbers
  - `f` - Fibonacci numbers
  - `e` - Even numbers
  - `r` - Random numbers

**Response:**
\`\`\`json
{
  "windowPrevState": [2, 4, 6, 8],
  "windowCurrState": [12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
  "numbers": [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
  "avg": 23.40
}
\`\`\`

### GET /health

Health check endpoint to verify the service is running.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2023-05-09T19:41:07.000Z"
}
\`\`\`

## Configuration

The service can be configured using the following environment variables:

- `PORT` - The port on which the service will run (default: 9876)

## Running the Service

### Prerequisites

- Node.js 18 or higher

### Installation

\`\`\`bash
npm install
\`\`\`

### Starting the Service

\`\`\`bash
npm start
\`\`\`

The service will be available at `http://localhost:9876`.

## Testing

You can test the service with the following curl commands:

\`\`\`bash
curl http://localhost:9876/numbers/e
curl http://localhost:9876/numbers/p
curl http://localhost:9876/numbers/f
curl http://localhost:9876/numbers/r
