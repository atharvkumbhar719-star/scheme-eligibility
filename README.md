# AI Government Scheme Eligibility Assistant

An AI-powered web application that helps citizens discover which government welfare schemes they are eligible for, based on their age, income, occupation, and gender — solving the real problem that millions of eligible people never claim benefits simply because they don't know such schemes exist.

## 🎯 Problem Statement

Millions of people across India remain unaware of government welfare schemes they qualify for — losing out on financial aid, healthcare coverage, housing support, and education benefits. Existing government portals are fragmented, text-heavy, and require users to already know which scheme to search for.

## 💡 Our Solution

Users enter basic details (age, income, occupation, gender), and our AI-driven eligibility engine instantly matches them against a database of government schemes, returning:
- Which schemes they're eligible for
- Why they qualify
- Required documents
- A short description of scheme benefits

## 🧠 AI / Logic Core

The eligibility engine performs rule-based matching combined with structured reasoning across multiple criteria (income bands, occupation category, gender-specific schemes) to generate personalized, explainable results — moving beyond simple keyword search to actual eligibility inference.

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Fetch API)
- **Backend:** Node.js, Express.js
- **Data:** JSON-based scheme eligibility rules engine
- **Deployment:** Railway (Backend), Vercel (Frontend)

## 🚀 Live Demo

- **Frontend (Live App):** https://scheme-eligibility.vercel.app
- **Backend API:** https://scheme-eligibility-production.up.railway.app

## ⚙️ How It Works

1. User submits age, income, occupation, and gender via the web form
2. Frontend sends a POST request to `/api/check-eligibility`
3. Backend evaluates the user against scheme eligibility rules
4. Matching schemes are returned with reasons, categories, and required documents

## 📦 Local Setup

### Backend


cd server
npm install
node index.js

### Frontend
Open `client/index.html` in your browser (update the fetch URL to `http://localhost:5000` for local testing).

## 📋 API Endpoint

**POST** `/api/check-eligibility`

Request body:
```json
{
  "age": 30,
  "income": 150000,
  "occupation": "farmer",
  "gender": "male"
}

Response:
Json
{
  "totalEligible": 3,
  "schemes": [...]
}


🌱 Theme
Sustainability & Social Impact — Public Services & Financial Inclusion
👤 Author
Atharv Kumbhar
