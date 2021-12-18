function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}    


docReady(function() {

    var tables = document.querySelectorAll('table');
    for ( var i = 0; i < tables.length; i++) {
        tables[i].classList.add("table");
        tables[i].classList.add("table-striped");
    }

    var blockquotes = document.querySelectorAll('blockquote');
    for ( var i = 0; i < blockquotes.length; i++) {
        blockquotes[i].classList.add("blockquote");

        var source = blockquotes[i].lastElementChild;

        //TODO: Wrap blockquote and caption in figure element

        if(source.innerText.match(/– (.*)/)) {
            blockquotes[i].removeChild(source);

            var figcaptionEl = document.createElement("figcaption");
            figcaptionEl.innerHTML = source.innerHTML; 
            figcaptionEl.classList.add("blockquote-footer");
    
            blockquotes[i].after(figcaptionEl);
        }
    }

});

