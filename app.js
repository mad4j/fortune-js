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

// Crea immagine della citazione
async function createQuoteImage() {
  const textElement = document.getElementById('text');
  const authorElement = document.getElementById('author');
  
  if (!textElement || !authorElement) return null;
  
  const quoteText = textElement.textContent.replace(/"/g, '');
  const quoteAuthor = authorElement.textContent;
  
  // Crea canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Dimensioni immagine (Instagram square format)
  const width = 1080;
  const height = 1080;
  canvas.width = width;
  canvas.height = height;
  
  // Verifica dark mode
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const bgColor = isDark ? '#1a1a1a' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Watermark (opzionale - carica e disegna l'immagine)
  try {
    const watermark = document.querySelector('.watermark');
    if (watermark && watermark.complete) {
      ctx.globalAlpha = isDark ? 0.2 : 0.4;
      ctx.drawImage(watermark, 40, 40, 270, 270);
      ctx.globalAlpha = 1.0;
    }
  } catch (error) {
    console.warn('[FORTUNE-JS] Watermark non disponibile:', error);
  }
  
  // Font e colore testo
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Disegna citazione (con word wrap)
  const maxWidth = width - 160;
  const lineHeight = 80;
  ctx.font = 'bold 60px Anton, sans-serif';
  
  const words = quoteText.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // Centra verticalmente il testo
  const totalHeight = lines.length * lineHeight;
  let y = (height - totalHeight) / 2;
  
  for (const line of lines) {
    ctx.fillText(line, width / 2, y);
    y += lineHeight;
  }
  
  // Disegna autore
  y += 60;
  ctx.font = '48px Anton, sans-serif';
  ctx.fillText(`— ${quoteAuthor}`, width / 2, y);
  
  // Disegna firma in basso
  ctx.font = '32px Anton, sans-serif';
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.6;
  ctx.fillText('daniele.olmisani@gmail.com', width / 2, height - 50);
  ctx.globalAlpha = 1.0;
  
  // Converti canvas in blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

// Condividi citazione
async function shareQuote() {
  const textElement = document.getElementById('text');
  const authorElement = document.getElementById('author');
  
  if (!textElement || !authorElement) return;
  
  const quoteText = textElement.textContent;
  const quoteAuthor = authorElement.textContent;
  const shareText = `${quoteText}\n\n— ${quoteAuthor}`;
  const shareUrl = window.location.href;
  
  // Prova a usare Web Share API (mobile)
  if (navigator.share) {
    try {
      // Prova a condividere come immagine se supportato
      if (navigator.canShare) {
        const imageBlob = await createQuoteImage();
        
        if (imageBlob) {
          const file = new File([imageBlob], 'fortune-quote.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Fortune - Citazione del giorno',
              text: shareText,
              files: [file]
            });
            showToast('✓ Condiviso!');
            return;
          }
        }
      }
      
      // Fallback: condividi solo testo
      await navigator.share({
        title: 'Fortune - Citazione del giorno',
        text: shareText,
        url: shareUrl
      });
      showToast('✓ Condiviso!');
    } catch (error) {
      // Utente ha annullato la condivisione
      if (error.name !== 'AbortError') {
        console.error('[FORTUNE-JS] Errore durante la condivisione:', error);
      }
    }
  } else {
    // Fallback: copia negli appunti
    try {
      await navigator.clipboard.writeText(shareText);
      showToast('✓ Copiato negli appunti!');
    } catch (error) {
      console.error('[FORTUNE-JS] Errore durante la copia:', error);
      showToast('✗ Impossibile copiare');
    }
  }
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
