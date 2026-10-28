# Comprehensive Trader Analysis (Mindset + Psychology + Technical) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, insightful, and interactive Analysis page (`/analysis`) that synthesizes trade history, psychology logs, and daily reviews into 3 dimensions: Technical Edge, Trading Psychology, and Mindset & Discipline.

---

## File Structure & Responsibilities

- **`src/app/analysis/page.tsx`**: Main Analysis page component. Contains state management for account and time filtering, tabs (Overview, Technical, Psychology, Mindset), calculations, and rich visual components.
- **`src/lib/analysisCalculations.ts`**: Pure calculation helper module for computing metrics across trades and reviews (Trader Score, Strategy stats, Emotion matrices, Rule discipline PnL, Revenge trading patterns).
- **`src/lib/translations.ts`**: Translation dictionaries (`en` and `th`) for all analysis-related terms.

---

## Proposed Tasks

### Task 1: Create Analysis Calculations Utility (`src/lib/analysisCalculations.ts`)
- [ ] Create calculation engine that processes `Trade[]` and `Review[]`:
  - Overall Trader Score (0-100) combining Technical Edge (40%), Psychology Stability (30%), Discipline (30%)
  - Technical: Strategy stats (trades, winRate, netPnL, avgRR), Instrument stats, Direction stats, Planned vs Actual RR, Day of week stats
  - Psychology: Emotion impact (preTrade, duringTrade, postTrade) with trade count, win rate, netPnL; Pitfall frequencies; Energy/Mood correlation with review ratings
  - Mindset & Discipline: Rule compliance rate, PnL with rules vs without rules, Revenge trading detection (lot size increase after consecutive losses), Top mistakes & lessons frequency
  - Actionable Insights: Top 2 strengths, Top 2 fatal leaks, Top 3 focus recommendations

### Task 2: Add Translations for Analysis (`src/lib/translations.ts`)
- [ ] Add translation keys to `translations.ts` in both `en` and `th`:
  - Tab names: Overview, Technical, Psychology, Mindset
  - Metrics: Trader Score, Discipline Rate, Strategy Edge, Emotion Matrix, Pitfall Tracker, Rule Impact
  - Labels and explanatory tooltips

### Task 3: Build the Analysis Page (`src/app/analysis/page.tsx`)
- [ ] Create `/analysis` page with responsive layout:
  - Header with Account switcher, Date range filter (All, 30 Days, 7 Days, This Month)
  - Trader Scorecard Hero banner with breakdown meters
  - Tab switcher:
    - **Tab 1: Overview & AI Coach**: Radar / health bars, key metrics, Strengths & Leaks summary cards
    - **Tab 2: Technical Edge**: Strategy performance table & bars, Pair/Direction breakdown, RR analysis, Day-of-week win rate
    - **Tab 3: Psychology (Psy)**: Emotion P&L Matrix (Pre/During/Post), Pitfalls frequency, Mood & Energy vs Trading performance
    - **Tab 4: Mindset & Discipline**: Followed vs Broke Rules comparison, Cost of breaking rules, Revenge Trading Detector, Mistake distribution
- [ ] Support Dark / Light themes and responsive mobile/desktop view

### Task 4: Verify, Build, and Deploy
- [ ] Run `npm run build` and ensure 0 TypeScript or linting errors
- [ ] Commit and push to repository
- [ ] Deploy to Vercel production
- [ ] Verify functionality and report back to user in Thai
