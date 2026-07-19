const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { checkEligibility } = require('./eligibilityController');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Scheme Eligibility API is running');
});
app.post('/api/check-eligibility', checkEligibility);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});