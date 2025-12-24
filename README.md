<p align="center">
  <img src="https://www.aiassesstech.com/logo-256.png" alt="AI Assessment Tool Logo" width="128" height="128">
</p>

<h1 align="center">AI Assessment Tool</h1>

<p align="center">
  <strong>What's Your AI's Ethics Score?</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@aiassesstech/sdk">
    <img src="https://img.shields.io/npm/v/@aiassesstech/sdk?label=SDK&color=green" alt="npm version">
  </a>
  <a href="https://aiassessmenttool.com">
    <img src="https://img.shields.io/badge/demo-live-brightgreen" alt="Live Demo">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-14.2-black" alt="Next.js">
  </a>
</p>

<p align="center">
  Test your AI system across 4 ethical dimensions in under 15 minutes.<br/>
  Free, open-source, and your API key never leaves your browser.
</p>

---

## 🌟 What is This?

The **AI Assessment Tool** is a standalone demo application that tests AI systems for ethical alignment. It uses the [AI Assess Tech SDK](https://www.npmjs.com/package/@aiassesstech/sdk) to evaluate AI responses against 120 questions across four dimensions:

| Dimension | What It Tests |
|-----------|--------------|
| 🤥 **Lying** | Honesty, truthfulness, and deception avoidance |
| 🎲 **Cheating** | Fair play, rule-following, and integrity |
| 🏴‍☠️ **Stealing** | Respect for ownership and intellectual property |
| ⚠️ **Harm** | Safety, avoiding damage, and protective behavior |

---

## ✨ Key Features

- 🔑 **Bring Your Own Key (BYOK)** - Your OpenAI/Anthropic API key never touches our servers
- 🎯 **Lead Capture** - Collects email and company before assessment
- ⚙️ **Configurable Thresholds** - Set custom pass/fail criteria per dimension
- 📊 **Real-time Progress** - Watch the 120-question assessment run live
- ✅ **Instant Results** - Pass/fail determination with detailed scores
- 🔗 **Verification URLs** - Shareable, tamper-proof verification links
- 💾 **Saved Prompts** - Save and reuse system prompts locally

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  Landing    │ ─> │  Configure   │ ─> │   Assess      │  │
│  │  (Lead)     │    │  (API Key)   │    │   (Questions) │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│                            │                     │          │
│                            v                     v          │
│                    ┌───────────────┐    ┌───────────────┐  │
│                    │  localStorage │    │  OpenAI API   │  │
│                    │  (config)     │    │  (in browser) │  │
│                    └───────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            v
              ┌─────────────────────────┐
              │   AI Assess Tech API    │
              │  (Lead registration,    │
              │   scoring, verification)│
              └─────────────────────────┘
```

### Security Model

Your API key stays completely in your browser:

1. **Input** - You paste your API key
2. **Storage** - Stored in browser `localStorage` (cleared on page load)
3. **Usage** - Direct browser-to-OpenAI/Anthropic calls
4. **Result** - Only responses (not keys) sent to our API for scoring

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **npm** or **yarn**
- **OpenAI API Key** or **Anthropic API Key**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-assessment-tool.git
cd ai-assessment-tool

# Install dependencies
npm install

# Copy environment example
cp env.example .env.local

# Start development server
npm run dev
```

The app runs at **http://localhost:3001** (port 3001 to avoid conflicts with other apps).

### Production Build

```bash
npm run build
npm start
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file from `env.example`:

```env
# AI Assess Tech API URL (for lead registration and scoring)
NEXT_PUBLIC_API_URL=https://www.aiassesstech.com

# Optional: Health Check API Key (for server-side validation)
# Leave empty if not needed - the demo works without it
NEXT_PUBLIC_HEALTH_CHECK_KEY=
```

### Self-Hosted Setup

To run your own instance:

1. **Clone this repo** and set up environment
2. **Configure API URL** to point to your AI Assess Tech instance
3. **Deploy to Vercel** (or any Node.js host)

---

## 📱 Pages & Flow

| Route | Purpose |
|-------|---------|
| `/` | Landing page with lead capture form |
| `/configure` | API key input, model selection, system prompt, thresholds |
| `/assess` | Real-time progress during 120-question assessment |
| `/results/[runId]` | Results with scores, pass/fail, and verification link |

### User Flow

```
📧 Enter Email → 🔑 Enter API Key → 📝 Configure Prompt → ▶️ Run Assessment → 📊 View Results
```

---

## 🔧 Supported AI Providers

### OpenAI
- GPT-4 (Recommended)
- GPT-4 Turbo (Faster)
- GPT-4o (Latest)
- GPT-3.5 Turbo (Budget)

### Anthropic (Claude)
- Claude 4 Sonnet (Latest)
- Claude 4 Opus (Most Capable)
- Claude 3.5 Sonnet (Stable)
- Claude 3.5 Haiku (Fast)
- Claude 3 Haiku (Budget)

---

## ⏱️ Time Estimates

| Model | Estimated Time |
|-------|----------------|
| GPT-3.5 Turbo | 4-6 minutes |
| GPT-4 Turbo | 6-10 minutes |
| GPT-4 | 8-12 minutes |
| Claude 3 Haiku | 3-5 minutes |
| Claude 3.5 Sonnet | 8-12 minutes |
| Claude 4 Opus | 10-15 minutes |

---

## 🛠️ Development

### Project Structure

```
ai-assessment-tool/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Landing (lead capture)
│   │   ├── configure/       # API key & config
│   │   ├── assess/          # Assessment runner
│   │   ├── results/         # Results display
│   │   └── api/             # API routes (proxy, rate-limit)
│   ├── components/          # Reusable UI components
│   │   ├── APIKeyInput.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── SavedPrompts.tsx
│   │   ├── SystemPromptEditor.tsx
│   │   └── ThresholdSliders.tsx
│   └── lib/                 # Utilities
│       ├── assessment.ts    # Config/result management
│       ├── leads.ts         # Lead registration
│       └── prompts.ts       # Saved prompts storage
├── public/                  # Static assets
├── env.example              # Environment template
├── package.json
└── README.md
```

### Key Technologies

- **[Next.js 14](https://nextjs.org)** - React framework with App Router
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first styling
- **[Radix UI](https://radix-ui.com)** - Accessible component primitives
- **[Lucide Icons](https://lucide.dev)** - Beautiful icon set
- **[OpenAI SDK](https://github.com/openai/openai-node)** - OpenAI API client
- **[@aiassesstech/sdk](https://www.npmjs.com/package/@aiassesstech/sdk)** - Health check SDK

### Scripts

```bash
npm run dev      # Start development server on port 3001
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-assessment-tool)

1. Click "Deploy with Vercel"
2. Set environment variables in Vercel dashboard
3. Deploy!

### Manual Deployment

```bash
# Build
npm run build

# Deploy to your hosting provider
# Upload .next/, node_modules/, package.json, and public/
```

### Environment Variables for Production

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | AI Assess Tech API URL |
| `NEXT_PUBLIC_HEALTH_CHECK_KEY` | ❌ | Optional demo key |

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Flow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📋 Roadmap

- [ ] **Chat Interface** - Chat with your AI after it passes
- [ ] **Email Verification** - Verify leads before assessment
- [ ] **Cloud Prompts** - Sync saved prompts across devices
- [ ] **CAPTCHA** - Rate limiting with hCaptcha/Turnstile
- [ ] **Assessment History** - View past assessments
- [ ] **PDF Reports** - Export results as PDF

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live Demo:** [aiassessmenttool.com](https://aiassessmenttool.com)
- **Main Platform:** [aiassesstech.com](https://www.aiassesstech.com)
- **SDK on npm:** [@aiassesstech/sdk](https://www.npmjs.com/package/@aiassesstech/sdk)
- **Documentation:** [aiassesstech.com/docs](https://www.aiassesstech.com/docs)

---

## 💬 Support

- **Email:** support@aiassesstech.com
- **Issues:** [GitHub Issues](https://github.com/yourusername/ai-assessment-tool/issues)

---

<p align="center">
  Made with ❤️ by <a href="https://www.aiassesstech.com">AI Assess Tech</a>
</p>
