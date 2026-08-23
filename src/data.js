export const dataSnapshot = {
  priceDate: '22 Aug 2026',
  priceSource: 'Curated prototype snapshot inspired by PriceCatcher',
  nutritionSource: 'Curated prototype values modelled on MyFCD fields',
  location: 'Kuala Lumpur',
}

export const ingredientCatalog = {
  rice: { name: 'Local rice', unit: 'kg', price: 8, sara: 'category', saraCategory: 'Rice', category: 'Grains' },
  eggs: { name: 'Grade C eggs', unit: 'eggs', price: 0.55, sara: 'category', saraCategory: 'Eggs', category: 'Protein' },
  sambal: { name: 'Sambal paste', unit: 'kg', price: 18, sara: 'category', saraCategory: 'Seasoning', category: 'Condiments' },
  cabbage: { name: 'Cabbage', unit: 'kg', price: 5.4, sara: null, category: 'Vegetables' },
  chicken: { name: 'Fresh local chicken', unit: 'kg', price: 14.5, sara: null, category: 'Protein' },
  tempeh: { name: 'Tempeh', unit: 'packs', price: 2.6, sara: null, category: 'Protein' },
  sardines: { name: 'Canned sardines', unit: 'cans', price: 5.5, sara: 'category', saraCategory: 'Canned food', category: 'Protein' },
  tuna: { name: 'Canned tuna', unit: 'cans', price: 6.2, sara: 'category', saraCategory: 'Canned food', category: 'Protein' },
  tofu: { name: 'Firm tofu', unit: 'blocks', price: 2.2, sara: null, category: 'Protein' },
  spinach: { name: 'Local spinach', unit: 'bunches', price: 3.2, sara: null, category: 'Vegetables' },
  carrot: { name: 'Carrots', unit: 'kg', price: 6, sara: null, category: 'Vegetables' },
  onion: { name: 'Red onions', unit: 'kg', price: 5.8, sara: null, category: 'Produce' },
  garlic: { name: 'Garlic', unit: 'kg', price: 11, sara: null, category: 'Produce' },
  tomato: { name: 'Tomatoes', unit: 'kg', price: 7, sara: null, category: 'Vegetables' },
  cucumber: { name: 'Cucumber', unit: 'kg', price: 4.8, sara: null, category: 'Vegetables' },
  coconutMilk: { name: 'Coconut milk', unit: 'packs', price: 3.2, sara: 'category', saraCategory: 'Seasoning', category: 'Cooking essentials' },
  noodles: { name: 'Yellow noodles', unit: 'packs', price: 2.5, sara: 'category', saraCategory: 'Noodles', category: 'Grains' },
  turmeric: { name: 'Turmeric powder', unit: 'packs', price: 2.4, sara: 'category', saraCategory: 'Seasoning', category: 'Condiments' },
  soySauce: { name: 'Soy sauce', unit: 'bottles', price: 5.9, sara: 'category', saraCategory: 'Seasoning', category: 'Condiments' },
  anchovies: { name: 'Dried anchovies', unit: 'packs', price: 6.5, sara: null, category: 'Protein' },
  lentils: { name: 'Red lentils', unit: 'packs', price: 3.8, sara: null, category: 'Protein' },
  chickpeas: { name: 'Canned chickpeas', unit: 'cans', price: 4.6, sara: 'category', saraCategory: 'Canned food', category: 'Protein' },
  mackerel: { name: 'Ikan kembung', unit: 'kg', price: 16, sara: null, category: 'Protein' },
}

export const initialPantry = {
  rice: { quantity: 0.8, expiryDays: 60 },
  eggs: { quantity: 4, expiryDays: 6 },
  sambal: { quantity: 0.12, expiryDays: 30 },
  cabbage: { quantity: 0.25, expiryDays: 2 },
  soySauce: { quantity: 0.5, expiryDays: 90 },
}

export const meals = [
  {
    id: 'ayam-kunyit', name: 'Ayam kunyit & cabbage rice', description: 'Golden turmeric chicken with crisp cabbage over rice.', color: 'saffron', cuisine: 'Malay',
    protein: 35, carbs: 58, fat: 13, calories: 510, veg: 1.5, time: 22, tags: ['Halal-friendly', 'High protein'],
    ingredients: { rice: 0.16, chicken: 0.22, cabbage: 0.12, onion: 0.05, turmeric: 0.15, soySauce: 0.03 },
    steps: ['Cook the rice until fluffy.', 'Stir-fry onion, turmeric and chicken until cooked through.', 'Add cabbage and soy sauce, then serve over rice.'],
  },
  {
    id: 'tempeh-sambal', name: 'Sambal tempeh rice bowl', description: 'Crisp tempeh, sambal and wilted greens with rice.', color: 'paprika', cuisine: 'Malay-Indonesian',
    protein: 24, carbs: 61, fat: 12, calories: 470, veg: 2, time: 18, vegetarian: true, eggFree: true, tags: ['Vegetarian', 'Fibre-rich'],
    ingredients: { rice: 0.16, tempeh: 1, sambal: 0.035, spinach: 0.5, onion: 0.04 },
    steps: ['Cook the rice.', 'Crisp the tempeh in a pan.', 'Add sambal, onion and spinach, then serve together.'],
  },
  {
    id: 'sardine-egg', name: 'Sardine egg rice', description: 'Tomato sardines, jammy egg and sautéed cabbage.', color: 'ocean', cuisine: 'Malaysian',
    protein: 31, carbs: 55, fat: 14, calories: 495, veg: 1.5, time: 14, tags: ['Halal-friendly', 'Omega-3'],
    ingredients: { rice: 0.16, sardines: 1, eggs: 1, cabbage: 0.1, onion: 0.04 },
    steps: ['Warm the rice.', 'Simmer sardines with onion and cabbage.', 'Top with a boiled or fried egg.'],
  },
  {
    id: 'sup-ayam', name: 'Sup ayam sayur', description: 'Light chicken soup with carrot, greens and warm rice.', color: 'leaf', cuisine: 'Malay',
    protein: 33, carbs: 49, fat: 9, calories: 440, veg: 2.5, time: 28, tags: ['Halal-friendly', 'One pot'],
    ingredients: { rice: 0.14, chicken: 0.2, carrot: 0.12, spinach: 0.5, onion: 0.05 },
    steps: ['Simmer chicken and onion in water.', 'Add carrot and greens until tender.', 'Serve with warm rice.'],
  },
  {
    id: 'tofu-egg', name: 'Soy tofu & egg bowl', description: 'Seared tofu and egg with a sweet-savoury soy glaze.', color: 'plum', cuisine: 'Chinese Malaysian',
    protein: 27, carbs: 54, fat: 13, calories: 460, veg: 2, time: 15, vegetarian: true, tags: ['Vegetarian', 'Quick'],
    ingredients: { rice: 0.16, tofu: 1, eggs: 1, cabbage: 0.1, carrot: 0.08, soySauce: 0.05 },
    steps: ['Cook or reheat the rice.', 'Sear tofu and egg.', 'Add vegetables and soy sauce, then serve.'],
  },
  {
    id: 'mee-goreng-tempeh', name: 'Quick tempeh mee goreng', description: 'Fast wok noodles with tempeh, cabbage and sambal.', color: 'citrus', cuisine: 'Malaysian',
    protein: 22, carbs: 68, fat: 16, calories: 520, veg: 2, time: 12, vegetarian: true, eggFree: true, tags: ['Vegetarian', '12 minutes'],
    ingredients: { noodles: 1, tempeh: 0.75, cabbage: 0.12, sambal: 0.03, soySauce: 0.04 },
    steps: ['Crisp tempeh in a hot wok.', 'Add cabbage, sambal and noodles.', 'Finish with soy sauce and toss well.'],
  },
  {
    id: 'nasi-goreng-kampung', name: 'Nasi goreng kampung', description: 'Pantry-first fried rice with egg, greens and anchovies.', color: 'forest', cuisine: 'Malay',
    protein: 25, carbs: 57, fat: 12, calories: 480, veg: 1.5, time: 13, tags: ['Pantry hero', '13 minutes'],
    ingredients: { rice: 0.18, eggs: 2, anchovies: 0.25, spinach: 0.5, sambal: 0.025 },
    steps: ['Fry anchovies until crisp.', 'Add rice, sambal and greens.', 'Stir in egg and cook until set.'],
  },
  {
    id: 'dhal-rice', name: 'Red lentil dhal & rice', description: 'Comforting dhal with tomato, spinach and fragrant rice.', color: 'saffron', cuisine: 'Indian Malaysian',
    protein: 23, carbs: 70, fat: 7, calories: 455, veg: 2.5, time: 25, vegetarian: true, eggFree: true, tags: ['Vegetarian', 'High fibre'],
    ingredients: { rice: 0.14, lentils: 0.75, tomato: 0.1, spinach: 0.5, onion: 0.04, turmeric: 0.08 },
    steps: ['Simmer lentils with turmeric and onion.', 'Add tomato and spinach.', 'Serve the dhal with rice.'],
  },
  {
    id: 'ikan-asam', name: 'Ikan kembung asam tomato', description: 'Tangy local mackerel with tomato, cucumber and rice.', color: 'ocean', cuisine: 'Peranakan',
    protein: 34, carbs: 52, fat: 12, calories: 475, veg: 2, time: 24, eggFree: true, tags: ['High protein', 'Omega-3'],
    ingredients: { rice: 0.15, mackerel: 0.22, tomato: 0.12, cucumber: 0.1, onion: 0.04, garlic: 0.015 },
    steps: ['Cook the rice.', 'Pan-sear the mackerel.', 'Simmer tomato, onion and garlic; serve with cucumber.'],
  },
  {
    id: 'bubur-ayam', name: 'Bubur ayam sayur', description: 'Soothing chicken rice porridge with carrot and greens.', color: 'leaf', cuisine: 'Chinese Malaysian',
    protein: 30, carbs: 45, fat: 8, calories: 390, veg: 2, time: 25, eggFree: true, tags: ['Lighter', 'One pot'],
    ingredients: { rice: 0.11, chicken: 0.18, carrot: 0.1, spinach: 0.5, garlic: 0.012, soySauce: 0.025 },
    steps: ['Simmer rice with extra water until soft.', 'Add chicken and carrot until cooked.', 'Finish with spinach and soy sauce.'],
  },
  {
    id: 'tofu-kunyit', name: 'Tofu kunyit sayur', description: 'Turmeric tofu with crunchy cabbage, carrot and rice.', color: 'citrus', cuisine: 'Malay',
    protein: 25, carbs: 56, fat: 11, calories: 445, veg: 2.5, time: 17, vegetarian: true, eggFree: true, tags: ['Vegetarian', 'Colourful veg'],
    ingredients: { rice: 0.15, tofu: 1, cabbage: 0.1, carrot: 0.08, onion: 0.04, turmeric: 0.1 },
    steps: ['Cook the rice.', 'Sear tofu with turmeric.', 'Stir-fry vegetables and combine.'],
  },
  {
    id: 'chickpea-curry', name: 'Chickpea coconut curry', description: 'Creamy chickpeas, tomato and greens over rice.', color: 'paprika', cuisine: 'Indian Malaysian',
    protein: 21, carbs: 69, fat: 13, calories: 505, veg: 2.5, time: 20, vegetarian: true, eggFree: true, tags: ['Vegetarian', 'Pantry-friendly'],
    ingredients: { rice: 0.14, chickpeas: 1, coconutMilk: 0.5, tomato: 0.1, spinach: 0.5, onion: 0.04 },
    steps: ['Cook the rice.', 'Simmer chickpeas, coconut milk, tomato and onion.', 'Fold in spinach and serve.'],
  },
  {
    id: 'telur-kicap', name: 'Telur masak kicap', description: 'Eggs in peppery soy gravy with tomato and rice.', color: 'plum', cuisine: 'Malay',
    protein: 26, carbs: 55, fat: 12, calories: 450, veg: 2, time: 16, vegetarian: true, tags: ['Budget hero', 'Family favourite'],
    ingredients: { rice: 0.16, eggs: 2, tomato: 0.12, cucumber: 0.1, onion: 0.04, soySauce: 0.04 },
    steps: ['Cook the rice and eggs.', 'Simmer onion, tomato and soy sauce.', 'Add eggs to the gravy and serve with cucumber.'],
  },
  {
    id: 'tuna-noodle-soup', name: 'Tuna noodle soup', description: 'Quick clear noodle soup with tuna, carrot and greens.', color: 'ocean', cuisine: 'Malaysian',
    protein: 32, carbs: 50, fat: 8, calories: 410, veg: 2, time: 15, eggFree: true, tags: ['15 minutes', 'High protein'],
    ingredients: { noodles: 1, tuna: 1, carrot: 0.08, spinach: 0.5, onion: 0.03, soySauce: 0.025 },
    steps: ['Simmer onion and carrot in water.', 'Add noodles and tuna.', 'Finish with spinach and soy sauce.'],
  },
  {
    id: 'sardine-sambal-noodles', name: 'Sardine sambal noodles', description: 'Spicy sardines with noodles, cabbage and cucumber.', color: 'paprika', cuisine: 'Malaysian',
    protein: 29, carbs: 59, fat: 14, calories: 485, veg: 2, time: 14, eggFree: true, tags: ['14 minutes', 'SARA staples'],
    ingredients: { noodles: 1, sardines: 1, cabbage: 0.1, cucumber: 0.1, sambal: 0.025 },
    steps: ['Warm sardines with sambal.', 'Toss with cooked noodles and cabbage.', 'Serve with cucumber.'],
  },
  {
    id: 'chicken-tomato-rice', name: 'Chicken tomato rice bowl', description: 'Lean chicken, tomato and cucumber over warm rice.', color: 'leaf', cuisine: 'Malaysian',
    protein: 36, carbs: 53, fat: 9, calories: 435, veg: 2.5, time: 19, eggFree: true, tags: ['High protein', 'Balanced'],
    ingredients: { rice: 0.15, chicken: 0.21, tomato: 0.12, cucumber: 0.1, onion: 0.04, garlic: 0.012 },
    steps: ['Cook the rice.', 'Stir-fry chicken, onion, garlic and tomato.', 'Serve with cucumber.'],
  },
]

export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const goalProfiles = {
  protein: { label: 'High protein', protein: 30, maxCalories: 560, veg: 1.5 },
  balanced: { label: 'Balanced eating', protein: 24, maxCalories: 540, veg: 2 },
  lighter: { label: 'Lighter meals', protein: 23, maxCalories: 470, veg: 1.5 },
}

export const locations = ['Kuala Lumpur', 'Selangor', 'Penang']
