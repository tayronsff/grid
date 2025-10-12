const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        seedDatabase(); // Call the seeding function once connected
    })
    .catch(err => console.log('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    picture: { type: String, default: '' },
    createdChampionships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Championship' }],
    registeredChampionships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Championship' }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true }
});

const StageSchema = new mongoose.Schema({
    price: { type: Number, default: 0 },
    layout: { type: String },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    image: { type: String }
});

const ChampionshipSchema = new mongoose.Schema({
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    rulesLink: { type: String, default: '' },
    categories: [CategorySchema],
    registrationFee: { type: Number, default: 0 },
    name: { type: String, required: true },
    date: { type: Date }, // This will be auto-set from the first stage
    place: { type: String, required: true }, // Main location/track
    image: { type: String, required: true }, // Cover image
    organizer: { type: String, required: true },
    contactPhone: { type: String },
    contactEmail: { type: String },
    state: { type: String },
    city: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stages: [StageSchema]
});

const User = mongoose.model('User', UserSchema);
const Championship = mongoose.model('Championship', ChampionshipSchema);

// --- Auth Routes ---
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

app.post('/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).send('If an account with this email exists, a password reset link has been sent.');
        }
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
        const resetURL = `http://localhost:3000/reset-password.html?token=${token}`;
        console.log(`Password reset link: ${resetURL}`);
        res.status(200).send('If an account with this email exists, a password reset link has been sent.');
    } catch (error) {
        res.status(500).send('Error processing password reset.');
    }
});

app.post('/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).send('Password reset token is invalid or has expired.');
        }
        user.password = await bcrypt.hash(password, saltRounds);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).send('Password has been updated successfully.');
    } catch (error) {
        res.status(500).send('Error resetting password.');
    }
});

// --- User Routes ---
app.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, picture } = req.body;
        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).send('User not found.');
        }
        if (email && email !== userToUpdate.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).send('Email already in use.');
            }
            userToUpdate.email = email;
        }
        userToUpdate.name = name || userToUpdate.name;
        userToUpdate.picture = picture || userToUpdate.picture;
        await userToUpdate.save();
        const userToReturn = userToUpdate.toObject();
        delete userToReturn.password;
        res.status(200).json(userToReturn);
    } catch (error) {
        res.status(500).send('Error updating user profile.');
    }
});

app.get('/users/:userId/championships', async (req, res) => {
    try {
        const { userId } = req.params;
        const championships = await Championship.find({ creator: userId });
        res.status(200).json(championships);
    } catch (error) {
        res.status(500).send('Error fetching user championships.');
    }
});

// --- Stage Routes ---
app.get('/stages/upcoming', async (req, res) => {
    try {
        const championships = await Championship.find({ 'stages.date': { $gte: new Date() } }).populate('creator', 'name');

        const upcomingStages = championships.flatMap(champ => 
            champ.stages
                .filter(stage => stage.date >= new Date())
                .map(stage => ({
                    ...stage.toObject(),
                    championshipName: champ.name,
                    championshipId: champ._id,
                    championshipImage: champ.image, // Add championship image
                    championshipLogo: champ.logo    // Add championship logo
                }))
        );

        upcomingStages.sort((a, b) => a.date - b.date);

        res.status(200).json(upcomingStages.slice(0, 9));
    } catch (error) {
        res.status(500).send('Error fetching upcoming stages.');
    }
});

// --- Championship Routes ---
app.get('/championships/:id', async (req, res) => {
    try {
        const champ = await Championship.findById(req.params.id);
        if (!champ) {
            return res.status(404).send('Championship not found.');
        }
        res.status(200).json(champ);
    } catch (error) {
        res.status(500).send('Error fetching championship.');
    }
});

app.get('/championships', async (req, res) => {
    try {
        const championships = await Championship.find({});
        res.status(200).json(championships);
    } catch (error) {
        res.status(500).send('Error fetching championships.');
    }
});

app.post('/championships', async (req, res) => {
    try {
        const { creator, ...champData } = req.body;
        if (!creator) {
            return res.status(400).send('Creator ID is required.');
        }
        const user = await User.findById(creator);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        // Auto-set championship date to the first stage date if not provided
        if (champData.stages && champData.stages.length > 0 && !champData.date) {
            champData.date = champData.stages[0].date;
        }

        const champ = new Championship({ ...champData, creator });
        await champ.save();
        user.createdChampionships.push(champ._id);
        await user.save();
        res.status(201).send(champ);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.put('/championships/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, ...updateData } = req.body;
        const champ = await Championship.findById(id);
        if (!champ) {
            return res.status(404).send('Championship not found.');
        }
        if (champ.creator.toString() !== userId) {
            return res.status(403).send('User not authorized to edit this championship.');
        }
        Object.assign(champ, updateData);
        await champ.save();
        res.status(200).send(champ);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// --- Config Route ---
app.get('/api/config', (req, res) => {
    res.json({ googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY });
});

// --- Seeding Function ---
async function seedDatabase() {
    try {
        const demoUser = await User.findOne();
        if (!demoUser) {
            // console.log('Cannot seed database, no users found. Please create a user first.');
            return;
        }

        const existingChamp = await Championship.findOne({ name: 'Campeonato de Demonstração' });
        if (existingChamp) {
            return; // Demo data already exists
        }

        console.log('Seeding database with demo championship...');
        const today = new Date();
        const stages = [];
        for (let i = 1; i <= 5; i++) {
            const stageDate = new Date(today);
            stageDate.setDate(today.getDate() + (i * 7));
            stages.push({
                name: `Etapa de Demonstração ${i}`,
                date: stageDate,
                location: `Kartódromo Exemplo ${i}`
            });
        }

        const demoChamp = new Championship({
            name: 'Campeonato de Demonstração',
            description: 'Este é um campeonato gerado automaticamente para fins de demonstração. Explore suas etapas e funcionalidades!',
            date: stages[0].date,
            place: 'Vários Locais',
            image: 'https://images.unsplash.com/photo-1555532407-54c7c3b4f73c?auto=format&fit=crop&w=1200&q=80',
            logo: 'https://i.imgur.com/s6f2JjE.png',
            rulesLink: '#',
            organizer: 'Equipe GridBoard',
            contactEmail: 'contato@gridboard.com',
            state: 'SP',
            city: 'São Paulo',
            creator: demoUser._id,
            stages: stages
        });

        await demoChamp.save();
        console.log('Demo championship created successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

// --- Server Start ---
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
