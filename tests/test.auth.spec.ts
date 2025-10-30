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
  username: 'mario_rossi',
  password: 'password123',
};

// Credenziali per un utente che NON esiste o con password errata
const INVALID_CREDENTIALS = {
  username: 'wrong_user',
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
      // Inserisce username e password valide
      await page.fill('input[placeholder*="username" i], input[placeholder*="nome" i]', VALID_CREDENTIALS.username);
      await page.fill('input[type="password"]', VALID_CREDENTIALS.password);
      // Clicca sul pulsante di submit per inviare le credenziali
      await page.click('button[type="submit"]');
    });

    await test.step('3. Verifica successo e reindirizzamento', async () => {
      // L'app reindirizza a /restaurants dopo il login, quindi verifichiamo quello
      await page.waitForURL(`${BASE_URL}/restaurants`);
      // Verifica che l'URL finale sia corretto
      await expect(page).toHaveURL(`${BASE_URL}/restaurants`); 
      
      // Verifica che il token sia stato salvato nel sessionStorage (non localStorage!)
      const token = await page.evaluate(() => sessionStorage.getItem('token'));
      expect(token).not.toBeNull();

      // Verifica che l'utente sia loggato verificando la presenza dello username nella navbar
      const usernameInNav = page.locator('.user-name, .username').first();
      await expect(usernameInNav).toBeVisible();
    });
  });

  test('Login con credenziali invalide: messaggio di errore', async ({ page }) => {
    await test.step('1. Naviga alla pagina di Login', async () => {
      await page.goto(`${BASE_URL}/login`);
    });

    await test.step('2. Compila e invia il form con dati errati', async () => {
      await page.fill('input[placeholder*="username" i], input[placeholder*="nome" i]', INVALID_CREDENTIALS.username);
      await page.fill('input[type="password"]', INVALID_CREDENTIALS.password);
      await page.click('button[type="submit"]');
    });

    await test.step('3. Verifica la permanenza sulla pagina e il messaggio di errore', async () => {
      // L'URL non deve cambiare dopo un tentativo di login fallito
      await expect(page).toHaveURL(`${BASE_URL}/login`);

      // Verifica che un messaggio di errore sia mostrato all'utente
      const errorPopup = page.locator('.error-message, .toast-error, .alert-danger');
      await expect(errorPopup).toBeVisible();
      await expect(errorPopup).toContainText('Nome utente o password non validi');

      // Controlla che il token non sia stato salvato nel sessionStorage
      const token = await page.evaluate(() => sessionStorage.getItem('token'));
      expect(token).toBeNull();
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
    // con il parametro returnUrl che indica dove tornare dopo il login
    await expect(page).toHaveURL(/\/login(\?returnUrl=.*)?/);
  });
});

  test('Login con credenziali invalide: mostra messaggio di errore', async ({ page }) => {
    
    await test.step('1. Naviga e compila con credenziali errate', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[placeholder*="username" i], input[placeholder*="nome" i]', INVALID_CREDENTIALS.username);
      await page.fill('input[type="password"]', INVALID_CREDENTIALS.password);
    });

    await test.step('2. Invia il form e verifica il fallimento', async () => {
      await page.click('button[type="submit"]');
      
      // Asserzione critica 1: L'URL DEVE rimanere sulla pagina di login
      await expect(page).toHaveURL(`${BASE_URL}/login`); 

      // Asserzione critica 2: DEVE apparire un messaggio di errore
      await expect(page.locator('.error-message')).toBeVisible();
      await expect(page.locator('.error-message')).toContainText(/nome utente o password non validi/i);
    });
  });
});