/**
 * Inline Footnotes - Transforms traditional footnotes to appear as paragraphs after the parent paragraph
 * Progressive enhancement: Only hides the original footnotes if JS is enabled
 * Also adds tooltip functionality to footnote references
 */
document.addEventListener('DOMContentLoaded', () => {
  // Verify footnotes exist on the page
  const footnotesSection = document.querySelector('.footnotes');
  if (!footnotesSection) return;

  // Get all footnote entries
  const footnotes = document.querySelectorAll('.footnotes li');
  let inlineNotesAdded = 0;
  
  // Create a tooltip element to be reused
  const tooltip = document.createElement('div');
  tooltip.className = 'footnote-tooltip';
  tooltip.style.display = 'none';
  tooltip.style.position = 'absolute';
  tooltip.style.zIndex = '1000';
  document.body.appendChild(tooltip);

  // For each footnote
  footnotes.forEach(footnote => {
    // Get the footnote ID and text content
    const id = footnote.id.replace('fn:', '');

    // Find the reference in the main text
    const reference = document.querySelector(`#fnref\\:${id}`);
    if (!reference) return;

    // Create the footnote div element for inline display (hidden on mobile)
    const footnoteDiv = document.createElement('div');
    footnoteDiv.className = 'footnote-content d-none d-lg-block';
    footnoteDiv.setAttribute('data-footnote-id', id);
    
    // Create a span for the footnote number
    const numberSpan = document.createElement('span');
    numberSpan.className = 'footnote-number';
    numberSpan.textContent = id;
    footnoteDiv.appendChild(numberSpan);
    
    // Add a space after the footnote number
    footnoteDiv.appendChild(document.createTextNode(' '));
    
    // Extract the footnote content - first pass for inline footnote
    const inlineFragment = document.createDocumentFragment();
    footnote.childNodes.forEach(node => {
      // Skip the backlink which is typically the last element
      if (node.nodeType === Node.ELEMENT_NODE && 
          node.classList && 
          node.classList.contains('footnote-backref')) {
        return;
      }
      // Also skip paragraph wrapper if present
      if (node.nodeType === Node.ELEMENT_NODE && 
          node.tagName.toLowerCase() === 'p') {
        // Add p's children instead
        node.childNodes.forEach(child => {
          if (!(child.nodeType === Node.ELEMENT_NODE && 
                child.classList && 
                child.classList.contains('footnote-backref'))) {
            inlineFragment.appendChild(child.cloneNode(true));
          }
        });
      } else {
        inlineFragment.appendChild(node.cloneNode(true));
      }
    });
    
    footnoteDiv.appendChild(inlineFragment);

    // Create the desktop-only footnote number as a span
    const desktopNumber = document.createElement('span');
    desktopNumber.className = 'footnote-number-indicator d-none d-lg-inline-block';
    desktopNumber.textContent = id;

    if (reference.parentNode) {
      // First insert the number after the reference
      reference.parentNode.insertBefore(desktopNumber, reference.nextSibling);
      // Then insert the footnote content after the number
      reference.parentNode.insertBefore(footnoteDiv, desktopNumber.nextSibling);
      inlineNotesAdded++;
    }
    
    // Set up click handling for tooltip
    const refLink = reference.querySelector('a');
    if (refLink) {
      // Prepare tooltip content (created on demand)
      const createTooltipContent = () => {
        const tooltipContent = document.createElement('div');
        tooltipContent.className = 'footnote-tooltip-content';
        
        
        // Add space
        tooltipContent.appendChild(document.createTextNode(' '));
        
        // Get content by cloning the footnote again to get fresh nodes
        const tooltipFragment = document.createDocumentFragment();
        footnote.childNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.classList && 
              node.classList.contains('footnote-backref')) {
            return;
          }
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.tagName.toLowerCase() === 'p') {
            node.childNodes.forEach(child => {
              if (!(child.nodeType === Node.ELEMENT_NODE && 
                    child.classList && 
                    child.classList.contains('footnote-backref'))) {
                tooltipFragment.appendChild(child.cloneNode(true));
              }
            });
          } else {
            tooltipFragment.appendChild(node.cloneNode(true));
          }
        });
        
        tooltipContent.appendChild(tooltipFragment);
        return tooltipContent;
      };
      
      // Mouse enter event to show tooltip on hover
      refLink.addEventListener('mouseenter', function() {
        // Position tooltip near the reference
        const rect = refLink.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px'; // 5px below the reference
        
        // Set content (created on demand)
        tooltip.innerHTML = '';
        tooltip.appendChild(createTooltipContent());
        
        // Show tooltip
        tooltip.style.display = 'block';
      });
      
      // Mouse leave event to hide tooltip
      refLink.addEventListener('mouseleave', function() {
        // Add a small delay before hiding to allow moving mouse to tooltip
        setTimeout(() => {
          // Only hide if mouse isn't over the tooltip
          if (!tooltip.matches(':hover')) {
            tooltip.style.display = 'none';
          }
        }, 100);
      });
      
      // Click should still prevent default behavior
      refLink.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent jump to footnote
      });
    }
  });
  
  // Mouse leave on tooltip itself to hide it
  tooltip.addEventListener('mouseleave', function() {
    tooltip.style.display = 'none';
  });

  // Only hide the original footnotes section if we successfully added inline notes
  if (inlineNotesAdded > 0) {
    footnotesSection.style.display = 'none';
  }
});