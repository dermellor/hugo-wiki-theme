document.addEventListener('DOMContentLoaded', function() {
  // Select elements that need to have the margin-box classes added
  const elements = document.querySelectorAll('.footnote-content, article figure:not(:has(figcaption:empty)), article .callout');
  
  // Add margin-box class to all elements and alternating margin-box-left/right classes
  elements.forEach(function(element, index) {
    // Add the base margin-box class to all elements
    element.classList.add('margin-box');
    
    // Even indices also get margin-box-left, odd indices also get margin-box-right
    if (index % 2 === 0) {
      element.classList.add('margin-box-left');
    } else {
      element.classList.add('margin-box-right');
    }
  });
});