import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  ExternalLink,
  HeartPulse,
  Info,
  Leaf,
  Menu,
  MessageCircle,
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
import { buildBasket, macroStatus, mealCost, optimizePlan, parseAdjustment, parseAdjustmentHints, pantryQuantity, swapOptions, validatePlan } from './engine.js'
import { useLivePrices } from './useLivePrices.js'
import { LangContext, detectLang, useLang } from './i18n.js'

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

const formatMoney = (value) => `RM${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`
const inputNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback

function quantityText(line, key = 'buyQuantity') {
  const quantity = Number(line[key] || 0)
  if (line.unit === 'kg') return `${Math.round(quantity * 1000)} g`
  if (line.unit === 'eggs') return `${Math.ceil(quantity)} ${Math.ceil(quantity) === 1 ? 'egg' : 'eggs'}`
  return `${Number(quantity.toFixed(1))} ${line.unit}`
}

// ── Language toggle button ───────────────────────────────────────────────────
function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <button
      className="lang-toggle"
      aria-label={lang === 'en' ? 'Tukar ke Bahasa Malaysia' : 'Switch to English'}
      onClick={() => setLang(lang === 'en' ? 'ms' : 'en')}
    >
      {lang === 'en' ? 'BM' : 'EN'}
    </button>
  )
}

// ── Live-price badge shown in the plan header ────────────────────────────────
function PriceBadge({ isLive, priceDate, priceSource }) {
  const { t } = useLang()
  return (
    <span className={`price-badge ${isLive ? 'live' : 'static'}`} title={priceSource}>
      {isLive ? (
        <><span className="price-dot" />{t('price.live.badge')} · {t('price.live.source')} · {priceDate}</>
      ) : (
        <><span className="price-dot" />{t('price.static.badge')} · {priceDate}</>
      )}
    </span>
  )
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

function ConfirmModal({ message, onConfirm, onClose }) {
  const { t } = useLang()
  return (
    <ModalShell titleId="confirm-title" className="confirm-modal" onClose={onClose}>
      <div className="modal-header">
        <div><span>{t('confirm.kicker')}</span><h2 id="confirm-title">{t('confirm.title')}</h2></div>
        <button className="icon-button" aria-label="Cancel" onClick={onClose}><X size={19} /></button>
      </div>
      <p className="modal-intro">{message}</p>
      <div className="modal-actions">
        <button className="secondary-button" onClick={onClose}>{t('confirm.cancel')}</button>
        <button className="primary-button danger" onClick={() => { onConfirm(); onClose() }}>{t('confirm.ok')}</button>
      </div>
    </ModalShell>
  )
}

function TopBar({ activeView, setActiveView, onSettings }) {
  const { t } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = (view) => { setActiveView(view); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navItems = [
    { id: 'plan',   label: t('nav.plan'),   icon: CalendarDays },
    { id: 'basket', label: t('nav.basket'), icon: ShoppingBasket },
    { id: 'pantry', label: t('nav.pantry'), icon: PackageCheck },
    { id: 'impact', label: t('nav.impact'), icon: BarChart3 },
  ]
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Logo onClick={() => navigate('plan')} />
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={activeView === item.id ? 'active' : ''} aria-current={activeView === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.label}</button>)}
        </nav>
        <div className="header-actions">
          <LangToggle />
          <button className="icon-button desktop-only" aria-label="Open plan settings" onClick={onSettings}><Settings2 size={19} /></button>
          <button className="avatar" aria-label="Open preferences" onClick={onSettings}>AN</button>
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
          <button onClick={() => { onSettings(); setMobileOpen(false) }}><Settings2 size={18} /> {t('nav.settings')}</button>
        </nav>
      )}
    </header>
  )
}

function JourneyStrip({ activeView, setActiveView }) {
  const { t } = useLang()
  const journeys = [
    { id: 'plan',   label: t('journey.plan.label'),   text: t('journey.plan.text'),   icon: CalendarDays },
    { id: 'basket', label: t('journey.fund.label'),   text: t('journey.fund.text'),   icon: WalletCards },
    { id: 'pantry', label: t('journey.rescue.label'), text: t('journey.rescue.text'), icon: PackageCheck },
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
  const { t } = useLang()
  const [showHints, setShowHints] = useState(false)
  const options = [
    { id: 'budget',           label: t('constraint.chip.budget'),    icon: CircleDollarSign, selected: false,                        action: onReduceBudget },
    { id: 'vegetarianFriday', label: t('constraint.chip.vegfri'),    icon: Leaf,             selected: constraints.vegetarianFriday },
    { id: 'noChicken',        label: t('constraint.chip.nochicken'), icon: RefreshCw,        selected: constraints.noChicken },
    { id: 'quickTomorrow',    label: t('constraint.chip.quick'),     icon: Clock3,           selected: constraints.quickTomorrow },
  ]
  return (
    <section className="constraint-section">
      <div className="section-kicker"><Sparkles size={16} /> {t('constraint.kicker')}</div>
      <div className="constraint-heading"><div><h2>{t('constraint.heading')}</h2><p>{t('constraint.subhead')}</p></div></div>
      <form className="command-bar" onSubmit={(event) => { event.preventDefault(); onCommand(); setShowHints(false) }}>
        <Sparkles size={18} />
        <label className="sr-only" htmlFor="plan-command">{t('constraint.heading')}</label>
        <input
          id="plan-command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onFocus={() => setShowHints(true)}
          onBlur={() => setTimeout(() => setShowHints(false), 150)}
          placeholder={t('constraint.input.placeholder')}
          autoComplete="off"
        />
        <button className="primary-button small-command" type="submit" disabled={!command.trim()}>{t('constraint.apply')}</button>
      </form>
      {showHints && !command.trim() && (
        <div className="command-hints" role="listbox" aria-label="Example commands">
          {parseAdjustmentHints.map((hint) => (
            <button key={hint} role="option" className="hint-chip" onMouseDown={() => { setCommand(hint); setShowHints(false) }}>{hint}</button>
          ))}
        </div>
      )}
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
  const { t } = useLang()
  const pantryMatches = Object.keys(meal.ingredients).filter((id) => pantryQuantity(pantry[id]) > 0).length
  return (
    <article className="meal-card">
      <FoodVisual meal={meal} />
      <div className="meal-content">
        <div className="meal-day-row">
          <span className="meal-day">{day}</span>
          <div className="meal-card-actions">
            <button className="swap-button" onClick={onDetails}><Info size={14} /> {t('meal.details')}</button>
            <button className="swap-button" onClick={onSwap}><RefreshCw size={14} /> {t('meal.swap')}</button>
          </div>
        </div>
        <h3>{meal.name}</h3><p>{meal.description}</p>
        <div className="meal-tags">
          {meal.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
          {pantryMatches > 0 && <span className="pantry-tag"><PackageCheck size={12} /> {t(pantryMatches === 1 ? 'meal.pantry.uses' : 'meal.pantry.uses.plural', { n: pantryMatches })}</span>}
        </div>
        <div className="meal-metrics">
          <div><strong>{formatMoney(mealCost(meal, servings))}</strong><span>{t('meal.metric.value')}</span></div>
          <div><strong>{meal.protein}g</strong><span>{t('meal.metric.protein')}</span></div>
          <div><strong>{meal.time} min</strong><span>{t('meal.metric.time')}</span></div>
        </div>
      </div>
    </article>
  )
}

function BudgetCard({ settings, basket, macro, feasible, reasons }) {
  const { t } = useLang()
  const remaining = settings.budget - basket.total
  const percentage = Math.min(100, Math.max(0, (basket.total / settings.budget) * 100))
  return (
    <aside className={`summary-card ${feasible ? '' : 'summary-warning'}`}>
      <div className="summary-label"><WalletCards size={16} /> {t('budget.label')}</div>
      <div className="budget-number"><strong>{formatMoney(basket.total)}</strong><span>of RM{settings.budget.toFixed(0)}</span></div>
      <div className="progress-track" role="progressbar" aria-label="Budget used" aria-valuemin="0" aria-valuemax={settings.budget} aria-valuenow={Math.min(basket.total, settings.budget)}><span style={{ width: `${percentage}%` }} /></div>
      <div className="budget-caption">
        <span>{remaining >= 0 ? t('budget.left', { amount: formatMoney(remaining) }) : t('budget.topup', { amount: formatMoney(Math.abs(remaining)) })}</span>
        <span>{t('budget.prototype')}</span>
      </div>
      {!feasible && <div className="validation-mini"><AlertCircle size={16} /><span>{reasons[0]}</span></div>}
      <div className="summary-divider" />
      <div className="summary-stat-grid">
        <div><span className="stat-icon protein"><Zap size={16} /></span><strong>{Math.round(macro.summary.protein)}g</strong><small>{t('budget.protein')}</small></div>
        <div><span className="stat-icon veg"><Leaf size={16} /></span><strong>{macro.summary.veg.toFixed(1)}</strong><small>{t('budget.veg')}</small></div>
        <div><span className="stat-icon saved"><PackageCheck size={16} /></span><strong>{formatMoney(basket.saved)}</strong><small>{t('budget.pantry')}</small></div>
        <div><span className="stat-icon fast"><Clock3 size={16} /></span><strong>{Math.round(macro.summary.time)}m</strong><small>{t('budget.time')}</small></div>
      </div>
      <div className="health-callout"><BadgeCheck size={19} /><div><strong>{macro.onTrack ? t('budget.macro.ok') : t('budget.macro.fit')}</strong><span>{macro.checks.map((check) => `${check.label} ${check.met ? '✓' : '△'}`).join(' · ')}</span></div></div>
    </aside>
  )
}

function PlanView({ plan, basket, settings, constraints, pantry, feasible, reasons, macro, openSettings, openSwap, openDetails, onReset, command, setCommand, applyCommand, toggleConstraint, reduceBudget, setActiveView, priceInfo }) {
  const { t } = useLang()
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span /> {t('hero.eyebrow')}</div>
          <h1>{t('hero.title').split('\n').map((line, i) => i === 0 ? <span key={i}>{line}<br /></span> : <em key={i}>{line}</em>)}</h1>
          <p>{settings.mealsCount} {t('nav.plan').replace('Dapur','').replace('Rancangan','').trim().toLowerCase() || 'Malaysian'} meals for {settings.servings} {settings.servings === 1 ? 'person' : 'people'}, optimised for {goalProfiles[settings.goal].label.toLowerCase()}, time and a RM{settings.budget} budget.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => document.getElementById('weekly-plan')?.scrollIntoView({ behavior: 'smooth' })}>{t('hero.cta.see')} <ArrowRight size={17} /></button>
            <button className="secondary-button" onClick={openSettings}><Pencil size={16} /> {t('hero.cta.tune')}</button>
          </div>
        </div>
        <div className="hero-summary">
          {plan[1] && <div className="mini-plan-card back-card"><FoodVisual meal={plan[1]} compact /></div>}
          {plan[0] && (
            <div className="mini-plan-card front-card">
              <div className="mini-top"><span>{weekdays[0].toUpperCase()} · LUNCH</span><span className={`fit-badge ${feasible ? '' : 'fit-warning'}`}>{feasible ? <Check size={12} /> : <AlertCircle size={12} />}{feasible ? ' VALIDATED' : ' CLOSEST FIT'}</span></div>
              <FoodVisual meal={plan[0]} compact />
              <h3>{plan[0].name}</h3>
              <div className="mini-metrics"><span>{formatMoney(mealCost(plan[0], settings.servings))}</span><span>{plan[0].protein}g protein</span><span>{plan[0].time} min</span></div>
            </div>
          )}
          <div className="floating-pill pantry-pill"><PackageCheck size={17} /><div><strong>{basket.owned.length} {t('hero.pill.pantry')}</strong><span>{t('hero.pill.pantry.sub')}</span></div></div>
          <div className="floating-pill savings-pill"><CircleDollarSign size={17} /><div><strong>{formatMoney(basket.saved)}</strong><span>{t('hero.pill.saved.sub')}</span></div></div>
        </div>
      </section>
      <div className="container"><JourneyStrip activeView="plan" setActiveView={setActiveView} /></div>
      <div className="soft-band"><div className="container"><ConstraintBar constraints={constraints} onToggle={toggleConstraint} onReduceBudget={reduceBudget} command={command} setCommand={setCommand} onCommand={applyCommand} /></div></div>
      <section id="weekly-plan" className="week-section container">
        <div className="section-header">
          <div>
            <div className="eyebrow"><span /> {t('plan.section.eyebrow')}</div>
            <h2>{t('plan.section.heading', { n: settings.mealsCount })}</h2>
            <p>{settings.servings} serving{settings.servings > 1 ? 's' : ''} · {settings.location} · {settings.diet === 'halal' ? t('settings.diet.halal') : settings.diet === 'vegetarian' ? t('settings.diet.vegetarian') : t('settings.diet.eggFree')}</p>
          </div>
          <div className="section-actions">
            <button className="text-button" onClick={onReset}><RefreshCw size={15} /> {t('plan.reset')}</button>
            <button className="secondary-button small" onClick={openSettings}><Settings2 size={15} /> {t('nav.settings')}</button>
          </div>
        </div>
        <PriceBadge isLive={priceInfo.isLive} priceDate={priceInfo.priceDate} priceSource={priceInfo.priceSource} />
        {!feasible && (
          <div className="feasibility-banner" role="alert">
            <AlertCircle size={20} />
            <div><strong>{t('plan.feasibility.title')}</strong><span>{reasons.join(' · ')}</span></div>
            <button className="secondary-button small" onClick={openSettings}>{t('plan.adjust')}</button>
          </div>
        )}
        <div className="plan-layout">
          <div className="meal-list">{plan.map((meal, index) => <MealCard key={`${weekdays[index]}-${meal.id}`} meal={meal} day={weekdays[index]} pantry={pantry} servings={settings.servings} onSwap={() => openSwap(index)} onDetails={() => openDetails(meal)} />)}</div>
          <div className="summary-column">
            <BudgetCard settings={settings} basket={basket} macro={macro} feasible={feasible} reasons={reasons} />
            <details className="source-card details-source">
              <summary><Calculator size={17} /><strong>{t('plan.calc.heading')}</strong><ChevronDown size={14} className="details-chevron" /></summary>
              <p>{t('plan.calc.body')}</p>
              <span>{priceInfo.priceSource} · {priceInfo.priceDate}</span>
              <span>{dataSnapshot.nutritionSource}</span>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}

function BasketView({ basket, settings, setSettings, plan, pantry, setActiveView, priceInfo }) {
  const { t } = useLang()
  const [filter, setFilter] = useState('all')
  const [checkedIds, setCheckedIds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dapur-checked') || '[]') } catch { return [] }
  })
  const [saraMode, setSaraMode] = useState(true)
  const visible = basket.shopping.filter((line) => filter === 'all' || (filter === 'sara' ? line.saraPotential > 0 : line.saraPotential === 0))
  const saraUsed = saraMode ? Math.min(basket.saraPotential, settings.saraBalance) : 0
  const cashNeeded = Math.max(0, basket.total - saraUsed)
  const cashShortfall = Math.max(0, cashNeeded - settings.cashBalance)

  const toggleCheck = useCallback((id) => {
    setCheckedIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      try { sessionStorage.setItem('dapur-checked', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // ── Export helpers ───────────────────────────────────────────────────────
  function buildListText() {
    const lines = basket.shopping.map(
      (line) => `- ${line.name}: ${quantityText(line)} (${formatMoney(line.cost)})${line.saraPotential ? ' — SARA kategori' : ' — tunai'}`
    ).join('\n')
    return [
      `🛒 *Senarai Belanja DapurKita*`,
      `${settings.location} · ${priceInfo.priceDate}`,
      '',
      lines,
      '',
      `*Jumlah:* ${formatMoney(basket.total)}`,
      `*Liputan SARA:* ${formatMoney(saraUsed)}`,
      `*Tunai diperlukan:* ${formatMoney(cashNeeded)}`,
      '',
      '_Anggaran kategori sahaja. Sahkan label rak SARA melalui MyKasih._',
    ].join('\n')
  }

  const exportList = () => {
    const content = buildListText().replace(/\*/g, '').replace(/_/g, '')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'dapur-kita-validated-list.txt'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 500)
  }

  const exportCsv = () => {
    const header = 'Name,Quantity,Unit,Category,Cost (RM),SARA Category\n'
    const rows = basket.shopping.map((line) => `"${line.name}",${line.buyQuantity.toFixed(3)},"${line.unit}","${line.category}",${line.cost.toFixed(2)},"${line.saraPotential ? line.saraCategory || 'SARA' : 'Cash'}"`)
    const url = URL.createObjectURL(new Blob([header + rows.join('\n')], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'dapur-kita-shopping-list.csv'; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 500)
  }

  const shareWhatsApp = () => {
    const text = buildListText()
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="page-shell container">
      <div className="page-title-row">
        <div>
          <div className="eyebrow"><span /> {t('basket.eyebrow')}</div>
          <h1>{t('basket.title')}</h1>
          <p>{t('basket.subtitle')}</p>
        </div>
        <div className="export-buttons">
          <button className="primary-button wa-button" onClick={shareWhatsApp}>
            <MessageCircle size={17} /> {t('basket.export.wa')}
          </button>
          <button className="secondary-button" onClick={exportList}><ShoppingBasket size={17} /> {t('basket.export.txt')}</button>
          <button className="secondary-button" onClick={exportCsv}><ShoppingBasket size={17} /> {t('basket.export.csv')}</button>
        </div>
      </div>
      <JourneyStrip activeView="basket" setActiveView={setActiveView} />
      <div className="rahmah-controls panel">
        <label><span>SARA balance</span><div className="input-prefix"><span>RM</span><input aria-label="SARA balance" type="number" min="0" value={settings.saraBalance} onChange={(event) => setSettings((current) => ({ ...current, saraBalance: Math.max(0, inputNumber(event.target.value)) }))} /></div></label>
        <label><span>{t('basket.sara.cash')}</span><div className="input-prefix"><span>RM</span><input aria-label="Available cash" type="number" min="0" value={settings.cashBalance} onChange={(event) => setSettings((current) => ({ ...current, cashBalance: Math.max(0, inputNumber(event.target.value)) }))} /></div></label>
        <div className="rahmah-context"><span>{t('basket.rahmah.context')}</span><strong>{settings.servings} people · {settings.mealsCount} meals</strong><button className="text-button" onClick={() => setActiveView('plan')}>{t('basket.rahmah.change')}</button></div>
      </div>
      <div className="basket-layout">
        <section className="basket-main panel">
          <div className="basket-toolbar">
            <div className="segmented" role="group" aria-label="Basket filter">
              <button className={filter === 'all'  ? 'active' : ''} onClick={() => setFilter('all')}>{t('basket.filter.all')}</button>
              <button className={filter === 'sara' ? 'active' : ''} onClick={() => setFilter('sara')}>{t('basket.filter.sara')}</button>
              <button className={filter === 'cash' ? 'active' : ''} onClick={() => setFilter('cash')}>{t('basket.filter.cash')}</button>
            </div>
            <span>{visible.length} items</span>
          </div>
          <div className="shopping-list">
            {visible.map((line) => (
              <div className="shopping-row" key={line.id}>
                <button className={`check-circle ${checkedIds.includes(line.id) ? 'checked' : ''}`} aria-label={`Mark ${line.name} complete`} aria-pressed={checkedIds.includes(line.id)} onClick={() => toggleCheck(line.id)}><Check size={14} /></button>
                <div className="ingredient-icon"><Utensils size={18} /></div>
                <div className="shopping-name"><strong>{line.name}</strong><span>{quantityText(line)} · {line.category}</span></div>
                {saraMode && <span className={`coverage-badge ${line.saraPotential ? 'covered' : 'cash'}`}>{line.saraPotential ? 'CATEGORY' : 'CASH'}</span>}
                <strong className="row-price">{formatMoney(line.cost)}</strong>
              </div>
            ))}
          </div>
          <div className="already-owned">
            <div><PackageCheck size={18} /><strong>{t('basket.owned.heading')}</strong><span>{basket.owned.length} {t('basket.owned.sub')}</span></div>
            <div className="owned-chips">{basket.owned.map((line) => <span key={line.id}><Check size={12} /> {line.name}: {quantityText(line, 'ownedQuantity')}</span>)}</div>
          </div>
        </section>
        <aside className="basket-side">
          <div className="panel sara-card">
            <div className="sara-header">
              <div className="sara-mark">S</div>
              <div><strong>{t('basket.sara.title')}</strong><span>{t('basket.sara.sub')}</span></div>
              <button className={`toggle ${saraMode ? 'on' : ''}`} role="switch" aria-label="Toggle SARA estimate" aria-checked={saraMode} onClick={() => setSaraMode(!saraMode)}><span /></button>
            </div>
            {saraMode && (
              <>
                <div className="coverage-chart">
                  <div className="donut" style={{ '--coverage': `${basket.total ? Math.min(100, saraUsed / basket.total * 100) : 0}%` }}><span>{basket.total ? Math.round(saraUsed / basket.total * 100) : 0}%</span></div>
                  <div><strong>{formatMoney(saraUsed)}</strong><span>{t('basket.sara.coverage')}</span></div>
                </div>
                <div className="cost-split">
                  <div><span>{t('basket.sara.used')}</span><strong>{formatMoney(saraUsed)}</strong></div>
                  <div><span>{t('basket.sara.cash')}</span><strong>{formatMoney(cashNeeded)}</strong></div>
                  <div><span>{t('basket.sara.remaining')}</span><strong>{formatMoney(Math.max(0, settings.cashBalance - cashNeeded))}</strong></div>
                </div>
              </>
            )}
            <div className={`funding-status ${cashShortfall ? 'shortfall' : ''}`}>
              {cashShortfall ? <AlertCircle size={17} /> : <ShieldCheck size={17} />}
              <div>
                <strong>{cashShortfall ? t('basket.sara.shortfall', { amount: formatMoney(cashShortfall) }) : t('basket.sara.fundable')}</strong>
                <span>{cashShortfall ? t('basket.sara.shortfall.sub') : t('basket.sara.fundable.sub')}</span>
              </div>
            </div>
            <div className="prototype-note"><Info size={15} /> {t('basket.sara.note')}</div>
            <a className="official-link" href="https://sara.gov.my/en/home.html" target="_blank" rel="noreferrer">{t('basket.sara.link')} <ExternalLink size={13} /></a>
          </div>
          <div className="panel total-card">
            <div><span>{t('basket.total.basket')}</span><strong>{formatMoney(basket.total)}</strong></div>
            <div className="budget-line"><span>{t('basket.total.consumed')}</span><strong>{formatMoney(basket.consumedValue)}</strong></div>
            <div className="total-progress"><span style={{ width: `${Math.min(100, basket.total / Math.max(settings.budget, 1) * 100)}%` }} /></div>
            <p className={basket.total <= settings.budget ? '' : 'over-budget'}>
              {basket.total <= settings.budget ? <Check size={14} /> : <AlertCircle size={14} />}
              {basket.total <= settings.budget ? t('basket.total.under', { amount: formatMoney(settings.budget - basket.total) }) : t('basket.total.over', { amount: formatMoney(basket.total - settings.budget) })}
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

function PantryView({ pantry, setPantry, plan, basket, settings, setActiveView }) {
  const { t } = useLang()
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
      <div className="page-title-row"><div><div className="eyebrow"><span /> {t('pantry.eyebrow')}</div><h1>{t('pantry.title')}</h1><p>{t('pantry.subtitle')}</p></div></div>
      <JourneyStrip activeView="pantry" setActiveView={setActiveView} />
      <div className="pantry-layout">
        <section className="panel pantry-panel">
          <div className="panel-heading"><div><h2>{t('pantry.heading')}</h2><p>{t('pantry.sub')}</p></div></div>
          <div className="pantry-grid">{rows.map((item) => {
            const step = item.unit === 'kg' ? 0.05 : item.unit === 'eggs' ? 1 : 0.25
            return (
              <article className="pantry-item" key={item.id}>
                <div className="pantry-item-top"><div className="ingredient-icon"><PackageCheck size={19} /></div><button className="remove-pantry" aria-label={`Remove ${item.name}`} onClick={() => setPantry((current) => { const next = { ...current }; delete next[item.id]; return next })}><Trash2 size={15} /></button></div>
                <strong>{item.name}</strong>
                <span>{quantityText({ ...item, buyQuantity: item.quantity })}</span>
                <div className="quantity-stepper">
                  <button aria-label={`Reduce ${item.name}`} onClick={() => update(item.id, { quantity: Math.max(0, item.quantity - step) })}><Minus size={14} /></button>
                  <span>{item.used > 0 ? t('pantry.planned', { qty: quantityText({ ...item, ownedQuantity: item.used }, 'ownedQuantity') }) : t('pantry.notinplan')}</span>
                  <button aria-label={`Add ${item.name}`} onClick={() => update(item.id, { quantity: item.quantity + step })}><Plus size={14} /></button>
                </div>
                <label className="expiry-field">
                  <span>{t('pantry.usewithin')}</span>
                  <select value={item.expiryDays} onChange={(event) => update(item.id, { expiryDays: Number(event.target.value) })}>
                    <option value="2">2 days</option><option value="6">6 days</option><option value="14">2 weeks</option><option value="30">1 month</option><option value="90">{t('pantry.staple')}</option>
                  </select>
                </label>
                <div className={`freshness ${item.expiryDays <= 7 ? 'soon' : ''}`}><span /> {item.expiryDays <= 7 ? t('pantry.usesoon') : t('pantry.good')} · {item.expiryDays >= 90 ? t('pantry.staple') : `${item.expiryDays} days`}</div>
              </article>
            )
          })}</div>
          <div className="add-pantry-row">
            <label><span>{t('pantry.add.label')}</span><select value={selectedIngredient} onChange={(event) => setSelectedIngredient(event.target.value)}>{Object.entries(ingredientCatalog).filter(([id]) => !pantry[id]).map(([id, item]) => <option key={id} value={id}>{item.name}</option>)}</select></label>
            <button className="secondary-button" disabled={Object.keys(pantry).length >= Object.keys(ingredientCatalog).length} onClick={addIngredient}><Plus size={16} /> {t('pantry.add.btn')}</button>
          </div>
        </section>
        <aside className="rescue-card">
          <div className="section-kicker"><Sparkles size={15} /> {t('pantry.rescue.kicker')}</div>
          {atRisk ? (
            <>
              <h2>{t('pantry.rescue.use', { name: atRisk.name.toLowerCase() })}</h2>
              <p>{quantityText({ ...atRisk, ownedQuantity: atRisk.used }, 'ownedQuantity')} is allocated across {reuseMeals.length} planned meal{reuseMeals.length === 1 ? '' : 's'} before its {atRisk.expiryDays}-day freshness window.</p>
              <div className="rescue-flow">{reuseMeals.map((entry, index) => <div className="rescue-step" key={`${entry.day}-${entry.meal.id}`}><div><span>{entry.day}</span><strong>{entry.meal.name}</strong></div>{index < reuseMeals.length - 1 && <ArrowRight size={17} />}</div>)}</div>
            </>
          ) : (
            <><h2>{t('pantry.rescue.noatrisk.title')}</h2><p>{t('pantry.rescue.noatrisk.body')}</p></>
          )}
          <button className="secondary-button" onClick={() => setActiveView('plan')}>{t('pantry.rescue.cta')} <ArrowRight size={16} /></button>
        </aside>
      </div>
    </main>
  )
}

function ImpactView({ basket, plan, pantry, settings, macro, setActiveView }) {
  const { t } = useLang()
  const BASELINE_MEAL_COST = 14
  const baseline = BASELINE_MEAL_COST * settings.mealsCount * settings.servings
  const cashSavings = Math.max(0, baseline - basket.total)
  const atRiskKg = basket.lines.filter((line) => line.unit === 'kg' && inputNumber(pantry[line.id]?.expiryDays, 30) <= 7).reduce((sum, line) => sum + line.ownedQuantity, 0)
  const goalMet = macro.checks.filter((check) => check.met).length
  return (
    <main className="page-shell container impact-page">
      <div className="page-title-row"><div><div className="eyebrow"><span /> {t('impact.eyebrow')}</div><h1>{t('impact.title')}</h1><p>{t('impact.subtitle')}</p></div></div>
      <div className="impact-grid">
        <article className="impact-card accent"><div className="impact-icon"><WalletCards size={22} /></div><span>{t('impact.cash.label')}</span><strong>{formatMoney(cashSavings)}</strong><p>{t('impact.cash.sub', { n: settings.mealsCount * settings.servings, amt: BASELINE_MEAL_COST })}</p></article>
        <article className="impact-card"><div className="impact-icon"><PackageCheck size={22} /></div><span>{t('impact.pantry.label')}</span><strong>{formatMoney(basket.saved)}</strong><p>{t('impact.pantry.sub', { n: basket.owned.length })}</p></article>
        <article className="impact-card"><div className="impact-icon"><Leaf size={22} /></div><span>{t('impact.waste.label')}</span><strong>{atRiskKg.toFixed(2)} kg</strong><p>{t('impact.waste.sub')}</p></article>
      </div>
      <section className="panel impact-story">
        <div>
          <div className="section-kicker"><HeartPulse size={15} /> {t('impact.macro.kicker')}</div>
          <h2>{goalProfiles[settings.goal].label}, explained.</h2>
          <p>The plan averages {Math.round(macro.summary.protein)} g protein, {Math.round(macro.summary.calories)} kcal and {macro.summary.veg.toFixed(1)} vegetable servings per meal. Values are curated prototype estimates, not medical advice.</p>
        </div>
        <div className="balance-bars">{macro.checks.map((check) => <div key={check.label}><span>{check.label}</span><i><b style={{ width: check.met ? '100%' : '65%' }} /></i><strong>{check.value} {check.met ? '✓' : '△'}</strong></div>)}</div>
      </section>
      <div className="impact-method panel">
        <Calculator size={20} />
        <div><strong>{t('impact.macro.checks', { n: goalMet })}</strong><p>{t('impact.macro.body', { amt: BASELINE_MEAL_COST })}</p></div>
        <button className="secondary-button small" onClick={() => setActiveView('plan')}>{t('impact.macro.cta')}</button>
      </div>
    </main>
  )
}

function SettingsModal({ settings, onSave, onClose }) {
  const { t } = useLang()
  const [draft, setDraft] = useState(settings)
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  const save = () => onSave({ ...draft, budget: Math.max(10, inputNumber(draft.budget, 60)), mealsCount: Math.min(7, Math.max(3, inputNumber(draft.mealsCount, 5))), servings: Math.min(6, Math.max(1, inputNumber(draft.servings, 1))), maxPrep: inputNumber(draft.maxPrep, 30) })
  return (
    <ModalShell titleId="settings-title" className="settings-modal" onClose={onClose}>
      <div className="modal-header"><div><span>{t('settings.kicker')}</span><h2 id="settings-title">{t('settings.title')}</h2></div><button className="icon-button" aria-label="Close settings" onClick={onClose}><X size={19} /></button></div>
      <div className="form-grid">
        <label htmlFor="budget"><span>{t('settings.budget')}</span><div className="input-prefix"><span>RM</span><input id="budget" type="number" min="10" max="300" value={draft.budget} onChange={(event) => update('budget', event.target.value)} /></div></label>
        <label htmlFor="servings"><span>{t('settings.servings')}</span><div className="input-prefix"><input id="servings" type="number" min="1" max="6" value={draft.servings} onChange={(event) => update('servings', event.target.value)} /></div></label>
        <label htmlFor="meal-count"><span>{t('settings.meals')}</span><div className="select-wrap"><select id="meal-count" value={draft.mealsCount} onChange={(event) => update('mealsCount', Number(event.target.value))}>{[3,4,5,6,7].map((n) => <option key={n} value={n}>{t('settings.meals.option', { n })}</option>)}</select><ChevronDown size={16} /></div></label>
        <label htmlFor="max-prep"><span>{t('settings.prep')}</span><div className="select-wrap"><select id="max-prep" value={draft.maxPrep} onChange={(event) => update('maxPrep', Number(event.target.value))}>{[15,20,25,30].map((n) => <option key={n} value={n}>{t('settings.prep.option', { n })}</option>)}</select><ChevronDown size={16} /></div></label>
        <label htmlFor="nutrition-goal"><span>{t('settings.goal')}</span><div className="select-wrap"><select id="nutrition-goal" value={draft.goal} onChange={(event) => update('goal', event.target.value)}>{Object.entries(goalProfiles).map(([id, goal]) => <option key={id} value={id}>{goal.label}</option>)}</select><ChevronDown size={16} /></div></label>
        <label htmlFor="diet"><span>{t('settings.diet')}</span><div className="select-wrap"><select id="diet" value={draft.diet} onChange={(event) => update('diet', event.target.value)}><option value="halal">{t('settings.diet.halal')}</option><option value="vegetarian">{t('settings.diet.vegetarian')}</option><option value="eggFree">{t('settings.diet.eggFree')}</option></select><ChevronDown size={16} /></div></label>
        <label htmlFor="location"><span>{t('settings.location')}</span><div className="select-wrap"><select id="location" value={draft.location} onChange={(event) => update('location', event.target.value)}>{locations.map((location) => <option key={location}>{location}</option>)}</select><ChevronDown size={16} /></div></label>
      </div>
      <div className="preference-summary"><Target size={19} /><div><strong>{t('settings.constraint.note')}</strong><span>{t('settings.constraint.sub')}</span></div></div>
      <div className="modal-actions"><button className="secondary-button" onClick={onClose}>{t('settings.cancel')}</button><button className="primary-button" onClick={save}>{t('settings.save')} <Sparkles size={16} /></button></div>
    </ModalShell>
  )
}

function SwapModal({ index, plan, options, onSwap, onClose }) {
  const { t } = useLang()
  const shown = [...options.filter((o) => o.valid).slice(0, 4), ...options.filter((o) => !o.valid).slice(0, 2)]
  return (
    <ModalShell titleId="swap-title" className="swap-modal" onClose={onClose}>
      <div className="modal-header"><div><span>{t('swap.kicker')} · {weekdays[index]?.toUpperCase()}</span><h2 id="swap-title">{t('swap.title')}</h2></div><button className="icon-button" aria-label="Close swap choices" onClick={onClose}><X size={19} /></button></div>
      <p className="modal-intro">{t('swap.intro')}</p>
      <div className="swap-list">{shown.map((option) => <button key={option.meal.id} className={`swap-option ${option.valid ? '' : 'blocked'}`} disabled={!option.valid} onClick={() => onSwap(option.meal.id)}><FoodVisual meal={option.meal} compact /><div><strong>{option.meal.name}</strong><span>{formatMoney(option.basket.total)} basket · {option.meal.protein}g protein · {option.meal.time} min</span>{!option.valid && <small><ShieldCheck size={12} /> {t('swap.blocked', { reason: option.reasons[0] })}</small>}</div>{option.valid ? <ArrowRight size={18} /> : <X size={18} />}</button>)}</div>
    </ModalShell>
  )
}

function MealDetailsModal({ meal, settings, pantry, onClose }) {
  const { t } = useLang()
  const basket = buildBasket([meal], pantry, settings.servings)
  return (
    <ModalShell titleId="meal-details-title" className="meal-details-modal" onClose={onClose}>
      <div className="modal-header"><div><span>{t('details.kicker')}</span><h2 id="meal-details-title">{meal.name}</h2></div><button className="icon-button" aria-label="Close meal details" onClick={onClose}><X size={19} /></button></div>
      <div className="details-macro-row"><span><strong>{meal.protein}g</strong> protein</span><span><strong>{meal.carbs}g</strong> carbs</span><span><strong>{meal.fat}g</strong> fat</span><span><strong>{meal.calories}</strong> kcal</span></div>
      <div className="details-columns">
        <div><h3>{settings.servings === 1 ? t('details.for', { n: settings.servings }) : t('details.for.plural', { n: settings.servings })}</h3><ul>{basket.lines.map((line) => <li key={line.id}><span>{line.name}</span><strong>{quantityText(line, 'requiredQuantity')}</strong></li>)}</ul></div>
        <div><h3>{t('details.cook')}</h3><ol>{meal.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      </div>
      <div className="prototype-note"><Info size={15} /> {t('details.note')}</div>
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
      manualSwaps: parsed.manualSwaps || {},
    }
  } catch {
    return { settings: defaultSettings, constraints: defaultConstraints, pantry: initialPantry, manualSwaps: {} }
  }
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  // Language state — auto-detect on first visit
  const [lang, setLangState] = useState(() => detectLang())
  const setLang = (l) => { setLangState(l); localStorage.setItem('dapur-lang', l) }

  // Live prices from PriceCatcher
  const priceInfo = useLivePrices()

  // Build engine-compatible catalog with live prices merged in
  const liveCatalog = priceInfo.catalog

  const persisted = useMemo(loadPersisted, [])
  const [activeView, setActiveView] = useState('plan')
  const [settings, setSettings] = useState(persisted.settings)
  const [constraints, setConstraints] = useState(persisted.constraints)
  const [pantry, setPantry] = useState(persisted.pantry)
  const [manualSwaps, setManualSwaps] = useState(persisted.manualSwaps)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [swapIndex, setSwapIndex] = useState(null)
  const [detailMeal, setDetailMeal] = useState(null)
  const [command, setCommand] = useState('')
  const [toast, setToast] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    localStorage.setItem('dapur-kita-state', JSON.stringify({ settings, constraints, pantry, manualSwaps }))
  }, [settings, constraints, pantry, manualSwaps])

  const debouncedSettings = useDebounced(settings, 280)

  const planningSettings = useMemo(() => ({
    budget: debouncedSettings.budget,
    mealsCount: debouncedSettings.mealsCount,
    servings: debouncedSettings.servings,
    maxPrep: debouncedSettings.maxPrep,
    goal: debouncedSettings.goal,
    diet: debouncedSettings.diet,
    location: debouncedSettings.location,
  }), [debouncedSettings.budget, debouncedSettings.mealsCount, debouncedSettings.servings, debouncedSettings.maxPrep, debouncedSettings.goal, debouncedSettings.diet, debouncedSettings.location])

  // Pass live catalog into optimizer so costs use PriceCatcher prices
  const optimized = useMemo(
    () => optimizePlan(planningSettings, constraints, pantry, liveCatalog),
    [planningSettings, constraints, pantry, liveCatalog]
  )

  const plan = useMemo(() => optimized.plan.map((meal, index) => {
    const swappedId = manualSwaps[index]
    if (!swappedId) return meal
    return meals.find((candidate) => candidate.id === swappedId) || meal
  }), [optimized.plan, manualSwaps])

  const validation = useMemo(
    () => validatePlan(plan, pantry, planningSettings, constraints, liveCatalog),
    [plan, pantry, planningSettings, constraints, liveCatalog]
  )
  const basket = validation.basket
  const macro = useMemo(() => macroStatus(plan, settings.goal), [plan, settings.goal])
  const options = useMemo(
    () => swapIndex === null ? [] : swapOptions(plan, swapIndex, pantry, planningSettings, constraints, liveCatalog),
    [swapIndex, plan, pantry, planningSettings, constraints, liveCatalog]
  )

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }

  const applySettings = (next) => {
    const safeSwaps = next.mealsCount < settings.mealsCount
      ? Object.fromEntries(Object.entries(manualSwaps).filter(([idx]) => Number(idx) < next.mealsCount))
      : manualSwaps
    setSettings(next); setManualSwaps(safeSwaps); setSettingsOpen(false)
    notify('Plan rebuilt and every hard constraint was checked.')
  }
  const toggleConstraint = (id) => {
    const next = !constraints[id]
    setConstraints((current) => ({ ...current, [id]: next }))
    notify(`${id === 'vegetarianFriday' ? 'Vegetarian Friday' : id === 'noChicken' ? 'No chicken' : '15-minute tomorrow'} ${next ? 'applied' : 'removed'}. Plan revalidated.`)
  }
  const reduceBudget = () => {
    setSettings((current) => ({ ...current, budget: Math.max(10, current.budget - 10) }))
    notify('Budget reduced by RM10. The plan was re-optimised.')
  }
  const applyCommand = () => {
    const parsed = parseAdjustment(command, settings, constraints)
    if (!parsed.changes.length) { notify('Try: "Set budget to RM80", "No chicken", "Make Friday vegetarian", "3 people", "7 meals".'); return }
    const safeSwaps = parsed.settings.mealsCount < settings.mealsCount
      ? Object.fromEntries(Object.entries(manualSwaps).filter(([idx]) => Number(idx) < parsed.settings.mealsCount))
      : manualSwaps
    setSettings(parsed.settings); setConstraints(parsed.constraints); setManualSwaps(safeSwaps); setCommand('')
    notify(`${parsed.changes.join(' · ')}. Validation complete.`)
  }
  const applySwap = (mealId) => {
    const option = options.find((candidate) => candidate.meal.id === mealId)
    if (!option?.valid) { notify(`Swap blocked: ${option?.reasons[0] || 'constraint conflict'}.`); return }
    setManualSwaps((current) => ({ ...current, [swapIndex]: mealId }))
    const day = weekdays[swapIndex]; setSwapIndex(null)
    notify(`${day} swapped to ${option.meal.name}. Budget and constraints revalidated.`)
  }
  const doReset = () => {
    setSettings(defaultSettings); setConstraints(defaultConstraints); setPantry(initialPantry); setManualSwaps({})
    notify('The validated demo scenario is restored.')
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div className="app-shell">
        <TopBar activeView={activeView} setActiveView={setActiveView} onSettings={() => setSettingsOpen(true)} />
        {activeView === 'plan'   && <PlanView   plan={plan} basket={basket} settings={settings} constraints={constraints} pantry={pantry} feasible={validation.valid} reasons={validation.reasons} macro={macro} openSettings={() => setSettingsOpen(true)} openSwap={setSwapIndex} openDetails={setDetailMeal} onReset={() => setConfirmReset(true)} command={command} setCommand={setCommand} applyCommand={applyCommand} toggleConstraint={toggleConstraint} reduceBudget={reduceBudget} setActiveView={setActiveView} priceInfo={priceInfo} />}
        {activeView === 'basket' && <BasketView basket={basket} settings={settings} setSettings={setSettings} plan={plan} pantry={pantry} setActiveView={setActiveView} priceInfo={priceInfo} />}
        {activeView === 'pantry' && <PantryView pantry={pantry} setPantry={setPantry} plan={plan} basket={basket} settings={settings} setActiveView={setActiveView} />}
        {activeView === 'impact' && <ImpactView basket={basket} plan={plan} pantry={pantry} settings={settings} macro={macro} setActiveView={setActiveView} />}
        <footer>
          <div className="container">
            <Logo onClick={() => setActiveView('plan')} />
            <p>Plan within constraints. Fund transparently. Rescue what you own.</p>
            <span>Prototype · {priceInfo.priceDate} reference snapshot</span>
          </div>
        </footer>
        {settingsOpen  && <SettingsModal settings={settings} onSave={applySettings} onClose={() => setSettingsOpen(false)} />}
        {swapIndex !== null && <SwapModal index={swapIndex} plan={plan} options={options} onSwap={applySwap} onClose={() => setSwapIndex(null)} />}
        {detailMeal    && <MealDetailsModal meal={detailMeal} settings={settings} pantry={pantry} onClose={() => setDetailMeal(null)} />}
        {confirmReset  && <ConfirmModal message="This will restore the demo scenario and overwrite your pantry entries, settings, and any manual meal swaps." onConfirm={doReset} onClose={() => setConfirmReset(false)} />}
        <Toast message={toast} />
      </div>
    </LangContext.Provider>
  )
}
