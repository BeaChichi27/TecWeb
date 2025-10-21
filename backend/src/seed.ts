import { sequelize } from './database'; // Assumi che il file database.ts esporti l'istanza di Sequelize
import User from './models/user';
import Restaurant from './models/restaurant';
import Review from './models/review';
import Vote from './models/vote';
import * as bcrypt from 'bcrypt'; // Assicurati di avere bcrypt installato: npm install bcrypt

/**
 * Script per popolare il database con dati fittizi.
 */
async function seedDatabase() {
    console.log('--- Avvio del Seeding del Database ---');

    try {
        // 1. Sincronizzazione: elimina i dati esistenti e ricrea le tabelle
        // !!! ATTENZIONE: Questo comando eliminerà tutti i dati esistenti nel database !!!
        await sequelize.sync({ force: true }); 
        console.log('Database sincronizzato. Tabelle ricreate.');

        // --- 2. Creazione Utenti ---
        const hashedPassword1 = await bcrypt.hash('password123', 10);
        const hashedPassword2 = await bcrypt.hash('proprietario456', 10);
        const hashedPassword3 = await bcrypt.hash('utente789', 10);
        
        // Aggiungo isOwner per coerenza col frontend, assumendo esista
        const users = await User.bulkCreate([
            { username: 'reviewer_max', email: 'max@example.com', password: hashedPassword1, isOwner: false },
            { username: 'owner_elisa', email: 'elisa@proprietario.com', password: hashedPassword2, isOwner: true },
            { username: 'tester_gio', email: 'gio@test.com', password: hashedPassword3, isOwner: false },
        // Aggiunta dell'opzione fields per forzare le colonne, anche se non dovrebbe essere necessaria per bulkCreate
        ], { returning: true, fields: ['username', 'email', 'password'] }); // Non passo userID o isOwner se non richiesto

        const [userMax, userElisa, userGio] = users;
        console.log(`Creati ${users.length} utenti.`);
        
        // --- 3. Creazione Ristoranti ---
        const restaurants = await Restaurant.bulkCreate([
            {
                name: 'Il Covo dei Pinguini Alieni',
                description: "Un ristorante dove i camerieri sono pinguini alieni che servono spaghetti volanti. L'esperienza è surreale e il conto... pure.",
                latitude: 40.8518, // CAMPI OBBLIGATORI
                longitude: 14.2681, // CAMPI OBBLIGATORI
                imagePath: 'pinguini_aliens.jpg',
                creatorUserID: userElisa.userID,
            },
            {
                name: 'Baita Senza Gravità',
                description: 'Cucina tradizionale valtellinese servita in una stanza a gravità zero. Ottimo per chi ama mangiare "leggero".',
                latitude: 45.4642, // CAMPI OBBLIGATORI
                longitude: 9.1900, // CAMPI OBBLIGATORI
                imagePath: 'gravita_zero.jpg',
                creatorUserID: userElisa.userID,
            },
        ], { 
            returning: true,
            // Aggiungo fields per il debug: forzo Sequelize a considerare tutti i campi che sto passando
            fields: ['name', 'description', 'latitude', 'longitude', 'imagePath', 'creatorUserID']
        });

        const [restPinguini, restGravita] = restaurants;
        console.log(`Creati ${restaurants.length} ristoranti.`);

        // --- 4. Creazione Recensioni ---
        // ATTENZIONE: Aggiungere il campo 'rating' nel modello Review se non c'è, altrimenti fallirà qui.
        const reviews = await Review.bulkCreate([
            {
                content: "Ho visto un pinguino con un fez che mi ha servito il brodo in una scarpa. Cinque stelle per l'assurdità.",
                // Ho aggiunto rating, assumendo esista nel tuo modello Review
                rating: 5, 
                authorUserID: userMax.userID,
                restaurantID: restPinguini.restaurantID,
            },
            {
                content: "Il cibo era buono, ma ho speso mezz'ora per recuperare il raviolo fluttuante. Divertente, ma non per chi ha fame.",
                rating: 3,
                authorUserID: userGio.userID,
                restaurantID: restGravita.restaurantID,
            },
            {
                content: "Una vera delusione, il pinguino mi ha rubato il portafoglio. Servizio pessimo. 1 stella.",
                rating: 1,
                authorUserID: userGio.userID,
                restaurantID: restPinguini.restaurantID,
            }
        ], { returning: true });

        const [revMax, revGioGravita, revGioPinguini] = reviews;
        console.log(`Create ${reviews.length} recensioni.`);

        // --- 5. Creazione Voti (Upvote e Downvote) ---
        await Vote.bulkCreate([
            { voteType: 'upvote', voterUserID: userGio.userID, reviewID: revMax.reviewID },
            { voteType: 'downvote', voterUserID: userMax.userID, reviewID: revGioGravita.reviewID },
            { voteType: 'upvote', voterUserID: userElisa.userID, reviewID: revGioPinguini.reviewID },

        ]);
        console.log('Creati voti fittizi.');

        console.log('--- Seeding Completato con Successo! ---');
        
    } catch (error) {
        console.error('Errore durante il seeding del database:', error); 
    }
}

seedDatabase();
