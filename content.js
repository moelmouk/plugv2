// État de l'enregistrement
let isRecording = false;
let recordedActions = [];
let lastActionTime = null;

// Écouteur de messages depuis popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_RECORDING') {
    startRecording();
    sendResponse({ success: true });
  } else if (message.type === 'STOP_RECORDING') {
    const actions = stopRecording();
    sendResponse({ success: true, actions });
  } else if (message.type === 'PLAY_SCENARIO') {
    playScenario(message.actions);
    sendResponse({ success: true });
  } else if (message.type === 'CHECK_STATUS') {
    sendResponse({ isRecording, actionCount: recordedActions.length });
  } else if (message.type === 'GET_ACTION_COUNT') {
    sendResponse({ count: recordedActions.length });
  }
  
  return true; // Pour les réponses asynchrones
});

// Démarrer l'enregistrement
function startRecording() {
  isRecording = true;
  recordedActions = [];
  lastActionTime = Date.now();
  
  console.log('🎬 Enregistrement démarré');
  showNotification('Enregistrement démarré', 'recording');
  
  // Ajouter les écouteurs d'événements
  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('keydown', handleKeydown, true);
}

// Arrêter l'enregistrement
function stopRecording() {
  isRecording = false;
  
  console.log('⏹️ Enregistrement arrêté', recordedActions.length, 'actions');
  showNotification(`${recordedActions.length} actions enregistrées`, 'success');
  
  // Retirer les écouteurs d'événements
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('keydown', handleKeydown, true);
  
  const actions = [...recordedActions];
  recordedActions = [];
  lastActionTime = null;
  
  return actions;
}

// Gérer les clics
function handleClick(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getUniqueSelector(element);
  
  if (!selector) return;
  
  const action = {
    type: 'click',
    selector,
    timestamp: Date.now(),
    delay: calculateDelay(),
    element: element.tagName,
    text: element.textContent?.trim().substring(0, 50) || ''
  };
  
  recordAction(action);
  console.log('🖱️ Clic enregistré:', action);
}

// Gérer les saisies de texte
function handleInput(event) {
  if (!isRecording) return;
  
  const element = event.target;
  
  if (!['INPUT', 'TEXTAREA'].includes(element.tagName)) return;
  
  const selector = getUniqueSelector(element);
  
  if (!selector) return;
  
  const action = {
    type: 'input',
    selector,
    value: element.value,
    timestamp: Date.now(),
    delay: calculateDelay(),
    element: element.tagName,
    inputType: element.type || 'text'
  };
  
  recordAction(action);
  console.log('⌨️ Saisie enregistrée:', action);
}

// Gérer les changements (select, checkbox, radio)
function handleChange(event) {
  if (!isRecording) return;
  
  const element = event.target;
  const selector = getUniqueSelector(element);
  
  if (!selector) return;
  
  let action = {
    selector,
    timestamp: Date.now(),
    delay: calculateDelay(),
    element: element.tagName
  };
  
  if (element.tagName === 'SELECT') {
    action.type = 'select';
    action.value = element.value;
    action.selectedIndex = element.selectedIndex;
    action.selectedText = element.options[element.selectedIndex]?.text || '';
  } else if (element.type === 'checkbox') {
    action.type = 'checkbox';
    action.checked = element.checked;
  } else if (element.type === 'radio') {
    action.type = 'radio';
    action.checked = element.checked;
    action.value = element.value;
  }
  
  recordAction(action);
  console.log('📝 Changement enregistré:', action);
}

// Gérer les touches spéciales
function handleKeydown(event) {
  if (!isRecording) return;
  
  // Enregistrer uniquement les touches spéciales
  const specialKeys = ['Enter', 'Tab', 'Escape', 'Backspace', 'Delete'];
  
  if (!specialKeys.includes(event.key)) return;
  
  const element = event.target;
  const selector = getUniqueSelector(element);
  
  if (!selector) return;
  
  const action = {
    type: 'keypress',
    selector,
    key: event.key,
    timestamp: Date.now(),
    delay: calculateDelay(),
    element: element.tagName
  };
  
  recordAction(action);
  console.log('⌨️ Touche enregistrée:', action);
}

// Enregistrer une action
function recordAction(action) {
  recordedActions.push(action);
  lastActionTime = Date.now();
}

// Calculer le délai depuis la dernière action
function calculateDelay() {
  if (!lastActionTime) return 0;
  return Date.now() - lastActionTime;
}

// Vérifier si un sélecteur CSS est valide
function isValidCssSelector(selector) {
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch (e) {
    return false;
  }
}

// Obtenir un sélecteur unique pour un élément (avec XPath pour Angular)
function getUniqueSelector(element) {
  // PRIORITÉ 1: Pour les radio/checkbox, utiliser name + type + value
  if (element.type && ['radio', 'checkbox'].includes(element.type)) {
    if (element.name) {
      const tagName = element.tagName.toLowerCase();
      if (element.type === 'radio' && element.value) {
        return `${tagName}[type="${element.type}"][name="${element.name}"][value="${element.value}"]`;
      }
      return `${tagName}[type="${element.type}"][name="${element.name}"]`;
    }
  }
  
  // PRIORITÉ 2: Name (pour les autres inputs)
  if (element.name && element.tagName === 'INPUT') {
    const tagName = element.tagName.toLowerCase();
    return `${tagName}[name="${element.name}"]`;
  }
  
  // PRIORITÉ 3: ID (avec validation STRICTE)
  if (element.id) {
    const hasInvalidChars = /[{}()\[\];<>]/.test(element.id);
    const hasJsKeywords = /function|return|throw|let|const|var|if|else/.test(element.id);
    const isTooLong = element.id.length > 50;
    
    if (!hasInvalidChars && !hasJsKeywords && !isTooLong) {
      const idSelector = `#${element.id}`;
      if (isValidCssSelector(idSelector)) {
        return idSelector;
      }
    } else {
      console.log('⚠️ ID dynamique ignoré:', element.id.substring(0, 50) + '...');
    }
  }
  
  // PRIORITÉ 4: XPath pour éléments Angular avec texte
  if (['NG-OPTION', 'LABEL', 'SPAN', 'BUTTON'].includes(element.tagName)) {
    const text = element.textContent?.trim();
    if (text && text.length > 0 && text.length < 100) {
      // Générer un XPath basé sur le texte
      const xpath = getXPathByText(element);
      if (xpath) {
        return xpath;
      }
    }
  }
  
  // PRIORITÉ 4: Classe unique (avec filtrage des classes dynamiques)
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c);
    if (classes.length > 0) {
      // Filtrer les classes Angular dynamiques (états temporaires)
      const stableClasses = classes.filter(c => 
        c.length < 30 && 
        !/[{}()\[\];<>]/.test(c) &&
        !c.startsWith('ng-') &&
        // Exclure les classes d'état Angular
        !c.includes('touched') &&
        !c.includes('untouched') &&
        !c.includes('pristine') &&
        !c.includes('dirty') &&
        !c.includes('valid') &&
        !c.includes('invalid') &&
        !c.includes('pending') &&
        !c.includes('focused') &&
        !c.includes('opened') &&
        !c.includes('closed') &&
        !c.includes('bottom') &&
        !c.includes('top') &&
        !c.includes('disabled') &&
        !c.includes('selected')
      );
      
      // Essayer avec les classes stables uniquement
      if (stableClasses.length > 0) {
        const classSelector = '.' + stableClasses.join('.');
        const matchingElements = document.querySelectorAll(classSelector);
        if (matchingElements.length === 1) {
          return classSelector;
        }
        // Si plusieurs éléments, utiliser juste la première classe stable
        if (stableClasses.length > 0) {
          const firstClassSelector = '.' + stableClasses[0];
          const firstClassElements = document.querySelectorAll(firstClassSelector);
          if (firstClassElements.length === 1) {
            return firstClassSelector;
          }
        }
      }
    }
  }
  
  // PRIORITÉ 5: Attributs data-*
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-')) {
      const selector = `${element.tagName.toLowerCase()}[${attr.name}="${attr.value}"]`;
      const matchingElements = document.querySelectorAll(selector);
      if (matchingElements.length === 1) {
        return selector;
      }
    }
  }
  
  // PRIORITÉ 5: Attribut for pour les labels (seulement si valide)
  if (element.tagName === 'LABEL' && element.htmlFor) {
    if (!/[{}()\[\];<>]|function|return/.test(element.htmlFor)) {
      return `label[for="${element.htmlFor}"]`;
    } else {
      console.log('⚠️ Label for invalide ignoré:', element.htmlFor.substring(0, 50) + '...');
    }
  }
  
  // PRIORITÉ 6: XPath comme dernier recours (plus robuste que nth-child)
  const xpath = getOptimalXPath(element);
  if (xpath) {
    return xpath;
  }
  
  // PRIORITÉ 7: Chemin complet avec nth-child (fallback final)
  return getFullPath(element);
}

// Générer un XPath basé sur le texte de l'élément
function getXPathByText(element) {
  const tagName = element.tagName.toLowerCase();
  const text = element.textContent?.trim();
  
  if (!text) return null;
  
  // Échapper les guillemets dans le texte
  const escapedText = text.replace(/"/g, '\\"');
  
  // Pour les éléments avec texte exact
  if (text.length < 50) {
    return `xpath=//${tagName}[normalize-space(text())="${escapedText}"]`;
  }
  
  // Pour les textes plus longs, utiliser contains
  return `xpath=//${tagName}[contains(normalize-space(text()), "${escapedText.substring(0, 30)}")]`;
}

// Générer un XPath optimal pour l'élément
function getOptimalXPath(element) {
  const tagName = element.tagName.toLowerCase();
  
  // Pour les éléments Angular spécifiques
  if (tagName === 'ng-option' || tagName === 'ng-select') {
    const text = element.textContent?.trim();
    if (text) {
      const escapedText = text.replace(/"/g, '\\"');
      return `xpath=//${tagName}[contains(normalize-space(.), "${escapedText}")]`;
    }
  }
  
  // Pour les inputs avec ID stable
  if (element.id && element.id.length < 100 && !/[{}()\[\];<>]|function/.test(element.id)) {
    return `xpath=//${tagName}[@id="${element.id}"]`;
  }
  
  // Pour les éléments avec classe stable
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c);
    const stableClasses = classes.filter(c => 
      c.length < 30 && 
      !/[{}()\[\];<>]/.test(c) &&
      !c.startsWith('ng-') &&
      !c.includes('touched') &&
      !c.includes('pristine') &&
      !c.includes('focused') &&
      !c.includes('opened')
    );
    
    if (stableClasses.length > 0) {
      return `xpath=//${tagName}[contains(@class, "${stableClasses[0]}")]`;
    }
  }
  
  return null;
}

// Obtenir le chemin complet d'un élément
function getFullPath(element) {
  if (element === document.body) {
    return 'body';
  }
  
  const parent = element.parentElement;
  if (!parent) return null;
  
  const siblings = Array.from(parent.children).filter(child => 
    child.tagName === element.tagName
  );
  
  const index = siblings.indexOf(element);
  const tagName = element.tagName.toLowerCase();
  const nthChild = siblings.length > 1 ? `:nth-of-type(${index + 1})` : '';
  
  const parentPath = getFullPath(parent);
  return `${parentPath} > ${tagName}${nthChild}`;
}

// Jouer un scénario
async function playScenario(actions) {
  console.log('▶️ Lecture du scénario:', actions.length, 'actions');
  showNotification('Lecture du scénario...', 'playing');
  
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    
    if (action.delay > 0) {
      await sleep(action.delay);
    }
    
    try {
      await performAction(action);
      console.log(`✅ Action ${i + 1}/${actions.length} exécutée:`, action);
    } catch (error) {
      console.error(`❌ Erreur action ${i + 1}:`, error, action);
    }
  }
  
  console.log('✅ Scénario terminé');
  showNotification('Scénario terminé!', 'success');
}

// Exécuter une action
async function performAction(action) {
  const element = findElement(action.selector, action.text, action.element);
  
  if (!element) {
    throw new Error(`Élément introuvable: ${action.selector}`);
  }
  
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(300);
  
  highlightElement(element);
  
  switch (action.type) {
    case 'click':
      element.click();
      break;
      
    case 'input':
      element.focus();
      element.value = '';
      for (const char of action.value) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(50);
      }
      element.dispatchEvent(new Event('change', { bubbles: true }));
      break;
      
    case 'select':
      element.focus();
      if (action.selectedIndex !== undefined) {
        element.selectedIndex = action.selectedIndex;
      } else if (action.value !== undefined) {
        element.value = action.value;
      }
      element.dispatchEvent(new Event('change', { bubbles: true }));
      break;
      
    case 'checkbox':
      element.focus();
      if (element.checked !== action.checked) {
        element.click();
      }
      break;
      
    case 'radio':
      element.focus();
      if (!element.checked) {
        element.click();
      }
      break;
      
    case 'keypress':
      element.focus();
      const keyEvent = new KeyboardEvent('keydown', {
        key: action.key,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(keyEvent);
      break;
  }
  
  await sleep(200);
}

// Trouver un élément avec fallback (support XPath)
function findElement(selector, actionText = '', elementType = '') {
  try {
    // SUPPORT XPATH
    if (selector.startsWith('xpath=')) {
      const xpath = selector.substring(6); // Enlever 'xpath='
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      if (result.singleNodeValue) {
        return result.singleNodeValue;
      }
      console.warn('⚠️ XPath non trouvé:', xpath);
      // Fallback sur recherche par texte
      if (actionText && elementType) {
        return findElementByText(elementType, actionText);
      }
      return null;
    }
    
    // DÉTECTION: Sélecteurs invalides
    if (selector.startsWith('#') && /[{}()\[\];<>]|function|return/.test(selector)) {
      console.warn('⚠️ Sélecteur invalide (ID dynamique):', selector.substring(0, 50) + '...');
      if (actionText && elementType) {
        return findElementByText(elementType, actionText);
      }
      return null;
    }
    
    // DÉTECTION: Labels avec for invalide
    if (selector.startsWith('label[for=') && /[{}()\[\];<>]|function|return/.test(selector)) {
      console.warn('⚠️ Label avec for invalide:', selector.substring(0, 50) + '...');
      if (actionText) {
        return findElementByText('LABEL', actionText);
      }
      return null;
    }
    
    // Essayer le sélecteur CSS direct
    let element = document.querySelector(selector);
    if (element) return element;
    
    // Fallback 1: Pour les radio/checkbox
    if (selector.includes('[type="radio"]') || selector.includes('[type="checkbox"]')) {
      const nameMatch = selector.match(/\[name="([^"]+)"\]/);
      const valueMatch = selector.match(/\[value="([^"]+)"\]/);
      const typeMatch = selector.match(/\[type="([^"]+)"\]/);
      
      if (nameMatch && typeMatch) {
        const name = nameMatch[1];
        const type = typeMatch[1];
        const value = valueMatch ? valueMatch[1] : null;
        
        if (value) {
          element = document.querySelector(`input[type="${type}"][name="${name}"][value="${value}"]`);
          if (element) return element;
        }
        
        const elements = document.querySelectorAll(`input[type="${type}"][name="${name}"]`);
        if (elements.length > 0) return elements[0];
      }
    }
    
    // Fallback 2: Si on a le texte et le type d'élément, chercher par texte
    if (actionText && elementType) {
      element = findElementByText(elementType, actionText);
      if (element) return element;
    }
    
    // Fallback 3: nth-of-type
    if (selector.includes(':nth-of-type')) {
      const baseSelector = selector.split(':nth-of-type')[0].trim();
      const elements = document.querySelectorAll(baseSelector);
      if (elements.length > 0) return elements[0];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur sélecteur:', selector, error);
    return null;
  }
}

// Trouver un élément par son texte
function findElementByText(tagName, text) {
  if (!text || !tagName) return null;
  
  const elements = document.querySelectorAll(tagName.toLowerCase());
  for (const el of elements) {
    // Comparaison exacte du texte
    if (el.textContent.trim() === text) {
      return el;
    }
  }
  
  // Si pas trouvé avec comparaison exacte, essayer avec includes
  for (const el of elements) {
    if (el.textContent.trim().includes(text)) {
      return el;
    }
  }
  
  return null;
}

// Mettre en évidence un élément
function highlightElement(element) {
  const originalOutline = element.style.outline;
  const originalBackground = element.style.backgroundColor;
  
  element.style.outline = '3px solid #ff6600';
  element.style.backgroundColor = 'rgba(255, 102, 0, 0.1)';
  
  setTimeout(() => {
    element.style.outline = originalOutline;
    element.style.backgroundColor = originalBackground;
  }, 500);
}

// Afficher une notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'action-recorder-notification';
  notification.textContent = message;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px 25px',
    borderRadius: '8px',
    backgroundColor: type === 'recording' ? '#ff6600' : 
                     type === 'playing' ? '#4facfe' : 
                     type === 'success' ? '#38ef7d' : '#667eea',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    zIndex: '999999',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s ease-out'
  });
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Fonction utilitaire pour attendre
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('✅ Action Recorder content script chargé');
