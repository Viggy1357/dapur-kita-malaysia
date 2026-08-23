# DapurKita Malaysia

DapurKita is a Malaysian budget-to-basket food decision engine. It turns a household's budget, nutrition goal, schedule and pantry into meals they can cook and an estimated shopping basket they can afford.

The prototype contains three connected journeys:

- **DapurPlan** — deterministic, macro-aware meal optimisation with validated natural-language adjustments and swaps.
- **DapurRahmah** — transparent SARA category estimates, cash requirements and pantry deductions without claiming MyKad payment or SKU verification.
- **DapurRescue** — editable pantry quantities, freshness priority and a dynamic ingredient reuse map.

## Highlights

- 16 curated Malaysian meals and 23 ingredients
- Budget, servings, meal count, dietary and preparation-time constraints
- High-protein, balanced and lighter macro profiles
- Deterministic validation for every generated plan and swap
- Explicit infeasible states and top-up requirements
- Natural-language commands converted into structured constraints
- Pantry-aware retail basket with package rounding
- SARA category-level estimates with SKU-verification caveats
- Dynamic impact calculations with visible assumptions
- Local browser persistence
- Responsive and accessible React interface

## Technology

- React 19
- Vite 7
- Lucide React
- Node's built-in test runner
- Static client-side deployment

The optimizer, calculations and validation are deterministic. No external AI service, API key, backend or user account is required for this prototype.

## Run locally

Requirements:

- Node.js 20.19+ or Node.js 22.12+
- npm

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Test and build

```bash
npm test
npm run build
npm run preview
```

The automated suite covers:

- Unique plan generation
- Combined dietary and schedule constraints
- Infeasible budgets
- Validated swaps
- Pantry aggregation
- Natural-language intent parsing
- Constraint-matrix safety
- SARA category classifications

## Architecture

```text
User preferences and adjustment
              ↓
Structured constraints
              ↓
Deterministic meal optimizer
              ↓
Budget, nutrition and pantry calculations
              ↓
Validation layer
              ↓
Meals, basket, funding split and explanations
```

A future language model may extract intent or explain a validated result, but it must not generate authoritative prices, nutrition totals, SARA eligibility or final basket calculations.

## Prototype data boundaries

- Nutrition values are curated prototype estimates modelled on Malaysian Food Composition Database fields.
- Prices are a static prototype snapshot inspired by PriceCatcher and are not live retailer inventory.
- SARA values indicate potential published-category coverage, not exact SKU eligibility.
- The app cannot check SARA eligibility, read a MyKad balance or authorise payment.
- Health and waste figures are planning estimates, not measured outcomes or medical advice.

Official references:

- [Malaysian Food Composition Database](https://myfcd.moh.gov.my/)
- [PriceCatcher data catalogue](https://data.gov.my/data-catalogue/pricecatcher)
- [Official SARA portal](https://sara.gov.my/en/home.html)

## Deployment

The application builds to the `dist` directory and can be deployed directly to Vercel as a Vite project. No environment variables are required.
