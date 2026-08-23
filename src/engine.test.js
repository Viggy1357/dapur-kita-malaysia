import test from 'node:test'
import assert from 'node:assert/strict'
import { ingredientCatalog, initialPantry } from './data.js'
import { buildBasket, optimizePlan, parseAdjustment, swapOptions, validatePlan } from './engine.js'

const settings = { budget: 60, mealsCount: 5, servings: 2, maxPrep: 30, goal: 'protein', diet: 'halal', location: 'Kuala Lumpur' }
const constraints = { vegetarianFriday: false, noChicken: false, quickTomorrow: false }

test('optimizer returns a unique plan within every hard constraint', () => {
  const result = optimizePlan(settings, constraints, initialPantry)
  assert.equal(result.feasible, true)
  assert.equal(result.plan.length, 5)
  assert.equal(new Set(result.plan.map((meal) => meal.id)).size, 5)
  assert.ok(result.basket.total <= settings.budget)
  assert.equal(validatePlan(result.plan, initialPantry, settings, constraints).valid, true)
})

test('combined constraints remain enforced', () => {
  const strict = { vegetarianFriday: true, noChicken: true, quickTomorrow: true }
  const result = optimizePlan(settings, strict, initialPantry)
  assert.equal(result.feasible, true)
  assert.equal(Boolean(result.plan[4].vegetarian), true)
  assert.equal(result.plan.some((meal) => meal.ingredients.chicken), false)
  assert.ok(result.plan[1].time <= 15)
})

test('infeasible budgets are reported instead of labelled safe', () => {
  const result = optimizePlan({ ...settings, budget: 10 }, constraints, initialPantry)
  assert.equal(result.feasible, false)
  assert.ok(result.reasons.some((reason) => reason.includes('over budget')))
})

test('swap options never mark an invalid replacement as valid', () => {
  const strictSettings = { ...settings, budget: 70, maxPrep: 15 }
  const strict = { vegetarianFriday: true, noChicken: true, quickTomorrow: true }
  const result = optimizePlan(strictSettings, strict, initialPantry)
  assert.equal(result.feasible, true)
  const options = swapOptions(result.plan, 4, initialPantry, strictSettings, strict)
  options.filter((option) => option.valid).forEach((option) => {
    const candidate = result.plan.map((meal, index) => index === 4 ? option.meal : meal)
    assert.equal(validatePlan(candidate, initialPantry, strictSettings, strict).valid, true)
  })
  assert.ok(options.some((option) => !option.valid))
})

test('pantry is aggregated and deducted once', () => {
  const result = optimizePlan(settings, constraints, initialPantry)
  const basket = buildBasket(result.plan, initialPantry, settings.servings)
  basket.lines.forEach((line) => assert.ok(line.ownedQuantity <= line.requiredQuantity))
  const cabbage = basket.lines.find((line) => line.id === 'cabbage')
  if (cabbage) assert.ok(cabbage.ownedQuantity <= initialPantry.cabbage.quantity)
})

test('natural-language adjustment produces structured changes', () => {
  const result = parseAdjustment('Make Friday vegetarian and reduce budget by RM10 with no chicken', settings, constraints)
  assert.equal(result.settings.budget, 50)
  assert.equal(result.constraints.vegetarianFriday, true)
  assert.equal(result.constraints.noChicken, true)
  assert.equal(result.changes.length, 3)
})

test('constraint matrix never reports an invalid plan as feasible', () => {
  const diets = ['halal', 'vegetarian', 'eggFree']
  const preparationLimits = [15, 20, 30]
  const constraintSets = [
    constraints,
    { ...constraints, noChicken: true },
    { vegetarianFriday: true, noChicken: true, quickTomorrow: true },
  ]
  diets.forEach((diet) => preparationLimits.forEach((maxPrep) => constraintSets.forEach((activeConstraints) => {
    const scenario = { ...settings, budget: 100, servings: 1, diet, maxPrep, goal: diet === 'vegetarian' ? 'balanced' : 'protein' }
    const result = optimizePlan(scenario, activeConstraints, initialPantry)
    if (result.feasible) assert.equal(validatePlan(result.plan, initialPantry, scenario, activeConstraints).valid, true)
    else assert.ok(result.reasons.length > 0)
  })))
})

test('fresh chicken and onions are not presented as SARA-covered categories', () => {
  assert.equal(ingredientCatalog.chicken.sara, null)
  assert.equal(ingredientCatalog.onion.sara, null)
  assert.equal(ingredientCatalog.rice.sara, 'category')
  assert.equal(ingredientCatalog.sardines.sara, 'category')
})
