import { test, expect } from '@playwright/test';

/**
 * Test suite per i flussi di autenticazione
 * - Login con credenziali valide/invalide
 * - Accesso protetto alle pagine
 * C'è un totale di 3 test
 */

const BASE_URL = 'http://localhost:4200';

// Credenziali per un utente che esiste nel database di test
const VALID_CREDENTIALS = {
  email: 'mario@example.com',
  password: 'Password123!',
};

// Credenziali per un utente che NON esiste o con password errata
const INVALID_CREDENTIALS = {
  email: 'wrong@example.com',
  password: 'WrongPassword',
};


test.describe('Flussi di Autenticazione', () => {
  
  test.beforeEach(async ({ page }) => {
    // Assicura che ogni test parta dalla pagina principale
    await page.goto(BASE_URL);
  });

  test('Login con credenziali valide: reindirizzamento al profilo', async ({ page }) => {
    await test.step('1. Naviga alla pagina di Login', async () => {
      // Clicca sul link 'Accedi' per andare al form di login
      await page.click('a[href="/login"]'); 
      // Verifica che l'URL sia corretto
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    await test.step('2. Compila e invia il form', async () => {
      // Inserisce email e password valide
      await page.fill('input[type="email"]', VALID_CREDENTIALS.email);
      await page.fill('input[type="password"]', VALID_CREDENTIALS.password);
      // Clicca sul pulsante di submit per inviare le credenziali
      await page.click('button[type="submit"]');
    });

    await test.step('3. Verifica successo e reindirizzamento al profilo', async () => {
      // Attende che l'URL diventi quello del profilo dopo il login
      await page.waitForURL(`${BASE_URL}/profile`);
      // Verifica che l'URL finale sia corretto
      await expect(page).toHaveURL(`${BASE_URL}/profile`); 
      
      // Controlla che il titolo della pagina del profilo sia visibile
      await expect(page.locator('h1', { hasText: 'Il mio Profilo' })).toBeVisible();

      // Verifica che nella navbar sia apparso il link di logout, confermando lo stato di login
      await expect(page.locator('a[href="/logout"]')).toBeVisible(); 
    });
  });

  test('Login con credenziali invalide: messaggio di errore', async ({ page }) => {
    await test.step('1. Naviga alla pagina di Login', async () => {
      await page.goto(`${BASE_URL}/login`);
    });

    await test.step('2. Compila e invia il form con dati errati', async () => {
      await page.fill('input[type="email"]', INVALID_CREDENTIALS.email);
      await page.fill('input[type="password"]', INVALID_CREDENTIALS.password);
      await page.click('button[type="submit"]');
    });

    await test.step('3. Verifica la permanenza sulla pagina e il messaggio di errore', async () => {
      // L'URL non deve cambiare dopo un tentativo di login fallito
      await expect(page).toHaveURL(`${BASE_URL}/login`);

      // Verifica che un messaggio di errore sia mostrato all'utente
      const errorPopup = page.locator('.error-message, .toast-error, .alert-danger');
      await expect(errorPopup).toBeVisible();
      await expect(errorPopup).toContainText('Credenziali non valide');

      // Controlla che il token non sia stato salvato nel localStorage
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeFalsy();
    });
  });

  test('Accesso negato a pagine protette senza autenticazione', async ({ page }) => {
    await test.step('1. Pulisci lo stato di autenticazione', async () => {
      // Assicura che non ci sia un token residuo da test precedenti
      await page.evaluate(() => localStorage.clear());
    });

    await test.step('2. Tenta di accedere a una pagina protetta', async () => {
      // Prova a navigare direttamente all'URL del profilo
      await page.goto(`${BASE_URL}/profile`);
    });

  await test.step('3. Verifica il reindirizzamento alla pagina di login', async () => {
    // L'AuthGuard dovrebbe reindirizzare l'utente non autenticato alla pagina di login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });
});

  test('Login con credenziali invalide: mostra messaggio di errore', async ({ page }) => {
    
    await test.step('1. Naviga e compila con credenziali errate', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', INVALID_CREDENTIALS.email);
      await page.fill('input[type="password"]', INVALID_CREDENTIALS.password);
    });

    await test.step('2. Invia il form e verifica il fallimento', async () => {
      await page.click('button[type="submit"]');
      
      // Asserzione critica 1: L'URL DEVE rimanere sulla pagina di login
      await expect(page).toHaveURL(`${BASE_URL}/login`); 

      // Asserzione critica 2: DEVE apparire un messaggio di errore
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('.error-message')).toContainText(/credenziali non valide|errore di login/i);
    });
  });

  test('Accesso negato a pagine protette senza autenticazione', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`); 

    await test.step('1. Prova ad accedere alla pagina /profile direttamente', async () => {
      await page.goto(`${BASE_URL}/profile`);
    });

    await test.step('2. Verifica il redirect automatico alla pagina di login', async () => {
      // Il router guard dovrebbe intercettare la richiesta e reindirizzare
      await page.waitForURL(`${BASE_URL}/login`);
      await expect(page).toHaveURL(`${BASE_URL}/login`);
      
      await expect(page.locator('button[type="submit"]', { hasText: 'Accedi' })).toBeVisible();
    });
  });
});