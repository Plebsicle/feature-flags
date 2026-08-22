# Feature Flag Management System

A comprehensive feature flag management platform built with modern web technologies, enabling teams to safely deploy and control feature rollouts across their applications.

## Deployment Status Notice

**Temporary Service Outage**

The hosted deployment of this project is currently offline due to a security incident detected on the infrastructure.

## Overview

This feature flag system provides a complete solution for managing feature toggles, A/B testing, and gradual rollouts. Built as a monorepo using Turborepo, it consists of a robust backend API, a modern web dashboard, and shared packages for database management and UI components.

### Key Features

- **Feature Flag Management**: Create, update, and delete feature flags with environment-specific configurations.
- **Rule-Based Targeting**: Define complex targeting rules based on user attributes, geographic location, and custom properties.
- **Gradual Rollouts**: Implement percentage-based rollouts and canary deployments.
- **Real-time Updates**: Redis-powered caching for instant flag evaluation.
- **Audit Logging**: Comprehensive audit trail for all flag changes and deployments.
- **Slack Notifications**: Receive instant alerts on flag changes, rollouts, or kill switch activations via Slack.
- **Multi-tenant Architecture**: Organization-based isolation with role-based access control.
- **Authentication**: Email/password and Google OAuth integration with session management.
- **Type Safety**: Full TypeScript coverage with Zod validation.

### Architecture

The system is built as a monorepo with the following structure:

- **Server**: Express.js API with Prisma ORM and Redis caching.
- **Web**: Next.js dashboard for flag management.
- **Database**: PostgreSQL with Prisma schema.
- **Shared Packages**: TypeScript configs, UI components, and database client.
- **Landing**: Marketing and public-facing landing page.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Plebsicle/feature-flags.git
   cd feature-flags
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/server/.env.sample apps/server/.env
   cp apps/web/.env.sample apps/web/.env
   cp packages/db/.env.sample packages/db/.env
   ```

4. **Configure your environment variables** (see Environment Variables section below)

5. **Set up the database**
   ```bash
   pnpm --filter @repo/db db:generate
   pnpm --filter @repo/db db:migrate
   ```

6. **Start the development servers**
   ```bash
   pnpm dev
   # Or individually:
   pnpm --filter server dev
   pnpm --filter web dev
   ```

The application will be available at:
- **Web Dashboard**: http://localhost:3000
- **API Server**: http://localhost:8000

## Environment Variables

### Required Environment Variables

**Server Environment Variables:**
- Database connection string
- Redis connection URL
- Session secret
- SMTP configuration for email notifications
- Google OAuth credentials

**Web Environment Variables:**
- API server URL
- Google OAuth client ID

### Required Setup

1. **PostgreSQL Database**: Create a database and update the `DATABASE_URL`.
2. **Redis Instance**: Set up Redis for caching and session storage.
3. **Email Service**: Configure SMTP settings for user verification emails.
4. **Google OAuth**: Set up Google OAuth credentials for social login.

## Integration

### JavaScript SDK

Use our official JavaScript SDK: [`bitswitch-sdk`](https://www.npmjs.com/package/bitswitch-sdk)

The SDK includes:
- Simple API for flag evaluation and metric collection.
- TypeScript support with full type definitions.
- Comprehensive documentation and examples.
- Support for React, Vue, and vanilla JavaScript applications.

### Slack Notifications

Easily integrate Slack to receive real-time alerts whenever feature flags are created, updated, or rolled back.

- Secure webhook-based integration.
- Supports team-wide notifications with custom channel configuration.

### Hosted Service

You can use the hosted version of the application at [https://bitswitch.site](https://bitswitch.site) — no infrastructure setup required.

- Create and evaluate feature flags instantly.
- Access a production-grade dashboard with team support.
- Roll out features safely using kill switches, targeting, and gradual exposure.
- Add metrics and flag status indicators to evaluate performance and usage.

## Development

### Available Scripts

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm run build

# Start production servers
pnpm start

# Run linting
pnpm lint

# Run type checking
pnpm type-check
```

### Project Structure

```
feature-flag/
├── apps/
│   ├── server/            # Express.js API server
│   ├── web/               # Next.js web dashboard
│   └── landing/           # Marketing landing page
├── packages/
│   ├── db/                # Database client and schema
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   ├── eslint-config/     # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
├── package.json
└── turbo.json
```

### Database Schema

Key entities managed via Prisma:

- **Organizations**: Multi-tenant isolation.
- **Users**: User roles (OWNER, ADMIN, MEMBER, VIEWER).
- **Feature Flags**: Core flag definitions.
- **Flag Environments**: Environment-specific flag settings.
- **Flag Rules**: Dynamic rule targeting.
- **Flag Rollouts**: Gradual rollout strategies.
- **Audit Logs**: Comprehensive change tracking.

### API Endpoints

RESTful APIs include:

- **Authentication**: Sign up, sign in, email verification.
- **Feature Flags**: Full CRUD for flags and environments.
- **Rules**: Targeting rule management.
- **Rollouts**: Configure rollout percentages.
- **Audit**: View historical changes and actions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
