
//frequency of update in millis
const FREQ = 1000*60*60*24;


//register events
window.addEventListener('load', e => {

    //register ServiceWorkder to support offline content
    registerServiceWorker();

    //load quote database and trigger UI update
    loadQuoteDatabase('./quotes.json')
        .then(q => updateQuote(q));
});

window.addEventListener('onmousedown', e => {
  console.log("down");
});

window.addEventListener('onmouseup', e => {
  console.log("up");
});


//load quote database
async function loadQuoteDatabase(url) {

    //fetch provided URL 
    const q = await fetch(url);

    //and return promised content as JSON string
    return q.json();
}


//register Service Workder to handle offline content
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('sw.js');
        } catch (e) {
          alert('ServiceWorker registration failed. Sorry about that.');
        }
      } else {
        console.log('[FORTUNE-JS] ERROR: Service Worker NOT supported.')
      }
}


//select and display a new quote
function updateQuote(quotes) {

    //select a quote index form database
    const t = Math.floor(Date.now() / FREQ);
    const index = (t*13) % quotes.length;
    console.log(`[FORTUNE-JS] time: ${t}, quote: ${index} of ${quotes.length}`);

    //retrieve quote from database
    const q = quotes[index];

    //update UI
    $('#text').html(`“${q.text}”`);
    $('#author').html(`${q.author}`);

    //delay until next update in millies
    var nextUpdate = FREQ - Date.now() % FREQ;
    console.log(`[FORTUNE-JS] next update within ${Math.floor(nextUpdate / (1000*60))} minutes`);

    //setup trigger for next update
    setTimeout(updateQuote, nextUpdate, quotes);
}
