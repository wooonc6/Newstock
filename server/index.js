require('dotenv').config();
const express = require('express');
const cors = require('cors');
const learningRouter = require('./routes/learning');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/learning', learningRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Newstock 서버 실행 중: http://localhost:${PORT}`);
});
