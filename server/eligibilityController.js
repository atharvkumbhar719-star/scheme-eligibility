const schemes = require('./schemes.json');
const { predictEligibility } = require('./mlPredictor');

// Hybrid engine:
//  1. Rule check (from schemes.json) decides eligibility  -> always correct vs official-style rules
//  2. Random Forest (trained in Python) gives a confidence score for each scheme
//     and is used to rank the results. If ML and rules disagree, the result is flagged.
function checkEligibility(req, res) {
  const { age, income, occupation, gender } = req.body;

  if (age === undefined || income === undefined || !occupation) {
    return res.status(400).json({ error: 'Please provide age, income, and occupation.' });
  }

  const user = { age: Number(age), income: Number(income), occupation, gender };
  let mlScores = {};
  try {
    mlScores = predictEligibility(user);
  } catch (err) {
    console.error('ML prediction failed, using rules only:', err.message);
  }

  const matched = schemes
    .filter((scheme) => {
      const rule = scheme.eligibility;
      const occupationMatch =
        rule.occupation.includes('any') || rule.occupation.includes(String(occupation).toLowerCase());
      const incomeMatch = user.income >= rule.minIncome && user.income <= rule.maxIncome;
      const genderMatch = rule.gender ? rule.gender.includes((gender || '').toLowerCase()) : true;
      return occupationMatch && incomeMatch && genderMatch;
    })
    .map((scheme) => {
      const p = mlScores[scheme.id];
      const hasMl = typeof p === 'number';
      return {
        name: scheme.name,
        category: scheme.category,
        description: scheme.description,
        documents: scheme.documents,
        reason: `You are eligible because your income (Rs. ${income}) is within the limit and your occupation/gender matches this scheme's criteria.`,
        mlConfidence: hasMl ? Math.round(p * 100) : null,
        mlAgrees: hasMl ? p >= 0.5 : null,
      };
    })
    .sort((a, b) => (b.mlConfidence ?? 0) - (a.mlConfidence ?? 0));

  res.json({
    engine: 'Hybrid: rule-based check + Random Forest confidence score',
    totalEligible: matched.length,
    schemes: matched,
  });
}

module.exports = { checkEligibility };
