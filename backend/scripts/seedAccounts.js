const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedDemoAccounts() {
    try {
        console.log('Seeding demo accounts...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('SafeSpace@2026', salt);

        // Seed Patient
        const patientData = {
            email: 'patient@safespace.in',
            passwordHash,
            role: 'patient'
        };

        let patient = await User.findOne({ email: patientData.email });
        if (!patient) {
            patient = new User(patientData);
            await patient.save();
            console.log('Patient demo account created.');
        } else {
            // Update password hash just in case
            patient.passwordHash = passwordHash;
            await patient.save();
        }

        // Seed Caregiver
        const caregiverData = {
            email: 'caregiver@safespace.in',
            passwordHash,
            role: 'caregiver',
            linkedPatientId: patient._id
        };

        let caregiver = await User.findOne({ email: caregiverData.email });
        if (!caregiver) {
            caregiver = new User(caregiverData);
            await caregiver.save();
            console.log('Caregiver demo account created.');
        } else {
            caregiver.passwordHash = passwordHash;
            caregiver.linkedPatientId = patient._id;
            await caregiver.save();
        }

        console.log('Demo accounts seeded successfully.');
    } catch (err) {
        console.error('Error seeding demo accounts:', err);
    }
}

module.exports = seedDemoAccounts;
