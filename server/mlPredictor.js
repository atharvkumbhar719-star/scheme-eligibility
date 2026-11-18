// Runs the Random Forest trained in train_model.py (exported to model.json).
// No Python server is needed: the forest is just arrays, so prediction is a tree walk.
const model = require('./model.json');

function buildFeatures({ age, income, occupation, gender }) {
  const occ = String(occupation || '').toLowerCase().trim();
  const gen = String(gender || '').toLowerCase().trim();
  const occKnown = model.occupations.includes(occ) ? occ : 'other';
  const genKnown = model.genders.includes(gen) ? gen : 'other';

  return model.features.map((name) => {
    if (name === 'age') return Number(age) || 0;
    if (name === 'income') return Number(income) || 0;
    if (name.startsWith('occ_')) return name === 'occ_' + occKnown ? 1 : 0;
    if (name.startsWith('gen_')) return name === 'gen_' + genKnown ? 1 : 0;
    return 0;
  });
}

// Walk one tree from the root to a leaf and return P(eligible) for every scheme.
function walk(tree, x) {
  let node = 0;
  while (tree.left[node] !== -1) {
    node = x[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
  }
  return tree.prob[node];
}

// Average over all trees = Random Forest probability for each scheme.
function predictFromVector(x) {
  const n = model.schemes.length;
  const sum = new Array(n).fill(0);
  for (const tree of model.trees) {
    const p = walk(tree, x);
    for (let i = 0; i < n; i++) sum[i] += p[i];
  }
  const result = {};
  model.schemes.forEach((id, i) => {
    result[id] = sum[i] / model.trees.length;
  });
  return result;
}

function predictEligibility(user) {
  return predictFromVector(buildFeatures(user));
}

module.exports = { predictEligibility, predictFromVector };
