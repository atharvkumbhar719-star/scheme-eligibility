const schemes = require("./schemes.json");
const { predictEligibility } = require("./mlPredictor");

// Hybrid engine: rules decide eligibility, Random Forest gives a confidence score and ranking.
function evaluate(input) {
  const { age, income, occupation, gender } = input || {};

  if (age === undefined || income === undefined || !occupation) {
    return { status: 400, body: { error: "Please provide age, income, and occupation." } };
  }

  const user = { age: Number(age), income: Number(income), occupation, gender };
  let mlScores = {};
  try {
    mlScores = predictEligibility(user);
  } catch (err) {
    console.error("ML prediction failed, using rules only:", err.message);
  }

  const occ = String(occupation).toLowerCase().trim();
  const gen = String(gender || "").toLowerCase().trim();

  const matched = schemes
    .filter((scheme) => {
      const rule = scheme.eligibility;
      const occupationMatch = rule.occupation.includes("any") || rule.occupation.includes(occ);
      const incomeMatch = user.income >= rule.minIncome && user.income <= rule.maxIncome;
      const genderMatch = rule.gender ? rule.gender.includes(gen) : true;
      return occupationMatch && incomeMatch && genderMatch;
    })
    .map((scheme) => {
      const p = mlScores[scheme.id];
      const hasMl = typeof p === "number";
      return {
        name: scheme.name,
        category: scheme.category,
        description: scheme.description,
        documents: scheme.documents,
        reason: "You are eligible because your income (Rs. " + income + ") is within the limit and your occupation/gender matches this scheme\u0027s criteria.",
        mlConfidence: hasMl ? Math.round(p * 100) : null,
        mlAgrees: hasMl ? p >= 0.5 : null,
      };
    })
    .sort((a, b) => (b.mlConfidence ?? 0) - (a.mlConfidence ?? 0));

  return {
    status: 200,
    body: {
      engine: "Hybrid: rule-based check + Random Forest confidence score",
      totalEligible: matched.length,
      schemes: matched,
    },
  };
}

module.exports = { evaluate };
