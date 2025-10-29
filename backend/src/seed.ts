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
        console.log('\n👥 Creazione utenti...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const users = await User.bulkCreate([
            // Proprietari (owner)
            { username: 'mario_rossi', email: 'mario@example.com', password: hashedPassword, isOwner: true },
            { username: 'giulia_bianchi', email: 'giulia@example.com', password: hashedPassword, isOwner: true },
            { username: 'luca_verdi', email: 'luca@example.com', password: hashedPassword, isOwner: true },
            // Recensori (non owner)
            { username: 'reviewer1', email: 'rev1@example.com', password: hashedPassword, isOwner: false },
            { username: 'reviewer2', email: 'rev2@example.com', password: hashedPassword, isOwner: false },
            { username: 'reviewer3', email: 'rev3@example.com', password: hashedPassword, isOwner: false },
        ], { returning: true });

        const [owner1, owner2, owner3, reviewer1, reviewer2, reviewer3] = users;
        console.log(`✅ Creati ${users.length} utenti (3 owner, 3 reviewer).`);
        
        // --- 3. Creazione Ristoranti (8 satirici tech-themed) ---
        console.log('\n🍕 Creazione ristoranti satirici...');
        const restaurants = await Restaurant.bulkCreate([
            {
                name: 'Trattoria Single-Threaded',
                description: 'Esecuzione sequenziale garantita: un piatto alla volta. Perfetto per chi ha tempo da perdere!',
                latitude: 41.9028,
                longitude: 12.4964,
                imagePath: 'template.jpg',
                creatorUserID: owner1.userID,
            },
            {
                name: 'Pizzeria Callback Hell',
                description: 'Ogni pizza ne chiama un\'altra in una catena infinita di dipendenze. Buona fortuna a finire il pasto!',
                latitude: 45.4642,
                longitude: 9.1900,
                imagePath: 'template.jpg',
                creatorUserID: owner1.userID,
            },
            {
                name: 'Ristorante 404 Not Found',
                description: 'Il locale esiste ma il cibo no. Vieni per l\'esperienza metafisica della fame digitale.',
                latitude: 40.8518,
                longitude: 14.2681,
                imagePath: 'template.jpg',
                creatorUserID: owner2.userID,
            },
            {
                name: 'Osteria NullPointerException',
                description: 'Atmosfera accogliente, ma ogni tanto il servizio crashha senza preavviso. Porta un debugger!',
                latitude: 43.7696,
                longitude: 11.2558,
                imagePath: 'template.jpg',
                creatorUserID: owner2.userID,
            },
            {
                name: 'Sushi Bar Async/Await',
                description: 'Il sushi arriva quando vuole lui. Promise non mantenute, ma l\'attesa vale la pena... forse.',
                latitude: 45.0703,
                longitude: 7.6869,
                imagePath: 'template.jpg',
                creatorUserID: owner2.userID,
            },
            {
                name: 'Tavola Calda Segmentation Fault',
                description: 'Cucina casalinga che accede a zone di memoria proibite. Il menù cambia ogni volta che provi a leggerlo.',
                latitude: 44.4056,
                longitude: 8.9463,
                imagePath: 'template.jpg',
                creatorUserID: owner3.userID,
            },
            {
                name: 'Ristorante Race Condition',
                description: 'Due camerieri servono lo stesso tavolo contemporaneamente. Chi arriva primo vince!',
                latitude: 43.3188,
                longitude: 11.3307,
                imagePath: 'template.jpg',
                creatorUserID: owner3.userID,
            },
            {
                name: 'Pizzeria Stack Overflow',
                description: 'Pizza su pizza su pizza in una ricorsione infinita senza caso base. Preparati a esplodere!',
                latitude: 40.6263,
                longitude: 14.3757,
                imagePath: 'template.jpg',
                creatorUserID: owner3.userID,
            },
        ], { returning: true });

        console.log(`✅ Creati ${restaurants.length} ristoranti satirici.`);

        // --- 4. Creazione Recensioni (2 per ristorante, satiriche) ---
        console.log('\n📝 Creazione recensioni satiriche...');
        const reviews = await Review.bulkCreate([
            // Ristorante 0: Trattoria Single-Threaded
            { content: "Single-threaded al 100%! Ho ordinato l'antipasto e mi è arrivato dopo 3 ore. Almeno era caldo.", rating: 3, authorUserID: reviewer1.userID, restaurantID: restaurants[0].restaurantID },
            { content: "Il cameriere ha detto 'sto processando la tua richiesta'... e lo fa ancora. Consigliato per chi ha pazienza.", rating: 4, authorUserID: reviewer2.userID, restaurantID: restaurants[0].restaurantID },
            
            // Ristorante 1: Pizzeria Callback Hell
            { content: "Ogni volta che finisci un piatto ne arriva un altro che non hai ordinato. È un loop infinito di sorprese!", rating: 2, authorUserID: reviewer3.userID, restaurantID: restaurants[1].restaurantID },
            { content: "Ho chiesto una Margherita e mi è arrivata una Promise. Dopo 20 minuti si è risolta in una Carbonara. WTF?!", rating: 1, authorUserID: reviewer1.userID, restaurantID: restaurants[1].restaurantID },
            
            // Ristorante 2: Ristorante 404 Not Found
            { content: "L'arredamento è bellissimo ma il cibo non esiste. Ho mangiato solo aria e aspettative. 5 stelle per il concept!", rating: 5, authorUserID: reviewer2.userID, restaurantID: restaurants[2].restaurantID },
            { content: "Sono entrato, mi hanno dato un menu vuoto e mi hanno detto 'Page not found'. Arte culinaria postmoderna.", rating: 4, authorUserID: reviewer3.userID, restaurantID: restaurants[2].restaurantID },
            
            // Ristorante 3: Osteria NullPointerException
            { content: "Il primo piatto era ottimo, ma al secondo il cameriere ha crashato e non si è più riavviato. Esperienza unica!", rating: 3, authorUserID: reviewer1.userID, restaurantID: restaurants[3].restaurantID },
            { content: "Ho provato a ordinare il dolce ma mi hanno lanciato un'eccezione. Servizio da rivedere, ma il vino era buono.", rating: 2, authorUserID: reviewer2.userID, restaurantID: restaurants[3].restaurantID },
            
            // Ristorante 4: Sushi Bar Async/Await
            { content: "Il sushi arriva quando gli pare. Ho aspettato 2 ore ma ne è valsa la pena. Promise finalmente mantenuta!", rating: 4, authorUserID: reviewer3.userID, restaurantID: restaurants[4].restaurantID },
            { content: "Atmosfera zen, ma troppa attesa. Ho fatto await() per 40 minuti e poi mi hanno dato un reject(). Mai più.", rating: 1, authorUserID: reviewer1.userID, restaurantID: restaurants[4].restaurantID },
            
            // Ristorante 5: Tavola Calda Segmentation Fault
            { content: "Ogni volta che provo a leggere il menu cambia contenuto. Alla fine ho ordinato a caso. Piatto core dumped.", rating: 2, authorUserID: reviewer2.userID, restaurantID: restaurants[5].restaurantID },
            { content: "Il gestore mi ha detto 'sei in zona di memoria proibita'. Ho pagato e me ne sono andato subito. Inquietante.", rating: 1, authorUserID: reviewer3.userID, restaurantID: restaurants[5].restaurantID },
            
            // Ristorante 6: Ristorante Race Condition
            { content: "Due camerieri mi hanno servito lo stesso piatto contemporaneamente. Doppia porzione senza pagare extra! WIN!", rating: 5, authorUserID: reviewer1.userID, restaurantID: restaurants[6].restaurantID },
            { content: "Caos totale in sala. Ordinato una pasta, ricevuto un thread lock. Ma il pane era croccante.", rating: 3, authorUserID: reviewer2.userID, restaurantID: restaurants[6].restaurantID },
            
            // Ristorante 7: Pizzeria Stack Overflow
            { content: "Pizza infinita! Ogni morso ne genera un'altra. Ho mangiato per 3 ore senza mai finire. Consigliato!", rating: 5, authorUserID: reviewer3.userID, restaurantID: restaurants[7].restaurantID },
            { content: "Troppa pizza! Dopo il settimo livello di ricorsione ho avuto un overflow gastrico. Divertente ma pericoloso.", rating: 4, authorUserID: reviewer1.userID, restaurantID: restaurants[7].restaurantID },
        ], { returning: true });

        console.log(`✅ Create ${reviews.length} recensioni satiriche.`);

        // --- 5. Creazione Voti (Distribuzione strategica per "trending") ---
        console.log('\n👍👎 Creazione voti con distribuzione strategica...');
        
        // STRATEGIA: Creare ristoranti MOLTO popolari, popolari, neutri e impopolari
        // Popolarità = upvotes - downvotes sulle recensioni del ristorante
        
        await Vote.bulkCreate([
            // === Ristorante 0 (Trattoria Single-Threaded): MOLTO POPOLARE (score +5) ===
            // reviews[0] → 4 upvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[0].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[0].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[0].reviewID },
            { voteType: 'upvote', voterUserID: owner1.userID, reviewID: reviews[0].reviewID },
            // reviews[1] → 2 upvote, 1 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[1].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[1].reviewID },
            { voteType: 'downvote', voterUserID: owner2.userID, reviewID: reviews[1].reviewID },
            // TOTALE: 6 upvote, 1 downvote = +5 score
            
            // === Ristorante 1 (Pizzeria Callback Hell): IMPOPOLARE (score -3) ===
            // reviews[2] → 1 upvote, 3 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[2].reviewID },
            { voteType: 'downvote', voterUserID: reviewer2.userID, reviewID: reviews[2].reviewID },
            { voteType: 'downvote', voterUserID: reviewer3.userID, reviewID: reviews[2].reviewID },
            { voteType: 'downvote', voterUserID: owner1.userID, reviewID: reviews[2].reviewID },
            // reviews[3] → 0 upvote, 2 downvote
            { voteType: 'downvote', voterUserID: reviewer2.userID, reviewID: reviews[3].reviewID },
            { voteType: 'downvote', voterUserID: owner3.userID, reviewID: reviews[3].reviewID },
            // TOTALE: 1 upvote, 5 downvote = -4 score
            
            // === Ristorante 2 (404 Not Found): MOLTO POPOLARE (score +6) ===
            // reviews[4] → 5 upvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[4].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[4].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[4].reviewID },
            { voteType: 'upvote', voterUserID: owner1.userID, reviewID: reviews[4].reviewID },
            { voteType: 'upvote', voterUserID: owner2.userID, reviewID: reviews[4].reviewID },
            // reviews[5] → 3 upvote, 2 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[5].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[5].reviewID },
            { voteType: 'upvote', voterUserID: owner3.userID, reviewID: reviews[5].reviewID },
            { voteType: 'downvote', voterUserID: reviewer3.userID, reviewID: reviews[5].reviewID },
            { voteType: 'downvote', voterUserID: owner1.userID, reviewID: reviews[5].reviewID },
            // TOTALE: 8 upvote, 2 downvote = +6 score (IL PIÙ POPOLARE!)
            
            // === Ristorante 3 (Osteria NullPointerException): NEUTRO (score +1) ===
            // reviews[6] → 3 upvote, 1 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[6].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[6].reviewID },
            { voteType: 'upvote', voterUserID: owner1.userID, reviewID: reviews[6].reviewID },
            { voteType: 'downvote', voterUserID: reviewer3.userID, reviewID: reviews[6].reviewID },
            // reviews[7] → 1 upvote, 2 downvote
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[7].reviewID },
            { voteType: 'downvote', voterUserID: reviewer1.userID, reviewID: reviews[7].reviewID },
            { voteType: 'downvote', voterUserID: owner2.userID, reviewID: reviews[7].reviewID },
            // TOTALE: 4 upvote, 3 downvote = +1 score
            
            // === Ristorante 4 (Sushi Bar Async/Await): POPOLARE (score +3) ===
            // reviews[8] → 4 upvote, 1 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[8].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[8].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[8].reviewID },
            { voteType: 'upvote', voterUserID: owner1.userID, reviewID: reviews[8].reviewID },
            { voteType: 'downvote', voterUserID: owner2.userID, reviewID: reviews[8].reviewID },
            // reviews[9] → 2 upvote, 2 downvote
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[9].reviewID },
            { voteType: 'upvote', voterUserID: owner3.userID, reviewID: reviews[9].reviewID },
            { voteType: 'downvote', voterUserID: reviewer1.userID, reviewID: reviews[9].reviewID },
            { voteType: 'downvote', voterUserID: reviewer3.userID, reviewID: reviews[9].reviewID },
            // TOTALE: 6 upvote, 3 downvote = +3 score
            
            // === Ristorante 5 (Tavola Calda Segmentation Fault): MOLTO IMPOPOLARE (score -4) ===
            // reviews[10] → 1 upvote, 3 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[10].reviewID },
            { voteType: 'downvote', voterUserID: reviewer2.userID, reviewID: reviews[10].reviewID },
            { voteType: 'downvote', voterUserID: reviewer3.userID, reviewID: reviews[10].reviewID },
            { voteType: 'downvote', voterUserID: owner1.userID, reviewID: reviews[10].reviewID },
            // reviews[11] → 0 upvote, 3 downvote
            { voteType: 'downvote', voterUserID: reviewer1.userID, reviewID: reviews[11].reviewID },
            { voteType: 'downvote', voterUserID: owner2.userID, reviewID: reviews[11].reviewID },
            { voteType: 'downvote', voterUserID: owner3.userID, reviewID: reviews[11].reviewID },
            // TOTALE: 1 upvote, 6 downvote = -5 score (IL PIÙ IMPOPOLARE!)
            
            // === Ristorante 6 (Race Condition): MOLTO POPOLARE (score +5) ===
            // reviews[12] → 5 upvote, 0 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[12].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[12].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[12].reviewID },
            { voteType: 'upvote', voterUserID: owner1.userID, reviewID: reviews[12].reviewID },
            { voteType: 'upvote', voterUserID: owner2.userID, reviewID: reviews[12].reviewID },
            // reviews[13] → 2 upvote, 2 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[13].reviewID },
            { voteType: 'upvote', voterUserID: owner3.userID, reviewID: reviews[13].reviewID },
            { voteType: 'downvote', voterUserID: reviewer2.userID, reviewID: reviews[13].reviewID },
            { voteType: 'downvote', voterUserID: reviewer3.userID, reviewID: reviews[13].reviewID },
            // TOTALE: 7 upvote, 2 downvote = +5 score
            
            // === Ristorante 7 (Pizzeria Stack Overflow): MOLTO POPOLARE (score +7) ===
            // reviews[14] → 5 upvote, 0 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[14].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[14].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[14].reviewID },
            { voteType: 'upvote', voterUserID: owner1.userID, reviewID: reviews[14].reviewID },
            { voteType: 'upvote', voterUserID: owner2.userID, reviewID: reviews[14].reviewID },
            // reviews[15] → 4 upvote, 2 downvote
            { voteType: 'upvote', voterUserID: reviewer1.userID, reviewID: reviews[15].reviewID },
            { voteType: 'upvote', voterUserID: reviewer2.userID, reviewID: reviews[15].reviewID },
            { voteType: 'upvote', voterUserID: reviewer3.userID, reviewID: reviews[15].reviewID },
            { voteType: 'upvote', voterUserID: owner3.userID, reviewID: reviews[15].reviewID },
            { voteType: 'downvote', voterUserID: owner1.userID, reviewID: reviews[15].reviewID },
            { voteType: 'downvote', voterUserID: owner2.userID, reviewID: reviews[15].reviewID },
            // TOTALE: 9 upvote, 2 downvote = +7 score (SECONDO PIÙ POPOLARE!)
        ]);
        
        console.log('✅ Creati voti con distribuzione strategica:');
        console.log('   🏆 TOP 3 POPOLARI:');
        console.log('      1. Pizzeria Stack Overflow: +7 score');
        console.log('      2. Ristorante 404 Not Found: +6 score');
        console.log('      3. Trattoria Single-Threaded/Race Condition: +5 score');
        console.log('   👎 TOP 2 IMPOPOLARI:');
        console.log('      1. Tavola Calda Segmentation Fault: -5 score');
        console.log('      2. Pizzeria Callback Hell: -4 score');

        console.log('--- Seeding Completato con Successo! ---');
        
    } catch (error) {
        console.error('Errore durante il seeding del database:', error); 
    }
}

seedDatabase();
