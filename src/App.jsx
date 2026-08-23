import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calculator,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  CookingPot,
  HeartPulse,
  Info,
  Leaf,
  Menu,
  Minus,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  WalletCards,
  X,
  Zap,
} from 'lucide-react'
import { dataSnapshot, goalProfiles, ingredientCatalog, initialPantry, locations, meals, weekdays } from './data.js'
import { buildBasket, macroStatus, mealCost, optimizePlan, parseAdjustment, swapOptions, validatePlan } from './engine.js'

const defaultSettings = {
  budget: 60,
  mealsCount: 5,
  servings: 2,
  maxPrep: 30,
  goal: 'protein',
  diet: 'halal',
  location: 'Kuala Lumpur',
  saraBalance: 100,
  cashBalance: 20,
}

const defaultConstraints = { vegetarianFriday: false, noChicken: false, quickTomorrow: false }

const navItems = [
  { id: 'plan', label: 'DapurPlan', icon: CalendarDays },
  { id: 'basket', label: 'DapurRahmah', icon: ShoppingBasket },
  { id: 'pantry', label: 'DapurRescue', icon: PackageCheck },
  { id: 'impact', label: 'My impact', icon: BarChart3 },
]

const formatMoney = (value) => `RM${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`
const inputNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function quantityText(line, key = 'buyQuantity') {
  const quantity = Number(line[key] || 0)
  if (line.unit === 'kg') return `${Math.round(quantity * 1000)} g`
  if (line.unit === 'eggs') return `${Math.ceil(quantity)} ${Math.ceil(quantity) === 1 ? 'egg' : 'eggs'}`
  return `${Number(quantity.toFixed(1))} ${line.unit}`
}

function Logo({ onClick }) {
  return (
    <button className="brand brand-button" aria-label="Open DapurPlan" onClick={onClick}>
      <span className="brand-mark"><CookingPot size={21} strokeWidth={2.3} /></span>
      <span className="brand-name">Dapur<span>Kita</span></span>
    </button>
  )
}

function FoodVisual({ meal, compact = false }) {
  return (
    <div className={`food-visual ${meal.color} ${compact ? 'compact' : ''}`} aria-hidden="true">
      <span className="leaf leaf-a" />
      <span className="leaf leaf-b" />
      <div className="plate">
        <span className="food food-a" />
        <span className="food food-b" />
        <span className="food food-c" />
        <span className="food food-d" />
      </div>
    </div>
  )
}

function ModalShell({ titleId, className = '', onClose, children }) {
  const modalRef = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    modalRef.current?.focus()
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      previous?.focus?.()
    }
  }, [onClose])
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section ref={modalRef} tabIndex="-1" className={`modal ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </section>
    </div>
  )
}

function TopBar({ activeView, setActiveView, onSettings }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = (view) => { setActiveView(view); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Logo onClick={() => navigate('plan')} />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={activeView === item.id ? 'active' : ''} aria-current={activeView === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.label}</button>)}
        </nav>
        <div className="header-actions">
          <button className="icon-button desktop-only" aria-label="Open plan settings" onClick={onSettings}><Settings2 size={19} /></button>
          <button className="avatar" aria-label="Open Aina's preferences" onClick={onSettings}>AN</button>
          <button className="icon-button mobile-menu" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return <button key={item.id} className={activeView === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><Icon size={18} /> {item.label}</button>
          })}
          <button onClick={() => { onSettings(); setMobileOpen(false) }}><Settings2 size={18} /> Plan settings</button>
        </nav>
      )}
    </header>
  )
}

function JourneyStrip({ activeView, setActiveView }) {
  const journeys = [
    { id: 'plan', label: '1 · Plan', text: 'Optimise meals and macros', icon: CalendarDays },
    { id: 'basket', label: '2 · Fund', text: 'Split SARA and cash', icon: WalletCards },
    { id: 'pantry', label: '3 · Rescue', text: 'Use at-risk ingredients', icon: PackageCheck },
  ]
  return (
    <div className="journey-strip" aria-label="DapurKita journeys">
      {journeys.map((journey) => {
        const Icon = journey.icon
        return <button key={journey.id} className={activeView === journey.id ? 'active' : ''} onClick={() => setActiveView(journey.id)}><Icon size={18} /><span><strong>{journey.label}</strong><small>{journey.text}</small></span><ArrowRight size={15} /></button>
      })}
    </div>
  )
}

function ConstraintBar({ constraints, onToggle, onReduceBudget, command, setCommand, onCommand }) {
  const options = [
    { id: 'budget', label: 'Reduce budget by RM10', icon: CircleDollarSign, selected: false, action: onReduceBudget },
    { id: 'vegetarianFriday', label: 'Make Friday vegetarian', icon: Leaf, selected: constraints.vegetarianFriday },
    { id: 'noChicken', label: 'No more chicken', icon: RefreshCw, selected: constraints.noChicken },
    { id: 'quickTomorrow', label: 'Only 15 min tomorrow', icon: Clock3, selected: constraints.quickTomorrow },
  ]
  return (
    <section className="constraint-section">
      <div className="section-kicker"><Sparkles size={16} /> DETERMINISTIC ADJUSTMENT ENGINE</div>
      <div className="constraint-heading"><div><h2>Something changed?</h2><p>Every update is re-optimised and validated before it reaches your basket.</p></div></div>
      <form className="command-bar" onSubmit={(event) => { event.preventDefault(); onCommand() }}>
        <Sparkles size={18} />
        <label className="sr-only" htmlFor="plan-command">Adjust this plan</label>
        <input id="plan-command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Try: Make Friday vegetarian and reduce budget by RM10" />
        <button className="primary-button small-command" type="submit" disabled={!command.trim()}>Apply change</button>
      </form>
      <div className="constraint-list">
        {options.map((option) => {
          const Icon = option.icon
          return (
            <button key={option.id} className={`constraint-chip ${option.selected ? 'selected' : ''}`} aria-pressed={option.id === 'budget' ? undefined : option.selected} onClick={option.action || (() => onToggle(option.id))}>
              <Icon size={17} /><span>{option.label}</span>{option.selected ? <Check size={16} /> : <Plus size={16} />}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MealCard({ meal, day, pantry, servings, onSwap, onDetails }) {
  const pantryMatches = Object.keys(meal.ingredients).filter((id) => inputNumber(pantry[id]?.quantity ?? pantry[id]) > 0).length
  return (
    <article className="meal-card">
      <FoodVisual meal={meal} />
      <div className="meal-content">
        <div className="meal-day-row"><span className="meal-day">{day}</span><div className="meal-card-actions"><button className="swap-button" onClick={onDetails}><Info size={14} /> Details</button><button className="swap-button" onClick={onSwap}><RefreshCw size={14} /> Swap</button></div></div>
        <h3>{meal.name}</h3><p>{meal.description}</p>
        <div className="meal-tags">{meal.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}{pantryMatches > 0 && <span className="pantry-tag"><PackageCheck size={12} /> Uses {pantryMatches} pantry item{pantryMatches > 1 ? 's' : ''}</span>}</div>
        <div className="meal-metrics">
          <div><strong>{formatMoney(mealCost(meal, servings))}</strong><span>food value</span></div>
          <div><strong>{meal.protein}g</strong><span>protein / serving</span></div>
          <div><strong>{meal.time} min</strong><span>cook time</span></div>
        </div>
      </div>
    </article>
  )
}

function BudgetCard({ settings, basket, macro, feasible, reasons }) {
  const remaining = settings.budget - basket.total
  const percentage = Math.min(100, Math.max(0, (basket.total / settings.budget) * 100))
  return (
    <aside className={`summary-card ${feasible ? '' : 'summary-warning'}`}>
      <div className="summary-label"><WalletCards size={16} /> Validated weekly basket</div>
      <div className="budget-number"><strong>{formatMoney(basket.total)}</strong><span>of RM{settings.budget.toFixed(0)}</span></div>
      <div className="progress-track" role="progressbar" aria-label="Budget used" aria-valuemin="0" aria-valuemax={settings.budget} aria-valuenow={Math.min(basket.total, settings.budget)}><span style={{ width: `${percentage}%` }} /></div>
      <div className="budget-caption"><span>{remaining >= 0 ? `${formatMoney(remaining)} left` : `${formatMoney(Math.abs(remaining))} top-up needed`}</span><span>Prototype prices</span></div>
      {!feasible && <div className="validation-mini"><AlertCircle size={16} /><span>{reasons[0]}</span></div>}
      <div className="summary-divider" />
      <div className="summary-stat-grid">
        <div><span className="stat-icon protein"><Zap size={16} /></span><strong>{Math.round(macro.summary.protein)}g</strong><small>avg. protein</small></div>
        <div><span className="stat-icon veg"><Leaf size={16} /></span><strong>{macro.summary.veg.toFixed(1)}</strong><small>veg servings</small></div>
        <div><span className="stat-icon saved"><PackageCheck size={16} /></span><strong>{formatMoney(basket.saved)}</strong><small>pantry value used</small></div>
        <div><span className="stat-icon fast"><Clock3 size={16} /></span><strong>{Math.round(macro.summary.time)}m</strong><small>avg. cook time</small></div>
      </div>
      <div className="health-callout"><BadgeCheck size={19} /><div><strong>{macro.onTrack ? 'Macro goal on track' : 'Closest feasible macro fit'}</strong><span>{macro.checks.map((check) => `${check.label} ${check.met ? '✓' : '△'}`).join(' · ')}</span></div></div>
    </aside>
  )
}

function PlanView({ plan, basket, settings, constraints, pantry, feasible, reasons, macro, openSettings, openSwap, openDetails, reset, command, setCommand, applyCommand, toggleConstraint, reduceBudget, setActiveView }) {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span /> BUDGET TO BASKET, VALIDATED</div>
          <h1>Good food, planned<br />around <em>your life.</em></h1>
          <p>{settings.mealsCount} Malaysian meals for {settings.servings} {settings.servings === 1 ? 'person' : 'people'}, optimised for {goalProfiles[settings.goal].label.toLowerCase()}, time and a RM{settings.budget} budget.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById('weekly-plan')?.scrollIntoView({ behavior: 'smooth' })}>See validated plan <ArrowRight size={17} /></button><button className="secondary-button" onClick={openSettings}><Pencil size={16} /> Tune my plan</button></div>
        </div>
        <div className="hero-summary">
          {plan[1] && <div className="mini-plan-card back-card"><FoodVisual meal={plan[1]} compact /></div>}
          {plan[0] && <div className="mini-plan-card front-card"><div className="mini-top"><span>{weekdays[0].toUpperCase()} · LUNCH</span><span className={`fit-badge ${feasible ? '' : 'fit-warning'}`}>{feasible ? <Check size={12} /> : <AlertCircle size={12} />}{feasible ? ' VALIDATED' : ' CLOSEST FIT'}</span></div><FoodVisual meal={plan[0]} compact /><h3>{plan[0].name}</h3><div className="mini-metrics"><span>{formatMoney(mealCost(plan[0], settings.servings))}</span><span>{plan[0].protein}g protein</span><span>{plan[0].time} min</span></div></div>}
          <div className="floating-pill pantry-pill"><PackageCheck size={17} /><div><strong>{basket.owned.length} pantry items</strong><span>deducted once</span></div></div>
          <div className="floating-pill savings-pill"><CircleDollarSign size={17} /><div><strong>{formatMoney(basket.saved)} used</strong><span>from your pantry</span></div></div>
        </div>
      </section>
      <div className="container"><JourneyStrip activeView="plan" setActiveView={setActiveView} /></div>
      <div className="soft-band"><div className="container"><ConstraintBar constraints={constraints} onToggle={toggleConstraint} onReduceBudget={reduceBudget} command={command} setCommand={setCommand} onCommand={applyCommand} /></div></div>
      <section id="weekly-plan" className="week-section container">
        <div className="section-header"><div><div className="eyebrow"><span /> DETERMINISTIC MEAL GRAPH</div><h2>Your {settings.mealsCount}-meal plan</h2><p>{settings.servings} serving{settings.servings > 1 ? 's' : ''} · {settings.location} prototype prices · {settings.diet === 'halal' ? 'Halal-friendly catalogue' : settings.diet === 'vegetarian' ? 'Vegetarian' : 'Egg-free'}</p></div><div className="section-actions"><button className="text-button" onClick={reset}><RefreshCw size={15} /> Reset demo</button><button className="secondary-button small" onClick={openSettings}><Settings2 size={15} /> Plan settings</button></div></div>
        {!feasible && <div className="feasibility-banner" role="alert"><AlertCircle size={20} /><div><strong>No fully feasible plan at the current limits</strong><span>{reasons.join(' · ')}</span></div><button className="secondary-button small" onClick={openSettings}>Adjust constraints</button></div>}
        <div className="plan-layout"><div className="meal-list">{plan.map((meal, index) => <MealCard key={`${weekdays[index]}-${meal.id}`} meal={meal} day={weekdays[index]} pantry={pantry} servings={settings.servings} onSwap={() => openSwap(index)} onDetails={() => openDetails(meal)} />)}</div><div className="summary-column"><BudgetCard settings={settings} basket={basket} macro={macro} feasible={feasible} reasons={reasons} /><details className="source-card details-source"><summary><Calculator size={17} /><strong>How this is calculated</strong></summary><p>Ingredients are aggregated for all servings, pantry quantities are deducted once, packaged goods round up, and the final basket is validated against every active constraint.</p><span>{dataSnapshot.priceSource} · {dataSnapshot.priceDate}</span><span>{dataSnapshot.nutritionSource}</span></details></div></div>
      </section>
    </>
  )
}

function BasketView({ basket, settings, setSettings, plan, pantry, setActiveView }) {
  const [filter, setFilter] = useState('all')
  const [checkedIds, setCheckedIds] = useState([])
  const [saraMode, setSaraMode] = useState(true)
  const visible = basket.shopping.filter((line) => filter === 'all' || (filter === 'sara' ? line.saraPotential > 0 : line.saraPotential === 0))
  const saraUsed = saraMode ? Math.min(basket.saraPotential, settings.saraBalance) : 0
  const cashNeeded = Math.max(0, basket.total - saraUsed)
  const cashShortfall = Math.max(0, cashNeeded - settings.cashBalance)
  const exportList = () => {
    const items = basket.shopping.map((line) => `- ${line.name}: ${quantityText(line)} (${formatMoney(line.cost)})${line.saraPotential ? ' — potentially SARA-category covered' : ' — cash'}`).join('\n')
    const content = `DapurKita validated shopping list\n${settings.location} · prototype snapshot ${dataSnapshot.priceDate}\n\n${items}\n\nEstimated basket: ${formatMoney(basket.total)}\nPotential SARA category coverage: ${formatMoney(saraUsed)}\nCash needed: ${formatMoney(cashNeeded)}\n\nCategory estimates are not SKU verification. Confirm eligible shelf labels in the official MyKasih app.`
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'dapur-kita-validated-list.txt'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 500)
  }
  return (
    <main className="page-shell container">
      <div className="page-title-row"><div><div className="eyebrow"><span /> JOURNEY 2 · FUND THE BASKET</div><h1>Turn assistance into meals.</h1><p>Separate category-estimated SARA coverage, cash top-up and ingredients already at home—without claiming checkout or MyKad authorisation.</p></div><button className="primary-button" onClick={exportList}><ShoppingBasket size={17} /> Export validated list</button></div>
      <JourneyStrip activeView="basket" setActiveView={setActiveView} />
      <div className="rahmah-controls panel">
        <label><span>SARA balance</span><div className="input-prefix"><span>RM</span><input aria-label="SARA balance" type="number" min="0" value={settings.saraBalance} onChange={(event) => setSettings((current) => ({ ...current, saraBalance: Math.max(0, inputNumber(event.target.value)) }))} /></div></label>
        <label><span>Available cash</span><div className="input-prefix"><span>RM</span><input aria-label="Available cash" type="number" min="0" value={settings.cashBalance} onChange={(event) => setSettings((current) => ({ ...current, cashBalance: Math.max(0, inputNumber(event.target.value)) }))} /></div></label>
        <div className="rahmah-context"><span>Plan context</span><strong>{settings.servings} people · {settings.mealsCount} meals</strong><button className="text-button" onClick={() => setActiveView('plan')}>Change the meal plan</button></div>
      </div>
      <div className="basket-layout">
        <section className="basket-main panel">
          <div className="basket-toolbar"><div className="segmented" role="group" aria-label="Basket filter"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All items</button><button className={filter === 'sara' ? 'active' : ''} onClick={() => setFilter('sara')}>SARA category</button><button className={filter === 'cash' ? 'active' : ''} onClick={() => setFilter('cash')}>Cash</button></div><span>{visible.length} items</span></div>
          <div className="shopping-list">{visible.map((line) => <div className="shopping-row" key={line.id}><button className={`check-circle ${checkedIds.includes(line.id) ? 'checked' : ''}`} aria-label={`Mark ${line.name} complete`} aria-pressed={checkedIds.includes(line.id)} onClick={() => setCheckedIds((current) => current.includes(line.id) ? current.filter((id) => id !== line.id) : [...current, line.id])}><Check size={14} /></button><div className="ingredient-icon"><Utensils size={18} /></div><div className="shopping-name"><strong>{line.name}</strong><span>{quantityText(line)} · {line.category}</span></div>{saraMode && <span className={`coverage-badge ${line.saraPotential ? 'covered' : 'cash'}`}>{line.saraPotential ? 'CATEGORY' : 'CASH'}</span>}<strong className="row-price">{formatMoney(line.cost)}</strong></div>)}</div>
          <div className="already-owned"><div><PackageCheck size={18} /><strong>Already at home</strong><span>{basket.owned.length} ingredients deducted</span></div><div className="owned-chips">{basket.owned.map((line) => <span key={line.id}><Check size={12} /> {line.name}: {quantityText(line, 'ownedQuantity')}</span>)}</div></div>
        </section>
        <aside className="basket-side">
          <div className="panel sara-card"><div className="sara-header"><div className="sara-mark">S</div><div><strong>DapurRahmah mode</strong><span>Category estimate only</span></div><button className={`toggle ${saraMode ? 'on' : ''}`} role="switch" aria-label="Toggle SARA estimate" aria-checked={saraMode} onClick={() => setSaraMode(!saraMode)}><span /></button></div>{saraMode && <><div className="coverage-chart"><div className="donut" style={{ '--coverage': `${basket.total ? Math.min(100, saraUsed / basket.total * 100) : 0}%` }}><span>{basket.total ? Math.round(saraUsed / basket.total * 100) : 0}%</span></div><div><strong>{formatMoney(saraUsed)}</strong><span>potential category coverage</span></div></div><div className="cost-split"><div><span>SARA balance used</span><strong>{formatMoney(saraUsed)}</strong></div><div><span>Cash needed</span><strong>{formatMoney(cashNeeded)}</strong></div><div><span>Cash remaining</span><strong>{formatMoney(Math.max(0, settings.cashBalance - cashNeeded))}</strong></div></div></>}<div className={`funding-status ${cashShortfall ? 'shortfall' : ''}`}>{cashShortfall ? <AlertCircle size={17} /> : <ShieldCheck size={17} />}<div><strong>{cashShortfall ? `${formatMoney(cashShortfall)} still needed` : 'Basket is fundable'}</strong><span>{cashShortfall ? 'Raise cash or adjust the plan.' : 'Using entered SARA and cash balances.'}</span></div></div><div className="prototype-note"><Info size={15} /> Published category rules are not exact SKU approval. Confirm the SARA shelf label and balance through MyKasih.</div><a className="official-link" href="https://sara.gov.my/en/home.html" target="_blank" rel="noreferrer">Open official SARA guide <ArrowRight size={14} /></a></div>
          <div className="panel total-card"><div><span>Estimated basket</span><strong>{formatMoney(basket.total)}</strong></div><div className="budget-line"><span>Food consumed value</span><strong>{formatMoney(basket.consumedValue)}</strong></div><div className="total-progress"><span style={{ width: `${Math.min(100, basket.total / Math.max(settings.budget, 1) * 100)}%` }} /></div><p className={basket.total <= settings.budget ? '' : 'over-budget'}>{basket.total <= settings.budget ? <Check size={14} /> : <AlertCircle size={14} />}{basket.total <= settings.budget ? `${formatMoney(settings.budget - basket.total)} under plan budget` : `${formatMoney(basket.total - settings.budget)} over plan budget`}</p></div>
        </aside>
      </div>
    </main>
  )
}

function PantryView({ pantry, setPantry, plan, basket, settings, setActiveView }) {
  const [selectedIngredient, setSelectedIngredient] = useState(Object.keys(ingredientCatalog).find((id) => !pantry[id]) || 'rice')
  const plannedLines = new Map(basket.lines.map((line) => [line.id, line]))
  const rows = Object.entries(pantry).filter(([, entry]) => inputNumber(entry?.quantity ?? entry) > 0).map(([id, entry]) => ({ id, ...ingredientCatalog[id], quantity: inputNumber(entry?.quantity ?? entry), expiryDays: inputNumber(entry?.expiryDays, 30), used: plannedLines.get(id)?.ownedQuantity || 0 }))
  const atRisk = [...rows].filter((item) => item.expiryDays <= 7 && item.used > 0).sort((a, b) => a.expiryDays - b.expiryDays || b.used - a.used)[0]
  const reuseMeals = atRisk ? plan.map((meal, index) => ({ meal, day: weekdays[index], amount: meal.ingredients[atRisk.id] || 0 })).filter((entry) => entry.amount > 0) : []
  const update = (id, patch) => setPantry((current) => ({ ...current, [id]: { quantity: inputNumber(current[id]?.quantity ?? current[id]), expiryDays: inputNumber(current[id]?.expiryDays, 30), ...patch } }))
  const addIngredient = () => {
    const item = ingredientCatalog[selectedIngredient]
    update(selectedIngredient, { quantity: item.unit === 'kg' ? 0.25 : 1, expiryDays: 14 })
    const next = Object.keys(ingredientCatalog).find((id) => !pantry[id] && id !== selectedIngredient)
    if (next) setSelectedIngredient(next)
  }
  return (
    <main className="page-shell container">
      <div className="page-title-row"><div><div className="eyebrow"><span /> JOURNEY 3 · RESCUE WHAT YOU OWN</div><h1>Your pantry changes the plan.</h1><p>Edit approximate quantities and freshness. DapurKita deducts stock once and prioritises at-risk ingredients already used by the selected meals.</p></div></div>
      <JourneyStrip activeView="pantry" setActiveView={setActiveView} />
      <div className="pantry-layout">
        <section className="panel pantry-panel">
          <div className="panel-heading"><div><h2>In your kitchen</h2><p>Saved locally on this device</p></div></div>
          <div className="pantry-grid">{rows.map((item) => {
            const step = item.unit === 'kg' ? 0.05 : item.unit === 'eggs' ? 1 : 0.25
            return <article className="pantry-item" key={item.id}><div className="pantry-item-top"><div className="ingredient-icon"><PackageCheck size={19} /></div><button className="remove-pantry" aria-label={`Remove ${item.name}`} onClick={() => setPantry((current) => { const next = { ...current }; delete next[item.id]; return next })}><Trash2 size={15} /></button></div><strong>{item.name}</strong><span>{quantityText({ ...item, buyQuantity: item.quantity })}</span><div className="quantity-stepper"><button aria-label={`Reduce ${item.name}`} onClick={() => update(item.id, { quantity: Math.max(0, item.quantity - step) })}><Minus size={14} /></button><span>{item.used > 0 ? `${quantityText({ ...item, ownedQuantity: item.used }, 'ownedQuantity')} planned` : 'Not in plan'}</span><button aria-label={`Add ${item.name}`} onClick={() => update(item.id, { quantity: item.quantity + step })}><Plus size={14} /></button></div><label className="expiry-field"><span>Use within</span><select value={item.expiryDays} onChange={(event) => update(item.id, { expiryDays: Number(event.target.value) })}><option value="2">2 days</option><option value="6">6 days</option><option value="14">2 weeks</option><option value="30">1 month</option><option value="90">Pantry staple</option></select></label><div className={`freshness ${item.expiryDays <= 7 ? 'soon' : ''}`}><span /> {item.expiryDays <= 7 ? 'Use soon' : 'Good'} · {item.expiryDays >= 90 ? 'Pantry staple' : `${item.expiryDays} days`}</div></article>
          })}</div>
          <div className="add-pantry-row"><label><span>Add an ingredient</span><select value={selectedIngredient} onChange={(event) => setSelectedIngredient(event.target.value)}>{Object.entries(ingredientCatalog).filter(([id]) => !pantry[id]).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}</select></label><button className="secondary-button" disabled={Object.keys(pantry).length >= Object.keys(ingredientCatalog).length} onClick={addIngredient}><Plus size={16} /> Add to pantry</button></div>
        </section>
        <aside className="rescue-card"><div className="section-kicker"><Sparkles size={15} /> DAPURRESCUE · DYNAMIC PREVIEW</div>{atRisk ? <><h2>Use {atRisk.name.toLowerCase()} first.</h2><p>{quantityText({ ...atRisk, ownedQuantity: atRisk.used }, 'ownedQuantity')} is allocated across {reuseMeals.length} planned meal{reuseMeals.length === 1 ? '' : 's'} before its {atRisk.expiryDays}-day freshness window.</p><div className="rescue-flow">{reuseMeals.map((entry, index) => <div className="rescue-step" key={`${entry.day}-${entry.meal.id}`}><div><span>{entry.day}</span><strong>{entry.meal.name}</strong></div>{index < reuseMeals.length - 1 && <ArrowRight size={17} />}</div>)}</div></> : <><h2>No at-risk planned item yet.</h2><p>Add an expiry window or adjust your plan to prioritise something that needs using soon.</p></>}<button className="secondary-button" onClick={() => setActiveView('plan')}>See reuse in DapurPlan <ArrowRight size={16} /></button></aside>
      </div>
    </main>
  )
}

function ImpactView({ basket, plan, pantry, settings, macro, setActiveView }) {
  const baseline = 14 * settings.mealsCount * settings.servings
  const cashSavings = Math.max(0, baseline - basket.total)
  const atRiskKg = basket.lines.filter((line) => line.unit === 'kg' && inputNumber(pantry[line.id]?.expiryDays, 30) <= 7).reduce((sum, line) => sum + line.ownedQuantity, 0)
  const goalMet = macro.checks.filter((check) => check.met).length
  return (
    <main className="page-shell container impact-page">
      <div className="page-title-row"><div><div className="eyebrow"><span /> CALCULATED, NOT CLAIMED</div><h1>Your plan’s measurable outputs.</h1><p>These figures update from the current basket and plan. Health outcomes and actual waste reduction require a real-world pilot.</p></div></div>
      <div className="impact-grid"><article className="impact-card accent"><div className="impact-icon"><WalletCards size={22} /></div><span>Estimated cash difference</span><strong>{formatMoney(cashSavings)}</strong><p>versus {settings.mealsCount * settings.servings} bought lunches at an explicit RM14 assumption</p></article><article className="impact-card"><div className="impact-icon"><PackageCheck size={22} /></div><span>Pantry value allocated</span><strong>{formatMoney(basket.saved)}</strong><p>{basket.owned.length} pantry ingredients deducted from this basket</p></article><article className="impact-card"><div className="impact-icon"><Leaf size={22} /></div><span>At-risk food allocated</span><strong>{atRiskKg.toFixed(2)} kg</strong><p>planned use only; not a claim of measured waste avoided</p></article></div>
      <section className="panel impact-story"><div><div className="section-kicker"><HeartPulse size={15} /> CURRENT MACRO FIT</div><h2>{goalProfiles[settings.goal].label}, explained.</h2><p>The plan averages {Math.round(macro.summary.protein)} g protein, {Math.round(macro.summary.calories)} kcal and {macro.summary.veg.toFixed(1)} vegetable servings per meal. Values are curated prototype estimates, not medical advice.</p></div><div className="balance-bars">{macro.checks.map((check) => <div key={check.label}><span>{check.label}</span><i><b style={{ width: check.met ? '100%' : '65%' }} /></i><strong>{check.value} {check.met ? '✓' : '△'}</strong></div>)}</div></section>
      <div className="impact-method panel"><Calculator size={20} /><div><strong>{goalMet}/3 macro checks met</strong><p>Cash difference = RM14 × meals × servings − current basket cash outlay. Pantry and at-risk figures use quantities allocated to this plan.</p></div><button className="secondary-button small" onClick={() => setActiveView('plan')}>Adjust the plan</button></div>
    </main>
  )
}

function SettingsModal({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState(settings)
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const save = () => onSave({ ...draft, budget: Math.max(10, inputNumber(draft.budget, 60)), mealsCount: Math.min(7, Math.max(3, inputNumber(draft.mealsCount, 5))), servings: Math.min(6, Math.max(1, inputNumber(draft.servings, 1))), maxPrep: inputNumber(draft.maxPrep, 30) })
  return (
    <ModalShell titleId="settings-title" className="settings-modal" onClose={onClose}>
      <div className="modal-header"><div><span>PLAN PREFERENCES</span><h2 id="settings-title">Shape a feasible week</h2></div><button className="icon-button" aria-label="Close settings" onClick={onClose}><X size={19} /></button></div>
      <div className="form-grid">
        <label htmlFor="budget"><span>Meal-plan budget</span><div className="input-prefix"><span>RM</span><input id="budget" type="number" min="10" max="300" value={draft.budget} onChange={(event) => update('budget', event.target.value)} /></div></label>
        <label htmlFor="servings"><span>People / servings</span><div className="input-prefix"><input id="servings" type="number" min="1" max="6" value={draft.servings} onChange={(event) => update('servings', event.target.value)} /></div></label>
        <label htmlFor="meal-count"><span>Number of meals</span><div className="select-wrap"><select id="meal-count" value={draft.mealsCount} onChange={(event) => update('mealsCount', Number(event.target.value))}><option value="3">3 meals</option><option value="4">4 meals</option><option value="5">5 meals</option><option value="6">6 meals</option><option value="7">7 meals</option></select><ChevronDown size={16} /></div></label>
        <label htmlFor="max-prep"><span>Maximum cook time</span><div className="select-wrap"><select id="max-prep" value={draft.maxPrep} onChange={(event) => update('maxPrep', Number(event.target.value))}><option value="15">15 minutes</option><option value="20">20 minutes</option><option value="25">25 minutes</option><option value="30">30 minutes</option></select><ChevronDown size={16} /></div></label>
        <label htmlFor="nutrition-goal"><span>Macro goal</span><div className="select-wrap"><select id="nutrition-goal" value={draft.goal} onChange={(event) => update('goal', event.target.value)}>{Object.entries(goalProfiles).map(([id, goal]) => <option key={id} value={id}>{goal.label}</option>)}</select><ChevronDown size={16} /></div></label>
        <label htmlFor="diet"><span>Dietary rule</span><div className="select-wrap"><select id="diet" value={draft.diet} onChange={(event) => update('diet', event.target.value)}><option value="halal">Halal-friendly catalogue</option><option value="vegetarian">Vegetarian</option><option value="eggFree">Egg-free</option></select><ChevronDown size={16} /></div></label>
        <label htmlFor="location"><span>Price location label</span><div className="select-wrap"><select id="location" value={draft.location} onChange={(event) => update('location', event.target.value)}>{locations.map((location) => <option key={location}>{location}</option>)}</select><ChevronDown size={16} /></div></label>
      </div>
      <div className="preference-summary"><Target size={19} /><div><strong>Hard constraints are enforced</strong><span>Budget · dietary rule · time · servings · unique meals</span></div></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save}>Optimise my plan <Sparkles size={16} /></button></div>
    </ModalShell>
  )
}

function SwapModal({ index, plan, options, onSwap, onClose }) {
  const shown = [...options.filter((option) => option.valid).slice(0, 4), ...options.filter((option) => !option.valid).slice(0, 2)]
  return (
    <ModalShell titleId="swap-title" className="swap-modal" onClose={onClose}>
      <div className="modal-header"><div><span>VALIDATED SWAP · {weekdays[index]?.toUpperCase()}</span><h2 id="swap-title">Choose without breaking the plan</h2></div><button className="icon-button" aria-label="Close swap choices" onClick={onClose}><X size={19} /></button></div>
      <p className="modal-intro">Valid options preserve budget, dietary, time and uniqueness rules. Blocked options show exactly which rule failed.</p>
      <div className="swap-list">{shown.map((option) => <button key={option.meal.id} className={`swap-option ${option.valid ? '' : 'blocked'}`} disabled={!option.valid} onClick={() => onSwap(option.meal.id)}><FoodVisual meal={option.meal} compact /><div><strong>{option.meal.name}</strong><span>{formatMoney(option.basket.total)} basket · {option.meal.protein}g protein · {option.meal.time} min</span>{!option.valid && <small><ShieldCheck size={12} /> Blocked: {option.reasons[0]}</small>}</div>{option.valid ? <ArrowRight size={18} /> : <X size={18} />}</button>)}</div>
    </ModalShell>
  )
}

function MealDetailsModal({ meal, settings, pantry, onClose }) {
  const basket = buildBasket([meal], pantry, settings.servings)
  return (
    <ModalShell titleId="meal-details-title" className="meal-details-modal" onClose={onClose}>
      <div className="modal-header"><div><span>PORTIONS & METHOD</span><h2 id="meal-details-title">{meal.name}</h2></div><button className="icon-button" aria-label="Close meal details" onClick={onClose}><X size={19} /></button></div>
      <div className="details-macro-row"><span><strong>{meal.protein}g</strong> protein</span><span><strong>{meal.carbs}g</strong> carbs</span><span><strong>{meal.fat}g</strong> fat</span><span><strong>{meal.calories}</strong> kcal</span></div>
      <div className="details-columns"><div><h3>For {settings.servings} serving{settings.servings > 1 ? 's' : ''}</h3><ul>{basket.lines.map((line) => <li key={line.id}><span>{line.name}</span><strong>{quantityText(line, 'requiredQuantity')}</strong></li>)}</ul></div><div><h3>Cook it</h3><ol>{meal.steps.map((step) => <li key={step}>{step}</li>)}</ol></div></div>
      <div className="prototype-note"><Info size={15} /> Nutrition is a curated per-serving prototype estimate. Ingredient quantities scale deterministically with servings.</div>
    </ModalShell>
  )
}

function Toast({ message }) {
  if (!message) return null
  return <div className="toast" role="status" aria-live="polite"><Check size={16} /><span>{message}</span></div>
}

function loadPersisted() {
  try {
    const parsed = JSON.parse(localStorage.getItem('dapur-kita-state') || '{}')
    return {
      settings: { ...defaultSettings, ...parsed.settings },
      constraints: { ...defaultConstraints, ...parsed.constraints },
      pantry: parsed.pantry || initialPantry,
    }
  } catch {
    return { settings: defaultSettings, constraints: defaultConstraints, pantry: initialPantry }
  }
}

export default function App() {
  const persisted = useMemo(loadPersisted, [])
  const [activeView, setActiveView] = useState('plan')
  const [settings, setSettings] = useState(persisted.settings)
  const [constraints, setConstraints] = useState(persisted.constraints)
  const [pantry, setPantry] = useState(persisted.pantry)
  const [manualSwaps, setManualSwaps] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [swapIndex, setSwapIndex] = useState(null)
  const [detailMeal, setDetailMeal] = useState(null)
  const [command, setCommand] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem('dapur-kita-state', JSON.stringify({ settings, constraints, pantry }))
  }, [settings, constraints, pantry])

  const planningSettings = useMemo(() => ({
    budget: settings.budget,
    mealsCount: settings.mealsCount,
    servings: settings.servings,
    maxPrep: settings.maxPrep,
    goal: settings.goal,
    diet: settings.diet,
    location: settings.location,
  }), [settings.budget, settings.mealsCount, settings.servings, settings.maxPrep, settings.goal, settings.diet, settings.location])
  const optimized = useMemo(() => optimizePlan(planningSettings, constraints, pantry), [planningSettings, constraints, pantry])
  const plan = useMemo(() => optimized.plan.map((meal, index) => manualSwaps[index] ? meals.find((candidate) => candidate.id === manualSwaps[index]) || meal : meal), [optimized.plan, manualSwaps])
  const validation = useMemo(() => validatePlan(plan, pantry, planningSettings, constraints), [plan, pantry, planningSettings, constraints])
  const basket = validation.basket
  const macro = useMemo(() => macroStatus(plan, settings.goal), [plan, settings.goal])
  const options = useMemo(() => swapIndex === null ? [] : swapOptions(plan, swapIndex, pantry, planningSettings, constraints), [swapIndex, plan, pantry, planningSettings, constraints])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }
  const applySettings = (next) => {
    setSettings(next)
    setManualSwaps({})
    setSettingsOpen(false)
    notify('Plan rebuilt and every hard constraint was checked.')
  }
  const toggleConstraint = (id) => {
    const next = !constraints[id]
    setConstraints((current) => ({ ...current, [id]: next }))
    setManualSwaps({})
    notify(`${id === 'vegetarianFriday' ? 'Vegetarian Friday' : id === 'noChicken' ? 'No chicken' : '15-minute tomorrow'} ${next ? 'applied' : 'removed'}. Plan revalidated.`)
  }
  const reduceBudget = () => {
    setSettings((current) => ({ ...current, budget: Math.max(10, current.budget - 10) }))
    setManualSwaps({})
    notify('Budget reduced by RM10. The plan was re-optimised.')
  }
  const applyCommand = () => {
    const parsed = parseAdjustment(command, settings, constraints)
    if (!parsed.changes.length) {
      notify('Try a budget, Friday vegetarian, no chicken, 15-minute, or macro request.')
      return
    }
    setSettings(parsed.settings)
    setConstraints(parsed.constraints)
    setManualSwaps({})
    setCommand('')
    notify(`${parsed.changes.join(' · ')}. Validation complete.`)
  }
  const applySwap = (mealId) => {
    const option = options.find((candidate) => candidate.meal.id === mealId)
    if (!option?.valid) {
      notify(`Swap blocked: ${option?.reasons[0] || 'constraint conflict'}.`)
      return
    }
    setManualSwaps((current) => ({ ...current, [swapIndex]: mealId }))
    const day = weekdays[swapIndex]
    setSwapIndex(null)
    notify(`${day} swapped to ${option.meal.name}. Budget and constraints revalidated.`)
  }
  const reset = () => {
    setSettings(defaultSettings)
    setConstraints(defaultConstraints)
    setPantry(initialPantry)
    setManualSwaps({})
    notify('The validated demo scenario is restored.')
  }

  return (
    <div className="app-shell">
      <TopBar activeView={activeView} setActiveView={setActiveView} onSettings={() => setSettingsOpen(true)} />
      {activeView === 'plan' && <PlanView plan={plan} basket={basket} settings={settings} constraints={constraints} pantry={pantry} feasible={validation.valid} reasons={validation.reasons} macro={macro} openSettings={() => setSettingsOpen(true)} openSwap={setSwapIndex} openDetails={setDetailMeal} reset={reset} command={command} setCommand={setCommand} applyCommand={applyCommand} toggleConstraint={toggleConstraint} reduceBudget={reduceBudget} setActiveView={setActiveView} />}
      {activeView === 'basket' && <BasketView basket={basket} settings={settings} setSettings={setSettings} plan={plan} pantry={pantry} setActiveView={setActiveView} />}
      {activeView === 'pantry' && <PantryView pantry={pantry} setPantry={setPantry} plan={plan} basket={basket} settings={settings} setActiveView={setActiveView} />}
      {activeView === 'impact' && <ImpactView basket={basket} plan={plan} pantry={pantry} settings={settings} macro={macro} setActiveView={setActiveView} />}
      <footer><div className="container"><Logo onClick={() => setActiveView('plan')} /><p>Plan within constraints. Fund transparently. Rescue what you own.</p><span>Prototype · {dataSnapshot.priceDate} reference snapshot</span></div></footer>
      {settingsOpen && <SettingsModal settings={settings} onSave={applySettings} onClose={() => setSettingsOpen(false)} />}
      {swapIndex !== null && <SwapModal index={swapIndex} plan={plan} options={options} onSwap={applySwap} onClose={() => setSwapIndex(null)} />}
      {detailMeal && <MealDetailsModal meal={detailMeal} settings={settings} pantry={pantry} onClose={() => setDetailMeal(null)} />}
      <Toast message={toast} />
    </div>
  )
}
