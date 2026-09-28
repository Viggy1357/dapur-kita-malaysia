/**
 * DapurKita i18n — Bahasa Malaysia / English
 *
 * A lightweight translation context. No library needed for a 4-view SPA.
 * Auto-detects browser language; persists choice to localStorage.
 *
 * Usage:
 *   const { t, lang, setLang } = useLang()
 *   <h1>{t('hero.title')}</h1>
 */

import { createContext, useContext } from 'react'

// ---------------------------------------------------------------------------
// Translation strings
// ---------------------------------------------------------------------------
const strings = {
  en: {
    // Nav
    'nav.plan':   'DapurPlan',
    'nav.basket': 'DapurRahmah',
    'nav.pantry': 'DapurRescue',
    'nav.impact': 'My impact',
    'nav.settings': 'Plan settings',

    // Hero
    'hero.eyebrow': 'BUDGET TO BASKET, VALIDATED',
    'hero.title':   'Good food, planned\naround your life.',
    'hero.cta.see': 'See validated plan',
    'hero.cta.tune': 'Tune my plan',
    'hero.pill.pantry': 'pantry items',
    'hero.pill.pantry.sub': 'deducted once',
    'hero.pill.saved.sub': 'from your pantry',

    // Journey strip
    'journey.plan.label': '1 · Plan',
    'journey.plan.text':  'Optimise meals and macros',
    'journey.fund.label': '2 · Fund',
    'journey.fund.text':  'Split SARA and cash',
    'journey.rescue.label': '3 · Rescue',
    'journey.rescue.text':  'Use at-risk ingredients',

    // Constraint bar
    'constraint.kicker':   'DETERMINISTIC ADJUSTMENT ENGINE',
    'constraint.heading':  'Something changed?',
    'constraint.subhead':  'Every update is re-optimised and validated before it reaches your basket.',
    'constraint.input.placeholder': 'Try: Make Friday vegetarian and reduce budget by RM10',
    'constraint.apply':    'Apply change',
    'constraint.chip.budget':    'Reduce budget by RM10',
    'constraint.chip.vegfri':    'Make Friday vegetarian',
    'constraint.chip.nochicken': 'No more chicken',
    'constraint.chip.quick':     'Only 15 min tomorrow',

    // Meal card
    'meal.details': 'Details',
    'meal.swap':    'Swap',
    'meal.pantry.uses': 'Uses {{n}} pantry item',
    'meal.pantry.uses.plural': 'Uses {{n}} pantry items',
    'meal.metric.value':   'food value',
    'meal.metric.protein': 'protein / serving',
    'meal.metric.time':    'cook time',

    // Plan section
    'plan.section.eyebrow':  'DETERMINISTIC MEAL GRAPH',
    'plan.section.heading':  'Your {{n}}-meal plan',
    'plan.reset': 'Reset demo',
    'plan.feasibility.title': 'No fully feasible plan at the current limits',
    'plan.adjust': 'Adjust constraints',
    'plan.calc.heading': 'How this is calculated',
    'plan.calc.body': 'Ingredients are aggregated for all servings, pantry quantities are deducted once, packaged goods round up, and the final basket is validated against every active constraint.',

    // Budget card
    'budget.label': 'Validated weekly basket',
    'budget.left':  '{{amount}} left',
    'budget.topup': '{{amount}} top-up needed',
    'budget.prototype': 'Prices via PriceCatcher',
    'budget.protein':   'avg. protein',
    'budget.veg':       'veg servings',
    'budget.pantry':    'pantry value used',
    'budget.time':      'avg. cook time',
    'budget.macro.ok':  'Macro goal on track',
    'budget.macro.fit': 'Closest feasible macro fit',

    // Basket view
    'basket.eyebrow':  'JOURNEY 2 · FUND THE BASKET',
    'basket.title':    'Turn assistance into meals.',
    'basket.subtitle': 'Separate category-estimated SARA coverage, cash top-up and ingredients already at home—without claiming checkout or MyKad authorisation.',
    'basket.export.txt': 'Export list (.txt)',
    'basket.export.csv': 'Export CSV',
    'basket.export.wa':  'Share on WhatsApp',
    'basket.filter.all':  'All items',
    'basket.filter.sara': 'SARA category',
    'basket.filter.cash': 'Cash',
    'basket.owned.heading': 'Already at home',
    'basket.owned.sub':     'ingredients deducted',
    'basket.sara.title':  'DapurRahmah mode',
    'basket.sara.sub':    'Category estimate only',
    'basket.sara.coverage': 'potential category coverage',
    'basket.sara.used':     'SARA balance used',
    'basket.sara.cash':     'Cash needed',
    'basket.sara.remaining':'Cash remaining',
    'basket.sara.fundable': 'Basket is fundable',
    'basket.sara.shortfall':'{{amount}} still needed',
    'basket.sara.shortfall.sub': 'Raise cash or adjust the plan.',
    'basket.sara.fundable.sub':  'Using entered SARA and cash balances.',
    'basket.sara.note': 'Published category rules are not exact SKU approval. Confirm the SARA shelf label and balance through MyKasih.',
    'basket.sara.link': 'Open official SARA guide',
    'basket.total.basket':  'Estimated basket',
    'basket.total.consumed':'Food consumed value',
    'basket.total.under':   '{{amount}} under plan budget',
    'basket.total.over':    '{{amount}} over plan budget',
    'basket.rahmah.context': 'Plan context',
    'basket.rahmah.change':  'Change the meal plan',

    // Pantry view
    'pantry.eyebrow': 'JOURNEY 3 · RESCUE WHAT YOU OWN',
    'pantry.title':   'Your pantry changes the plan.',
    'pantry.subtitle':'Edit approximate quantities and freshness. DapurKita deducts stock once and prioritises at-risk ingredients already used by the selected meals.',
    'pantry.heading': 'In your kitchen',
    'pantry.sub':     'Saved locally on this device',
    'pantry.planned': '{{qty}} planned',
    'pantry.notinplan': 'Not in plan',
    'pantry.usewithin': 'Use within',
    'pantry.usesoon': 'Use soon',
    'pantry.good':    'Good',
    'pantry.staple':  'Pantry staple',
    'pantry.add.label': 'Add an ingredient',
    'pantry.add.btn':   'Add to pantry',
    'pantry.rescue.kicker': 'DAPURRESCUE · DYNAMIC PREVIEW',
    'pantry.rescue.use':   'Use {{name}} first.',
    'pantry.rescue.noatrisk.title': 'No at-risk planned item yet.',
    'pantry.rescue.noatrisk.body': 'Add an expiry window or adjust your plan to prioritise something that needs using soon.',
    'pantry.rescue.cta': 'See reuse in DapurPlan',

    // Impact view
    'impact.eyebrow':  'CALCULATED, NOT CLAIMED',
    'impact.title':    "Your plan's measurable outputs.",
    'impact.subtitle': 'These figures update from the current basket and plan. Health outcomes and actual waste reduction require a real-world pilot.',
    'impact.cash.label': 'Estimated cash difference',
    'impact.cash.sub':   'versus {{n}} bought lunches at an assumed RM{{amt}} per meal',
    'impact.pantry.label': 'Pantry value allocated',
    'impact.pantry.sub':   '{{n}} pantry ingredients deducted from this basket',
    'impact.waste.label':  'At-risk food allocated',
    'impact.waste.sub':    'planned use only; not a claim of measured waste avoided',
    'impact.macro.kicker': 'CURRENT MACRO FIT',
    'impact.macro.cta':    'Adjust the plan',
    'impact.macro.checks': '{{n}}/3 macro checks met',
    'impact.macro.body':   'Cash difference = RM{{amt}} × meals × servings − current basket cash outlay. Pantry and at-risk figures use quantities allocated to this plan.',

    // Settings modal
    'settings.kicker': 'PLAN PREFERENCES',
    'settings.title':  'Shape a feasible week',
    'settings.budget': 'Meal-plan budget',
    'settings.servings': 'People / servings',
    'settings.meals':  'Number of meals',
    'settings.prep':   'Maximum cook time',
    'settings.goal':   'Macro goal',
    'settings.diet':   'Dietary rule',
    'settings.location': 'Price location label',
    'settings.constraint.note': 'Hard constraints are enforced',
    'settings.constraint.sub': 'Budget · dietary rule · time · servings · unique meals',
    'settings.cancel': 'Cancel',
    'settings.save':   'Optimise my plan',
    'settings.diet.halal': 'Halal-friendly catalogue',
    'settings.diet.vegetarian': 'Vegetarian',
    'settings.diet.eggFree': 'Egg-free',
    'settings.meals.option': '{{n}} meals',
    'settings.prep.option': '{{n}} minutes',

    // Swap modal
    'swap.kicker': 'VALIDATED SWAP',
    'swap.title':  'Choose without breaking the plan',
    'swap.intro':  'Valid options preserve budget, dietary, time and uniqueness rules. Blocked options show exactly which rule failed.',
    'swap.blocked': 'Blocked: {{reason}}',

    // Meal details modal
    'details.kicker': 'PORTIONS & METHOD',
    'details.for':    'For {{n}} serving',
    'details.for.plural': 'For {{n}} servings',
    'details.cook':   'Cook it',
    'details.note':   'Nutrition is a curated per-serving prototype estimate. Ingredient quantities scale deterministically with servings.',

    // Confirm modal
    'confirm.kicker': 'CONFIRM ACTION',
    'confirm.title':  'Are you sure?',
    'confirm.cancel': 'Cancel',
    'confirm.ok':     'Yes, reset',
    'confirm.reset.msg': 'This will restore the demo scenario and overwrite your pantry entries, settings, and any manual meal swaps.',

    // Toasts
    'toast.plan.rebuilt': 'Plan rebuilt and every hard constraint was checked.',
    'toast.reset': 'The validated demo scenario is restored.',
    'toast.budget.reduced': 'Budget reduced by RM10. The plan was re-optimised.',
    'toast.command.unknown': 'Try: "Set budget to RM80", "No chicken", "Make Friday vegetarian", "3 people", "7 meals".',
    'toast.swap.blocked': 'Swap blocked: {{reason}}.',
    'toast.wa.copied':    'List text copied — paste into WhatsApp.',

    // Footer
    'footer.tagline': 'Plan within constraints. Fund transparently. Rescue what you own.',
    'footer.snapshot': 'Prototype · {{date}} reference snapshot',

    // Price source banner
    'price.live.badge':  'Live prices',
    'price.live.source': 'KPDN PriceCatcher',
    'price.static.badge': 'Reference prices',
  },

  // ---------------------------------------------------------------------------
  // Bahasa Malaysia
  // ---------------------------------------------------------------------------
  ms: {
    'nav.plan':   'RancanganDapur',
    'nav.basket': 'DapurRahmah',
    'nav.pantry': 'SelamatkanDapur',
    'nav.impact': 'Impak saya',
    'nav.settings': 'Tetapan rancangan',

    'hero.eyebrow': 'BAJET KE BAKUL, DISAHKAN',
    'hero.title':   'Makanan baik, dirancang\nmengikut kehidupan anda.',
    'hero.cta.see': 'Lihat rancangan disahkan',
    'hero.cta.tune': 'Ubah rancangan saya',
    'hero.pill.pantry': 'bahan dalam pantri',
    'hero.pill.pantry.sub': 'ditolak sekali',
    'hero.pill.saved.sub': 'dari pantri anda',

    'journey.plan.label': '1 · Rancang',
    'journey.plan.text':  'Optimumkan hidangan dan makro',
    'journey.fund.label': '2 · Biaya',
    'journey.fund.text':  'Bahagikan SARA dan tunai',
    'journey.rescue.label': '3 · Selamatkan',
    'journey.rescue.text':  'Guna bahan yang akan luput',

    'constraint.kicker':   'ENJIN PELARASAN DETERMINISTIK',
    'constraint.heading':  'Ada perubahan?',
    'constraint.subhead':  'Setiap kemas kini dioptimumkan dan disahkan sebelum sampai ke bakul anda.',
    'constraint.input.placeholder': 'Cuba: Buat Jumaat vegetarian dan kurangkan bajet RM10',
    'constraint.apply':    'Guna perubahan',
    'constraint.chip.budget':    'Kurangkan bajet RM10',
    'constraint.chip.vegfri':    'Jumaat vegetarian',
    'constraint.chip.nochicken': 'Tiada ayam',
    'constraint.chip.quick':     'Hanya 15 min esok',

    'meal.details': 'Butiran',
    'meal.swap':    'Tukar',
    'meal.pantry.uses': 'Guna {{n}} bahan pantri',
    'meal.pantry.uses.plural': 'Guna {{n}} bahan pantri',
    'meal.metric.value':   'nilai makanan',
    'meal.metric.protein': 'protein / hidangan',
    'meal.metric.time':    'masa masak',

    'plan.section.eyebrow':  'GRAF HIDANGAN DETERMINISTIK',
    'plan.section.heading':  'Rancangan {{n}} hidangan anda',
    'plan.reset': 'Set semula demo',
    'plan.feasibility.title': 'Tiada rancangan yang layak pada had semasa',
    'plan.adjust': 'Laraskan kekangan',
    'plan.calc.heading': 'Cara pengiraan ini',
    'plan.calc.body': 'Bahan-bahan diagregatkan untuk semua hidangan, kuantiti pantri ditolak sekali, barangan bungkusan dibundarkan ke atas, dan bakul akhir disahkan terhadap setiap kekangan aktif.',

    'budget.label': 'Bakul mingguan disahkan',
    'budget.left':  '{{amount}} berbaki',
    'budget.topup': '{{amount}} tambahan diperlukan',
    'budget.prototype': 'Harga via PriceCatcher',
    'budget.protein':   'purata protein',
    'budget.veg':       'hidangan sayur',
    'budget.pantry':    'nilai pantri digunakan',
    'budget.time':      'purata masa masak',
    'budget.macro.ok':  'Sasaran makro menepati',
    'budget.macro.fit': 'Padanan makro terbaik',

    'basket.eyebrow':  'PERJALANAN 2 · BIAYAI BAKUL',
    'basket.title':    'Tukar bantuan menjadi hidangan.',
    'basket.subtitle': 'Pisahkan anggaran liputan kategori SARA, tambahan tunai dan bahan yang sudah ada di rumah—tanpa mendakwa semakan MyKad.',
    'basket.export.txt': 'Eksport senarai (.txt)',
    'basket.export.csv': 'Eksport CSV',
    'basket.export.wa':  'Kongsi di WhatsApp',
    'basket.filter.all':  'Semua',
    'basket.filter.sara': 'Kategori SARA',
    'basket.filter.cash': 'Tunai',
    'basket.owned.heading': 'Sudah ada di rumah',
    'basket.owned.sub':     'bahan ditolak',
    'basket.sara.title':  'Mod DapurRahmah',
    'basket.sara.sub':    'Anggaran kategori sahaja',
    'basket.sara.coverage': 'anggaran liputan kategori',
    'basket.sara.used':     'Baki SARA digunakan',
    'basket.sara.cash':     'Tunai diperlukan',
    'basket.sara.remaining':'Tunai berbaki',
    'basket.sara.fundable': 'Bakul boleh dibiayai',
    'basket.sara.shortfall':'{{amount}} masih diperlukan',
    'basket.sara.shortfall.sub': 'Dapatkan tunai tambahan atau laraskan rancangan.',
    'basket.sara.fundable.sub':  'Menggunakan baki SARA dan tunai yang dimasukkan.',
    'basket.sara.note': 'Peraturan kategori yang diterbitkan bukan kelulusan SKU tepat. Sahkan label rak SARA dan baki melalui MyKasih.',
    'basket.sara.link': 'Buka panduan SARA rasmi',
    'basket.total.basket':  'Anggaran bakul',
    'basket.total.consumed':'Nilai makanan yang digunakan',
    'basket.total.under':   '{{amount}} bawah bajet rancangan',
    'basket.total.over':    '{{amount}} melebihi bajet rancangan',
    'basket.rahmah.context': 'Konteks rancangan',
    'basket.rahmah.change':  'Tukar rancangan hidangan',

    'pantry.eyebrow': 'PERJALANAN 3 · SELAMATKAN APA YANG ADA',
    'pantry.title':   'Pantri anda mengubah rancangan.',
    'pantry.subtitle':'Edit kuantiti dan kesegaran anggaran. DapurKita menolak stok sekali dan mengutamakan bahan yang hampir luput.',
    'pantry.heading': 'Di dapur anda',
    'pantry.sub':     'Disimpan tempatan di peranti ini',
    'pantry.planned': '{{qty}} dirancang',
    'pantry.notinplan': 'Tiada dalam rancangan',
    'pantry.usewithin': 'Guna dalam',
    'pantry.usesoon': 'Guna segera',
    'pantry.good':    'Baik',
    'pantry.staple':  'Bahan asas',
    'pantry.add.label': 'Tambah bahan',
    'pantry.add.btn':   'Tambah ke pantri',
    'pantry.rescue.kicker': 'SELAMATKAN · PRATONTON DINAMIK',
    'pantry.rescue.use':   'Gunakan {{name}} dahulu.',
    'pantry.rescue.noatrisk.title': 'Tiada bahan berisiko dirancang lagi.',
    'pantry.rescue.noatrisk.body': 'Tambah tetingkap luput atau laraskan rancangan anda untuk mengutamakan sesuatu yang perlu digunakan segera.',
    'pantry.rescue.cta': 'Lihat penggunaan semula dalam RancanganDapur',

    'impact.eyebrow':  'DIKIRA, BUKAN DITUNTUT',
    'impact.title':    'Hasil boleh ukur rancangan anda.',
    'impact.subtitle': 'Angka ini dikemas kini dari bakul dan rancangan semasa. Hasil kesihatan dan pengurangan pembaziran sebenar memerlukan kajian lapangan.',
    'impact.cash.label': 'Anggaran perbezaan tunai',
    'impact.cash.sub':   'berbanding {{n}} tengah hari yang dibeli dengan anggaran RM{{amt}} semeal',
    'impact.pantry.label': 'Nilai pantri yang diperuntukkan',
    'impact.pantry.sub':   '{{n}} bahan pantri ditolak dari bakul ini',
    'impact.waste.label':  'Makanan berisiko yang diperuntukkan',
    'impact.waste.sub':    'penggunaan yang dirancang sahaja; bukan dakwaan pembaziran yang diukur',
    'impact.macro.kicker': 'PADANAN MAKRO SEMASA',
    'impact.macro.cta':    'Laraskan rancangan',
    'impact.macro.checks': '{{n}}/3 semakan makro dipenuhi',
    'impact.macro.body':   'Perbezaan tunai = RM{{amt}} × hidangan × sajian − perbelanjaan tunai bakul semasa.',

    'settings.kicker': 'KEUTAMAAN RANCANGAN',
    'settings.title':  'Bentuk minggu yang boleh dilaksanakan',
    'settings.budget': 'Bajet rancangan hidangan',
    'settings.servings': 'Orang / sajian',
    'settings.meals':  'Bilangan hidangan',
    'settings.prep':   'Masa masak maksimum',
    'settings.goal':   'Sasaran makro',
    'settings.diet':   'Peraturan pemakanan',
    'settings.location': 'Label lokasi harga',
    'settings.constraint.note': 'Kekangan keras dikuatkuasakan',
    'settings.constraint.sub': 'Bajet · peraturan pemakanan · masa · sajian · hidangan unik',
    'settings.cancel': 'Batal',
    'settings.save':   'Optimumkan rancangan saya',
    'settings.diet.halal': 'Katalog mesra Halal',
    'settings.diet.vegetarian': 'Vegetarian',
    'settings.diet.eggFree': 'Bebas telur',
    'settings.meals.option': '{{n}} hidangan',
    'settings.prep.option': '{{n}} minit',

    'swap.kicker': 'TUKAR DISAHKAN',
    'swap.title':  'Pilih tanpa merosakkan rancangan',
    'swap.intro':  'Pilihan sah mengekalkan bajet, pemakanan, masa dan peraturan keunikan. Pilihan disekat menunjukkan peraturan mana yang gagal.',
    'swap.blocked': 'Disekat: {{reason}}',

    'details.kicker': 'BAHAGIAN & KAEDAH',
    'details.for':    'Untuk {{n}} sajian',
    'details.for.plural': 'Untuk {{n}} sajian',
    'details.cook':   'Cara memasak',
    'details.note':   'Nutrisi adalah anggaran prototaip per sajian. Kuantiti bahan dikira secara deterministik mengikut sajian.',

    'confirm.kicker': 'SAHKAN TINDAKAN',
    'confirm.title':  'Adakah anda pasti?',
    'confirm.cancel': 'Batal',
    'confirm.ok':     'Ya, set semula',
    'confirm.reset.msg': 'Ini akan memulihkan senario demo dan menimpa entri pantri, tetapan, dan sebarang pertukaran hidangan manual anda.',

    'toast.plan.rebuilt': 'Rancangan dibina semula dan setiap kekangan keras telah disemak.',
    'toast.reset': 'Senario demo yang disahkan dipulihkan.',
    'toast.budget.reduced': 'Bajet dikurangkan sebanyak RM10. Rancangan telah dioptimumkan semula.',
    'toast.command.unknown': 'Cuba: "Tetapkan bajet RM80", "Tiada ayam", "Jumaat vegetarian", "3 orang", "7 hidangan".',
    'toast.swap.blocked': 'Pertukaran disekat: {{reason}}.',
    'toast.wa.copied':    'Teks senarai disalin — tampal ke WhatsApp.',

    'footer.tagline': 'Rancang dalam kekangan. Biaya dengan telus. Selamatkan apa yang ada.',
    'footer.snapshot': 'Prototaip · rujukan {{date}}',

    'price.live.badge':  'Harga semasa',
    'price.live.source': 'KPDN PriceCatcher',
    'price.static.badge': 'Harga rujukan',
  },
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const LangContext = createContext({ lang: 'en', setLang: () => {} })

export function useLang() {
  const { lang, setLang } = useContext(LangContext)

  function t(key, vars = {}) {
    const str = strings[lang]?.[key] ?? strings.en[key] ?? key
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
      str,
    )
  }

  return { t, lang, setLang }
}

export function detectLang() {
  const saved = localStorage.getItem('dapur-lang')
  if (saved === 'ms' || saved === 'en') return saved
  const browser = (navigator.language || 'en').toLowerCase()
  return browser.startsWith('ms') ? 'ms' : 'en'
}
