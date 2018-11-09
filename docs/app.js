
//frequency of update in millis
const FREQ = 1000*60*60*24;


//register event
window.addEventListener('load', e => {
    updateQuote();
})


//select and display a new quote
function updateQuote() {

    //select a quote index form database
    var index = Math.floor((Date.now() / FREQ)) % QUOTES.length;
    console.log(`quote index: ${index}`);

    //retrieve quote from database
    var quote = QUOTES[index].split("\n");

    //update UI
    document.querySelector("#text").innerHTML = quote[0];
    document.querySelector("#author").innerHTML = quote[1];

    //delay until next update in millies
    var nextUpdate = FREQ - Date.now() % FREQ;
    console.log(`next update within ${Math.floor(nextUpdate / (1000*60))} minutes`);

    //setup trigger for next update
    setTimeout(updateQuote, nextUpdate);
}
