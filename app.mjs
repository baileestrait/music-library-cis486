//import 'dotenv/config';
import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
//import { MongoClient, ServerApiVersion } from 'mongodb';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express()
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

app.get('/', (req, res) => {
  res.send('MINI APP is running!')
})

// Simple API endpoint
app.get("/hello", (req, res) => {
  res.json({ message: "Hello CIS 486! Your API is running.", timestamp: new Date().toISOString() });
});

// Health endpoint (useful for Render/uptime checks)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});