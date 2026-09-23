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

export async function generateFeasibilityReport(
  location: { village: string; block: string; district: string; state: string },
  category: string,
  availableMargin: number,
  language: string = 'en'
): Promise<any> {
  const feasibleProjectCost = Math.round(availableMargin / 0.1);
  const maxLoanAmount = Math.round(feasibleProjectCost * 0.9);
  const isMicro = feasibleProjectCost <= 140000;
  const schemeName = isMicro ? 'Micro Finance Scheme (6.5% interest, 3-yr tenure, 3-mo moratorium)' : 'Term Loan Scheme (8% interest, 7-yr tenure, 6-mo moratorium)';

  const ai = getAiClient();

  if (!ai) {
    return generateOfflineFeasibilityReport(location, category, availableMargin, feasibleProjectCost, maxLoanAmount, schemeName, language);
  }

  const prompt = `You are an institutional-grade rural business consultant for the Ministry of Social Justice and Empowerment (MoSJE), State Channelizing Agencies (SCAs).
Generate a structured, hyper-local Business Feasibility Report for a rural micro-entrepreneur.

Parameters:
- Location: Village/Gram Panchayat: "${location.village}", Block: "${location.block}", District: "${location.district}", State: "${location.state}"
- Proposed Business Category: "${category}"
- Available Margin Capital (10% contribution): ₹${availableMargin}
- Feasible Project Cost (100%): ₹${feasibleProjectCost}
- Concessional Loan Eligible (90%): ₹${maxLoanAmount} under ${schemeName}
- Target Language: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}

You MUST structure your JSON response with the following 6 core analytical modules (strictly adhering to Problem Statement 26091):
1. Market Reach:
   - consumerBaseEstimate: e.g. "Approx. 18,000 to 24,000 residents across 7 adjacent Gram Panchayats within 5-10 km radius"
   - radiusKm: 10
   - primaryChannels: array of 4 realistic distribution channels (e.g. Village Weekly Haat, Direct Farm-gate, Block Chilling Center, Local Kirana Network)
   - populationDemographics: localized demographic purchasing traits
2. Opportunity Analysis:
   - underservedNiches: array of 3 specific unserved or underserved niches in this block
   - highMarginSegments: array of 3 value-added products or services with better margins
   - valueAdditionPotential: strategic analysis of how processing or direct selling boosts margins
3. SWOT Analysis:
   - strengths: array of 4 bullet points tailored to ₹${feasibleProjectCost} project budget
   - weaknesses: array of 4 realistic weaknesses (e.g. limited initial working capital, lack of cold chain)
   - opportunities: array of 4 localized opportunities in this block
   - threats: array of 4 real rural threats
4. Threats Identification:
   - supplyChainBottlenecks: array of 3 specific local supply bottlenecks
   - seasonalFluctuations: array of 3 seasonal weather or harvest cycle demand swings
   - singleBuyerDependency: risk evaluation and mitigation of relying on a single middleman/trader
   - mitigationStrategies: array of 4 actionable risk mitigation steps
5. Competitor Mapping:
   - estimatedCompetitorDensity: e.g. "Low to Moderate: 3-5 semi-organized units in a 5km radius"
   - competitorsCountEstimate: numeric estimate (e.g. 4)
   - competitiveAdvantageAdvice: concrete strategy to differentiate and outcompete existing players
6. Product Market Value:
   - optimalPricingStrategy: tiered pricing recommendation based on local purchasing power
   - benchmarkSellingPrice: benchmark rate per unit (e.g. ₹52-₹58 per liter / kg)
   - regionalPurchasingPowerEstimate: assessment of rural household disposable income
   - breakEvenTimeline: expected months to break even (e.g. "5 to 7 months post-moratorium")
7. Executive Summary: 2-3 inspiring, grounded sentences summarizing feasibility.

Respond ONLY with valid JSON conforming to this structure:
{
  "marketReach": { "consumerBaseEstimate": "...", "radiusKm": 10, "primaryChannels": [...], "populationDemographics": "..." },
  "opportunityAnalysis": { "underservedNiches": [...], "highMarginSegments": [...], "valueAdditionPotential": "..." },
  "swot": { "strengths": [...], "weaknesses": [...], "opportunities": [...], "threats": [...] },
  "threatsIdentification": { "supplyChainBottlenecks": [...], "seasonalFluctuations": [...], "singleBuyerDependency": "...", "mitigationStrategies": [...] },
  "competitorMapping": { "estimatedCompetitorDensity": "...", "competitorsCountEstimate": 4, "competitiveAdvantageAdvice": "..." },
  "productMarketValue": { "optimalPricingStrategy": "...", "benchmarkSellingPrice": "...", "regionalPurchasingPowerEstimate": "...", "breakEvenTimeline": "..." },
  "executiveSummary": "..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const jsonText = response.text || '{}';
    const parsed = JSON.parse(jsonText);
    return {
      id: `feas_${Date.now()}`,
      location,
      category,
      categoryName: category.toUpperCase(),
      availableMargin,
      feasibleProjectCost,
      maxLoanAmount,
      ...parsed,
      generatedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  } catch (e) {
    console.warn('Gemini feasibility generation failed, falling back to rule engine:', e);
    return generateOfflineFeasibilityReport(location, category, availableMargin, feasibleProjectCost, maxLoanAmount, schemeName, language);
  }
}

function generateOfflineFeasibilityReport(
  location: { village: string; block: string; district: string; state: string },
  category: string,
  availableMargin: number,
  feasibleProjectCost: number,
  maxLoanAmount: number,
  schemeName: string,
  language: string
): any {
  const isHi = language === 'hi';
  const catLower = (category || 'dairy').toLowerCase();

  return {
    id: `feas_${Date.now()}`,
    location,
    category,
    categoryName: category.toUpperCase(),
    availableMargin,
    feasibleProjectCost,
    maxLoanAmount,
    marketReach: {
      consumerBaseEstimate: isHi
        ? `ग्राम पंचायत ${location.village} और ब्लॉक ${location.block} के 5-10 किमी दायरे में लगभग 15,000-22,000 ग्रामीण उपभोक्ता`
        : `Approx. 16,000 - 22,000 rural consumers across 8 Gram Panchayats within 5-10 km radius of ${location.village}`,
      radiusKm: 10,
      primaryChannels: isHi
        ? [
            `स्थानीय साप्ताहिक हाट बाज़ार (${location.block})`,
            'प्रत्यक्ष ग्राम बिक्री एवं स्वयं सहायता समूह (SHG) नेटवर्क',
            'निकटवर्ती कस्बा थोक व्यापारी एवं खुदरा किराना नेटवर्क',
            'सहकारी दुग्ध / कृषि उत्पाद संग्रहण केंद्र',
          ]
        : [
            `Weekly Block Haat Bazaar (${location.block})`,
            'Direct Farm-gate & Village SHG Distribution Network',
            'Sub-district Town Retail Stores & Kirana Outlets',
            'Cooperative Producer Linkage Center',
          ],
      populationDemographics: isHi
        ? 'दैनिक नकदी लेन-देन वाले 3,200+ ग्रामीण परिवार, जिनकी प्राथमिक आजीविका कृषि एवं मजदूरी है।'
        : '3,200+ rural households with daily/weekly cash flow primarily dependent on agriculture and allied activities.',
    },
    opportunityAnalysis: {
      underservedNiches: isHi
        ? [
            'स्थानीय स्तर पर गुणवत्तापूर्ण एवं मिलावट-मुक्त उत्पाद की भारी मांग',
            'कस्बे जाने के बजाय गांव में ही तैयार एवं तुरंत उपलब्ध सेवाएं',
            'छोटे पैक में किफायती पैकेजिंग (ग्रामीण उपभोक्ता प्राथमिकता)',
          ]
        : [
            'High demand for adulteration-free, locally produced fresh goods',
            'Value-added processing avoiding travel to sub-district center',
            'Affordable micro-packaging suited for daily wage earners',
          ],
      highMarginSegments: isHi
        ? ['प्रीमियम गुणवत्ता प्रत्यक्ष उपभोक्ता बिक्री', 'त्योहारी एवं शादी सीजन में विशेष थोक आपूर्ति', 'उपोत्पाद (बाय-प्रोडक्ट) पुनर्चक्रण व बिक्री']
        : ['Direct consumer supply with zero middleman margin loss', 'Seasonal wedding & festival surge bulk supplies', 'Value-added byproduct monetization'],
      valueAdditionPotential: isHi
        ? 'कच्चे माल को सीधे बेचने के बजाय प्राथमिक ग्रेडिंग, पैकेजिंग या प्रोसेसिंग से 22% से 35% अतिरिक्त मार्जिन अर्जित किया जा सकता है।'
        : 'Primary grading and direct packaging at the village level captures an additional 20% to 35% profit margin otherwise captured by mandi commission agents.',
    },
    swot: {
      strengths: isHi
        ? [
            `10% मार्जिन पूंजी (₹${availableMargin.toLocaleString('en-IN')}) के आधार पर 90% रियायती ऋण पात्रता`,
            'स्थानीय ग्रामीणों व पड़ोसियों के साथ मजबूत सामाजिक विश्वास व संबंध',
            'परिवहन एवं किराये की न्यूनतम लागत (गांव में ही संचालन)',
            'सस्ती पारिवारिक श्रम सहायता एवं त्वरित अनुकूलन क्षमता',
          ]
        : [
            `Optimal 10% equity commitment (₹${availableMargin.toLocaleString('en-IN')}) yielding 90% concessional credit eligibility`,
            'Deep social trust and community goodwill across the Gram Panchayat',
            'Negligible commercial rent overhead by operating within native village premises',
            'Agile operational flexibility with family workforce participation',
          ],
      weaknesses: isHi
        ? [
            'शुरुआती 3-6 महीने में सीमित कार्यशील पूंजी (वर्किंग कैपिटल)',
            'औपचारिक बही-खाता एवं डिजिटल लेखांकन का सीमित पूर्व अनुभव',
            'शीतगृह (कोल्ड स्टोरेज) या आधुनिक उपकरणों का अभाव',
            'कच्चे माल की कीमतों में मौसमी उतार-चढ़ाव सहने की सीमित क्षमता',
          ]
        : [
            'Initial working capital constraints during first two business cycles',
            'Limited historical exposure to formalized double-entry bookkeeping',
            'Absence of cold storage or automated processing machinery',
            'Vulnerability to temporary price volatility in raw materials',
          ],
      opportunities: isHi
        ? [
            `MoSJE / SCA रियायती ऋण योजना के तहत कम ब्याज दर व मोरेटोरियम अवधि`,
            'आसपास के 3 गांवों में समान आधुनिक सेवा/उत्पाद का न होना',
            'डिजिटल भुगतान (UPI) और सरकारी ई-मार्केटप्लेस से जुड़ाव',
            'स्थानीय स्वयं सहायता समूह (SHG) फेडरेशन के साथ आपूर्ति समझौता',
          ]
        : [
            `Access to MoSJE/SCA Concessional Credit with low interest and grace moratorium`,
            'Significant market void: No mechanized competitor within immediate 5 km radius',
            'Growing UPI adoption among village youth enabling instant cash collections',
            'Potential tie-up with local SHG federations and block development offices',
          ],
      threats: isHi
        ? [
            'अनियंत्रित ग्राहक उधारी (Udhaar) जिससे नकदी प्रवाह रुक सकता है',
            'कच्चे माल की आपूर्ति में मौसम या परिवहन संबंधी रुकावटें',
            'बाहरी बड़े शहरों के ब्रांडेड उत्पादों से मूल्य प्रतिस्पर्धा',
            'बिजली आपूर्ति या प्राकृतिक आपदाओं के कारण उत्पादन में बाधा',
          ]
        : [
            'Excessive uncollected customer credit (Udhaar) stalling liquid working capital',
            'Monsoon transport bottlenecks or supply chain interruptions',
            'Price dumping or synthetic alternatives from urban industrial hubs',
            'Unscheduled power outages affecting daily processing operations',
          ],
    },
    threatsIdentification: {
      supplyChainBottlenecks: isHi
        ? [
            'बारिश के दिनों में संपर्क सड़क खराब होने से माल ढुलाई में 1-2 दिन का विलंब',
            'स्थानीय स्तर पर थोक कच्चा माल उपलब्ध न होना, कस्बे के व्यापारियों पर निर्भरता',
            'पैकिंग सामग्री व स्पेयर पार्ट्स की समय पर आपूर्ति में कमी',
          ]
        : [
            'Monsoon access road disruptions causing 24-48 hour logistical delays',
            'Intermediary dependency for critical input commodities and raw components',
            'Delayed availability of food-grade packaging materials in local market',
          ],
      seasonalFluctuations: isHi
        ? [
            'गर्मी के महीनों में मांग या उत्पादन में 15-25% की मौसमी कमी',
            'फसल कटाई (रबी/खरीफ) के समय नकदी की प्रचुरता, जबकि बुवाई के समय नकदी की तंगी',
            'त्योहारी सीजन (दीपावली/शादी) में मांग में 2 गुना उछाल',
          ]
        : [
            'Summer heat stress creating a 15-20% contraction in agricultural/dairy outputs',
            'Post-harvest liquidity surges contrasting with lean sowing seasons',
            'High demand peaks during regional festival and wedding seasons',
          ],
      singleBuyerDependency: isHi
        ? 'किसी एक आढ़ती या व्यापारी पर निर्भर रहने से कीमत में 10-15% का नुकसान हो सकता है। कम से कम 3 अलग-अलग बिक्री माध्यम रखें।'
        : 'Relying exclusively on a single commission agent poses serious margin compression. Diversify across direct retail, weekly haat, and institutional buyers.',
      mitigationStrategies: isHi
        ? [
            'उधार बिक्री पर सख्त 15-दिवसीय सीमा निर्धारित करें और 70% नकद लेन-देन रखें।',
            '3 महीने का बफर स्टॉक या अग्रिम कच्चा माल आपूर्ति अनुबंध सुरक्षित करें।',
            'मोरेटोरियम अवधि (3 से 6 महीने) का उपयोग करके आपातकालीन नकद आरक्षित निधि बनाएं।',
            'स्थानीय ग्राम पंचायत में अन्य उद्यमियों के साथ मिलकर साझा परिवहन का उपयोग करें।',
          ]
        : [
            'Enforce a strict 15-day ceiling on customer credit and maintain 70%+ cash/UPI sales.',
            'Maintain a 30-day raw material buffer stock to cushion against price spikes.',
            'Leverage the loan moratorium window (3-6 months) to build cash reserves.',
            'Form pooled transport syndicates with neighboring micro-entrepreneurs.',
          ],
    },
    competitorMapping: {
      estimatedCompetitorDensity: isHi
        ? 'मध्यम: ग्राम पंचायत व आसपास के 5 किमी दायरे में 2 से 4 असंगठित इकाइयां'
        : 'Low to Moderate: 2-4 unorganized informal units within 5 km radius',
      competitorsCountEstimate: 3,
      competitiveAdvantageAdvice: isHi
        ? 'प्रतियोगी मिलावटी या बासा माल बेचते हैं; आप पूर्ण शुद्धता, सही तौल, और डिजिटल बिलिंग से 90% स्थानीय निष्ठावान ग्राहक प्राप्त कर सकते हैं।'
        : 'Competitors suffer from inconsistent inventory and irregular operating hours. Differentiate via consistent freshness, verified electronic weighing, and courteous service.',
    },
    productMarketValue: {
      optimalPricingStrategy: isHi
        ? 'लागत-प्लस-25% रणनीति: स्थानीय कस्बे के भाव से 5% कम रखें ताकि ग्रामीण तुरंत आकर्षित हों।'
        : 'Cost-Plus-25% Margin Strategy: Benchmark price 4-6% below town retail to incentivize village retention.',
      benchmarkSellingPrice: isHi ? '₹48 - ₹65 प्रति मानक इकाई (स्थानीय मंडी अनुसार)' : '₹48 - ₹65 per standard unit (indexed to regional mandi)',
      regionalPurchasingPowerEstimate: isHi
        ? 'मध्यम-निम्न: उपभोक्ता छोटे पैक में बार-बार नकद भुगतान पसंद करते हैं।'
        : 'Moderate-Rural: High frequency, low ticket-size purchases with strong preference for tangible value.',
      breakEvenTimeline: isHi ? 'मोरेटोरियम समाप्त होने के बाद 4 से 6 महीने' : '4 to 6 months post-moratorium phase',
    },
    executiveSummary: isHi
      ? `ग्राम पंचायत ${location.village} में ₹${feasibleProjectCost.toLocaleString('en-IN')} की यह परियोजना पूर्णतः व्यावहारिक है। 10% मार्जिन पूंजी (₹${availableMargin.toLocaleString('en-IN')}) और MoSJE 90% रियायती ऋण के संयोजन से यह इकाई प्रथम वर्ष में ही सकारात्मक नकदी प्रवाह उत्पन्न कर सकती है।`
      : `The proposed enterprise in ${location.village} (Block: ${location.block}) demonstrates robust commercial viability at a project cost of ₹${feasibleProjectCost.toLocaleString('en-IN')}. Combining the entrepreneur's 10% margin capital with 90% MoSJE concessional credit establishes a low-risk, bankable model with healthy debt service coverage.`,
    generatedDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
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
