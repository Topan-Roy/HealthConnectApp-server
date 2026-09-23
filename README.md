# HealthConnect Server

Backend for the HealthConnect healthcare application.

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update the variables in `.env` with your actual configuration.

## Development

Run the application in development mode with automatic restart:

```bash
npm run dev
```

## Production Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Running Production Server

Start the compiled application:

```bash
npm start
```

## API Health Check

Verify the API is running by visiting:
`GET /api/v1/health`
