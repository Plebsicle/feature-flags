# 🚀 Feature Flag Management System

A comprehensive feature flag management platform built with modern web technologies, enabling teams to safely deploy and control feature rollouts across their applications.

## 📋 Overview

This feature flag system provides a complete solution for managing feature toggles, A/B testing, and gradual rollouts. Built as a monorepo using Turborepo, it consists of a robust backend API, a modern web dashboard, and shared packages for database management and UI components.

### ✨ Key Features

- **🎯 Feature Flag Management**: Create, update, and delete feature flags with environment-specific configurations
- **⚙️ Rule-Based Targeting**: Define complex targeting rules based on user attributes, geographic location, and custom properties
- **📈 Gradual Rollouts**: Implement percentage-based rollouts and canary deployments
- **⚡ Real-time Updates**: Redis-powered caching for instant flag evaluation
- **📊 Audit Logging**: Comprehensive audit trail for all flag changes and deployments
- **🏢 Multi-tenant Architecture**: Organization-based isolation with role-based access control
- **🔐 Authentication**: Email/password and Google OAuth integration
- **🛡️ Type Safety**: Full TypeScript coverage with Zod validation

### 🏗️ Architecture

The system is built as a monorepo with the following structure:

- **🖥️ Server**: Express.js API with Prisma ORM and Redis caching
- **🌐 Web**: Next.js dashboard for flag management
- **🗄️ Database**: PostgreSQL with Prisma schema
- **📦 Shared Packages**: TypeScript configs, UI components, and database client

## 🚀 Getting Started

### 📋 Prerequisites

- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Redis 6+

### ⚙️ Installation

1. **📥 Clone the repository**
   ```bash
   git clone <repository-url>
   cd feature-flag
   ```

2. **📦 Install dependencies**
   ```bash
   pnpm install
   ```

3. **🔧 Set up environment variables**
   ```bash
   # Copy environment templates
   cp apps/server/.env.sample apps/server/.env
   cp apps/web/.env.sample apps/web/.env
   cp packages/db/.env.sample packages/db/.env
   ```

4. **⚙️ Configure your environment variables** (see Environment Variables section below)

5. **🗄️ Set up the database**
   ```bash
   # Generate Prisma client
   pnpm --filter @repo/db db:generate
   
   # Run database migrations
   pnpm --filter @repo/db db:migrate
   ```

6. **▶️ Start the development servers**
   ```bash
   # Start all services
   pnpm dev
   
   # Or start individual services
   pnpm --filter server dev
   pnpm --filter web dev
   ```

The application will be available at:
- **🌐 Web Dashboard**: http://localhost:3000
- **🖥️ API Server**:    http://localhost:8000

## 🔧 Environment Variables

The project requires several environment variables to function properly. Environment template files will be provided in the following locations:

- `apps/server/.env.sample` - Server environment variables
- `apps/web/.env.sample` - Web application environment variables
- `packages/db/.env.sample` - Database environment Variables

### 📝 Setup Instructions

1. **📋 Copy environment templates** to create your local `.env` files:
   ```bash
   cp apps/server/.env.sample apps/server/.env
   cp apps/web/.env.sample apps/web/.env
   cp packages/db/.env.sample packages/db/.env
   ```

2. **⚙️ Configure the variables** in each `.env` file according to your setup

### 📋 Required Environment Variables

The following environment variables are required for the system to function:

**🖥️ Server Environment Variables:**
- Database connection string
- Redis connection URL
- Session secret
- SMTP configuration for email notifications
- Google OAuth credentials
- JWT secret

**🌐 Web Environment Variables:**
- API server URL
- Google OAuth client ID

### 🔧 Required Setup

1. **🗄️ PostgreSQL Database**: Create a database and update the `DATABASE_URL`
2. **⚡ Redis Instance**: Set up Redis for caching and session storage
3. **📧 Email Service**: Configure SMTP settings for user verification emails
4. **🔐 Google OAuth**: Set up Google OAuth credentials for social login

## 🔌 Integration

### 📦 JavaScript SDK

A JavaScript SDK will be available soon, providing easy integration for feature flags into your applications. The SDK will include:

- 🎯 Simple API for flag evaluation
- ⚡ Automatic caching and performance optimization
- 🛡️ TypeScript support with full type definitions
- 📚 Comprehensive documentation and examples
- 🎨 Support for React, Vue, and vanilla JavaScript applications

### ☁️ Hosted Service

The feature flag system will soon be available as a hosted service, eliminating the need for self-hosting. Users will be able to:

- 🚀 Deploy feature flags instantly without infrastructure setup
- 🏢 Access a managed dashboard with enterprise-grade reliability
- 🔄 Benefit from automatic updates and security patches
- 📈 Scale automatically based on usage

Stay tuned for the launch announcement and early access opportunities! 🎉

## 💻 Development

### 🛠️ Available Scripts

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test
```

### 📁 Project Structure

```
feature-flag/
├── apps/
│   ├── server/          # Express.js API server
│   ├── web/            # Next.js web dashboard
│   └── docs/           # Documentation site
├── packages/
│   ├── db/             # Database client and schema
│   ├── ui/             # Shared UI components
│   ├── types/          # Shared TypeScript types
│   ├── eslint-config/  # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
├── package.json
└── turbo.json
```

### 🗄️ Database Schema

The system uses Prisma with the following main entities:

- **🏢 Organizations**: Multi-tenant isolation
- **👥 Users**: User management with roles (OWNER, ADMIN, MEMBER, VIEWER)
- **🚩 Feature Flags**: Core flag definitions
- **🌍 Flag Environments**: Environment-specific configurations
- **⚙️ Flag Rules**: Targeting rules and conditions
- **📈 Flag Rollouts**: Gradual rollout configurations
- **📊 Audit Logs**: Change tracking and compliance

### 🔗 API Endpoints

The server provides RESTful APIs for:

- **🔐 Authentication**: Sign up, sign in, email verification
- **🚩 Feature Flags**: CRUD operations for flags and environments
- **⚙️ Rules**: Targeting rule management
- **📈 Rollouts**: Gradual rollout configuration
- **📊 Audit**: Change history and compliance reporting

## 🚀 Deployment

### 🛠️ Manual Deployment

1. Build the production assets:
   ```bash
   pnpm build
   ```

2. Set up production environment variables

3. Run database migrations:
   ```bash
   pnpm --filter @repo/db db:migrate:deploy
   ```

4. Start the production servers:
   ```bash
   pnpm --filter server start
   pnpm --filter web start
   ```

### 🐳 Docker Support

Docker support is coming soon. Users will be able to run the entire system using Docker Compose with pre-configured containers for all services.

## 🤝 Contributing

1. 🍴 Fork the repository
2. 🌿 Create a feature branch
3. ✏️ Make your changes
4. 🧪 Add tests if applicable
5. 📤 Submit a pull request


