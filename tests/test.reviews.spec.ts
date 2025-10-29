import { test, expect } from '@playwright/test';

/**
 * Test suite per la gestione delle recensioni
 * - Visualizzazione recensioni di un ristorante
 * - Voto (upvote/downvote) di una recensione
 * C'è un totale di 2 test
 */

const BASE_URL = 'http:localhost:4200';


const VOTER_CREDENTIALS = {
  email: 'mario@example.com',
  password: 'Password123!',
};

test.describe('Gestione Recensioni', () => {

  // Esegue il login prima di ogni test per garantire uno stato autenticato
  test.beforeEach(async ({ page }) => {
    // Naviga direttamente alla pagina di login
    await page.goto(`${BASE_URL}/login`);
    // Compila i campi con le credenziali di test
    await page.fill('input[type="email"]', VOTER_CREDENTIALS.email);
    await page.fill('input[type="password"]', VOTER_CREDENTIALS.password);
    // Invia il form per effettuare il login
    await page.click('button[type="submit"]');
    
    // Attende il reindirizzamento alla pagina del profilo per assicurarsi che il login sia completato
    await page.waitForURL(`${BASE_URL}/profile`); 
  });
  
  test('Visualizzazione recensioni di un ristorante', async ({ page }) => {
    
    await test.step('1. Naviga a un ristorante (dalla lista)', async () => {
      await page.goto(`${BASE_URL}/restaurants`);
      
      // Clicca sulla prima card per accedere alla pagina dei dettagli
      await page.locator('.restaurant-card, .restaurant-item').first().click();
      
      // Verifica che il titolo del ristorante sia visibile, confermando il corretto reindirizzamento
      await expect(page.locator('h1.restaurant-name')).toBeVisible(); 
    });

    await test.step('2. Verifica la visibilità della sezione recensioni', async () => {
      // Controlla che il contenitore principale delle recensioni esista e sia visibile
      const reviewsSection = page.locator('.reviews-list, #reviews-section');
      await expect(reviewsSection).toBeVisible();

      // Verifica che almeno una card di recensione sia presente
      const reviewCards = page.locator('.review-card, .review-item');
      await expect(reviewCards.first()).toBeVisible();
      
      // Controlla gli elementi essenziali della prima recensione (autore, rating, testo)
      const firstReview = reviewCards.first();
      await expect(firstReview.locator('.review-author, .author-name')).toBeVisible();
      await expect(firstReview.locator('.review-rating, .star-rating')).toBeVisible();
      await expect(firstReview.locator('.review-comment, .comment-text')).toBeVisible();
    });
  });

  test('Upvote e Downvote di una recensione', async ({ page }) => {
    let initialVotes: number;
    // Selettori riutilizzabili per migliorare la manutenibilità
    const reviewSelector = '.review-card, .review-item';
    const upvoteBtnSelector = '.upvote-btn, .vote-up';
    const downvoteBtnSelector = '.downvote-btn, .vote-down';
    const voteCountSelector = '.vote-count, .score';

    await test.step('1. Naviga a un ristorante e seleziona una recensione', async () => {
      // Va alla lista dei ristoranti
      await page.goto(`${BASE_URL}/restaurants`);
      // Accede ai dettagli del primo ristorante
      await page.locator('.restaurant-card, .restaurant-item').first().click();
      // Assicura che ci sia almeno una recensione su cui votare
      expect(await page.locator(reviewSelector).count()).toBeGreaterThan(0);
    });

    const firstReview = page.locator(reviewSelector).first();
    const voteCount = firstReview.locator(voteCountSelector);

    await test.step('2. Esegui upvote e verifica il cambiamento', async () => {
      // Salva il conteggio iniziale dei voti per il confronto
      initialVotes = parseInt(await voteCount.textContent() || '0', 10);
      
      const upvoteButton = firstReview.locator(upvoteBtnSelector);

      // Simula il click sul pulsante "upvote"
      await upvoteButton.click();
      
      // Verifica che il conteggio dei voti sia aumentato esattamente di 1
      await expect(voteCount).toHaveText(String(initialVotes + 1));
    });

    await test.step('3. Esegui downvote e verifica il ripristino/cambio', async () => {
      const downvoteButton = firstReview.locator(downvoteBtnSelector);

      // Simula il click sul pulsante "downvote"
      await downvoteButton.click();
      
      // Logica di voto: un downvote dopo un upvote rimuove l'upvote (+1) e applica il downvote (-1),
      // risultando in un punteggio di -2 rispetto allo stato post-upvote, ovvero initialVotes - 1.
      await expect(voteCount).toHaveText(String(initialVotes - 1));
      
      // Test aggiuntivo: clicca di nuovo upvote per annullare il downvote
      await firstReview.locator(upvoteBtnSelector).click();
      // Il punteggio dovrebbe tornare allo stato iniziale (voto neutro)
      await expect(voteCount).toHaveText(String(initialVotes));
    });
  });
});