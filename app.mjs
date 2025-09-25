import 'dotenv/config';
import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion } from 'mongodb';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const PORT = process.env.PORT || 3000;

app.use(express.json()); 
app.use(express.static(join(__dirname, 'public')));

// const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI; 
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Keep the connection open for our CRUD operations
let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("songs"); // Database name
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
connectDB();



app.get('/', (req, res) => {
  res.send('<h3>Welcome to the Music Library!</h3><a href="musiclibrary">Visit Your Music Library!</a><br>')
})



app.get('/musiclibrary', (req, res) => {
 
  res.sendFile(join(__dirname, 'public', 'music-CRUD.html')) 

})

// CRUD ENDPOINTS FOR FILING MUSIC IN A LIBRARY

// CREATE -- ADD A NEW SONG

app.post('/api/songs', async (req, res) => {
  try {
    console.log(req.body);
    const { songTitle, artist , year, genre } = req.body;
    console.log (songTitle); 
    
    // Simple validation
    if (!songTitle || !artist || !year || !genre) {
      return res.status(400).json({ error: 'Song Title, Artist, Year, and Genre are required' });
    }

    const song = { songTitle, artist, year: parseInt(year), genre };
    const result = await db.collection('songs').insertOne(song);
    
    res.status(201).json({ 
      message: 'Student created successfully',
      songId: result.insertedId,
      song: { ...song, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create song: ' + error.message });
  }

});

app.listen(PORT, () => {
});