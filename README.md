# FAKERESTAURANT - Progetto di Tecnologie Web

**FAKERESTAURANT** è una piattaforma satirica che permette agli utenti di inventare ristoranti immaginari e scrivere recensioni umoristiche, creando una parodia divertente dei classici siti di recensioni gastronomiche.

---

## Struttura e Artefatti del Progetto

Il progetto è un'applicazione full-stack organizzata in due directory principali.

### 1. `/frontend`
Questa directory contiene tutti i file sorgente e gli artefatti necessari per l'esecuzione del client (l'interfaccia utente).

-   **Artefatti Sorgente**: Il codice sorgente dell'applicazione Angular si trova in `frontend/src/`.
-   **Componenti Principali**:
    -   `app/components`: Contiene i componenti Angular che definiscono le varie sezioni dell'interfaccia (autenticazione, ristoranti, recensioni).
    -   `app/services`: Contiene i servizi che gestiscono la logica di business e le chiamate HTTP al backend.
    -   `app/models`: Contiene i modelli TypeScript che definiscono la struttura dei dati (es. `Restaurant`, `User`).
-   **Artefatti di Build**: Eseguendo il comando `ng build`, Angular compila il codice sorgente e genera gli artefatti di produzione (file HTML, CSS, JS ottimizzati) nella cartella `frontend/dist/`.

### 2. `/backend`
Questa directory contiene tutti i file sorgente e gli artefatti per l'esecuzione del server (l'API REST).

-   **Artefatti Sorgente**: Il codice sorgente del server Node.js/Express si trova in `backend/src/`.
-   **Componenti Principali**:
    -   `src/server.ts`: File principale che avvia il server Express.
    -   `src/routes`: Definisce tutti gli endpoint dell'API (es. `/api/restaurants`, `/api/auth`).
    -   `src/models`: Contiene i modelli Sequelize che definiscono le tabelle del database.
    -   `src/database.ts`: Gestisce la connessione e l'inizializzazione del database.
-   **Artefatti Generati**:
    -   `uploads/`: Directory in cui vengono salvate le immagini caricate dagli utenti per i ristoranti.
    -   `database.sqlite` (nella root): File del database SQLite generato al primo avvio se non esiste.

### 3. `/tests`
Questa directory contiene gli script per i test End-to-End (E2E) realizzati con Playwright. Ogni file `*.spec.ts` rappresenta una suite di test per una specifica funzionalità dell'applicazione.

---

## Tecnologie Utilizzate

-   **Front-end**: Angular, TypeScript, SCSS, Playwright, Leaflet.
-   **Back-end**: Node.js, Express.js, Sequelize, JWT, Multer.

---

## Guida all'Installazione e Configurazione

**Prerequisiti**: Node.js e npm.

### 1. Installazione Dipendenze

```bash
# Installa le dipendenze del backend
cd backend
npm install

# Torna alla root, poi installa le dipendenze del frontend
cd ../frontend
npm install
```

### 2. Configurazione Backend

Nella cartella `backend`, copia il file `.env.example` in un nuovo file `.env` e inserisci i valori richiesti.

```bash
# Esegui dalla cartella 'backend'
cp .env.example .env
```

**Esempio di configurazione `.env`:**
```env
PORT=3000
JWT_SECRET=chiave_segretissima 
DB_STORAGE=../database.sqlite
```

# Esempio più esplicito per la JWT_SECRET: JWT_SECRET=ABBASSISSIMO_GLOVO

---

### 1. Avvia il Backend

```bash
# Dalla cartella 'backend'
npm start
```
Il server si avvierà su `http://localhost:3000` e inizializzerà il database.

### 2. Avvia il Frontend

```bash
# Dalla cartella 'frontend'
npm start
```
L'applicazione sarà accessibile su `http://localhost:4200`.

---