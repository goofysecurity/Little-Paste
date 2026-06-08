const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Dynamic import for nanoid (since nanoid uses ESM)
let nanoid;
import('nanoid').then(mod => nanoid = mod.nanoid);

const app = express();

// Middleware
app.use(cors()); // Allows your mobile/web frontend to talk to this API
app.use(express.json()); // Allows the API to read JSON text data sent by the frontend

// 1. Connect to MongoDB
// Replace 'YOUR_MONGODB_URI' with your actual connection string (e.g., from MongoDB Atlas)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/monopaste';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// 2. Define how a "Paste" looks in the database (Schema)
const pasteSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Paste = mongoose.model('Paste', pasteSchema);

// 3. API Route: Create a new paste (POST)
// The frontend hits this when you click "Create Paste"
app.post('/api/pastes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content cannot be empty' });
    }

    // Generate a unique, short 8-character ID (like abcdef12)
    const shortId = nanoid(8); 

    // Save to database
    const newPaste = new Paste({ shortId, content });
    await newPaste.save();

    // Send the short ID back to the frontend
    res.status(201).json({ shortId });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Server error: Could not save paste' });
  }
});

// 4. API Route: Fetch a specific paste (GET)
// The frontend hits this automatically when someone opens a shareable link
app.get('/api/pastes/:id', async (req, res) => {
  try {
    const paste = await Paste.findOne({ shortId: req.params.id });
    
    if (!paste) {
      return res.status(404).json({ error: 'Paste not found' });
    }
    
    // Send the text content back to the frontend
    res.json({ content: paste.content });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Server error: Could not retrieve paste' });
  }
});

// 5. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server is running on port ${PORT}`));
