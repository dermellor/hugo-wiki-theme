document.addEventListener('DOMContentLoaded', () => {
  // Selektiere den Blog-Post-Artikel
  const blogPost = document.querySelector('article.blog-post');

  // Überprüfe, ob der Blog-Post auf der Seite existiert
  if (!blogPost) {
    return;
  }

  // Hole die "Buy Me a Coffee"-URL aus einem Data-Attribut des Blog-Post-Elements
  // Du musst sicherstellen, dass dieses Attribut in deinem Hugo-Template gesetzt wird,
  // z.B. <article class="blog-post" data-buymeacoffee-url="{{ site.Params.buyMeACoffeeURL }}">
  const buyMeACoffeeURL = blogPost.dataset.buymeacoffeeUrl;

  // Selektiere alle H2-Überschriften im Blog-Post
  const headings = blogPost.querySelectorAll('h2');

  // Wir brauchen mindestens eine H2-Überschrift, um einen Link *vor* der letzten einzufügen
  if (headings.length >= 1) {
    // Die letzte Überschrift ist an Index length - 1
    const targetHeading = headings[headings.length - 1];

    // Erstelle das Link-Element, nur wenn eine URL vorhanden ist
    if (buyMeACoffeeURL) {
      const coffeeDiv = document.createElement('div');
      // Bootstrap 5 alert Klassen hinzufügen
      coffeeDiv.classList.add('alert', 'alert-secondary', 'buy-me-a-coffee-banner');
      coffeeDiv.setAttribute('role', 'alert'); // Für Barrierefreiheit

      const coffeeLink = document.createElement('a');
      coffeeLink.href = buyMeACoffeeURL;
      // Textinhalt des Links (lokalisiert)
      coffeeLink.innerHTML = window.i18nStrings?.buyMeACoffeeText || 'Der Artikel hilft dir weiter? Spendiere mir einen Kaffee! ☕🙏';
      coffeeLink.target = '_blank'; // Link in neuem Tab öffnen
      coffeeLink.rel = 'noopener noreferrer'; // Sicherheitsaspekt für target="_blank"
      // coffeeLink.classList.add('alert-link'); // Optional, wenn der gesamte Text ein Link sein soll und speziell hervorgehoben werden soll

      coffeeDiv.appendChild(coffeeLink);

      // Füge den Link-Container vor der Zielüberschrift ein
      targetHeading.parentNode.insertBefore(coffeeDiv, targetHeading);
      console.log('"Buy me a coffee"-Infobox eingefügt vor:', targetHeading);
    } else {
      console.warn('Keine "data-buymeacoffee-url" am article.blog-post Element gefunden. Der Link wird nicht eingefügt.');
    }
  } else {
    console.log('Keine H2-Überschriften im Blog-Post gefunden, um den Link einzufügen.');
  }
});