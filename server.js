import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8082;

// Serve static files first
app.use(express.static(__dirname));

// Route rewrites for history mode routing
// All /docs/* routes serve docs/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, '/docs/index.html'));
});

app.get('/docs/:product', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/product/index.html'));
});


// 404 route
app.get('/404', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Fallback: serve 404 for unmatched routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Routes configured:');
  console.log('  /           -> index.html');
  console.log('  /docs/*     -> docs/index.html');
  console.log('  /404        -> 404.html');
  console.log('  * (fallback) -> 404.html');
});
