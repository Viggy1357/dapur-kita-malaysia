import { goalProfiles, ingredientCatalog, meals } from './data.js'

const continuousUnits = new Set(['kg'])

export function pantryQuantity(value) {
  return typeof value === 'number' ? value : Number(value?.quantity || 0)
}

export function mealCost(meal, servings = 1, catalog = ingredientCatalog) {
  return Object.entries(meal.ingredients).reduce(
    (total, [id, quantity]) => total + (catalog[id]?.price ?? ingredientCatalog[id].price) * quantity * servings,
    0,
  )
}

export function buildBasket(plan, pantry = {}, servings = 1, catalog = ingredientCatalog) {
  const required = plan.reduce((all, meal) => {
    Object.entries(meal.ingredients).forEach(([id, quantity]) => {
      all[id] = (all[id] || 0) + quantity * servings
    })
    return all
  }, {})

  const lines = Object.entries(required).map(([id, requiredQuantity]) => {
    const item = catalog[id] ?? ingredientCatalog[id]
    const available = pantryQuantity(pantry[id])
    const ownedQuantity = Math.min(available, requiredQuantity)
    const remainingQuantity = Math.max(0, requiredQuantity - ownedQuantity)
    const buyQuantity = continuousUnits.has(item.unit) ? remainingQuantity : Math.ceil(remainingQuantity - 0.000001)
    return {
      id,
      ...item,
      requiredQuantity,
      ownedQuantity,
      buyQuantity,
      cost: buyQuantity * item.price,
      saved: ownedQuantity * item.price,
      saraPotential: item.sara === 'category' ? buyQuantity * item.price : 0,
    }
  })

  return {
    lines,
    shopping: lines.filter((line) => line.buyQuantity > 0.001),
    owned: lines.filter((line) => line.ownedQuantity > 0.001),
    total: lines.reduce((sum, line) => sum + line.cost, 0),
    consumedValue: lines.reduce((sum, line) => sum + line.requiredQuantity * line.price, 0),
    saved: lines.reduce((sum, line) => sum + line.saved, 0),
    saraPotential: lines.reduce((sum, line) => sum + line.saraPotential, 0),
  }
}

// Re-export ingredientCatalog so callers can fall back to it
export { ingredientCatalog }

export function summarizePlan(plan) {
  const count = Math.max(plan.length, 1)
  return {
    protein: plan.reduce((sum, meal) => sum + meal.protein, 0) / count,
    carbs: plan.reduce((sum, meal) => sum + meal.carbs, 0) / count,
    fat: plan.reduce((sum, meal) => sum + meal.fat, 0) / count,
    calories: plan.reduce((sum, meal) => sum + meal.calories, 0) / count,
    veg: plan.reduce((sum, meal) => sum + meal.veg, 0) / count,
    time: plan.reduce((sum, meal) => sum + meal.time, 0) / count,
  }
}

function allowedForDay(meal, index, settings, constraints, catalog = ingredientCatalog) {
  if (meal.time > settings.maxPrep) return false
  if (settings.diet === 'vegetarian' && !meal.vegetarian) return false
  if (settings.diet === 'eggFree' && !meal.eggFree) return false
  if (constraints.noChicken && meal.ingredients.chicken) return false
  if (constraints.quickTomorrow && index === 1 && meal.time > 15) return false
  if (constraints.vegetarianFriday && index === 4 && !meal.vegetarian) return false
  return true
}

function planScore(plan, pantry, settings, catalog = ingredientCatalog) {
  const profile = goalProfiles[settings.goal]
  const summary = summarizePlan(plan)
  const basket = buildBasket(plan, pantry, settings.servings, catalog)
  const cuisines = new Set(plan.map((meal) => meal.cuisine)).size
  const pantryMatches = basket.owned.length
  const proteinScore = Math.min(summary.protein / profile.protein, 1.15) * 34
  const calorieScore = summary.calories <= profile.maxCalories ? 18 : Math.max(0, 18 - (summary.calories - profile.maxCalories) * 0.25)
  const vegScore = Math.min(summary.veg / profile.veg, 1.15) * 18
  const varietyScore = cuisines * 3
  const pantryScore = pantryMatches * 1.5
  const budgetScore = Math.max(0, 12 - Math.abs(settings.budget * 0.82 - basket.total) * 0.35)
  return proteinScore + calorieScore + vegScore + varietyScore + pantryScore + budgetScore
}

function partialScore(plan, pantry, settings, catalog = ingredientCatalog) {
  if (!plan.length) return 0
  const summary = summarizePlan(plan)
  const profile = goalProfiles[settings.goal]
  const pantryIds = new Set(Object.entries(pantry).filter(([, value]) => pantryQuantity(value) > 0).map(([id]) => id))
  const matches = plan.reduce((sum, meal) => sum + Object.keys(meal.ingredients).filter((id) => pantryIds.has(id)).length, 0)
  return Math.min(summary.protein / profile.protein, 1.2) * 30 + Math.min(summary.veg / profile.veg, 1.2) * 16 + matches
}

export function validatePlan(plan, pantry, settings, constraints, catalog = ingredientCatalog) {
  const reasons = []
  if (plan.length !== settings.mealsCount) reasons.push(`Needs ${settings.mealsCount} meals`)
  if (new Set(plan.map((meal) => meal.id)).size !== plan.length) reasons.push('Meal repetition is not allowed')
  plan.forEach((meal, index) => {
    if (meal.time > settings.maxPrep) reasons.push(`${meal.name} exceeds ${settings.maxPrep} minutes`)
    if (settings.diet === 'vegetarian' && !meal.vegetarian) reasons.push(`${meal.name} is not vegetarian`)
    if (settings.diet === 'eggFree' && !meal.eggFree) reasons.push(`${meal.name} contains egg`)
    if (constraints.noChicken && meal.ingredients.chicken) reasons.push(`${meal.name} contains chicken`)
    if (constraints.quickTomorrow && index === 1 && meal.time > 15) reasons.push(`${meal.name} exceeds tomorrow's 15-minute limit`)
    if (constraints.vegetarianFriday && index === 4 && !meal.vegetarian) reasons.push(`${meal.name} makes Friday non-vegetarian`)
  })
  const basket = buildBasket(plan, pantry, settings.servings, catalog)
  if (basket.total > settings.budget + 0.001) reasons.push(`Basket is RM${(basket.total - settings.budget).toFixed(2)} over budget`)
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)], basket }
}

export function optimizePlan(settings, constraints, pantry, catalog = ingredientCatalog) {
  let states = [{ plan: [], used: new Set(), score: 0 }]
  for (let index = 0; index < settings.mealsCount; index += 1) {
    const expanded = []
    states.forEach((state) => {
      meals.forEach((meal) => {
        if (state.used.has(meal.id) || !allowedForDay(meal, index, settings, constraints, catalog)) return
        const plan = [...state.plan, meal]
        expanded.push({ plan, used: new Set([...state.used, meal.id]), score: partialScore(plan, pantry, settings, catalog) })
      })
    })
    states = expanded.sort((a, b) => b.score - a.score || a.plan.map((meal) => meal.id).join().localeCompare(b.plan.map((meal) => meal.id).join())).slice(0, 300)
    if (!states.length) break
  }

  const ranked = states.map((state) => {
    const validation = validatePlan(state.plan, pantry, settings, constraints, catalog)
    return { ...state, ...validation, score: planScore(state.plan, pantry, settings, catalog) }
  }).sort((a, b) => Number(b.valid) - Number(a.valid) || b.score - a.score || a.basket.total - b.basket.total)

  const feasible = ranked.find((state) => state.valid)
  if (feasible) return { plan: feasible.plan, basket: feasible.basket, feasible: true, reasons: [], minimumBudget: feasible.basket.total }
  const closest = [...ranked].sort((a, b) => a.reasons.length - b.reasons.length || a.basket.total - b.basket.total)[0]
  if (!closest) return { plan: [], basket: buildBasket([], pantry, settings.servings, catalog), feasible: false, reasons: ['No meals satisfy the dietary and time constraints'], minimumBudget: null }
  return { plan: closest.plan, basket: closest.basket, feasible: false, reasons: closest.reasons, minimumBudget: closest.basket.total }
}

export function swapOptions(plan, index, pantry, settings, constraints, catalog = ingredientCatalog) {
  return meals.filter((meal) => meal.id !== plan[index]?.id).map((meal) => {
    const candidate = plan.map((planned, position) => position === index ? meal : planned)
    const validation = validatePlan(candidate, pantry, settings, constraints, catalog)
    return { meal, ...validation }
  }).sort((a, b) => Number(b.valid) - Number(a.valid) || a.basket.total - b.basket.total)
}

export function parseAdjustment(command, settings, constraints) {
  const text = command.toLowerCase().trim()
  const nextSettings = { ...settings }
  const nextConstraints = { ...constraints }
  const changes = []
  const explicitBudget = text.match(/(?:budget(?: to| is)?|rm)\s*rm?\s*(\d+(?:\.\d+)?)/)
  const reduction = text.match(/reduce(?: the)? budget(?: by)?\s*rm?\s*(\d+(?:\.\d+)?)/)
  const increase = text.match(/(?:increase|raise|set)(?: the)? budget(?: to| by)?\s*rm?\s*(\d+(?:\.\d+)?)/)
  if (reduction) {
    nextSettings.budget = Math.max(10, settings.budget - Number(reduction[1]))
    changes.push(`Budget reduced to RM${nextSettings.budget.toFixed(0)}`)
  } else if (increase) {
    nextSettings.budget = Math.max(10, settings.budget + Number(increase[1]))
    changes.push(`Budget raised to RM${nextSettings.budget.toFixed(0)}`)
  } else if (explicitBudget) {
    nextSettings.budget = Math.max(10, Number(explicitBudget[1]))
    changes.push(`Budget set to RM${nextSettings.budget.toFixed(0)}`)
  }
  if (text.includes('friday') && text.includes('vegetarian')) {
    nextConstraints.vegetarianFriday = true
    changes.push('Friday locked to vegetarian meals')
  }
  if (text.includes('no chicken') || text.includes("don't want chicken") || text.includes('without chicken') || text.includes('remove chicken')) {
    nextConstraints.noChicken = true
    changes.push('Chicken excluded')
  }
  if (text.includes('no egg') || text.includes('egg-free') || text.includes('egg free')) {
    nextSettings.diet = 'eggFree'
    changes.push('Egg-free diet applied')
  }
  if (text.includes('vegetarian') && !text.includes('friday')) {
    nextSettings.diet = 'vegetarian'
    changes.push('Vegetarian diet applied')
  }
  if ((text.includes('tomorrow') || text.includes('tuesday')) && (text.includes('15 min') || text.includes('15 minute') || text.includes('quick'))) {
    nextConstraints.quickTomorrow = true
    changes.push('Tomorrow limited to 15 minutes')
  }
  const servingsMatch = text.match(/(\d+)\s*(?:people|person|serving|servings|pax)/)
  if (servingsMatch) {
    nextSettings.servings = Math.min(6, Math.max(1, Number(servingsMatch[1])))
    changes.push(`Servings set to ${nextSettings.servings}`)
  }
  const mealsMatch = text.match(/(\d+)\s*meal/)
  if (mealsMatch) {
    nextSettings.mealsCount = Math.min(7, Math.max(3, Number(mealsMatch[1])))
    changes.push(`Meal count set to ${nextSettings.mealsCount}`)
  }
  if (text.includes('high protein') || text.includes('more protein')) {
    nextSettings.goal = 'protein'
    changes.push('High-protein goal applied')
  }
  if (text.includes('lighter') || text.includes('lower calorie') || text.includes('light meal')) {
    nextSettings.goal = 'lighter'
    changes.push('Lighter-meal goal applied')
  }
  if (text.includes('balanced')) {
    nextSettings.goal = 'balanced'
    changes.push('Balanced-eating goal applied')
  }
  return { settings: nextSettings, constraints: nextConstraints, changes }
}

export const parseAdjustmentHints = [
  'Set budget to RM80',
  'Reduce budget by RM10',
  'Make Friday vegetarian',
  'No chicken',
  'Lighter meals',
  'High protein',
  'Balanced eating',
  '3 people',
  '7 meals',
  'Quick tomorrow',
]

export function macroStatus(plan, goal) {
  const summary = summarizePlan(plan)
  const profile = goalProfiles[goal]
  const checks = [
    { label: 'Protein', value: `${Math.round(summary.protein)} g`, met: summary.protein >= profile.protein },
    { label: 'Vegetables', value: `${summary.veg.toFixed(1)} servings`, met: summary.veg >= profile.veg },
    { label: 'Calories', value: `${Math.round(summary.calories)} kcal`, met: summary.calories <= profile.maxCalories },
  ]
  return { summary, checks, onTrack: checks.filter((check) => check.met).length >= 2 }
}
