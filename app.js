// Frequenza di aggiornamento in millisecondi
const FREQ = 1000 * 60 * 60 * 24;

// Mostra toast notification
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Carica html2canvas se necessario
async function loadHtml2Canvas() {
  // Se già caricato, ritorna immediatamente
  if (typeof html2canvas !== 'undefined') {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // Rimuovi lo script dopo il caricamento per mantenere il DOM pulito
      script.remove();
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('Impossibile caricare html2canvas'));
    };
    document.head.appendChild(script);
  });
}

// Nascondi/mostra elementi per la cattura
function toggleElementsForCapture(hide) {
  const shareButton = document.getElementById('shareButton');
  const toast = document.getElementById('toast');
  
  if (shareButton) {
    shareButton.style.display = hide ? 'none' : '';
  }
  if (toast) {
    toast.style.display = hide ? 'none' : '';
  }
}

// Cattura screenshot della pagina
async function captureScreenshot() {
  try {
    // Carica html2canvas se necessario
    await loadHtml2Canvas();
    
    // Nascondi elementi temporaneamente
    toggleElementsForCapture(true);
    
    // Cattura la pagina
    const canvas = await html2canvas(document.body, {
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      scale: 2, // Alta qualità
      logging: false,
      useCORS: true
    });
    
    // Ripristina la visibilità
    toggleElementsForCapture(false);
    
    // Converti canvas in blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Impossibile creare il blob dall\'immagine'));
        }
      }, 'image/png');
    });
  } catch (error) {
    // Assicurati di ripristinare la visibilità in caso di errore
    toggleElementsForCapture(false);
    throw error;
  }
}

// Condividi citazione come screenshot
async function shareQuote() {
  const textElement = document.getElementById('text');
  const authorElement = document.getElementById('author');
  
  if (!textElement || !authorElement) return;
  
  const quoteText = textElement.textContent;
  const quoteAuthor = authorElement.textContent;
  const shareText = `${quoteText}\n\n— ${quoteAuthor}`;
  
  try {
    // Cattura screenshot
    const screenshot = await captureScreenshot();
    
    // Crea un file dall'immagine
    const file = new File([screenshot], 'fortune-quote.png', { type: 'image/png' });
    
    // Prova a condividere con Web Share API (con supporto file)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Fortune - Citazione del giorno',
          text: shareText
        });
        showToast('✓ Condiviso!');
      } catch (error) {
        // Utente ha annullato la condivisione
        if (error.name !== 'AbortError') {
          console.error('[FORTUNE-JS] Errore durante la condivisione:', error);
          // Fallback a download
          downloadScreenshot(screenshot);
        }
      }
    } else if (navigator.share) {
      // Fallback: condividi solo testo se file sharing non supportato
      try {
        await navigator.share({
          title: 'Fortune - Citazione del giorno',
          text: shareText,
          url: window.location.href
        });
        showToast('✓ Condiviso!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('[FORTUNE-JS] Errore durante la condivisione:', error);
        }
      }
    } else {
      // Fallback finale: scarica l'immagine
      downloadScreenshot(screenshot);
    }
  } catch (error) {
    console.error('[FORTUNE-JS] Errore durante la cattura dello screenshot:', error);
    showToast('✗ Errore durante la cattura dello screenshot');
  }
}

// Scarica screenshot come fallback
function downloadScreenshot(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fortune-quote.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('✓ Screenshot salvato!');
}

// Registra eventi
window.addEventListener('load', async () => {
  try {
    // Aggiungi listener per il pulsante di condivisione
    const shareButton = document.getElementById('shareButton');
    if (shareButton) {
      shareButton.addEventListener('click', shareQuote);
    }
    
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
