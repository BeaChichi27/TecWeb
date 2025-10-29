import { test, expect } from '@playwright/test';

/**
 * Test per le funzionalità del profilo utente
 * - Visualizzazione dati utente
 * - Gestione del pop-up per utenti senza recensioni
 * C'è un totale di 2 test
 */

const BASE_URL = 'http://localhost:4200';

// Credenziali di un utente specifico per i test del profilo
const TEST_CREDENTIALS = {
  email: 'mario@example.com', // Utente con 0 recensioni per testare il pop-up
  password: 'Password123!',
  emptyReviewMessage: 'Non hai ancora scritto alcuna recensione.',
};


test.describe('Profilo Utente', () => {

  // Esegue il login prima di ogni test di questa suite
  test.beforeEach(async ({ page }) => {
    await test.step('1. Esegui il Login', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
      await page.click('button[type="submit"]');
      
      // Attende il reindirizzamento alla pagina del profilo
      await page.waitForURL(`${BASE_URL}/profile`);
      await expect(page).toHaveURL(`${BASE_URL}/profile`);
    });
  });

  test('Visualizzazione corretta del profilo utente', async ({ page }) => {
    // Il beforeEach ci ha già portati sulla pagina del profilo
    await test.step('Verifica elementi chiave del profilo', async () => {
      // Controlla che il titolo principale sia visibile
      await expect(page.locator('h1', { hasText: 'Il mio Profilo' })).toBeVisible();
      
      // Verifica che l'email dell'utente loggato sia mostrata correttamente
      await expect(page.locator('text=' + TEST_CREDENTIALS.email)).toBeVisible();

      // Controlla la presenza delle tab per ristoranti e recensioni
      await expect(page.locator('button', { hasText: 'I miei ristoranti' })).toBeVisible();
      await expect(page.locator('button', { hasText: 'Le mie recensioni' })).toBeVisible();
    });
  });

  test('Visualizzazione pop-up per utente senza recensioni', async ({ page }) => {
    
    await test.step('1. Clicca sulla tab "Le mie recensioni"', async () => {
      // Simula il click dell'utente sulla tab delle recensioni
      await page.locator('button', { hasText: 'Le mie recensioni' }).click();
    });

    await test.step('2. Verifica che il pop-up di stato vuoto sia visibile', async () => {
      // Seleziona il pop-up (flashcard) che appare quando non ci sono recensioni
      const emptyStatePopup = page.locator('.no-reviews-popup, .empty-state-popup');
      
      // Verifica che il pop-up sia visibile
      await expect(emptyStatePopup).toBeVisible();
      // Controlla che il messaggio sia quello atteso
      await expect(emptyStatePopup).toContainText(TEST_CREDENTIALS.emptyReviewMessage);
    });

    await test.step('3. Chiudi il pop-up e verifica che scompaia', async () => {
      const closeButton = page.locator('.no-reviews-popup .close-btn, .empty-state-popup .close');
      await closeButton.click();

      // Verifica che il pop-up non sia più visibile dopo il click sul pulsante di chiusura
      await expect(page.locator('.no-reviews-popup, .empty-state-popup')).not.toBeVisible();
    });
  });
});