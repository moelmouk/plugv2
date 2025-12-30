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

// Obtenir un sélecteur unique pour un élément
function getUniqueSelector(element) {
  // Priorité 1: ID
  if (element.id) {
    return `#${element.id}`;
  }
  
  // Priorité 2: Name (pour les inputs)
  if (element.name) {
    const tagName = element.tagName.toLowerCase();
    return `${tagName}[name="${element.name}"]`;
  }
  
  // Priorité 3: Classe unique
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.trim().split(/\s+/).filter(c => c);
    if (classes.length > 0) {
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
  
  // Priorité 5: Chemin complet avec nth-child
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
    // Essayer le sélecteur direct
    let element = document.querySelector(selector);
    if (element) return element;
    
    // Fallback: essayer de trouver par texte partiel
    if (selector.includes(':nth-of-type')) {
      const baseSelector = selector.split(':nth-of-type')[0].trim();
      const elements = document.querySelectorAll(baseSelector);
      if (elements.length > 0) return elements[0];
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
