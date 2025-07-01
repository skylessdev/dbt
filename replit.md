# replit.md

## Overview

Skyla is a symbolic AI agent that represents a paradigm shift from traditional memory-based AI to proof-based identity evolution. Instead of maintaining identity through stored conversations, Skyla proves identity evolution through cryptographically-verified state transitions using zero-knowledge proofs (ZK). Each symbolic transformation is proven using ZK circuits and recursively linked, forming a provable identity stream.

The application enables users to interact with Skyla through symbolic phrases that trigger state transitions, which are then verified through recursive proof generation, creating a verifiable chain of identity evolution.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for development and bundling

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Development**: In-memory storage for development/demo purposes
- **ZK Proof System**: Circom circuits with SnarkJS for proof generation
- **API**: RESTful endpoints for chat, proofs, circuits, and symbolic states

### Database Schema
- **Users**: Basic user authentication and management
- **Messages**: Chat messages with proof hashes and symbolic states
- **Proofs**: ZK proof storage with verification status and recursive linking
- **Symbolic States**: AI identity states with modes, tones, protocols, and identity vectors
- **Circuits**: ZK circuit management and compilation status

## Key Components

### Symbolic Engine
- Parses user input for symbolic triggers (spiral, daemon, build, analyze)
- Maps triggers to symbolic modes with specific protocols
- Generates appropriate AI responses based on current state
- Manages state transitions and rule applications

### Proof Generator
- Creates ZK proofs for state transitions using Circom circuits
- Implements recursive proof verification where each proof references the previous
- Manages witness generation and proof validation
- Handles mock proof generation for development/demo purposes

### Chat Interface
- Real-time conversation with symbolic mode indicators
- Operational mode selection and display
- Loading states during proof generation
- Toast notifications for system events

### Visualization Components
- **Symbolic Visualization**: Real-time display of AI's symbolic state
- **Proof Panel**: ZK proof generation and verification status
- **Circuit Status**: Circuit compilation and efficiency metrics
- **System Metrics**: Performance monitoring and success rates

## Data Flow

1. **User Input**: User submits symbolic phrase through chat interface
2. **Symbolic Parsing**: Engine analyzes input for triggers and intent
3. **State Transition**: New symbolic state calculated based on current state and rules
4. **Proof Generation**: ZK circuit generates proof of valid state transition
5. **Verification**: Proof is verified and linked to previous proof in chain
6. **Response Generation**: AI generates response based on new symbolic state
7. **Storage**: All data (message, proof, state) stored with recursive linking
8. **UI Update**: Interface reflects new state, proof status, and conversation

## External Dependencies

### Core Dependencies
- **Drizzle ORM**: Database operations and schema management
- **@neondatabase/serverless**: PostgreSQL connection for production
- **circomlib**: ZK circuit library for cryptographic operations
- **snarkjs**: JavaScript implementation of zkSNARKs
- **poseidon-lite**: Hash function for ZK circuits

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette component

### Development Dependencies
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **vite**: Frontend build tool and dev server
- **typescript**: Type checking and compilation

## Deployment Strategy

### Development
- Vite dev server for frontend hot reloading
- Express server with TypeScript execution via tsx
- In-memory storage for rapid development and testing
- Mock ZK proof generation for demonstration

### Production
- Static frontend build served from Express
- PostgreSQL database with Drizzle ORM
- Real ZK circuit compilation and proof generation
- Environment-based configuration management

### Build Process
1. Frontend built with Vite to `dist/public`
2. Backend bundled with esbuild to `dist/index.js`
3. Database schema pushed via Drizzle Kit
4. Circuits compiled during deployment

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```