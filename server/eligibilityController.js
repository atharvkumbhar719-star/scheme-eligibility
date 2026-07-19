const schemes = require('./schemes.json');

function checkEligibility(req, res) {
  const { age, income, occupation, gender } = req.body;

  if (age === undefined || income === undefined || !occupation) {
    return res.status(400).json({
      error: 'Please provide age, income, and occupation.'
    });
  }

  const eligibleSchemes = schemes.filter((scheme) => {
    const rule = scheme.eligibility;

    const occupationMatch =
      rule.occupation.includes('any') ||
      rule.occupation.includes(occupation.toLowerCase());

    const incomeMatch = income >= rule.minIncome && income <= rule.maxIncome;

    const genderMatch = rule.gender
      ? rule.gender.includes((gender || '').toLowerCase())
      : true;

    return occupationMatch && incomeMatch && genderMatch;
  });

  const result = eligibleSchemes.map((scheme) => ({
    name: scheme.name,
    category: scheme.category,
    description: scheme.description,
    documents: scheme.documents,
    reason: `You are eligible because your income (Rs. ${income}) is within the limit and your occupation/gender matches this scheme's criteria.`
  }));

  res.json({
    totalEligible: result.length,
    schemes: result
  });
}

module.exports = { checkEligibility };