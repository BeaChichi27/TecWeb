import express from 'express';
import { connect } from './database';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import reviewRoutes from './routes/reviews';
import voteRoutes from './routes/votes';
import path from 'path';
import cors from 'cors'; 

const app = express();
const port = process.env.PORT || 3000;

console.log('🔧 Configurazione middleware...');

/**
 * Configurazione CORS (Cross-Origin Resource Sharing)
 * Permette le richieste solo da origini specifiche per motivi di sicurezza.
 * Le origini consentite includono il frontend Angular e gli ambienti di sviluppo locali.
 */
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:4200',    // Frontend Angular
            'http://localhost:5500',    // Live Server
            'http://127.0.0.1:5500',    // Live Server (IP alternativo)
            'http://localhost:3000'     // Backend stesso (per test)
        ];
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            console.log('Origin non permesso:', origin);
            return callback(new Error('Non permesso da CORS'), false);
        }
    },
    credentials: true
}));

/**
 * Middleware per il parsing del body delle richieste JSON.
 * Limite di 10MB per gestire anche immagini in base64 se necessario.
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Serve i file statici dalla cartella public (es. HTML, CSS, JS del frontend).
 */
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Middleware per il parsing di dati URL-encoded (form HTML).
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Serve immagini caricate dagli utenti dalla cartella uploads.
 * Le immagini sono accessibili tramite URL come: http://localhost:3000/uploads/nome-file.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Middleware di logging per tutte le richieste HTTP.
 * Stampa il metodo, percorso e body di ogni richiesta in console per debug.
 */
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

console.log('🛤️  Registrazione delle route...');

/**
 * Route per l'autenticazione utente.
 * Gestisce la registrazione, il login e le operazioni relative al profilo utente.
 * Base path: /api/auth
 */
app.use('/api/auth', authRoutes);
console.log('   ✅ Route autenticazione: /api/auth/*');

/**
 * Route per la gestione dei ristoranti.
 * Permette di creare, visualizzare, cercare ed eliminare ristoranti.
 * Base path: /api/restaurants
 */
app.use('/api/restaurants', restaurantRoutes);
console.log('   ✅ Route ristoranti: /api/restaurants/*');

/**
 * Route per la gestione delle recensioni.
 * Permette di creare, visualizzare ed eliminare recensioni sui ristoranti.
 * Base path: /api/reviews
 */
app.use('/api/reviews', reviewRoutes);
console.log('   ✅ Route recensioni: /api/reviews/*');

/**
 * Route per la gestione dei voti sulle recensioni.
 * Permette di votare (upvote/downvote) le recensioni degli altri utenti.
 * Base path: /api/votes
 */
app.use('/api/votes', voteRoutes);
console.log('   ✅ Route voti: /api/votes/*');

/**
 * GET /api/health
 * Endpoint di health check per verificare lo stato del server.
 * Restituisce informazioni sullo stato dell'API e gli endpoint disponibili.
 * 
 * @returns {Object} Stato del server e lista degli endpoint disponibili
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FAKERESTAURANT API è operativa',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/register, /api/auth/login',
      restaurants: '/api/restaurants (GET, POST, DELETE)',
      reviews: '/api/reviews (GET, POST, DELETE)',
      votes: '/api/votes (GET, POST, DELETE)',
      health: '/api/health'
    }
  });
});

/**
 * Middleware di gestione errori 404 - Route non trovata.
 * Questo middleware viene eseguito quando nessuna route precedente ha gestito la richiesta.
 * Restituisce un messaggio di errore con la lista degli endpoint disponibili.
 * 
 * @param {Object} req - Oggetto richiesta Express
 * @param {Object} res - Oggetto risposta Express
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint non trovato',
    requestedPath: req.originalUrl,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/restaurants',
      'POST /api/restaurants',
      'GET /api/restaurants/:id',
      'DELETE /api/restaurants/:id',
      'POST /api/reviews',
      'DELETE /api/reviews/:id',
      'POST /api/reviews/:id/vote'
    ]
  });
});

/**
 * Funzione principale per avviare il server.
 * Esegue in sequenza:
 * 1. Connessione al database SQLite
 * 2. Sincronizzazione dei modelli con il database
 * 3. Avvio del server Express sulla porta specificata
 * 
 * In caso di errore fatale durante l'avvio, il processo viene terminato.
 * 
 * @async
 * @throws {Error} Se la connessione al database o l'avvio del server falliscono
 */
async function startServer() {
  try {
    console.log('\n🚀 AVVIO FAKERESTAURANT API SERVER...\n');
    
    // Connessione e sincronizzazione del database
    console.log('💾 Connessione al database SQLite...');
    await connect();
    console.log('   ✅ Database connesso e sincronizzato!\n');
    
    // Avvio del server Express
    app.listen(port, () => {
      console.log(`✅ Server in esecuzione su http://localhost:${port}`); 
    });
    
  } catch (error) {
    console.error('❌ ERRORE FATALE: Impossibile avviare il server');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Gestione del segnale SIGINT (Ctrl+C).
 * Permette una chiusura pulita del server quando viene interrotto manualmente.
 * Utile per chiudere connessioni aperte e liberare risorse prima di terminare il processo.
 */
process.on('SIGINT', () => {
  console.log('\n👋 Spegnimento server in corso...');
  console.log('✅ Server spento correttamente');
  process.exit(0);
});

// Avvio del server
startServer();
