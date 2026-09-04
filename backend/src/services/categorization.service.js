export const categorizeTransaction = (merchant) => {
  if (!merchant) return 'Other';
  const text = merchant.toLowerCase();

  const rules = {
    'Utilities': ['jio', 'airtel', 'vi', 'vodafone', 'bescom', 'tata power', 'bill', 'recharge', 'electricity', 'water', 'gas', 'broadband', 'wifi', 'dth', 'postpaid', 'prepaid', 'power'],
    'Food': ['zomato', 'swiggy', 'blinkit', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'cafe', 'restaurant', 'food', 'dining', 'bakery', 'instamart', 'zepto', 'diner', 'pizza', 'burger', 'tea', 'coffee', 'momos', 'fast food', 'vegetable', 'dhaba', 'hotel', 'durga swami', 'super market', 'foods', 'annapurna', 'rajasthan foods', 'samiksha foods'],
    'Travel': ['ola', 'uber', 'irctc', 'makemytrip', 'indigo', 'flight', 'train', 'metro', 'yatra', 'redbus', 'petrol', 'fuel', 'hpcl', 'bpcl', 'ioccl', 'shell', 'parking', 'toll', 'fastag', 'cab', 'taxi', 'airline', 'automobiles', 'auto', 'railways', 'petrol supply', 'jain petrol', 'honda'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'reliance', 'mart', 'dmart', 'bigbasket', 'store', 'retail', 'clothes', 'clothing', 'shoes', 'electronics', 'croma', 'mall', 'supermarket', 'bazaar', 'ajio', 'meesho', 'nykaa', 'tailor', 'tailors', 'v mart', 'shop', 'vendolite', 'vend bees', 'ekart', 'vishal mega mart', 'swastik traders', 'gk traders', 'lakhdatar', 'profab', 'big save'],
    'Entertainment': ['netflix', 'spotify', 'prime', 'hotstar', 'bookmyshow', 'pvr', 'inox', 'youtube', 'gaming', 'steam', 'disney', 'cinema', 'theatre', 'club', 'bar', 'pub', 'game'],
    'Health': ['apollo', 'medplus', '1mg', 'pharmacy', 'hospital', 'clinic', 'practo', 'netmeds', 'doctor', 'diagnostic', 'pathology', 'medicine', 'dental', 'gym', 'fitness', 'cult.fit', 'dr vinod', 'dr.']
  };

  for (const [category, keywords] of Object.entries(rules)) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }

  return 'Other';
};

