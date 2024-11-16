const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const firebaseAdmin = require('firebase-admin');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

// Initialiser Firebase Admin SDK
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(require('./capsule-time-23589-firebase-adminsdk-4p2wc-4a88757d31.json')),
    databaseURL: 'https://capsule-time-23589-default-rtdb.firebaseio.com'

});

const app = express();
app.use(express.json()); // Middleware pour parser les requêtes JSON

// Ajouter une route GET pour la racine
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API CapsuleTime!');
});

// API pour partager une capsule
app.post('/api/shareCapsule', async (req, res) => {
    const { capsule, toEmail } = req.body;

    // Vérifier que les données nécessaires sont présentes ok
    if (!capsule || !toEmail) {
        return res.status(400).json({ error: 'Les champs "capsule" et "toEmail" sont requis' });
    }

    // Enregistrer la capsule partagée dans Firebase
    const ref = firebaseAdmin.database().ref('sharedCapsules').push();
    const sharedCapsuleData = {
        message: capsule.message,
        dateOuverture: capsule.dateOuverture,
        estOuverte: capsule.estOuverte,
        sentiment: capsule.sentiment,
        creatorID: capsule.creatorID,
        isShared: true,
        sharedWithEmails: [toEmail], // Liste des emails avec lesquels la capsule est partagée
    };

    try {
        // Enregistrer la capsule partagée
        await ref.set(sharedCapsuleData);

        // Envoyer un email pour notifier le destinataire
        await sendShareEmail(toEmail, capsule);

        return res.status(200).json({ message: 'Capsule partagée avec succès!' });
    } catch (error) {
        console.error('Erreur lors du partage de la capsule:', error);
        return res.status(500).json({ error: 'Erreur lors du partage de la capsule' });
    }
});

// Fonction pour envoyer un email de notification
async function sendShareEmail(toEmail, capsule) {
    const subject = "Une capsule temporelle a été partagée avec vous";
    const body = `
        Bonjour,
        Une capsule temporelle a été partagée avec vous sur Capsule Time.
        Elle sera disponible à partir du ${new Date(capsule.dateOuverture).toLocaleString()}.
        Connectez-vous à l'application pour la voir.
        Cordialement,
        L'équipe Capsule Time
    `;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME, // Email de l'expéditeur
        to: toEmail, // Email du destinataire
        subject: subject,
        text: body,
    };

    // Envoi de l'email
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            console.log('Email envoyé: ' + info.response);
            resolve(info);
        });
    });
}

// Démarrer le serveur sur le port spécifié ou 3000 par défaut
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
