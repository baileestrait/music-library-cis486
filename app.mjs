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
    //console.log(req.body);
    const { songTitle, artist , year, genre } = req.body;
    console.log (songTitle); 
    
    // Simple validation
    if (!songTitle || !artist || !year || !genre) {
      return res.status(400).json({ error: 'Song Title, Artist, Year, and Genre are required' });
    }

    const song = { songTitle, artist, year: parseInt(year), genre };
    const result = await db.collection('songs').insertOne(song);
    
    res.status(201).json({ 
      message: 'Song created successfully',
      songId: result.insertedId,
      song: { ...song, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create song: ' + error.message });
  }

});

// READ - Get all songs

app.get('/api/songs', async (req, res) => {
  try {
    const songs = await db.collection('songs').find({}).toArray();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch songs: ' + error.message});
  }
});

// UPDATE - Update a song by ID

app.put('/api/songs/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const {songTitle, artist, year, genre} = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid song ID' });
    }

    const updateData = {};
    if (songTitle) updateData.songTitle = songTitle;
    if (artist) updateData.artist = artist;
    if (year) updateData.year = parseInt(year);
    if (genre) updateData.genre = genre;

    console.log(updateData);

    const result = await db.collection('songs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Song not found'});
    }
    res.json({
      message: 'Song updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update song: ' + error.message});
  }
      });
      
// DELETE - Delete a song by ID
app.delete('/api/songs/:id', async (req, res) => {
  try {
    const {id} = req.params;

    if(!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid song ID' });
    }
    const result = await db.collection('songs').deleteOne({_id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json ({
      message: 'Song deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete song: ' + error.message });
  }
});

// SEED - Add sample songs
app.post('/api/seed', async (req, res) => {
  try {
    // clear existing data
    await db.collection('songs').deleteMany({});

    const sampleSongs = [
      { songTitle: "Ain't It Fun" , artist: "Paramore" , year: 2014 , genre: "Pop Rock" },
      { songTitle: "Into the Void" , artist: "Black Sabbath" , year: 1971 , genre: "Metal" },
      { songTitle: "Bonfire" , artist: "Childish Gambino" , year: 2011 , genre: "Rap" },
      { songTitle: "Ring Ring Ring" , artist: "Tyler, the Creator" , year: 2025 , genre: "Hip Hop" },
      { songTitle: "L'Amour De Ma Vie" , artist: "Billie Eilish" , year: 2024 , genre: "Alternative/Indie" },
      { songTitle: "The Way You Move" , artist: "OutKast" , year: 2003, genre: "Hip Hop" },
      { songTitle: "Stick Season" , artist: "Noah Kahan" , year: 2022 , genre: "Indie/Folk" },
    ];
    const result = await db.collection('songs').insertMany(sampleSongs);

    res.json({
      message: `Database seeded successfully! Added ${result.insertedCount} sample songs.`,
      insertedCount: result.insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database: ' + error.message });
  }
});

// CLEANUP - Remove ALL student data
app.delete('/api/cleanup', async (req, res) => {
  try {
    const result = await db.collection('songs').deleteMany({});

    res.json({
      message: `Database cleaned successfully! Removed ${result.deletedCount} songs.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup database: ' + error.message });
  }
});

app.listen(PORT, () => {
});