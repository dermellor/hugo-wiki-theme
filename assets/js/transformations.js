function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}    

function wrap(el, wrapper) {
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
}


docReady(function() {

    var blockquotes = document.querySelectorAll('blockquote');
    for ( var i = 0; i < blockquotes.length; i++) {
        blockquotes[i].classList.add("blockquote");

        var source = blockquotes[i].lastElementChild;

        if(source.innerText.match(/– (.*)/)) {
            blockquotes[i].removeChild(source);

            var figcaptionEl = document.createElement("figcaption");
            figcaptionEl.innerHTML = source.innerHTML; 
            figcaptionEl.classList.add("blockquote-footer");
    
            blockquotes[i].after(figcaptionEl);
        }
    }

    var tables =  document.querySelectorAll('table');
    for ( var i = 0; i < tables.length; i++) {
        var tableWrapper = document.createElement('div');
        tableWrapper.classList.add("table-responsive")
        wrap(tables[i], tableWrapper);
    }

});

