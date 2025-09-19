/*
database.ts
UTILITA DEL FILE: Struttura del database usando Sequelize con SQLite
*/

import { Sequelize } from 'sequelize';

/* Importazione dei modelli per definire le tabelle del database */
import User from './models/user';
import Restaurant from './models/restaurant';
import Review from './models/review';
import Vote from './models/vote';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false // Disabilita i log SQL per ora
});

/*
Funzione per connettersi al database e verificare la connessione
*/
export async function connect() {
  try {
    await sequelize.authenticate();
    console.log('Connessione stabilita.');

    await sequelize.sync({ force: false });
    console.log('Tutti i modelli sono stati sincronizzati!');
  } catch (error) {
    console.error('Impossibile connettersi al database:', error);
    throw error; // Importante: rilancia l'errore
  }
}

export default sequelize;