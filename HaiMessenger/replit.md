# IoT Temperature Monitor Dashboard

## Overview

This is a full-stack IoT temperature monitoring application that displays real-time sensor data from ESP8266 devices via MQTT. The system features a React frontend with real-time charts, an Express.js backend with WebSocket support, and PostgreSQL database integration using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Charts**: Recharts for data visualization
- **Real-time Communication**: WebSocket client for live data updates

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket server and MQTT client integration
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **Development**: Vite integration for hot module replacement

### Build System
- **Frontend Build**: Vite with React plugin
- **Backend Build**: esbuild for production bundling
- **Development**: TSX for TypeScript execution
- **CSS Processing**: PostCSS with Tailwind CSS and Autoprefixer

## Key Components

### Database Schema
- **Users Table**: Basic user authentication (id, username, password)
- **Sensor Readings Table**: IoT sensor data storage
  - DHT temperature readings (dhtTemperature)
  - LM35 temperature readings (lm35Temperature)
  - LED status levels (ledLevel)
  - Timestamps for data tracking

### MQTT Integration
- **Broker**: mqtt.revolusi-it.com
- **Topic**: iot/G.231.22.0101
- **Credentials**: Username/password authentication
- **Auto-reconnection**: Built-in reconnection logic for reliability

### WebSocket Communication
- **Endpoint**: /ws
- **Message Types**: 
  - sensor_data: Real-time sensor readings
  - connection_status: MQTT connection status updates
- **Real-time Updates**: Automatic frontend updates when new sensor data arrives

### API Endpoints
- **GET /api/readings/recent**: Fetch recent sensor readings with pagination
- **GET /api/readings/latest**: Get the most recent sensor reading
- **Real-time Data**: WebSocket-based live data streaming

## Data Flow

1. **ESP8266 Device**: Publishes sensor data (DHT11, LM35 temperatures, LED status) to MQTT broker
2. **MQTT Client**: Backend subscribes to IoT topic and receives sensor data
3. **Database Storage**: Incoming MQTT messages are parsed and stored in PostgreSQL
4. **WebSocket Broadcast**: New sensor data is broadcast to all connected frontend clients
5. **Frontend Updates**: React components automatically update charts and displays with new data
6. **Historical Data**: Dashboard can query historical sensor readings via REST API

## External Dependencies

### Core Runtime Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connectivity
- **ORM**: drizzle-orm with drizzle-zod for type-safe database operations
- **MQTT**: mqtt for IoT device communication
- **WebSocket**: ws for real-time client-server communication
- **UI Components**: Comprehensive Radix UI component library
- **Charts**: recharts for temperature data visualization

### Development Dependencies
- **Build Tools**: Vite, esbuild, tsx for development and production builds
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and TypeScript compiler checks

## Deployment Strategy

### Production Build Process
1. **Frontend**: Vite builds optimized React bundle to `dist/public`
2. **Backend**: esbuild compiles TypeScript server to `dist/index.js`
3. **Static Assets**: Express serves built frontend from `dist/public`
4. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **MQTT Configuration**: Hardcoded broker settings for IoT integration
- **Node Environment**: Production/development mode switching

### Deployment Considerations
- **Database Provisioning**: PostgreSQL instance must be available before startup
- **MQTT Connectivity**: Requires network access to mqtt.revolusi-it.com
- **WebSocket Support**: Server must support WebSocket connections
- **Static File Serving**: Production server handles both API and static content

## Changelog

```
Changelog:
- June 29, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```