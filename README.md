# Elevata – AI-Powered SME Financial Intelligence Platform

Elevata is a banking-grade financial decision system and analytics dashboard suite built for Small and Medium Enterprises (SMEs) and credit institutions in Rwanda. It operates as an internal analytics hub and AI-driven advisory portal with dynamic credit risk assessment capabilities.

## 🎨 Design System & Aesthetic Principles

Elevata adheres to a clean, data-driven, minimalistic fintech layout:
- **Core Background**: White (`#FFFFFF`) with secondary light slate (`#F8FAFC`).
- **Cards**: Structured white panels with subtle borders (`#E5E7EB`) and lightweight shadows.
- **Accents**: Strict, single accent color (Emerald `#10B981`) for secondary UI emphasis.
- **Status Indicators**:
  - Success: `#10B981` (Emerald)
  - Warning: `#F59E0B` (Amber)
  - Danger: `#EF4444` (Red/Rose)
  - Info: `#3B82F6` (Blue)
- **Typography**:
  - Headings: **Plus Jakarta Sans** (Semi-bold/Bold)
  - Body Copy: **Inter** (Regular/Medium)
  - Metrics / Financial KPIs: **JetBrains Mono** (Monospaced alignment)

## 📊 Modules & Pages

1. **SME Financial Dashboard (`/`)**: High-density business health KPIs, dynamic cash flow widgets, runway monitors, and AI-generated real-time risk alerts.
2. **Inventory Catalog (`/inventory`)**: SKU management catalog displaying reorder points, low-stock warnings, and capital allocation.
3. **Record Customer Invoices (`/sales`)**: Record sales journals, subtract matching stock units, and automatically compute profit impacts.
4. **Financial Performance Reports (`/reports`)**: Double-line trends for revenues and operational cost comparison, paired with historical profit margin analysis.
5. **Loan Simulator (`/advisor`)**: interactive slider modeling credit facilities, principal, and repayment periods against base profit forecasts.
6. **Tech Upgrade Advisor (`/tech-advisor`)**: SME equipment advisor recommending tech upgrades based on sector, with investment ROI modeling.
7. **Business Startup Planner (`/business-advisor`)**: Micro-mart, cafe, and accessory store model planners mapped onto Kigali commercial hub heatmaps (Kimironko, Nyabugogo, Nyamirambo).
8. **Bank Officer Panel (`/banker`)**: Banker interface to review portfolio health, approve/reject simulated credit applications, or request field audits.

## 🛠️ Stack & Setup

- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context (`AppContext.tsx`) with localStorage persistence

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle
npm run build
```
