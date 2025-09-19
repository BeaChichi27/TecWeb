import express from 'express'; // Assicurati che express sia importato
import { connect } from './database';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import reviewRoutes from './routes/reviews';
import path from 'path';
import cors from 'cors'; // Assicurati che cors sia importato

const app = express();
const port = process.env.PORT || 3000;


console.log('🔧 Configurazione middleware...');


app.use(cors({
    origin: (origin, callback) => {
        // Permetti richieste senza origin (file://, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:4200',    // Angular
            'http://localhost:5500',    // Live Server su localhost
            'http://127.0.0.1:5500',   // Live Server su 127.0.0.1
            'http://localhost:3000'     // Stesso dominio (se necessario)
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


app.use(express.json({ limit: '10mb' }));

// NUOVA RIGA: Servi i file statici dalla cartella 'public'
app.use(express.static(path.join(__dirname, '../public')));


app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// AGGIUNTO: Middleware per loggare tutte le richieste
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});


console.log('🛤️  Registrazione delle route...');


app.use('/api/auth', authRoutes);
console.log('   ✅ Route autenticazione: /api/auth/*');


app.use('/api/restaurants', restaurantRoutes);
console.log('   ✅ Route ristoranti: /api/restaurants/*');


app.use('/api/reviews', reviewRoutes);
console.log('   ✅ Route recensioni: /api/reviews/*');


app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FAKERESTAURANT API è operativa',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/register, /api/auth/login',
      restaurants: '/api/restaurants (GET, POST, DELETE)',
      reviews: '/api/reviews (GET, POST, DELETE)',
      health: '/api/health'
    }
  });
});



app.post('/api/test/echo', (req, res) => {
  console.log('📨 Test POST ricevuto:', req.body);
  res.json({
    message: '✅ POST funziona correttamente!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});


app.post('/api/test/register', (req, res) => {
  console.log('👤 Test registrazione:', req.body);
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({
      error: '❌ Dati mancanti',
      required: ['username', 'email', 'password'],
      received: req.body
    });
  }
  
  res.json({
    message: '✅ Dati di registrazione validi!',
    data: { username, email, password: '***hidden***' }
  });
});


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


async function startServer() {
  try {
    console.log('\n🚀 AVVIO FAKERESTAURANT API SERVER...\n');
    
    
    console.log('💾 Connessione al database SQLite...');
    await connect();
    console.log('   ✅ Database connesso e sincronizzato!\n');
    
    
    app.listen(port, () => {
      console.log(`✅ Server in esecuzione su http://localhost:${port}`); 
    });
    
  } catch (error) {
    console.error('❌ ERRORE FATALE: Impossibile avviare il server');
    console.error(error);
    process.exit(1);
  }
}


process.on('SIGINT', () => {
  console.log('\n👋 Spegnimento server in corso...');
  console.log('✅ Server spento correttamente');
  process.exit(0);
});


startServer();
