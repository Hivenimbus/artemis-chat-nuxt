# Evolution API v2 - WhatsApp Integration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [API Documentation](#api-documentation)
6. [Webhook Events](#webhook-events)
7. [Frontend Integration](#frontend-integration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Overview

This project uses **Evolution API v2** for WhatsApp Web integration. Evolution API is a REST API that provides WhatsApp functionality using the Baileys library.

### Key Features

✅ **QR Code Authentication** - Generate QR codes for WhatsApp Web login  
✅ **Pairing Code** - Alternative phone-based authentication  
✅ **Real-time Webhooks** - Receive instant notifications for messages and connection status  
✅ **Multi-instance Support** - Manage multiple WhatsApp connections per user  
✅ **Message Management** - Send and receive text messages, media, and more  

## Quick Start

### 1. Prerequisites

- Evolution API v2 instance (deployed or local)
- Supabase project with `inboxes` table
- Node.js 18+ and Nuxt 3 project

### 2. Environment Variables

Create a `.env` file in the project root:

```bash
# Evolution API Configuration
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-api-key-here

# Site Configuration (for webhooks)
SITE_URL=https://your-domain.com  # or http://localhost:3000 for dev

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Deploy Evolution API

**Option A: Use Hosted Service**
- Sign up at https://evolution-api.com (if available)
- Get your API URL and Key

**Option B: Self-host with Docker**

```bash
docker run -d \
  --name evolution_api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=your-chosen-key \
  -e SERVER_URL=https://your-server.com \
  atendai/evolution-api:v2
```

**Option C: Deploy to Cloud**
- Railway: https://railway.app
- Render: https://render.com
- DigitalOcean: https://www.digitalocean.com

### 4. Configure Webhooks

The Evolution API will automatically be configured with webhooks when creating instances. The webhook URL is:

```
https://your-site-url.com/api/webhooks/evolution
```

Make sure this endpoint is publicly accessible for the Evolution API to send events.

## Architecture

### System Flow

```
┌──────────────┐
│   Frontend   │
│  (Nuxt/Vue)  │
└──────┬───────┘
       │
       │ HTTP Requests
       ▼
┌──────────────────────┐
│   Nuxt API Routes    │
│ /api/evolution/*     │
└──────┬───────────────┘
       │
       │ Service Layer
       ▼
┌──────────────────────┐      ┌─────────────┐
│  Evolution API       │◄────►│  Supabase   │
│  Service Client      │      │  Database   │
└──────┬───────────────┘      └─────────────┘
       │
       │ HTTP Requests
       ▼
┌──────────────────────┐
│   Evolution API v2   │
│   (External)         │
└──────┬───────────────┘
       │
       │ Webhooks
       ▼
┌──────────────────────┐
│  Webhook Handler     │
│ /api/webhooks/evolution │
└──────────────────────┘
```

### File Structure

```
project/
├── server/
│   ├── services/
│   │   └── evolutionApi.ts          # Evolution API client service
│   └── api/
│       ├── evolution/
│       │   ├── create-instance.post.ts  # Create WhatsApp instance
│       │   ├── disconnect.post.ts       # Disconnect instance
│       │   └── status/
│       │       └── [inboxId].get.ts     # Check connection status
│       └── webhooks/
│           └── evolution.post.ts        # Receive Evolution events
├── composables/
│   └── useInboxes.ts                # Frontend composable with Evolution integration
├── types/
│   └── database.types.ts            # TypeScript types
└── docs/
    ├── EVOLUTION_API_INTEGRATION.md # This file
    └── INBOXES_BACKEND.md          # Backend documentation
```

## Setup Instructions

### Step 1: Create Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Step 2: Update Nuxt Config

The `nuxt.config.ts` is already configured with Evolution API settings:

```typescript
runtimeConfig: {
  // Server-only secrets (never exposed to client)
  evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
  
  // Public config (exposed to client)
  public: {
    evolutionApiUrl: process.env.EVOLUTION_API_URL || '',
    siteUrl: process.env.SITE_URL || 'http://localhost:3000'
  }
}
```

### Step 3: Test the Integration

#### Connect an Inbox

```typescript
// In your Vue component
const { connectInbox } = useInboxes()

const handleConnect = async () => {
  try {
    const result = await connectInbox(
      inboxId,
      'My Inbox Name',
      '5511999999999'  // Optional phone for pairing code
    )
    
    // Display QR Code to user
    const qrCode = result.qr_code  // Base64 string
    
    // Show in image: <img :src="`data:image/png;base64,${qrCode}`">
  } catch (error) {
    console.error('Failed to connect:', error)
  }
}
```

#### Check Connection Status

```typescript
const { checkInboxStatus } = useInboxes()

const checkStatus = async () => {
  const inbox = await checkInboxStatus(inboxId)
  
  // inbox.status can be:
  // - 'connected': WhatsApp is connected
  // - 'disconnected': Not connected
  // - 'connecting': Waiting for QR scan
}
```

#### Disconnect Inbox

```typescript
const { disconnectInbox } = useInboxes()

const disconnect = async () => {
  await disconnectInbox(inboxId)
  // Instance is removed from Evolution API
  // Database is updated
}
```

## API Documentation

### POST /api/evolution/create-instance

Creates a new WhatsApp instance and generates a QR code.

**Request:**
```json
{
  "inboxId": "uuid-of-inbox",
  "name": "Inbox Name",
  "phone": "5511999999999"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "inbox": {
    "id": "uuid",
    "name": "Inbox Name",
    "status": "connecting",
    "qr_code": "base64-qr-code-data",
    "session_data": {
      "instanceName": "inbox_uuid_timestamp",
      "status": "connecting",
      "pairingCode": "ABCD-1234"  // If phone provided
    }
  },
  "instance": {
    "name": "inbox_uuid_timestamp",
    "status": "connecting",
    "qrCode": "base64-qr-code-data",
    "pairingCode": "ABCD-1234"
  }
}
```

### GET /api/evolution/status/:inboxId

Fetches the current connection status from Evolution API.

**Response:**
```json
{
  "success": true,
  "status": "open",  // or "close", "connecting", "not_connected"
  "inbox": {
    "id": "uuid",
    "status": "connected",
    ...
  }
}
```

### POST /api/evolution/disconnect

Disconnects and removes a WhatsApp instance.

**Request:**
```json
{
  "inboxId": "uuid-of-inbox"
}
```

**Response:**
```json
{
  "success": true,
  "inbox": {
    "id": "uuid",
    "status": "disconnected",
    "qr_code": null,
    "session_data": null
  },
  "message": "WhatsApp instance disconnected successfully"
}
```

## Webhook Events

The webhook endpoint at `/api/webhooks/evolution` receives events from Evolution API.

### Handled Events

| Event | Description | Action |
|-------|-------------|--------|
| `QRCODE_UPDATED` | New QR code generated | Updates `qr_code` in database |
| `CONNECTION_UPDATE` | Connection state changed | Updates `status` and `session_data` |
| `MESSAGES_UPSERT` | New message received | Logs message (can be stored) |
| `MESSAGES_UPDATE` | Message status updated | Logs update |
| `MESSAGES_DELETE` | Message deleted | Logs deletion |

### Webhook Payload Structure

```typescript
{
  event: string,           // Event name
  instance: string,        // Instance name
  data: any,              // Event-specific data
  destination?: string,   // Destination number
  date_time?: string,     // Event timestamp
  server_url?: string,    // Evolution API URL
  apikey?: string         // API key used
}
```

### Example: Connection Update Event

```json
{
  "event": "CONNECTION_UPDATE",
  "instance": "inbox_abc123_1234567890",
  "data": {
    "state": "open"
  },
  "date_time": "2025-01-09T18:30:00Z"
}
```

## Frontend Integration

### Using the Composable

The `useInboxes()` composable provides all necessary functions:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useInboxes } from '~/composables/useInboxes'

const {
  fetchInboxes,
  createInbox,
  connectInbox,
  disconnectInbox,
  checkInboxStatus,
  subscribeToInboxChanges
} = useInboxes()

const inboxes = ref([])
const loading = ref(false)
const qrCode = ref<string | null>(null)

// Load all inboxes
const loadInboxes = async () => {
  loading.value = true
  try {
    inboxes.value = await fetchInboxes()
  } finally {
    loading.value = false
  }
}

// Create and connect new inbox
const createAndConnect = async () => {
  try {
    // 1. Create inbox
    const newInbox = await createInbox({
      name: 'My WhatsApp',
      description: 'Personal account'
    })
    
    // 2. Connect to WhatsApp
    const connectedInbox = await connectInbox(
      newInbox.id,
      newInbox.name
    )
    
    // 3. Show QR code
    qrCode.value = connectedInbox.qr_code
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Subscribe to real-time updates
onMounted(() => {
  loadInboxes()
  
  const channel = subscribeToInboxChanges((payload) => {
    console.log('Inbox changed:', payload)
    loadInboxes() // Reload on changes
  })
  
  onUnmounted(() => {
    channel.unsubscribe()
  })
})
</script>

<template>
  <div>
    <!-- QR Code Display -->
    <div v-if="qrCode" class="qr-container">
      <h3>Scan this QR Code with WhatsApp</h3>
      <img 
        :src="`data:image/png;base64,${qrCode}`" 
        alt="WhatsApp QR Code"
      />
    </div>
    
    <!-- Inbox List -->
    <div v-for="inbox in inboxes" :key="inbox.id">
      <h4>{{ inbox.name }}</h4>
      <span :class="inbox.status">{{ inbox.status }}</span>
      
      <button 
        v-if="inbox.status === 'disconnected'"
        @click="connectInbox(inbox.id, inbox.name)"
      >
        Connect
      </button>
      
      <button 
        v-else
        @click="disconnectInbox(inbox.id)"
      >
        Disconnect
      </button>
    </div>
  </div>
</template>
```

## Testing

### Manual Testing

1. **Create Inbox**: Create a new inbox from the UI
2. **Connect**: Click connect button
3. **Scan QR Code**: Use WhatsApp mobile app to scan displayed QR code
4. **Verify Connection**: Check if status changes to "connected"
5. **Send Message**: (future) Send a test message
6. **Disconnect**: Click disconnect button
7. **Verify Disconnection**: Check if status changes to "disconnected"

### Testing Webhooks Locally

Use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 3000
ngrok http 3000

# Use the generated URL in your .env
SITE_URL=https://your-ngrok-url.ngrok.io
```

### Debugging

Enable console logs to see webhook events:

```typescript
// In server/api/webhooks/evolution.post.ts
console.log('Received Evolution webhook:', payload)
```

Check Evolution API logs for connection issues.

## Troubleshooting

### Common Issues

#### 1. "Evolution API URL not configured"

**Solution**: Ensure `EVOLUTION_API_URL` is set in `.env`

```bash
EVOLUTION_API_URL=https://your-evolution-api.com
```

#### 2. "Evolution API Key not configured"

**Solution**: Ensure `EVOLUTION_API_KEY` is set in `.env`

```bash
EVOLUTION_API_KEY=your-api-key
```

#### 3. QR Code Not Updating

**Possible causes:**
- Webhook URL not accessible (check firewall, CORS)
- Evolution API can't reach your server
- Incorrect `SITE_URL` in config

**Solution**: 
- Use ngrok for local testing
- Ensure webhook URL is publicly accessible
- Check Evolution API logs

#### 4. Connection Status Stuck on "connecting"

**Possible causes:**
- QR code not scanned
- QR code expired (typically after 40 seconds)
- Evolution API connection issues

**Solution**:
- Regenerate QR code by reconnecting
- Check Evolution API health
- Verify WhatsApp app is updated

#### 5. Webhook Not Receiving Events

**Solution**:
```bash
# Test webhook manually
curl -X POST https://your-site.com/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "CONNECTION_UPDATE",
    "instance": "test_instance",
    "data": { "state": "open" }
  }'
```

#### 6. "Inbox not found" in Webhook

**Possible causes:**
- Instance name mismatch in database
- Evolution API using different instance name

**Solution**: Check `session_data.instanceName` matches webhook payload

### Debug Checklist

- [ ] Environment variables are set correctly
- [ ] Evolution API is running and accessible
- [ ] Nuxt server is running
- [ ] Database has `inboxes` table with RLS policies
- [ ] Webhook URL is publicly accessible
- [ ] QR code is generated and displayed
- [ ] WhatsApp app is up to date

### Getting Help

- Evolution API Docs: https://doc.evolution-api.com/v2
- Evolution API GitHub: https://github.com/EvolutionAPI/evolution-api
- Supabase Docs: https://supabase.com/docs
- Project Issues: [Your GitHub repo]

---

**Last Updated**: January 9, 2025  
**Version**: 1.0.0  
**Integration Status**: ✅ Fully Implemented
