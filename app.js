// Frequenza di aggiornamento in millisecondi
const FREQ = 1000 * 60 * 60 * 24;

// Registra eventi
window.addEventListener('load', async () => {
  try {
    // Registra il Service Worker per supportare contenuti offline
    await registerServiceWorker();

    // Carica il database delle citazioni e aggiorna l'interfaccia utente
    const quotes = await loadQuoteDatabase('./quotes.json');
    updateQuote(quotes);
  } catch (error) {
    console.error('[FORTUNE-JS] Errore durante l\'inizializzazione:', error);
  }
});

// Carica il database delle citazioni
async function loadQuoteDatabase(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Errore nel caricamento delle citazioni: ${response.statusText}`);
    }
    const quotes = await response.json();
    // Calcola il giorno corrente per determinare il seed
    const dayNumber = Math.floor(Date.now() / FREQ);
    return shuffleArray(quotes, dayNumber);
  } catch (error) {
    console.error('[FORTUNE-JS] Errore durante il caricamento del database:', error);
    throw error;
  }
}

// Generatore di numeri pseudo-casuali con seed
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Mescola un array usando l'algoritmo Fisher-Yates con seed deterministico
function shuffleArray(array, seed) {
  const shuffled = [...array];
  const random = seededRandom(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Registra il Service Worker per gestire contenuti offline
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js');
      console.log('[FORTUNE-JS] Service Worker registrato con successo.');
    } catch (error) {
      console.error('[FORTUNE-JS] Registrazione del Service Worker fallita:', error);
      alert('Registrazione del Service Worker fallita. Mi dispiace.');
    }
  } else {
    console.warn('[FORTUNE-JS] ERRORE: Service Worker NON supportato.');
  }
}

// Seleziona e visualizza una nuova citazione
function updateQuote(quotes) {
  try {
    // Seleziona un indice di citazione dal database
    const t = Math.floor(Date.now() / FREQ);
    const index = (t * 13) % quotes.length;
    console.log(`[FORTUNE-JS] Tempo: ${t}, citazione: ${index} di ${quotes.length}`);

    // Recupera la citazione dal database
    const q = quotes[index];

    // Aggiorna l'interfaccia utente
    document.getElementById('text').innerHTML = `“${q.text}”`;
    document.getElementById('author').innerHTML = q.author || 'Anonimo';

    // Calcola il ritardo fino al prossimo aggiornamento
    const nextUpdate = FREQ - (Date.now() % FREQ);
    console.log(`[FORTUNE-JS] Prossimo aggiornamento tra ${Math.floor(nextUpdate / (1000 * 60))} minuti`);

    // Imposta il trigger per il prossimo aggiornamento
    setTimeout(() => updateQuote(quotes), nextUpdate);
  } catch (error) {
    console.error('[FORTUNE-JS] Errore durante l\'aggiornamento della citazione:', error);
  }
}
