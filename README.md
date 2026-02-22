# 🛡️ Sentinel-Reviewer

An AI-powered GitHub PR reviewer bot built with NestJS and OpenAI GPT-4o-mini. Automatically reviews pull requests and provides intelligent, actionable feedback.

## ✨ Features

- 🤖 **AI-Powered Reviews** - Uses GPT-4o-mini for intelligent code analysis
- 🔒 **Secure** - Webhook signature verification for GitHub events
- 📝 **Comprehensive Reviews** - Analyzes code for bugs, security issues, and best practices
- 🚀 **Fast** - Asynchronous processing for quick responses
- 🎯 **Focused** - Reviews only code files (supports 20+ languages)

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub App    │────▶│  NestJS Server  │────▶│  OpenAI API     │
│   (Webhooks)    │     │  (Sentinel)     │     │  (GPT-4o-mini)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- GitHub Account
- OpenAI API Key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
OPENAI_API_KEY=sk-your-openai-api-key
GITHUB_APP_ID=your-github-app-id
GITHUB_PRIVATE_KEY=your-private-key-base64-encoded
GITHUB_WEBHOOK_SECRET=your-webhook-secret
PORT=3000
```

### 3. Create a GitHub App

See [GitHub App Setup](#-github-app-setup) section below.

### 4. Run the Server

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 🔧 GitHub App Setup

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**

2. Fill in the details:
   - **GitHub App name**: `Sentinel-Reviewer`
   - **Homepage URL**: `https://github.com/your-username/sentinel-reviewer`
   - **Webhook URL**: `https://your-domain.com/webhook/github`
   - **Webhook secret**: Generate a secure secret

3. Set **Permissions**:
   | Permission | Access |
   |------------|--------|
   | Contents | Read |
   | Pull requests | Read & Write |
   | Metadata | Read |

4. **Subscribe to events**:
   - ✅ Pull request

5. After creation:
   - Note the **App ID**
   - Generate and download a **Private Key**
   - Base64 encode: `base64 -i private-key.pem`

## 🧪 Local Testing with ngrok

```bash
# Terminal 1: Start the server
npm run start:dev

# Terminal 2: Expose with ngrok
ngrok http 3000
```

Update your GitHub App webhook URL with the ngrok URL + `/webhook/github`.

## 🚢 Deployment

### Docker

```bash
docker build -t sentinel-reviewer .
docker run -p 3000:3000 --env-file .env sentinel-reviewer
```

### Railway

```bash
railway login
railway init
railway up
```

## 📁 Project Structure

```
src/
├── config/          # Configuration management
├── github/          # GitHub API & webhook handling
├── openai/          # OpenAI integration
├── review/          # Review orchestration logic
├── app.module.ts    # Main application module
└── main.ts          # Application entry point
```

## 📄 License

MIT License
