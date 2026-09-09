import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AdvisoryContext {
  tradeType: string;
  village: string;
  district: string;
  monthlyRevenue: number;
  monthlyExpense: number;
  currentLoans: Array<{
    lender: string;
    lenderType: string;
    amount: number;
    interestRate: number;
    monthlyEmi: number;
  }>;
  recentLedgerSummary: {
    totalInflow: number;
    totalOutflow: number;
    pendingCreditGiven: number;
  };
}

export async function generateHyperLocalAdvisory(
  userQuery: string,
  context: AdvisoryContext,
  language: string = 'en'
): Promise<{
  text: string;
  keyActionSteps: string[];
  riskAlert?: string;
  schemeRecommendation?: string;
}> {
  const ai = getAiClient();

  // If no Gemini API key or if API call fails, use robust offline-grade fallback
  if (!ai) {
    return generateOfflineRuleAdvisory(userQuery, context, language);
  }

  const langNames: Record<string, string> = {
    hi: 'Hindi (हिंदी)',
    bn: 'Bengali (বাংলা)',
    te: 'Telugu (తెలుగు)',
    mr: 'Marathi (मराठी)',
    ta: 'Tamil (தமிழ்)',
    es: 'Spanish (Español)',
    sw: 'Swahili (Kiswahili)',
    en: 'English',
  };

  const targetLang = langNames[language] || 'English';

  const systemPrompt = `You are "GramSathi", an empathetic, highly practical AI Hyper-Local Business Advisor & Financial Structuring specialist for rural micro-entrepreneurs (smallholder farmers, dairy operators, village kirana shops, handloom weavers, rural artisans, poultry rearers).

Guidelines:
1. Speak in ${targetLang}. Use simple, respectful, crystal-clear everyday rural business vocabulary. Avoid complex corporate jargon.
2. The user operates in: Village: ${context.village}, District: ${context.district}. Trade: ${context.tradeType}.
3. Current finances: Monthly Inflow ~₹${context.monthlyRevenue}, Expense ~₹${context.monthlyExpense}.
4. Debts: ${context.currentLoans.map(l => `${l.lender} (${l.lenderType}): ₹${l.amount} @ ${l.interestRate}%/yr, EMI ₹${l.monthlyEmi}`).join('; ') || 'No active debt recorded'}.
5. Cash Ledger Snapshot: Recent Inflow ₹${context.recentLedgerSummary.totalInflow}, Outflow ₹${context.recentLedgerSummary.totalOutflow}, Customer Udhaar (Credit pending collection) ₹${context.recentLedgerSummary.pendingCreditGiven}.
6. Advise on practical actions: input costs, weather/seasonal pricing, reducing moneylender interest drain, converting to formal SHG/bank schemes (MUDRA, KCC, SVANidhi), collecting pending udhaar, and expanding margin.

Return your response formatted with:
- A warm, direct explanation (2-3 concise paragraphs)
- 3 distinct, numbered ACTION STEPS the entrepreneur can do TODAY or this week.
- Any critical risk alert if moneylender interest rate is >24% or customer credit is too high.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const responseText = response.text || '';

    // Extract action steps heuristically or return full text
    const lines = responseText.split('\n').map(l => l.trim()).filter(Boolean);
    const actionSteps: string[] = [];
    for (const line of lines) {
      if (/^(\d+[\.\)]|[-•*])\s+/.test(line) && line.length > 15 && line.length < 200) {
        actionSteps.push(line.replace(/^(\d+[\.\)]|[-•*])\s+/, ''));
      }
    }

    let riskAlert: string | undefined;
    const hasHighCostLoan = context.currentLoans.some(l => l.interestRate >= 24);
    if (hasHighCostLoan) {
      riskAlert = language === 'hi' 
        ? 'सावधानी: आपका स्थानीय साहूकार का ऋण बहुत महंगा है (24%+)। इसे तुरंत बैंक या स्वयं सहायता समूह (SHG) में रीफाइनेंस करें।'
        : 'Warning: High interest informal debt detected. Prioritize refinancing through SHG or MUDRA Bank loan.';
    }

    return {
      text: responseText,
      keyActionSteps: actionSteps.slice(0, 4),
      riskAlert,
    };
  } catch (err) {
    console.error('Gemini API call failed, falling back to rule engine:', err);
    return generateOfflineRuleAdvisory(userQuery, context, language);
  }
}

export async function structureLoanDossier(
  loanRequirement: {
    amountNeeded: number;
    purpose: string;
    targetTenureMonths: number;
  },
  context: AdvisoryContext,
  language: string = 'en'
): Promise<{
  dscr: number;
  repaymentCapacityMonthly: number;
  recommendedScheme: string;
  schemeCode: string;
  interestSavingsVsMoneylenderAnnual: number;
  structuredDossierSummary: string;
  dossierChecklist: string[];
}> {
  const netMonthlySurplus = Math.max(0, context.monthlyRevenue - context.monthlyExpense);
  const existingEmi = context.currentLoans.reduce((sum, l) => sum + l.monthlyEmi, 0);
  const freeCashFlow = Math.max(0, netMonthlySurplus - existingEmi);

  // Projected new EMI at 9% bank interest for needed tenure
  const r = 0.09 / 12;
  const n = loanRequirement.targetTenureMonths || 24;
  const p = loanRequirement.amountNeeded;
  const estimatedBankEmi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  // If borrower had taken this from a 36% moneylender:
  const rMoneylender = 0.36 / 12;
  const estimatedMoneylenderEmi = Math.round((p * rMoneylender * Math.pow(1 + rMoneylender, n)) / (Math.pow(1 + rMoneylender, n) - 1));
  const interestSavingsVsMoneylenderAnnual = Math.round((estimatedMoneylenderEmi - estimatedBankEmi) * 12);

  // DSCR = Net Cash Available for Debt Service / (Existing EMI + New EMI)
  const totalEmi = existingEmi + estimatedBankEmi;
  const dscr = totalEmi > 0 ? Number((netMonthlySurplus / totalEmi).toFixed(2)) : 2.5;

  let recommendedScheme = 'Pradhan Mantri MUDRA Yojana (Shishu/Kishore)';
  let schemeCode = 'PMMY-SHISHU';

  if (context.tradeType === 'dairy' || context.tradeType === 'farming') {
    recommendedScheme = 'Kisan Credit Card (KCC) for Animal Husbandry & Agriculture';
    schemeCode = 'KCC-DAIRY';
  } else if (p <= 50000 && (context.tradeType === 'kirana' || context.tradeType === 'workshop')) {
    recommendedScheme = 'PM-SVANidhi Micro Vendor Loan Scheme';
    schemeCode = 'PM-SVANIDHI';
  } else if (p > 50000 && p <= 500000) {
    recommendedScheme = 'Pradhan Mantri MUDRA Yojana (Kishore Loan)';
    schemeCode = 'PMMY-KISHORE';
  }

  const ai = getAiClient();
  let structuredDossierSummary = '';

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate a 1-page Micro-Enterprise Project & Debt Restructuring Summary for a rural bank branch manager.
Owner trade: ${context.tradeType}, Location: ${context.village}, ${context.district}.
Monthly Revenue: ₹${context.monthlyRevenue}, Expenses: ₹${context.monthlyExpense}, Net Surplus: ₹${netMonthlySurplus}.
Loan Requested: ₹${loanRequirement.amountNeeded} for "${loanRequirement.purpose}".
Calculated DSCR: ${dscr}, Estimated Bank EMI: ₹${estimatedBankEmi}/mo.
Existing high-cost debts: ${context.currentLoans.map(l => `${l.lender} @ ${l.interestRate}%`).join(', ') || 'None'}.
Explain clearly why the entrepreneur is creditworthy, how this loan increases production, and the repayment schedule.`,
      });
      structuredDossierSummary = response.text || '';
    } catch (e) {
      console.warn('Gemini dossier generation error:', e);
    }
  }

  if (!structuredDossierSummary) {
    structuredDossierSummary = `PROJECT APPRAISAL DOSSIER FOR ${context.tradeType.toUpperCase()} MICRO-UNIT
Location: ${context.village}, Dist. ${context.district}
1. Working Profile: Stable micro-enterprise generating an estimated monthly revenue of ₹${context.monthlyRevenue} with operating expenses of ₹${context.monthlyExpense}, retaining net operating surplus of ₹${netMonthlySurplus}.
2. Proposed Credit Facility: ₹${loanRequirement.amountNeeded} under ${recommendedScheme} for ${loanRequirement.purpose}.
3. Debt Service Coverage Ratio (DSCR): ${dscr} (Acceptable threshold > 1.25).
4. Viability & Savings: Consolidating informal high-cost borrowing saves ~₹${interestSavingsVsMoneylenderAnnual} annually in interest outgo, immediately boosting household debt servicing capacity.`;
  }

  return {
    dscr,
    repaymentCapacityMonthly: freeCashFlow,
    recommendedScheme,
    schemeCode,
    interestSavingsVsMoneylenderAnnual,
    structuredDossierSummary,
    dossierChecklist: [
      'KYC: Aadhaar Card and linked active mobile number',
      'Proof of Business: Sarpanch Certificate or Village Panchayat trade endorsement',
      'Bank Account Passbook: Last 6 months with verified direct benefit transfers or transactions',
      `Quotations: Valid written quotation/estimate for "${loanRequirement.purpose}"`,
      'Existing Loan NOC / Passbook if restructuring informal debt through SHG linkage',
    ],
  };
}

export function parseVoiceTransaction(transcript: string): {
  type: 'cash_in' | 'cash_out' | 'credit_given';
  amount: number;
  category: string;
  description: string;
  partyName?: string;
} {
  const lower = transcript.toLowerCase();

  // Extract amount
  const amountMatch = lower.match(/(?:rupees?|rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rupees?|rs\.?|inr|₹)?/);
  let amount = 0;
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // Detect type
  let type: 'cash_in' | 'cash_out' | 'credit_given' = 'cash_in';
  if (
    lower.includes('bought') ||
    lower.includes('purchased') ||
    lower.includes('spent') ||
    lower.includes('paid') ||
    lower.includes('kharcha') ||
    lower.includes('kharida') ||
    lower.includes('expense') ||
    lower.includes('diesel') ||
    lower.includes('feed')
  ) {
    type = 'cash_out';
  } else if (
    lower.includes('udhaar') ||
    lower.includes('credit') ||
    lower.includes('baki') ||
    lower.includes('borrowed by') ||
    lower.includes('gave credit')
  ) {
    type = 'credit_given';
  }

  // Category determination
  let category = 'General Daily Cash';
  if (lower.includes('milk') || lower.includes('doodh')) category = 'Dairy & Milk Sales';
  else if (lower.includes('vegetable') || lower.includes('sabzi') || lower.includes('crop')) category = 'Agri Produce';
  else if (lower.includes('feed') || lower.includes('khali') || lower.includes('choker')) category = 'Cattle Feed / Inputs';
  else if (lower.includes('kirana') || lower.includes('grocery') || lower.includes('oil')) category = 'Kirana Wholesale Stock';
  else if (lower.includes('transport') || lower.includes('tempo') || lower.includes('auto')) category = 'Logistics & Transport';

  return {
    type,
    amount: amount || 250,
    category,
    description: transcript,
    partyName: lower.includes('customer') || lower.includes('bhai') ? 'Village Customer' : undefined,
  };
}

function generateOfflineRuleAdvisory(
  query: string,
  context: AdvisoryContext,
  language: string
): {
  text: string;
  keyActionSteps: string[];
  riskAlert?: string;
  schemeRecommendation?: string;
} {
  const isHindi = language === 'hi';
  const trade = context.tradeType;
  const highInterestLoans = context.currentLoans.filter(l => l.interestRate >= 24);

  let text = '';
  let steps: string[] = [];
  let riskAlert: string | undefined;

  if (highInterestLoans.length > 0) {
    const totalHighDebt = highInterestLoans.reduce((s, l) => s + l.amount, 0);
    riskAlert = isHindi
      ? `महत्वपूर्ण चेतावनी: आपका ₹${totalHighDebt} का कर्ज़ बहुत भारी ब्याज दर (24%-48%) पर चल रहा है। हर महीने आपकी खून-पसीने की कमाई का बड़ा हिस्सा साहूकार के पास चला जाता है।`
      : `High Financial Risk: You have ₹${totalHighDebt} in informal debt at excessive interest rates (24%-48%). This erodes your micro-business operating margin.`;
  }

  if (trade === 'dairy') {
    if (isHindi) {
      text = `नमस्ते! आपकी डेयरी इकाई (${context.village}, ${context.district}) के लिए मुख्य सलाह:
वर्तमान में दुग्ध संघ और चिलिंग सेंटरों पर वसा (FAT) व SNF जांच के आधार पर दर तय होती है। दाने में सरसों की खली व हरा चारा 60:40 अनुपात में देने से दूध का वसा प्रतिशत 0.4% से 0.8% तक बढ़ जाता है, जिससे प्रति लीटर ₹3 से ₹5 अधिक मिलते हैं। 
उधार पर बेचे गए दूध की वसूली हर 15 दिन में तय करें ताकि पशु आहार खरीदने के लिए नकद संकट न आए।`;
      steps = [
        'पशु आहार में खनिज मिश्रण (Mineral Mixture 50g/day) जोड़ें ताकि दूध उत्पादन स्थिर रहे।',
        'नाबार्ड और बैंक से पशुपालन किसान क्रेडिट कार्ड (KCC Dairy) के लिए ब्लॉक पशु चिकित्सक से सत्यापन पत्र लें।',
        'स्थानीय साहूकार के कर्ज़ को महिला स्वयं सहायता समूह (SHG) या KCC ऋण (4% प्रभावी ब्याज) से बदलें।',
      ];
    } else {
      text = `Hyper-local advice for your Dairy enterprise in ${context.village}, ${context.district}:
Milk chilling plants pay premiums for fat and SNF testing. Balancing green fodder with mineral supplements improves milk density by up to 0.6 fat points, earning you ₹3-₹5 more per liter delivered.
Establish a strict 15-day settlement cycle with direct consumers so you have cash on hand for bulk feed purchases.`;
      steps = [
        'Procure cattle feed bags directly through village cooperative societies to save retail markup.',
        'Apply for KCC Animal Husbandry credit facility at 4% subsidized interest rate.',
        'Set aside ₹120 daily from morning milk collection in a dedicated savings pot for weekly repayments.',
      ];
    }
  } else if (trade === 'kirana') {
    if (isHindi) {
      text = `आपकी किराना दुकान (${context.village}) के लिए वित्तीय सलाह:
ग्रामीण किराना में सबसे बड़ा जोखिम अनियंत्रित 'उधार' (Customer Credit) होता है। यदि कुल मासिक बिक्री का 25% से अधिक बाज़ार में फंसा है, तो नया माल थोक में खरीदने के लिए नकद छूट (Cash Discount) छूट जाती है। 
थोक मंडी से हफ्ते में दो बार सामान मंगाने के बजाय समूह में अन्य दुकानदारों के साथ मिलकर परिवहन साझा करें।`;
      steps = [
        'जिन ग्राहकों पर ₹500 से अधिक उधार है, उन्हें वॉइस मैसेज या विनम्र तगादा कर बकाया इकट्ठा करें।',
        'पीएम स्वनिधि (PM SVANidhi) योजना के तहत ₹10,000 - ₹50,000 का ब्याज मुक्त/सब्सिडी युक्त लोन लें।',
        'तेजी से बिकने वाले 10 सामानों (तेल, साबुन, चीनी, दाल) का स्टॉक कभी खाली न होने दें।',
      ];
    } else {
      text = `Financial structure advice for your Kirana & General Store in ${context.village}:
Unregulated customer credit is the primary cause of rural retail cash dry-ups. If more than 20% of your capital is stuck in customer udhaar, you miss out on cash discounts from wholesale distributors.
Consolidate transport with neighboring village merchants to cut delivery costs.`;
      steps = [
        'Cap individual customer credit to 10 days or a maximum limit before releasing next groceries.',
        'Enroll in PM-SVANidhi to obtain working capital at single-digit subsidized rates.',
        'Use UPI QR code stickers to encourage instant digital settlements and reduce manual debt accounting.',
      ];
    }
  } else {
    if (isHindi) {
      text = `आपकी ग्रामीण उद्यम इकाई (${context.village}, ${context.district}) के लिए वित्तीय व व्यावसायिक रणनीति:
स्थानीय स्तर पर अपनी दैनिक लागत और नकदी प्रवाह को रोज़ाना 'बही-खाता' में दर्ज करें। जब आपके पास 3 महीने का लिखित या डिजिटल हिसाब होता है, तो बैंक शाखा प्रबंधक को मुद्रा योजना (MUDRA Shishu ₹50,000) स्वीकृत करने में आसानी होती है।`;
      steps = [
        'प्रतिदिन सुबह और शाम का नकद लेन-देन बिना चूके बही-खाता में जोड़ें।',
        'ग्राम पंचायत या सीएससी (CSC) केंद्र से उद्यम आधार (Udyam Registration) बनवाएं।',
        'अनावश्यक साहूकार उधारी के बजाय बैंक या स्वयं सहायता समूह से जुड़ें।',
      ];
    } else {
      text = `Actionable advisory for your micro-enterprise in ${context.village}, ${context.district}:
Maintaining a consistent daily ledger establishes an informal credit footprint. With 90 days of recorded cash inflows, rural bank branch managers can swiftly approve PMMY MUDRA micro-loans without demanding physical collateral.`;
      steps = [
        'Record every raw material purchase and daily sale in the offline ledger daily.',
        'Register on the Udyam portal via your local CSC center for priority sector lending status.',
        'Transfer high-cost informal moneylender debt to an SHG or RRB bank loan.',
      ];
    }
  }

  return {
    text,
    keyActionSteps: steps,
    riskAlert,
  };
}
