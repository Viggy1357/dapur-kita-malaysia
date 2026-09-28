/**
 * DapurKita — PriceCatcher price sync script
 *
 * Fetches the latest weekly retail prices from the official Malaysian
 * government data.gov.my PriceCatcher API and writes a versioned
 * prices.json to public/ for the app to consume on load.
 *
 * Usage:
 *   node scripts/sync-prices.mjs
 *   node scripts/sync-prices.mjs --dry-run   (print without writing)
 *
 * Schedule: run weekly via GitHub Actions / Vercel cron / any scheduler.
 *
 * API docs: https://api.data.gov.my/data-catalogue?id=pricecatcher_week
 * Licence:  CC BY 4.0 — KPDN / data.gov.my
 */

import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'public', 'prices.json')
const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Ingredient → PriceCatcher item_code mapping
//
// Codes are from the KPDN standard item list published at:
//   https://storage.data.gov.my/pricecatcher/lookup_item.csv
//
// Where multiple SKUs map to one ingredient we take a representative one
// and average if multiple codes are listed (e.g. chicken by part).
// ---------------------------------------------------------------------------
const INGREDIENT_MAP = {
  rice: {
    label: 'Local rice (beras tempatan)',
    codes: ['1001', '1002'],       // Beras putih tempatan 5kg, 10kg
    unit: 'kg',
    divisor: 1,                    // price per unit in the API
  },
  eggs: {
    label: 'Grade C eggs (telur gred C)',
    codes: ['3001'],               // Telur ayam gred C (10 biji)
    unit: 'eggs',
    divisor: 10,                   // API gives price per 10 eggs → per egg
  },
  chicken: {
    label: 'Fresh chicken (ayam segar)',
    codes: ['2001'],               // Ayam standard (per kg)
    unit: 'kg',
    divisor: 1,
  },
  cabbage: {
    label: 'Cabbage (kobis bulat)',
    codes: ['4009'],
    unit: 'kg',
    divisor: 1,
  },
  carrot: {
    label: 'Carrots (lobak merah)',
    codes: ['4004'],
    unit: 'kg',
    divisor: 1,
  },
  onion: {
    label: 'Red onions (bawang merah)',
    codes: ['4002'],
    unit: 'kg',
    divisor: 1,
  },
  garlic: {
    label: 'Garlic (bawang putih)',
    codes: ['4001'],
    unit: 'kg',
    divisor: 1,
  },
  tomato: {
    label: 'Tomatoes (tomato)',
    codes: ['4006'],
    unit: 'kg',
    divisor: 1,
  },
  cucumber: {
    label: 'Cucumber (timun)',
    codes: ['4007'],
    unit: 'kg',
    divisor: 1,
  },
  noodles: {
    label: 'Yellow noodles (mee kuning)',
    codes: ['5003'],               // Mee kuning basah (500g pack)
    unit: 'packs',
    divisor: 1,
  },
  sardines: {
    label: 'Canned sardines (sardin tin)',
    codes: ['6001'],               // Sardin dalam sos tomato 425g
    unit: 'cans',
    divisor: 1,
  },
  tuna: {
    label: 'Canned tuna (tuna tin)',
    codes: ['6002'],
    unit: 'cans',
    divisor: 1,
  },
  coconutMilk: {
    label: 'Coconut milk (santan)',
    codes: ['7002'],
    unit: 'packs',
    divisor: 1,
  },
  mackerel: {
    label: 'Ikan kembung (Indian mackerel)',
    codes: ['2012'],
    unit: 'kg',
    divisor: 1,
  },
  // Items without PriceCatcher codes fall back to static prices:
  // sambal, tempeh, tofu, spinach, turmeric, soySauce, anchovies, lentils, chickpeas
}

// Median of an array — more robust than mean for price data
function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

async function fetchPricesForCodes(codes) {
  const prices = []
  for (const code of codes) {
    const url = `https://api.data.gov.my/data-catalogue?id=pricecatcher_week&filter=item_code%3A${code}&limit=500`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) { console.warn(`  ⚠ HTTP ${res.status} for item_code ${code}`); continue }
    const json = await res.json()
    const rows = Array.isArray(json) ? json : (json.data ?? [])
    rows.forEach((row) => {
      const p = parseFloat(row.price)
      if (Number.isFinite(p) && p > 0) prices.push(p)
    })
  }
  return prices
}

async function main() {
  console.log('DapurKita PriceCatcher sync starting…')
  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })

  const prices = {}
  const meta = {}

  for (const [id, mapping] of Object.entries(INGREDIENT_MAP)) {
    process.stdout.write(`  Fetching ${id}… `)
    try {
      const rawPrices = await fetchPricesForCodes(mapping.codes)
      if (!rawPrices.length) {
        console.log('no data, will use fallback')
        continue
      }
      const med = median(rawPrices)
      const unitPrice = med / mapping.divisor
      prices[id] = Math.round(unitPrice * 100) / 100
      meta[id] = { label: mapping.label, sampleSize: rawPrices.length, median: med }
      console.log(`RM${prices[id].toFixed(2)} (n=${rawPrices.length})`)
    } catch (err) {
      console.log(`error — ${err.message}, will use fallback`)
    }
  }

  const output = {
    fetchedAt: now.toISOString(),
    dateLabel,
    source: 'data.gov.my PriceCatcher — KPDN © CC BY 4.0',
    apiUrl: 'https://api.data.gov.my/data-catalogue?id=pricecatcher_week',
    prices,
    meta,
  }

  if (DRY_RUN) {
    console.log('\nDry-run output:')
    console.log(JSON.stringify(output, null, 2))
  } else {
    writeFileSync(OUT_PATH, JSON.stringify(output, null, 2))
    console.log(`\n✓ Written to ${OUT_PATH}`)
    console.log(`  ${Object.keys(prices).length}/${Object.keys(INGREDIENT_MAP).length} ingredients updated from live data`)
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
