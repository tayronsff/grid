const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registeredChampionships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Championship' }]
});

const ChampionshipSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    place: { type: String, required: true },
    image: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);
const Championship = mongoose.model('Championship', ChampionshipSchema);


const bcrypt = require('bcrypt');
const saltRounds = 10;

// Route to handle championship creation
app.post('/championships', async (req, res) => {
    const { name, date, place, image } = req.body; // Image is now a URL from the form

    try {
        const newChampionship = new Championship({ name, date, place, image });
        await newChampionship.save();
        res.status(201).json(newChampionship);
    } catch (error) {
        res.status(500).send('Error creating championship.');
    }
});

// Route to get all championships
app.get('/championships', async (req, res) => {
    try {
        const championships = await Championship.find();
        res.json(championships);
    } catch (error) {
        res.status(500).send('Error fetching championships.');
    }
});

// Registration Route
app.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        const userToReturn = newUser.toObject();
        delete userToReturn.password;
        res.status(201).json(userToReturn);
    } catch (error) {
        res.status(500).send('Error registering user.');
    }
});

// Login Route
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Invalid credentials.');
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const userToReturn = user.toObject();
            delete userToReturn.password;
            res.status(200).json(userToReturn);
        } else {
            res.status(400).send('Invalid credentials.');
        }
    } catch (error) {
        res.status(500).send('Error logging in.');
    }
});

// Forgot Password Route (Simulated)
app.post('/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        console.log(`Password reset requested for: ${email}`);
    }
    // Always send a generic success message for security reasons
    res.status(200).send('If an account with this email exists, a password reset link has been sent.');
});

// Championship Registration Route
app.post('/users/:id/register', async (req, res) => {
    const { id } = req.params;
    const { championshipId } = req.body;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        if (!user.registeredChampionships.includes(championshipId)) {
            user.registeredChampionships.push(championshipId);
            await user.save();
        }

        const userToReturn = user.toObject();
        delete userToReturn.password;
        res.status(200).json(userToReturn);
    } catch (error) {
        res.status(500).send('Error registering for championship.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
