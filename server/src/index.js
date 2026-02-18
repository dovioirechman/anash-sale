import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import articlesRouter from './routes/articles.js';
import newsRouter from './routes/news.js';
import adsRouter from './routes/ads.js';
import adminRouter from './routes/admin.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/articles', articlesRouter);
app.use('/api/news', newsRouter);
app.use('/api/ads', adsRouter);
app.use('/api/admin', adminRouter);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
