# Contributing to AI Assessment Tool

Thank you for your interest in contributing to the AI Assessment Tool! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Issues](#reporting-issues)

---

## 📜 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow:

- **Be respectful** - Treat everyone with respect and kindness
- **Be constructive** - Provide helpful feedback and suggestions
- **Be inclusive** - Welcome people of all backgrounds and skill levels
- **Be patient** - Remember that everyone is learning

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- An OpenAI or Anthropic API key (for testing)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/ai-assessment-tool.git
cd ai-assessment-tool
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/aiassesstech/ai-assessment-tool.git
```

---

## 🛠️ Development Setup

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_URL=https://www.aiassesstech.com
```

### Start Development Server

```bash
npm run dev
```

The app runs at http://localhost:3001

### Run Linting

```bash
npm run lint
```

### Build for Production

```bash
npm run build
```

---

## ✏️ Making Changes

### Branch Naming Convention

Use descriptive branch names:

- `feature/` - New features (e.g., `feature/anthropic-support`)
- `fix/` - Bug fixes (e.g., `fix/api-key-validation`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/assessment-flow`)

### Creating a Branch

```bash
# Sync with upstream first
git fetch upstream
git checkout main
git merge upstream/main

# Create your branch
git checkout -b feature/your-feature-name
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, no code change
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

Examples:
```
feat(configure): add Anthropic provider support
fix(assessment): handle API timeout gracefully
docs(readme): add deployment instructions
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run linting:**
   ```bash
   npm run lint
   ```

3. **Build successfully:**
   ```bash
   npm run build
   ```

4. **Test manually:**
   - Complete the full assessment flow
   - Test with both OpenAI and Anthropic (if applicable)
   - Verify responsive design on mobile

### Submitting the PR

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request on GitHub

3. Fill out the PR template:
   - **Description** - What does this PR do?
   - **Motivation** - Why is this change needed?
   - **Testing** - How did you test this?
   - **Screenshots** - Include if UI changes

### Review Process

- A maintainer will review your PR
- Address any requested changes
- Once approved, a maintainer will merge

---

## 📏 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types and interfaces
- Avoid `any` types when possible

```typescript
// ✅ Good
interface AssessmentConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
}

function validateConfig(config: AssessmentConfig): boolean {
  return !!(config.apiKey && config.systemPrompt);
}

// ❌ Avoid
function validateConfig(config: any): boolean {
  return !!(config.apiKey && config.systemPrompt);
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Use descriptive prop names

```tsx
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, disabled = false, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={variant === 'primary' ? 'bg-green-500' : 'bg-gray-500'}
    >
      {label}
    </button>
  );
}
```

### Styling

- Use Tailwind CSS classes
- Follow the existing color scheme (green accents, dark theme)
- Ensure responsive design (mobile-first)

```tsx
// ✅ Good - Responsive with consistent colors
<div className="p-4 sm:p-6 lg:p-8 bg-white/5 border border-white/10 rounded-lg">
  <h2 className="text-lg sm:text-xl font-semibold text-white">Title</h2>
</div>
```

### File Organization

- Keep related files together
- Export from index files when appropriate
- Use consistent naming (PascalCase for components, camelCase for utilities)

```
components/
├── APIKeyInput.tsx
├── ModelSelector.tsx
├── index.ts          # export * from './APIKeyInput'; etc.
└── ui/
    ├── Button.tsx
    └── Input.tsx
```

---

## 🐛 Reporting Issues

### Bug Reports

Use the bug report template and include:

1. **Description** - Clear description of the bug
2. **Steps to Reproduce** - Exact steps to trigger the issue
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Browser, OS, Node.js version
6. **Screenshots** - If applicable

### Feature Requests

Use the feature request template and include:

1. **Problem** - What problem does this solve?
2. **Solution** - Your proposed solution
3. **Alternatives** - Other solutions you considered
4. **Context** - Any additional context

---

## 🙏 Thank You

Thank you for contributing to the AI Assessment Tool! Your contributions help make AI ethics assessment accessible to everyone.

If you have questions, reach out at support@aiassesstech.com or open a GitHub issue.

