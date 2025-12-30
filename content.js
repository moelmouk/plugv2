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

// Échapper les caractères problématiques pour les sélecteurs CSS
function escapeCssSelector(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Utiliser CSS.escape si disponible
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(input);
  }
  
  // Fallback: échapper manuellement les caractères problématiques
  // Caractères qui doivent être échappés en CSS: !"#$%&'()*+,./:;<=>?@[\]^`{|}~
  const escapeMap = {
    '\\': '\\\\',
    '"': '\\"',
    "'": "\\'",
    '!': '\\!',
    '#': '\\#',
    '$': '\\$',
    '%': '\\%',
    '&': '\\&',
    '(': '\\(',
    ')': '\\)',
    '*': '\\*',
    '+': '\\+',
    ',': '\\,',
    '-': '\\-',
    '.': '\\.',
    '/': '\\/',
    ':': '\\:',
    ';': '\\;',
    '<': '\\<',
    '=': '\\=',
    '>': '\\>',
    '?': '\\?',
    '@': '\\@',
    '[': '\\[',
    ']': '\\]',
    '^': '\\^',
    '`': '\\`',
    '{': '\\{',
    '|': '\\|',
    '}': '\\}',
    '~': '\\~',
    ' ': '\\ '
  };
  
  return input.split('').map(char => escapeMap[char] || char).join('');
}

// Obtenir un sélecteur unique pour un élément
function getUniqueSelector(element) {
  // Priorité 1: ID (avec validation)
  if (element.id) {
    const idSelector = `#${element.id}`;
    
    // Vérifier si l'ID est un sélecteur CSS valide (ne contient pas de caractères problématiques)
    if (isValidCssSelector(idSelector)) {
      return idSelector;
    }
    
    // Si l'ID n'est pas un sélecteur CSS valide, vérifier si l'élément existe avec cet ID
    // Certains navigateurs/DOM peuvent avoir des IDs avec des caractères spéciaux qui fonctionnent
    const elementWithId = document.getElementById(element.id);
    if (elementWithId) {
      return idSelector;
    }
    
    // Si l'ID contient trop de caractères problématiques, ignorer et passer aux autres méthodes
    // Les IDs générés par Angular/React contiennent souvent du code JS
    if (element.id.length > 50 || /[{}()\[\];<>]/.test(element.id)) {
      console.log('ID ignoré (probablement généré dynamiquement):', element.id.substring(0, 50) + '...');
    }
  }
  
  // Priorité 2: Name (pour les inputs)
  if (element.name) {
    const tagName = element.tagName.toLowerCase();
    return `${tagName}[name="${element.name}"]`;
  }
  
  // Priorité 3: Classe unique (avec filtrage des classes dynamiques)
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c);
    if (classes.length > 0) {
      // Filtrer les classes qui ressemblent à des codes générés
      const stableClasses = classes.filter(c => 
        c.length < 30 && 
        !/[{}()\[\];<>]/.test(c) &&
        !c.startsWith('ng-') // Ignorer les classes Angular dynamiques
      );
      
      // Essayer d'abord avec les classes stables
      if (stableClasses.length > 0) {
        const classSelector = '.' + stableClasses.join('.');
        const matchingElements = document.querySelectorAll(classSelector);
        if (matchingElements.length === 1) {
          return classSelector;
        }
      }
      
      // Sinon essayer avec les classes originales (si unique)
      const classSelector = '.' + classes.join('.');
      const matchingElements = document.querySelectorAll(classSelector);
      if (matchingElements.length === 1) {
        return classSelector;
      }
    }
  }
  
  // Priorité 4: Attributs data-*
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-')) {
      const selector = `${element.tagName.toLowerCase()}[${attr.name}="${attr.value}"]`;
      const matchingElements = document.querySelectorAll(selector);
      if (matchingElements.length === 1) {
        return selector;
      }
    }
  }
  
  // Priorité 5: Attribut type + name pour les inputs radio/checkbox
  if (element.type && element.name && ['radio', 'checkbox'].includes(element.type)) {
    // Utiliser le sélecteur name + type (plus stable que l'ID)
    return `${element.tagName.toLowerCase()}[type="${element.type}"][name="${element.name}"]`;
  }
  
  // Priorité 6: Chercher un ID qui ne contient pas de code JS (format stable)
  if (element.id && !/[{}()\[\];<>]/.test(element.id) && element.id.length < 100) {
    // Les IDs normaux (sans caractères spéciaux) sont OK
    return `#${element.id}`;
  }
  
  // Priorité 7: Attribut for pour les labels
  if (element.tagName === 'LABEL' && element.htmlFor) {
    return `label[for="${element.htmlFor}"]`;
  }
  
  // Priorité 8: Texte de l'élément pour les labels/options
  if ((element.tagName === 'LABEL' || element.tagName === 'NG-OPTION') && element.textContent?.trim()) {
    const text = element.textContent.trim();
    // Échapper les guillemets dans le texte
    const escapedText = text.replace(/"/g, '\\"');
    return `${element.tagName.toLowerCase()}:contains("${escapedText}")`;
  }
  
  // Priorité 9: Chemin complet avec nth-child (amélioré)
  return getFullPath(element);
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
    
    // Attendre le délai
    if (action.delay > 0) {
      await sleep(action.delay);
    }
    
    try {
      await performAction(action);
      console.log(`✅ Action ${i + 1}/${actions.length} exécutée:`, action);
    } catch (error) {
      console.error(`❌ Erreur action ${i + 1}:`, error, action);
      // Continuer malgré l'erreur
    }
  }
  
  console.log('✅ Scénario terminé');
  showNotification('Scénario terminé!', 'success');
}

// Exécuter une action
async function performAction(action) {
  const element = findElement(action.selector);
  
  if (!element) {
    throw new Error(`Élément introuvable: ${action.selector}`);
  }
  
  // Scroll vers l'élément
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(300);
  
  // Mettre en évidence l'élément
  highlightElement(element);
  
  switch (action.type) {
    case 'click':
      element.click();
      break;
      
    case 'input':
      element.focus();
      element.value = '';
      // Simuler la saisie caractère par caractère
      for (const char of action.value) {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(50); // Délai entre chaque caractère
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

// Trouver un élément avec fallback
function findElement(selector) {
  try {
    // Si le sélecteur contient :contains (non natif en CSS), utiliser une recherche par texte
    if (selector.includes(':contains(')) {
      const match = selector.match(/(\w+):contains\("([^"]+)"\)/);
      if (match) {
        const tagName = match[1].toLowerCase();
        const text = match[2];
        const elements = document.querySelectorAll(tagName);
        for (const el of elements) {
          if (el.textContent.trim() === text) {
            return el;
          }
        }
      }
    }
    
    // Essayer le sélecteur direct
    let element = document.querySelector(selector);
    if (element) return element;
    
    // Fallback 1: Si le sélecteur est un ID avec caractères échappés
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      element = document.getElementById(id);
      if (element) return element;
    }
    
    // Fallback 2: Essayer de trouver par texte pour les labels
    if (selector.startsWith('label')) {
      const textMatch = selector.match(/label\[for="([^"]+)"\]/);
      if (textMatch) {
        const forAttr = textMatch[1];
        // Trouver le label avec cet attribut for
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
          if (label.htmlFor === forAttr) {
            return label;
          }
        }
      }
    }
    
    // Fallback 3: nth-of-type
    if (selector.includes(':nth-of-type')) {
      const baseSelector = selector.split(':nth-of-type')[0].trim();
      const elements = document.querySelectorAll(baseSelector);
      if (elements.length > 0) return elements[0];
    }
    
    // Fallback 4: Pour les radio/checkbox, essayer de trouver par name
    if (selector.includes('[type="radio"]') || selector.includes('[type="checkbox"]')) {
      const nameMatch = selector.match(/\[name="([^"]+)"\]/);
      if (nameMatch) {
        const name = nameMatch[1];
        const typeMatch = selector.match(/\[type="([^"]+)"\]/);
        const type = typeMatch ? typeMatch[1] : 'radio';
        const elements = document.querySelectorAll(`input[type="${type}"][name="${name}"]`);
        if (elements.length > 0) return elements[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur sélecteur:', selector, error);
    return null;
  }
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
  // Créer l'élément de notification
  const notification = document.createElement('div');
  notification.className = 'action-recorder-notification';
  notification.textContent = message;
  
  // Styles
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
  
  // Ajouter au DOM
  document.body.appendChild(notification);
  
  // Retirer après 3 secondes
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
