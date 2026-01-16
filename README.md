# FinT26_01 — Personal Finance Intelligence Platform

## Overview

FinT26_01 is a production-grade personal finance and investment management system designed primarily for Zimbabwean users, with extensibility to regional and international markets.

## Project Philosophy

* **Precise and rigorous** — Production code standards, not tutorial quality
* **Zimbabwe-focused** — Built for local currency realities and financial instruments
* **Educational mandate** — Empowering users with financial literacy
* **Clean architecture** — Feature-based structure with clear separation of concerns

## Technical Stack

* **Framework:** React 18 with TypeScript (strict mode)
* **Build tool:** Vite
* **Styling:** Tailwind CSS with custom design system
* **Routing:** React Router v6
* **State:** Local storage for MVP (extensible to backend)

## Design System

### Colour Palette
* **Primary:** Deep blue (#1e40af) — Trust, stability
* **Secondary:** Muted sky blue (#0284c7) — Clarity
* **Neutrals:** Off-white backgrounds, professional greys
* **Semantic:** Success (green), Warning (amber), Danger (red)

### Typography
* **Font:** Inter (sans-serif)
* **Hierarchy:** Clear, confident headings; neutral, readable body text

### Components
* Cards for grouped financial data
* Generous spacing, grid-based layouts
* Minimal animations, maximum clarity

## Project Structure

```
src/
├── features/           # Feature modules
│   ├── dashboard/      # Financial snapshot and overview
│   ├── transactions/   # Income and expense tracking
│   ├── savings/        # Savings goals management
│   ├── investments/    # Portfolio tracking
│   └── analytics/      # Reports and insights
├── shared/             # Shared resources
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── styles/         # Global styles
└── config/             # Configuration files
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs the app on `http://localhost:3000`

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Core Domain Models

* **Transaction** — Income and expense records
* **SavingsGoal** — Target-based savings tracking
* **Investment** — Portfolio asset management
* **FinancialSnapshot** — Net worth at a point in time
* **MonthlySummary** — Aggregated monthly statistics

## Zimbabwe-Specific Features

* Multi-currency support (USD, ZWL, ZIG)
* Local payment methods (EcoCash, Onamii)
* Unit trusts and fixed income instruments
* Inflation-aware financial advice

## Code Quality Standards

* TypeScript strict mode enabled
* Explicit typing, no implicit any
* Descriptive variable and function names
* Production-grade error handling
* Comments only where reasoning is non-obvious

## Development Principles

1. **Readable over clever** — Code should be self-documenting
2. **Type safety** — Leverage TypeScript fully
3. **Separation of concerns** — Features are independent modules
4. **Progressive enhancement** — Build incrementally on solid foundations

## Next Steps

1. Implement transaction management feature
2. Build savings goals tracking
3. Create investment portfolio module
4. Develop analytics and reporting
5. Add data export functionality

---

**Built for Zimbabwean financial reality.**
