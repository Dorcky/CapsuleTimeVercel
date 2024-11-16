const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // Charger les variables d'environnement depuis le fichier .env

const app = express();
app.use(express.json()); // Middleware pour parser les requêtes JSON

// Ajouter une route GET pour la racine
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API CapsuleTime!');
});

// API de la fonction d'envoi d'email
app.post('/api/sendEmail', async (req, res) => {
    // Autoriser les requêtes CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Vérifier que la requête est bien de type POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    // Vérifier que le corps de la requête contient bien les données nécessaires
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'Les champs "to", "subject" et "text" sont requis' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: to,
        subject: subject,
        text: text,
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Email envoyé avec succès!' });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email', details: error.message });
    }
});

// Démarrer le serveur sur le port spécifié ou 3000 par défaut
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
