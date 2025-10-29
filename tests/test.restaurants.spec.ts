import { test, expect } from '@playwright/test';

/**
 * Test suite per la gestione dei ristoranti
 * - Visualizzazione lista ristoranti
 * - Ricerca ristoranti
 * - Visualizzazione dettagli ristorante
 * C'è un totale di 3 test
 */

const BASE_URL = 'http://localhost:4200';

// Costanti per rendere i test più leggibili e manutenibili
const SEARCH_TERM = 'Pizza';
const KNOWN_RESTAURANT_NAME = 'Pizzeria Callback Hell';

test.describe('Gestione Ristoranti', () => {
  
  test.beforeEach(async ({ page }) => {
    // Assicura che ogni test parta dalla pagina principale
    await page.goto(BASE_URL);
  });

  test('Visualizzazione lista ristoranti e conteggio', async ({ page }) => {
    await test.step('1. Naviga alla pagina ristoranti', async () => {
      // Clicca sul link di navigazione per accedere alla lista dei ristoranti
      await page.click('a[href="/restaurants"]');
      // Verifica che l'URL corrisponda alla pagina dei ristoranti
      await expect(page).toHaveURL(`${BASE_URL}/restaurants`);
    });

    await test.step('2. Verifica che la lista sia visibile e non vuota', async () => {
      // Seleziona il contenitore principale della lista
      const restaurantListContainer = page.locator('.restaurants-list, .restaurant-grid');
      // Assicura che il contenitore sia effettivamente visibile nella pagina
      await expect(restaurantListContainer).toBeVisible();

      // Seleziona tutte le card dei ristoranti usando selettori comuni
      const restaurantCards = page.locator('.restaurant-card, .restaurant-item');
      
      // Conta il numero di ristoranti visualizzati
      const count = await restaurantCards.count();
      // Verifica che ci sia almeno un ristorante nella lista
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Ricerca e filtraggio dei ristoranti', async ({ page }) => {
    await test.step('1. Naviga alla pagina ristoranti', async () => {
      await page.goto(`${BASE_URL}/restaurants`);
      await expect(page).toHaveURL(`${BASE_URL}/restaurants`);
    });

    await test.step('2. Inserisci un termine di ricerca e attendi i risultati', async () => {
      // Compila il campo di ricerca con un termine noto
      await page.fill('input[type="search"], input[placeholder*="erca"]', SEARCH_TERM);
      
      // Attende un breve periodo per permettere al debounce di eseguire la ricerca
      await page.waitForTimeout(500);
    });
    
    await test.step('3. Verifica i risultati filtrati', async () => {
      const filteredCards = page.locator('.restaurant-card, .restaurant-item');
      
      // Verifica che la ricerca abbia prodotto almeno un risultato
      const count = await filteredCards.count();
      expect(count).toBeGreaterThan(0);

      // Controlla che il primo risultato contenga il termine cercato, ignorando maiuscole/minuscole
      await expect(filteredCards.first()).toContainText(SEARCH_TERM, { ignoreCase: true });
    });
  });

  test('Visualizzazione dettagli ristorante', async ({ page }) => {
    let restaurantName: string;

    await test.step('1. Naviga alla lista ristoranti', async () => {
      await page.goto(`${BASE_URL}/restaurants`);
    });

    await test.step('2. Clicca sul primo ristorante e salva il suo nome', async () => {
      const firstCard = page.locator('.restaurant-card, .restaurant-item').first();
      
      // Estrae e salva il nome del ristorante dalla card per confrontarlo dopo
      restaurantName = await firstCard.locator('h3').textContent() || 'Nome non trovato';

      // Clicca sulla card per navigare alla pagina dei dettagli
      await firstCard.click();
    });

    await test.step('3. Verifica il reindirizzamento ai dettagli e i contenuti', async () => {
      await expect(page).not.toHaveURL(`${BASE_URL}/restaurants`);
      // Verifica che l'URL segua il pattern dei dettagli (es. /restaurants/123)
      await expect(page).toHaveURL(/restaurants\/\d+|restaurants\/[a-zA-Z0-9-]+/); 

      // Controlla che il titolo della pagina corrisponda al nome del ristorante cliccato
      await expect(page.locator('h1.restaurant-name')).toHaveText(restaurantName); 
      
      // Verifica che la descrizione del ristorante sia visibile
      await expect(page.locator('.restaurant-description')).toBeVisible();

      // Verifica la presenza della sezione dedicata alle recensioni
      await expect(page.locator('h2', { hasText: 'Recensioni' })).toBeVisible();

      // Verifica che il contenitore della mappa (es. Leaflet) sia presente
      await expect(page.locator('#map-container, .map-section')).toBeVisible();
    });
  });
});