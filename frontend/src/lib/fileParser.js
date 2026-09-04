import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
}

// Category keywords for intelligent auto-categorization
export const CATEGORY_KEYWORDS = {
  Utilities: ['jio', 'airtel', 'vi', 'vodafone', 'bescom', 'tata power', 'bill', 'recharge', 'electricity', 'water', 'gas', 'broadband', 'wifi', 'dth', 'postpaid', 'prepaid', 'power'],
  Food: ['zomato', 'swiggy', 'blinkit', 'dominos', 'mcdonalds', 'kfc', 'starbucks', 'cafe', 'restaurant', 'food', 'dining', 'bakery', 'instamart', 'zepto', 'diner', 'pizza', 'burger', 'tea', 'coffee', 'momos', 'fast food', 'vegetable', 'dhaba', 'hotel', 'durga swami', 'super market', 'foods', 'annapurna', 'rajasthan foods', 'samiksha foods'],
  Travel: ['ola', 'uber', 'irctc', 'makemytrip', 'indigo', 'flight', 'train', 'metro', 'yatra', 'redbus', 'petrol', 'fuel', 'hpcl', 'bpcl', 'ioccl', 'shell', 'parking', 'toll', 'fastag', 'cab', 'taxi', 'airline', 'automobiles', 'auto', 'railways', 'petrol supply', 'jain petrol', 'honda'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'reliance', 'mart', 'dmart', 'bigbasket', 'store', 'retail', 'clothes', 'clothing', 'shoes', 'electronics', 'croma', 'mall', 'supermarket', 'bazaar', 'ajio', 'meesho', 'nykaa', 'tailor', 'tailors', 'v mart', 'shop', 'vendolite', 'vend bees', 'ekart', 'vishal mega mart', 'swastik traders', 'gk traders', 'lakhdatar', 'profab', 'big save'],
  Salary: ['salary', 'payroll', 'wages', 'stipend', 'bonus', 'dividend', 'interest credited', 'interest payment', 'cashback', 'refund', 'reimbursement'],
  Housing: ['rent', 'maintenance', 'mortgage', 'society', 'deposit', 'furniture', 'plumbing', 'electrician', 'repairs', 'floor mill'],
  Entertainment: ['netflix', 'spotify', 'prime', 'hotstar', 'bookmyshow', 'pvr', 'inox', 'youtube', 'gaming', 'steam', 'disney', 'cinema', 'theatre', 'club', 'bar', 'pub', 'game'],
  Health: ['apollo', 'medplus', '1mg', 'pharmacy', 'hospital', 'clinic', 'practo', 'netmeds', 'doctor', 'diagnostic', 'pathology', 'medicine', 'dental', 'gym', 'fitness', 'cult.fit', 'dr vinod', 'dr.']
};

export const autoCategorize = (text, type = 'expense') => {
  if (!text) return type === 'income' ? 'Salary' : 'Other';
  const lower = String(text).toLowerCase();

  if (type === 'income') {
    if (CATEGORY_KEYWORDS.Salary.some(kw => lower.includes(kw))) return 'Salary';
    return 'Other';
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }

  return 'Other';
};

// Clean and normalize amounts
export const cleanAmount = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return Math.abs(val);

  let str = String(val).trim();
  // Remove currency symbols & words
  str = str.replace(/[₹$€£]/g, '');
  str = str.replace(/\b(rs|inr|usd|eur|gbp)\b\.?/gi, '');
  // Remove commas
  str = str.replace(/,/g, '');
  // Remove parenthesis
  str = str.replace(/[()]/g, '').trim();

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
};

// Month name lookup table
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

// Smart date normalization without UTC shifting bugs
export const normalizeDate = (raw) => {
  if (!raw) return new Date().toISOString().split('T')[0];

  // Excel serial number (e.g. 45230)
  if (typeof raw === 'number' && raw > 30000 && raw < 60000) {
    const utcDays = Math.floor(raw - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  }

  let str = String(raw).trim();

  // If already standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Handle "30 Aug 2026" or "30 Aug, 2026" or "17-Aug-2026" (Day Month, Year)
  const dmyNamed = str.match(/\b(\d{1,2})[-\s/]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s/,]+(\d{2,4})\b/i);
  if (dmyNamed) {
    const day = dmyNamed[1].padStart(2, '0');
    const month = MONTH_MAP[dmyNamed[2].toLowerCase()] || '01';
    let year = dmyNamed[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // Handle "Aug 17, 2026" or "Aug 17 2026" or "August 17, 2026" (Month Day, Year)
  const mdyNamed = str.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i);
  if (mdyNamed) {
    const month = MONTH_MAP[mdyNamed[1].toLowerCase()] || '01';
    const day = mdyNamed[2].padStart(2, '0');
    const year = mdyNamed[3];
    return `${year}-${month}-${day}`;
  }

  // Handle "DD/MM/YYYY" or "DD-MM-YYYY" or "DD.MM.YYYY"
  const dmyMatch = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (dmyMatch) {
    let day = dmyMatch[1].padStart(2, '0');
    let month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) year = '20' + year;

    if (dmyMatch[1].length === 4) {
      return `${dmyMatch[1]}-${month}-${dmyMatch[3].padStart(2, '0')}`;
    }

    if (parseInt(month, 10) > 12 && parseInt(day, 10) <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
};

// Find matching header key by aliases
const findHeaderKey = (headers, aliases) => {
  if (!headers || !Array.isArray(headers)) return null;
  const lowerAliases = aliases.map(a => a.toLowerCase());
  return headers.find(h => {
    const clean = String(h).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return lowerAliases.some(alias => {
      const cleanAlias = alias.replace(/[^a-z0-9]/g, '');
      return clean === cleanAlias || clean.includes(cleanAlias);
    });
  });
};

// Process structured rows (from CSV, TSV, or Excel)
export const processStructuredRows = (rows, headers) => {
  if (!rows || rows.length === 0) return [];

  const dateKey = findHeaderKey(headers, ['date', 'txndate', 'transactiondate', 'valuedate', 'postdate', 'postingdate', 'bookingdate', 'time', 'timestamp']);
  const descKey = findHeaderKey(headers, ['merchant', 'description', 'narration', 'particulars', 'details', 'transactiondetails', 'party', 'payee', 'name', 'remarks', 'beneficiary']);
  
  const debitKey = findHeaderKey(headers, ['debit', 'withdrawal', 'dr', 'paidout', 'debitamount', 'withdrawals', 'dr amount', 'spend']);
  const creditKey = findHeaderKey(headers, ['credit', 'deposit', 'cr', 'paidin', 'creditamount', 'deposits', 'cr amount', 'income']);
  const amountKey = findHeaderKey(headers, ['amount', 'txnamount', 'netamount', 'amt', 'total', 'sum', 'value', 'price']);
  
  const typeKey = findHeaderKey(headers, ['type', 'transactiontype', 'cr/dr', 'dr/cr', 'debit/credit', 'mode', 'dr_cr']);
  const categoryKey = findHeaderKey(headers, ['category', 'tag', 'expensecategory', 'head']);
  const notesKey = findHeaderKey(headers, ['notes', 'reference', 'refno', 'utr', 'chequeno', 'chqno', 'txnid', 'id']);

  const transactions = [];

  rows.forEach((row, index) => {
    let dateStr = row[dateKey] || '';
    let merchantStr = row[descKey] || '';
    let debitVal = debitKey ? cleanAmount(row[debitKey]) : 0;
    let creditVal = creditKey ? cleanAmount(row[creditKey]) : 0;
    let amountVal = amountKey ? cleanAmount(row[amountKey]) : 0;
    let typeVal = row[typeKey] ? String(row[typeKey]).trim().toLowerCase() : '';
    let categoryVal = row[categoryKey] ? String(row[categoryKey]).trim() : '';
    let notesVal = row[notesKey] ? String(row[notesKey]).trim() : '';

    if (!merchantStr) {
      for (const [k, v] of Object.entries(row)) {
        if (k !== dateKey && k !== amountKey && k !== debitKey && k !== creditKey && typeof v === 'string' && v.trim().length > 2) {
          merchantStr = v.trim();
          break;
        }
      }
    }

    let finalAmount = 0;
    let finalType = 'expense';

    if (debitVal > 0) {
      finalAmount = debitVal;
      finalType = 'expense';
    } else if (creditVal > 0) {
      finalAmount = creditVal;
      finalType = 'income';
    } else if (amountVal > 0) {
      finalAmount = amountVal;
      if (typeVal.includes('cr') || typeVal.includes('income') || typeVal.includes('deposit') || typeVal.includes('+')) {
        finalType = 'income';
      } else if (typeVal.includes('dr') || typeVal.includes('expense') || typeVal.includes('debit') || typeVal.includes('-')) {
        finalType = 'expense';
      } else {
        const rawAmt = String(row[amountKey] || '');
        if (rawAmt.includes('-') || (rawAmt.includes('(') && rawAmt.includes(')'))) {
          finalType = 'expense';
        } else {
          const isIncomeDesc = /salary|refund|cashback|dividend|interest|credit|received from|received|payment from|deposited/i.test(merchantStr);
          finalType = isIncomeDesc ? 'income' : 'expense';
        }
      }
    }

    if (!merchantStr && !finalAmount) return;

    let cleanMerchant = merchantStr ? merchantStr.replace(/\s+/g, ' ').trim() : `Transaction #${index + 1}`;
    if (cleanMerchant.length > 80) {
      if (!notesVal) notesVal = cleanMerchant;
      cleanMerchant = cleanMerchant.substring(0, 80);
    }

    const finalDate = normalizeDate(dateStr);
    const finalCategory = categoryVal || autoCategorize(cleanMerchant, finalType);

    if (finalAmount > 0 || cleanMerchant) {
      transactions.push({
        id: `import-${Date.now()}-${index}`,
        selected: true,
        date: finalDate,
        merchant: cleanMerchant || 'Bank Transaction',
        amount: finalAmount || 1,
        type: finalType,
        category: finalCategory,
        notes: notesVal || ''
      });
    }
  });

  return transactions;
};

// Known bank and account substrings to clean up from merchant names
const BANK_ACCOUNT_REGEX = /\b(?:State Bank of India|India Post Payments Bank|Airtel Payments Bank(?: Limited| Ltd)?|Punjab and Sind Bank|HDFC Bank|ICICI Bank|Axis Bank|Bank of Baroda|Canara Bank|Kotak|Union Bank|Paytm Payments Bank|Federal Bank|IndusInd Bank|IDFC FIRST|Yes Bank)(?:\s*-\s*\d+)?\b/gi;

const isDateHeaderRange = (line) => {
  return /\bstatement\s+(?:period|from)\b/i.test(line) ||
         /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\s*[-–to]+\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i.test(line);
};

// Universal Statement Text Parser (Handles Navi UPI, PhonePe, Google Pay, Paytm, Bank Statements & Plain Text)
export const parseStatementText = (rawText) => {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transactions = [];

  // Match date pattern: "30 Aug 2026", "Aug 17, 2026", "17-Aug-2026", "17/08/2026", "2026-08-17"
  const datePattern = /\b(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}|\d{1,2}[/.-](?:[A-Za-z]{3}|\d{1,2})[/.-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})\b/i;

  let currentBlock = [];

  const processBlock = (blockLines) => {
    if (!blockLines || blockLines.length === 0) return;
    const fullText = blockLines.join(' ');

    const dateMatch = fullText.match(datePattern);
    if (!dateMatch) return;

    // Skip metadata header lines without currency amounts
    if (/\b(?:Transaction statement from|Statement Period|All UPI, bill payments)\b/i.test(fullText) && !/₹\s*\d+/i.test(fullText)) {
      return;
    }

    const date = normalizeDate(dateMatch[0]);

    // Detect Transaction Type with precision
    const hasReceived = /\b(Received from|Received|Payment from|Transferred from|Cashback from|Refund from|Salary from|Credited by|Inward)\b/i.test(fullText);
    const hasPaid = /\b(Paid to|Payment to|Transfer to|Recharge of|Paid for|Withdrawal from|Debit to)\b/i.test(fullText);
    const hasSelfTransfer = /\b(Self Transferred to|Self Transfer)\b/i.test(fullText);
    const isExplicitCredit = /\b(CREDIT|CR|\+₹|\+\s*\d+)\b/i.test(fullText) || /\b(deposit|deposited|refund|cashback|salary|interest credited)\b/i.test(fullText);
    const isExplicitDebit = /\b(DEBIT|DR|-₹|-\s*\d+)\b/i.test(fullText) || /\b(withdrawal|purchased at|bill payment)\b/i.test(fullText);

    let type = 'expense';
    if (hasReceived) {
      type = 'income';
    } else if (hasPaid || isExplicitDebit || hasSelfTransfer) {
      type = 'expense';
    } else if (isExplicitCredit) {
      type = 'income';
    } else {
      type = 'expense';
    }

    // Extract Amount: e.g. "₹207", "₹25,700", "₹1,003.54", "CREDIT 120.00"
    let amount = 0;
    const amtMatch = fullText.match(/(?:₹|Rs\.?|INR|\$)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i) ||
                     fullText.match(/\b(?:CREDIT|DEBIT|CR|DR)\s+(?:₹|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);

    if (amtMatch) {
      amount = cleanAmount(amtMatch[1]);
    } else {
      const allNums = fullText.match(/\b[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})\b|\b[0-9]{2,6}\b/g) || [];
      const valid = allNums
        .map(n => cleanAmount(n))
        .filter(n => n > 0 && n < 10000000 && n !== 2026 && n !== 2025 && n !== 2024 && n !== 2023);
      if (valid.length > 0) amount = valid[0];
    }

    if (!amount || isNaN(amount) || amount <= 0) return;

    // Extract Notes (UPI txn ID, Note: ..., Bank Account)
    const notesParts = [];
    const utrMatch = fullText.match(/\b(?:UPI txn ID|UTR No\.|Transaction ID|Ref No)\s*[:.]?\s*([A-Za-z0-9]+)/i);
    if (utrMatch) notesParts.push(`Txn: ${utrMatch[1]}`);

    const noteMatch = fullText.match(/\bNote:\s*([^₹\n\r]+?)(?=\s*(?:State Bank|India Post|Airtel|Punjab|HDFC|ICICI|₹|UPI txn|$))/i);
    if (noteMatch && noteMatch[1].trim()) notesParts.push(`Note: ${noteMatch[1].trim()}`);

    const bankMatch = fullText.match(BANK_ACCOUNT_REGEX);
    if (bankMatch && bankMatch.length > 0) {
      notesParts.push(`A/c: ${bankMatch[bankMatch.length - 1].trim()}`);
    }

    // Extract Clean Merchant Description
    let merchant = '';
    const descMatch = fullText.match(/\b(Paid to|Received from|Recharge of|Self Transferred to,|Self Transferred to|Transfer to|Cashback from|Add money UPI Lite|Add money|Withdrawal from)\s+([^\n\r\t]+?)(?=\s*(?:(?:State Bank|India Post|Airtel Payments|Punjab and Sind|HDFC|ICICI|Axis)\s*-\s*\d+|DEBIT|CREDIT|UPI txn ID|Transaction ID|UTR No|Paid by|Credited to|Note:|Gift Card|₹|$))/i);

    if (descMatch) {
      const action = descMatch[1].replace(/,$/, '').trim();
      let target = descMatch[2].trim();
      if (!hasSelfTransfer) {
        target = target.replace(BANK_ACCOUNT_REGEX, '').trim();
      }
      target = target.replace(/^[,\s-]+|[,\s-]+$/g, '');
      if (target) {
        merchant = `${action} ${target}`.trim();
      } else {
        merchant = action;
      }
    } else {
      const cleanLines = blockLines.filter(l => 
        !datePattern.test(l) && 
        !/^(?:\d{1,2}:\d{2}\s*(?:am|pm)|UPI txn ID|Transaction ID|UTR No|Paid by|Credited to|Note:|Page \d+|Powered by)/i.test(l)
      );
      if (cleanLines.length > 0) {
        merchant = cleanLines[0]
          .replace(BANK_ACCOUNT_REGEX, '')
          .replace(/\b(?:DEBIT|CREDIT|₹[0-9,.]+)\b/gi, '')
          .trim();
      }
    }

    if (!merchant || merchant.length < 2) {
      merchant = type === 'income' ? 'Incoming Payment' : 'Bank Transaction';
    }
    if (merchant.length > 80) merchant = merchant.substring(0, 80).trim();

    const category = autoCategorize(merchant, type);

    transactions.push({
      id: `stmt-${Date.now()}-${transactions.length}`,
      selected: true,
      date,
      merchant,
      amount,
      type,
      category,
      notes: notesParts.join(' • ')
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (datePattern.test(line) && !isDateHeaderRange(line)) {
      if (currentBlock.length > 0) {
        processBlock(currentBlock);
        currentBlock = [];
      }
    }
    currentBlock.push(line);
  }
  if (currentBlock.length > 0) {
    processBlock(currentBlock);
  }

  // If block parsing didn't find items, fallback to line by line
  if (transactions.length === 0) {
    return parsePlainTextLines(rawText);
  }

  return transactions;
};

// Line-by-line parser fallback
export const parsePlainTextLines = (rawText) => {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transactions = [];

  const dateRegexes = [
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})\b/,
    /\b(\d{1,2}[-\s](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s]\d{2,4})\b/i,
    /\b(\d{4}[/.-]\d{1,2}[/.-]\d{1,2})\b/
  ];

  const amountRegex = /(?:₹|Rs\.?|INR|\$)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/g;

  lines.forEach((line, idx) => {
    let dateStr = null;

    for (const regex of dateRegexes) {
      const match = line.match(regex);
      if (match) {
        dateStr = match[1];
        break;
      }
    }

    if (!dateStr) return;

    const lineWithoutDate = line.replace(dateStr, ' ');

    let refNotes = '';
    const refMatch = lineWithoutDate.match(/\/(?:[A-Za-z0-9_-]{4,})\/|\b(?:REF|UPI|IMPS|NEFT|POS|CHQ|UTR|txn ID)[-:\s]*[A-Za-z0-9]+/i);
    if (refMatch) {
      refNotes = refMatch[0].replace(/[/]/g, '').trim();
    }

    const amountSearchText = lineWithoutDate.replace(/\/[A-Za-z0-9_-]+\//g, ' ');
    const amountsFound = [];
    let amtMatch;
    
    while ((amtMatch = amountRegex.exec(amountSearchText)) !== null) {
      const num = cleanAmount(amtMatch[1]);
      if (num > 0 && num < 100000000 && num !== 2026 && num !== 2025 && num !== 2024) {
        amountsFound.push({
          value: num,
          raw: amtMatch[0],
          hasDecimal: amtMatch[1].includes('.'),
          index: amtMatch.index
        });
      }
    }

    if (amountsFound.length === 0) return;

    const lowerLine = line.toLowerCase();
    const isCredit = /\b(cr|credit|received from|received|payment from|transferred from|deposited|deposit|refund|cashback|salary|stipend|interest credited|\+)\b/i.test(lowerLine);
    let type = isCredit ? 'income' : 'expense';

    const decimalAmount = amountsFound.find(a => a.hasDecimal);
    const primaryAmountObj = decimalAmount || amountsFound[0];
    const amount = primaryAmountObj.value;

    let desc = lineWithoutDate
      .replace(/\/[A-Za-z0-9_-]+\//g, ' ')
      .replace(BANK_ACCOUNT_REGEX, '')
      .replace(/\b(dr|cr|debit|credit|inr|rs|balance|bal)\b\.?/gi, '')
      .replace(/[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?/g, '')
      .replace(/[/:\-,#|_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!desc || desc.length < 2) {
      desc = type === 'income' ? `Incoming Payment #${idx + 1}` : `Statement Item #${idx + 1}`;
    } else if (desc.length > 80) {
      desc = desc.substring(0, 80).trim();
    }

    const normDate = normalizeDate(dateStr);
    const category = autoCategorize(desc, type);

    transactions.push({
      id: `parsed-${Date.now()}-${idx}`,
      selected: true,
      date: normDate,
      merchant: desc,
      amount,
      type,
      category,
      notes: refNotes || (line.length > 80 ? line.substring(0, 150) : '')
    });
  });

  return transactions;
};

// Parse CSV / TSV / Delimited Text
export const parseCSV = (fileContent) => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return resolve([]);
        }

        const headers = results.meta.fields || Object.keys(results.data[0] || {});
        
        if (headers.length > 1 && (findHeaderKey(headers, ['date', 'amount', 'merchant', 'debit', 'credit']) || results.data.length > 0)) {
          const txs = processStructuredRows(results.data, headers);
          if (txs.length > 0) return resolve(txs);
        }

        const plainTxs = parseStatementText(fileContent);
        resolve(plainTxs);
      },
      error: (err) => reject(err)
    });
  });
};

// Parse Excel (.xlsx, .xls)
export const parseExcel = async (arrayBuffer) => {
  try {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
    if (!jsonData || jsonData.length === 0) return [];

    const headers = Object.keys(jsonData[0] || {});
    return processStructuredRows(jsonData, headers);
  } catch (err) {
    console.error('Excel parse error:', err);
    throw new Error('Failed to parse Excel spreadsheet. Please ensure the file is valid.');
  }
};

// Parse Bank Statement PDF (supports PhonePe, GPay, Paytm, SBI, HDFC, ICICI, etc.)
export const parsePDF = async (arrayBuffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true
    });
    const pdf = await loadingTask.promise;
    let combinedText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Group items by Y coordinate (within 4px bucket)
      const lineBuckets = [];
      for (const item of textContent.items) {
        if (!item.str || !item.str.trim()) continue;
        const y = Math.round(item.transform[5]);
        let bucket = lineBuckets.find(b => Math.abs(b.y - y) <= 4);
        if (!bucket) {
          bucket = { y, items: [] };
          lineBuckets.push(bucket);
        }
        bucket.items.push({ x: item.transform[4], text: item.str });
      }

      // Sort lines top to bottom (descending Y in PDF coordinates)
      lineBuckets.sort((a, b) => b.y - a.y);

      for (const bucket of lineBuckets) {
        bucket.items.sort((a, b) => a.x - b.x);
        const lineText = bucket.items.map(i => i.text).join(' ').trim();
        if (lineText) combinedText += '\n' + lineText;
      }
    }

    if (!combinedText.trim()) {
      throw new Error('No readable text found in PDF. Scanned images or password-protected PDFs are not supported.');
    }

    const txs = parseStatementText(combinedText);
    if (txs.length === 0) {
      throw new Error('No valid transactions found in statement. Please verify the document is an unencrypted bank or UPI statement.');
    }

    return txs;
  } catch (err) {
    console.error('PDF parse error:', err);
    throw new Error(err.message || 'Failed to parse PDF file. Ensure it is a text-based bank statement.');
  }
};

// Universal Parser entrypoint
export const parseStatementFile = async (file) => {
  if (!file) throw new Error('No file selected.');

  const ext = file.name.split('.').pop()?.toLowerCase();
  const fileType = file.type?.toLowerCase() || '';

  if (ext === 'pdf' || fileType.includes('pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    return await parsePDF(arrayBuffer);
  }

  if (ext === 'xlsx' || ext === 'xls' || fileType.includes('sheet') || fileType.includes('excel')) {
    const arrayBuffer = await file.arrayBuffer();
    return await parseExcel(arrayBuffer);
  }

  if (ext === 'csv' || ext === 'txt' || ext === 'tsv' || fileType.includes('text') || fileType.includes('csv')) {
    const text = await file.text();
    return await parseCSV(text);
  }

  try {
    const text = await file.text();
    return await parseCSV(text);
  } catch {
    const arrayBuffer = await file.arrayBuffer();
    return await parseExcel(arrayBuffer);
  }
};
