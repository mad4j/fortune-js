
//frequency of update in millis
const FREQ = 1000*60*60*24;


//register event
window.addEventListener('load', e => {

    //load quote database and trigger UI update
    loadQuoteDatabase('./quotes.json')
        .then(q => updateQuote(q));

    //register ServiceWorkder to support offline content
    registerServiceWorker();
})


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
        console.log("ERROR: Service Worker NOT supported.")
      }
}


//select and display a new quote
function updateQuote(quotes) {

    //select a quote index form database
    const index = Math.floor((Date.now() / FREQ)) % quotes.length;
    console.log(`quote index: ${index} of total ${quotes.length} quotes`);

    //retrieve quote from database
    const q = quotes[index];

    //update UI
    document.querySelector('#text').innerHTML = `“${q.text}”`;
    document.querySelector('#author').innerHTML = `${q.author}`;

    //delay until next update in millies
    var nextUpdate = FREQ - Date.now() % FREQ;
    console.log(`next update within ${Math.floor(nextUpdate / (1000*60))} minutes`);

    //setup trigger for next update
    setTimeout(updateQuote, nextUpdate, quotes);
}
