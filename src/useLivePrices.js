/**
 * useLivePrices — React hook
 *
 * Fetches /prices.json (updated weekly by scripts/sync-prices.mjs via
 * GitHub Actions) and returns a merged ingredient catalog where any
 * ingredient covered by PriceCatcher has its price replaced with the
 * latest government-sourced median retail price.
 *
 * Falls back silently to the static catalog prices if the fetch fails or
 * the JSON is malformed, so the app always works offline.
 *
 * Return shape:
 *   {
 *     catalog:    { [id]: ingredientEntry },   // merged catalog
 *     priceDate:  string,                       // "22 Aug 2026" or similar
 *     priceSource: string,                      // attribution string
 *     isLive:     boolean,                      // true = PriceCatcher data loaded
 *     updatedIds: string[],                     // which ingredient IDs got live prices
 *   }
 */

import { useEffect, useState } from 'react'
import { ingredientCatalog, dataSnapshot } from './data.js'

const STATIC_FALLBACK = {
  catalog: ingredientCatalog,
  priceDate: dataSnapshot.priceDate,
  priceSource: dataSnapshot.priceSource,
  isLive: false,
  updatedIds: [],
}

export function useLivePrices() {
  const [state, setState] = useState(STATIC_FALLBACK)

  useEffect(() => {
    let cancelled = false
    fetch('/prices.json', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const livePrices = data?.prices ?? {}
        if (!Object.keys(livePrices).length) return  // empty → keep fallback

        const updatedIds = []
        const merged = Object.fromEntries(
          Object.entries(ingredientCatalog).map(([id, entry]) => {
            if (livePrices[id] != null) {
              updatedIds.push(id)
              return [id, { ...entry, price: livePrices[id] }]
            }
            return [id, entry]
          })
        )

        setState({
          catalog: merged,
          priceDate: data.dateLabel ?? data.fetchedAt?.slice(0, 10) ?? dataSnapshot.priceDate,
          priceSource: `KPDN PriceCatcher · ${data.dateLabel ?? ''} · CC BY 4.0`,
          isLive: true,
          updatedIds,
        })
      })
      .catch(() => { /* silently keep static fallback */ })

    return () => { cancelled = true }
  }, [])

  return state
}
