// Service worker pour gérer les événements en arrière-plan

// Écouter l'installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 Extension Action Recorder installée avec succès!');
    
    // Initialiser le storage
    chrome.storage.local.set({ 
      scenarios: [],
      settings: {
        highlightElements: true,
        typingSpeed: 50,
        scrollBehavior: 'smooth'
      }
    });
  } else if (details.reason === 'update') {
    console.log('🔄 Extension Action Recorder mise à jour');
  }
});

// Écouter les messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SCENARIOS') {
    chrome.storage.local.get(['scenarios'], (result) => {
      sendResponse({ scenarios: result.scenarios || [] });
    });
    return true; // Nécessaire pour les réponses asynchrones
  }
  
  if (message.type === 'SAVE_SCENARIO') {
    chrome.storage.local.get(['scenarios'], (result) => {
      const scenarios = result.scenarios || [];
      scenarios.push(message.scenario);
      chrome.storage.local.set({ scenarios }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
  
  if (message.type === 'DELETE_SCENARIO') {
    chrome.storage.local.get(['scenarios'], (result) => {
      const scenarios = result.scenarios || [];
      const filtered = scenarios.filter(s => s.id !== message.id);
      chrome.storage.local.set({ scenarios: filtered }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// Écouter les clics sur l'icône de l'extension
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Icône cliquée pour l\'onglet:', tab.id);
});

console.log('✅ Service worker Action Recorder chargé');
