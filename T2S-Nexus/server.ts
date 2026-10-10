import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// Health check endpoint for Cloud Run
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

const distPath = path.join(__dirname, 'dist');

// Serve static assets from Vite build output
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback: send index.html for all other routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(503).send('Application build in progress. Please refresh momentarily.');
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
