# AI Government Scheme Eligibility Assistant

A web application that tells citizens which government welfare schemes they are eligible for, using only four inputs: **age, annual income, occupation and gender**. For every matched scheme it shows the reason, the required documents and a **machine learning confidence score**.

Theme: Sustainability & Social Impact (Public Services & Financial Inclusion)

## Live links

- **Live app (frontend):** https://scheme-eligibility.vercel.app
- **API endpoint:** https://scheme-eligibility.vercel.app/api/check-eligibility
- **GitHub:** https://github.com/atharvkumbhar719-star/scheme-eligibility

## Problem

Many citizens are eligible for government schemes but never apply because they do not know the scheme exists or whether they qualify. Existing portals mostly expect the user to know or search for the scheme first.

## How it works (hybrid system)

1. The user submits age, income, occupation and gender on the website.
2. The frontend sends a `POST /api/check-eligibility` request to a serverless function on the same Vercel site (`client/api/`).
3. **Rule engine:** the function checks the user against the eligibility rules in `server/schemes.json`. This decides which schemes are shown.
4. **ML model:** a Random Forest classifier gives a confidence score (0-100%) for each scheme. Results are ranked by this score. If ML and rules ever disagree, the result carries `mlAgrees: false`.
5. The response lists the matched schemes with reason, documents and ML confidence.

## Machine learning part

| Item | Details |
|------|---------|
| Task | Multi-label classification: which of the 5 schemes is the user eligible for |
| Model | Random Forest (scikit-learn), 30 trees, max depth 9 |
| Features | age, income, occupation (one-hot), gender (one-hot) |
| Training data | **Synthetic**: 24,000 random user profiles labelled with the scheme rules (`ml/synthetic_training_data.csv`) |
| Split | 80% train (19,200) / 20% test (4,800) |
| Exact-match accuracy | 99.90% |
| Micro / Macro F1 | 0.9994 / 0.9977 |
| Most important feature | income (74%), then gender |
| Deployment | Trained in Python, exported to `model.json`, evaluated inside Node.js (`mlPredictor.js`), so no separate Python server is needed |

**Important note on the accuracy:** no real-world labelled eligibility dataset exists, so the training labels come from the same rules used in the rule engine. The model therefore learns to approximate those rules, and the very high accuracy is expected. It does not prove the model is better than the rules. In this project the rules remain the source of truth; the ML model adds a confidence score and ranking and demonstrates the full ML pipeline (data generation, training, evaluation, export, deployment). PM-KISAN has the lowest recall (0.98) because it has the fewest positive examples.

The eligibility rules in `schemes.json` are simplified for demonstration and must be checked against official scheme guidelines before real-world use.

## Schemes covered

PM-KISAN, Ayushman Bharat (PM-JAY), PM Awas Yojana, Sukanya Samriddhi Yojana, National Scholarship Portal.

## Tech stack

- Frontend: HTML, CSS, JavaScript (Vercel)
- Backend: Node.js serverless function on Vercel (`client/api/`); an equivalent Express server is also included in `server/` for local use
- ML: Python, pandas, scikit-learn (training only)

## Project structure

```
client/index.html            web form and results
client/api/check-eligibility.js   Vercel serverless API (live)
client/api/_lib/             engine, ML predictor, model.json, schemes.json used by the live API
server/index.js              Express server (optional, for local use)
server/eligibilityController.js   hybrid rules + ML logic
server/mlPredictor.js        runs the Random Forest in Node.js
server/model.json            exported trained model
server/schemes.json          scheme rules, descriptions, documents
ml/train_model.py            synthetic data, training, evaluation, export
ml/synthetic_training_data.csv
```

## Run locally

Backend:
```
cd server
npm install
node index.js
```
To test the Express version locally, open `client/index.html` after setting `API_URL` in it to `http://localhost:5000/api/check-eligibility`. The live site uses the Vercel function and needs no server.

Retrain the model (optional):
```
cd ml
pip install -r requirements.txt
python train_model.py
```
Then copy the new `model.json` into `server/`.

## API

`POST /api/check-eligibility`

```json
{ "age": 30, "income": 150000, "occupation": "farmer", "gender": "male" }
```

Response (shortened):
```json
{
  "engine": "Hybrid: rule-based check + Random Forest confidence score",
  "totalEligible": 3,
  "schemes": [
    { "name": "PM-KISAN", "mlConfidence": 81, "mlAgrees": true, "documents": ["..."] }
  ]
}
```

## Author

Atharv Kumbhar
