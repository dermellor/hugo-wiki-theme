document.addEventListener("DOMContentLoaded", function(){
    var newsletterModal = new bootstrap.Modal(document.getElementById('newsletter-modal'), {
        keyboard: true
    })

    const blogPost = document.querySelector('article.blog-post.posts');

    document.querySelectorAll(".subscribe-newsletter").forEach(element => {
      element.addEventListener("click", showNewsletterModal);
    });



    // Show autotriggered newsletter modal only on blog posts 
    if (blogPost && blogPost.length !== null) {
        
      //Make bounceback after 30 seconds
      setTimeout(function(){
        if(isMobile.any){
          //Modern browsers are preventing non user interactive changes to the history
          //See https://chromium-review.googlesource.com/c/chromium/src/+/1344199
          document.addEventListener("click", function(){
            Bounceback.init({
              checkReferrer: false,
              method: "history",
              onBounce: showNewsletterModal
            });
          }, {once : true})
        }
        else {
          Bounceback.init({
            checkReferrer: false,
            onBounce: showNewsletterModal
          });
        }
      }, 30000);

      //Check scrolldepth after 60 seconds
      setTimeout(function(){
          if(getScrollDepthPercentage() > 70 && !Bounceback.disabled) {
            showNewsletterModal();
          }
      }, 60000);

      //Show after 90 Seconds
      setTimeout(function(){
        if(!Bounceback.disabled) {
          showNewsletterModal();
        }
      }, 90000);

    }

    function showNewsletterModal(){
      newsletterModal.show();
      plausible('newsletterModal');
      Bounceback.data.set("bounceback-visited", "1");
      Bounceback.disable();
    }

    function getScrollDepthPercentage() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      return (scrollTop / windowHeight) * 100;
    }    


    // Ersetze excalidraw pngs durch svg Variante
    function replaceImagePath() {
      // Alle img-Tags auf der Seite auswählen
      const images = document.querySelectorAll('img');

      // Durch jedes Bild iterieren
      images.forEach(img => {
          const src = img.getAttribute('src');
          
          // Überprüfen, ob das Bild dem angegebenen Muster entspricht
          if (src && src.startsWith('https://images.marcelmellor.com/') && src.endsWith('.excalidraw.png')) {
              // Pfad ersetzen
              const newSrc = src.replace('.excalidraw.png', '.excalidraw.svg');
              img.setAttribute('src', newSrc);
          }
      });
    }

    // Funktion aufrufen
    replaceImagePath();

    //Botpoison 
    document.querySelectorAll("form.newsletter").forEach(function(formElement){
      var buttonElement = formElement.querySelector("button");
      console.log(formElement)
      console.log(buttonElement);
      formElement.addEventListener("botpoison-challenge-start", function () {
        buttonElement.setAttribute("disabled", "disabled");
      });
      formElement.addEventListener("botpoison-challenge-success", function () {
        //buttonElement.removeAttribute("disabled");
      });
      formElement.addEventListener("botpoison-challenge-error", function () {
        buttonElement.removeAttribute("disabled");
      });
    });

//Set source
function getQueryParam(name) { 
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"); 
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search); 
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " ")); 
}

function getAttribution(name) {
  	if(name == "utm_source") {
      if(getQueryParam("utm_source") !== "") {
        return getQueryParam("utm_source");
      }
      else {
        if (document.referrer != "") {
          return document.referrer;
        }
        else {
          return document.location.href; 
        }
      }
    }
    return getQueryParam(name);
}
  
document.querySelectorAll('input[type="hidden"]').forEach(function(el) {
    var paramValue = getAttribution(el.name);
    console.log(el.name);
    if (el.value == "" && paramValue != "")
        el.value = paramValue;
});


});


