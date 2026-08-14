require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const KnowledgeBase = require('../models/KnowledgeBase');

const seedData = [
  // Patient - LOW/MEDIUM
  {
    audience: 'patient',
    category: 'LOW',
    text: 'Grounding: name 5 things you can see, 4 you can touch, 3 you can hear.',
    tags: ['grounding', 'distraction', 'anxiety']
  },
  {
    audience: 'patient',
    category: 'LOW',
    text: 'Box breathing: in for 4, hold for 4, out for 4, hold for 4. Repeat 3-4 times.',
    tags: ['breathing', 'calm', 'panic']
  },
  {
    audience: 'patient',
    category: 'MEDIUM',
    text: 'Urge surfing: a craving typically peaks and fades within 15-20 minutes, like a wave — it does not stay at full intensity.',
    tags: ['craving', 'perspective', 'time']
  },
  {
    audience: 'patient',
    category: 'MEDIUM',
    text: 'Reaching out to one trusted person, even briefly, measurably reduces the intensity of a craving episode.',
    tags: ['contact', 'support', 'isolation']
  },
  // Caregiver - deescalation
  {
    audience: 'caregiver',
    category: 'caregiver_deescalation',
    text: 'Speak slowly and keep your own voice calm — tone matters more than words.',
    tags: ['tone', 'communication', 'calm']
  },
  {
    audience: 'caregiver',
    category: 'caregiver_deescalation',
    text: 'Avoid ultimatums or shame-based language in the moment; address consequences later, when calm.',
    tags: ['shame', 'ultimatums', 'boundaries']
  },
  {
    audience: 'caregiver',
    category: 'caregiver_deescalation',
    text: 'Offer a specific small next step (sit down, drink water, take 3 breaths together) rather than open-ended questions.',
    tags: ['actionable', 'small_steps', 'direction']
  },
  {
    audience: 'caregiver',
    category: 'caregiver_deescalation',
    text: 'If the person seems confused, unresponsive, or has physical symptoms (difficulty breathing, unconsciousness), treat it as a medical emergency.',
    tags: ['emergency', 'physical', 'overdose']
  }
];

async function seedDatabase() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI not found in environment variables.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing entries to prevent duplicates during multiple runs
    await KnowledgeBase.deleteMany({});
    console.log('Cleared existing KnowledgeBase entries.');

    await KnowledgeBase.insertMany(seedData);
    console.log('Successfully seeded KnowledgeBase with snippets.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
