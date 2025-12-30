// État global
let currentScenario = null;
let editingScenarioId = null;
let isRecording = false;

// Éléments du DOM
const startBtn = document.getElementById('startRecording');
const stopBtn = document.getElementById('stopRecording');
const statusDiv = document.getElementById('recordingStatus');
const counterDiv = document.getElementById('actionCounter');
const saveForm = document.getElementById('saveScenarioForm');
const scenarioNameInput = document.getElementById('scenarioName');
const saveBtn = document.getElementById('saveScenario');
const cancelBtn = document.getElementById('cancelSave');
const scenariosList = document.getElementById('scenariosList');
const exportBtn = document.getElementById('exportScenario');
const importBtn = document.getElementById('importScenario');
const importFile = document.getElementById('importFile');
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const editScenarioNameInput = document.getElementById('editScenarioName');
const actionsList = document.getElementById('actionsList');
const saveEditBtn = document.getElementById('saveEdit');
const cancelEditBtn = document.getElementById('cancelEdit');

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
  await loadScenarios();
  await checkRecordingStatus();
});

// Vérifier le statut d'enregistrement
async function checkRecordingStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { type: 'CHECK_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      updateStatus('idle');
      return;
    }
    
    if (response && response.isRecording) {
      isRecording = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      updateStatus('recording');
      updateCounter(response.actionCount || 0);
    } else {
      updateStatus('idle');
    }
  });
}

// Démarrer l'enregistrement
startBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Erreur: Impossible de communiquer avec la page. Rechargez-la et réessayez.');
      return;
    }
    
    if (response && response.success) {
      isRecording = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      updateStatus('recording');
      updateCounter(0);
      
      // Mettre à jour le compteur régulièrement
      const interval = setInterval(() => {
        if (!isRecording) {
          clearInterval(interval);
          return;
        }
        
        chrome.tabs.sendMessage(tab.id, { type: 'GET_ACTION_COUNT' }, (response) => {
          if (response && response.count !== undefined) {
            updateCounter(response.count);
          }
        });
      }, 500);
    }
  });
});

// Arrêter l'enregistrement
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { type: 'STOP_RECORDING' }, (response) => {
    if (response && response.actions) {
      currentScenario = response.actions;
      isRecording = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      updateStatus('idle', `${response.actions.length} actions enregistrées`);
      
      if (response.actions.length > 0) {
        saveForm.classList.remove('hidden');
        scenarioNameInput.focus();
      } else {
        alert('Aucune action enregistrée');
      }
    }
  });
});

// Sauvegarder le scénario
saveBtn.addEventListener('click', async () => {
  const name = scenarioNameInput.value.trim();
  
  if (!name) {
    alert('Veuillez entrer un nom pour le scénario');
    return;
  }
  
  if (!currentScenario || currentScenario.length === 0) {
    alert('Aucune action à sauvegarder');
    return;
  }
  
  const scenario = {
    id: Date.now().toString(),
    name: name,
    actions: currentScenario,
    createdAt: new Date().toISOString(),
    url: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].url
  };
  
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  scenarios.push(scenario);
  await chrome.storage.local.set({ scenarios });
  
  scenarioNameInput.value = '';
  saveForm.classList.add('hidden');
  currentScenario = null;
  await loadScenarios();
  
  alert('Scénario sauvegardé avec succès!');
});

// Annuler la sauvegarde
cancelBtn.addEventListener('click', () => {
  scenarioNameInput.value = '';
  saveForm.classList.add('hidden');
  currentScenario = null;
});

// Charger les scénarios
async function loadScenarios() {
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  
  if (scenarios.length === 0) {
    scenariosList.innerHTML = '<div class="empty-message">Aucun scénario enregistré</div>';
    return;
  }
  
  scenariosList.innerHTML = scenarios.map(scenario => `
    <div class="scenario-item" data-id="${scenario.id}">
      <div class="scenario-header">
        <div class="scenario-name">${escapeHtml(scenario.name)}</div>
      </div>
      <div class="scenario-info">
        🎬 ${scenario.actions.length} actions | 
        📅 ${new Date(scenario.createdAt).toLocaleString('fr-FR')}
      </div>
      <div class="scenario-info">
        🔗 ${truncateUrl(scenario.url)}
      </div>
      <div class="scenario-actions">
        <button class="btn btn-info btn-small play-btn" data-id="${scenario.id}">
          ▶️ Jouer
        </button>
        <button class="btn btn-warning btn-small edit-btn" data-id="${scenario.id}">
          ✏️ Éditer
        </button>
        <button class="btn btn-secondary btn-small duplicate-btn" data-id="${scenario.id}">
          📋 Dupliquer
        </button>
        <button class="btn btn-danger btn-small delete-btn" data-id="${scenario.id}">
          🗑️ Supprimer
        </button>
      </div>
    </div>
  `).join('');
  
  // Ajouter les événements
  document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', () => playScenario(btn.dataset.id));
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.duplicate-btn').forEach(btn => {
    btn.addEventListener('click', () => duplicateScenario(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteScenario(btn.dataset.id));
  });
}

// Jouer un scénario
async function playScenario(id) {
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    alert('Scénario introuvable');
    return;
  }
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Vérifier si l'URL correspond
  if (!tab.url.includes(new URL(scenario.url).hostname)) {
    const confirm = window.confirm(
      `Ce scénario a été enregistré sur ${scenario.url}.\n\n` +
      `Vous êtes actuellement sur ${tab.url}.\n\n` +
      `Voulez-vous continuer quand même?`
    );
    
    if (!confirm) return;
  }
  
  chrome.tabs.sendMessage(tab.id, { 
    type: 'PLAY_SCENARIO', 
    actions: scenario.actions 
  }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Erreur: Impossible de communiquer avec la page. Rechargez-la et réessayez.');
      return;
    }
    
    if (response && response.success) {
      alert(`Lecture du scénario "${scenario.name}" démarrée!`);
    } else {
      alert('Erreur lors de la lecture du scénario');
    }
  });
}

// Ouvrir le modal d'édition
async function openEditModal(id) {
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    alert('Scénario introuvable');
    return;
  }
  
  editingScenarioId = id;
  editScenarioNameInput.value = scenario.name;
  
  actionsList.innerHTML = scenario.actions.map((action, index) => `
    <div class="action-item" data-index="${index}">
      <div class="action-header">
        <div class="action-type">${getActionTypeLabel(action.type)}</div>
        <button class="btn btn-danger btn-small delete-action-btn" data-index="${index}">
          🗑️
        </button>
      </div>
      <div class="action-details">
        <strong>Sélecteur:</strong> ${escapeHtml(action.selector)}<br>
        ${action.value !== undefined ? `<strong>Valeur:</strong> ${escapeHtml(action.value)}<br>` : ''}
        <strong>Délai:</strong> <input type="number" class="input delay-input" data-index="${index}" value="${action.delay}" min="0" step="100"> ms
      </div>
    </div>
  `).join('');
  
  // Ajouter les événements pour supprimer des actions
  document.querySelectorAll('.delete-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionItem = btn.closest('.action-item');
      actionItem.remove();
    });
  });
  
  editModal.classList.remove('hidden');
}

// Fermer le modal
closeModal.addEventListener('click', () => {
  editModal.classList.add('hidden');
  editingScenarioId = null;
});

cancelEditBtn.addEventListener('click', () => {
  editModal.classList.add('hidden');
  editingScenarioId = null;
});

// Sauvegarder les modifications
saveEditBtn.addEventListener('click', async () => {
  const name = editScenarioNameInput.value.trim();
  
  if (!name) {
    alert('Veuillez entrer un nom pour le scénario');
    return;
  }
  
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  const scenarioIndex = scenarios.findIndex(s => s.id === editingScenarioId);
  
  if (scenarioIndex === -1) {
    alert('Scénario introuvable');
    return;
  }
  
  // Récupérer les actions mises à jour
  const updatedActions = [];
  const actionItems = actionsList.querySelectorAll('.action-item');
  const originalActions = scenarios[scenarioIndex].actions;
  
  actionItems.forEach(item => {
    const index = parseInt(item.dataset.index);
    const delayInput = item.querySelector('.delay-input');
    const action = { ...originalActions[index] };
    action.delay = parseInt(delayInput.value) || 0;
    updatedActions.push(action);
  });
  
  scenarios[scenarioIndex].name = name;
  scenarios[scenarioIndex].actions = updatedActions;
  scenarios[scenarioIndex].updatedAt = new Date().toISOString();
  
  await chrome.storage.local.set({ scenarios });
  
  editModal.classList.add('hidden');
  editingScenarioId = null;
  await loadScenarios();
  
  alert('Scénario mis à jour avec succès!');
});

// Dupliquer un scénario
async function duplicateScenario(id) {
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    alert('Scénario introuvable');
    return;
  }
  
  const newScenario = {
    ...scenario,
    id: Date.now().toString(),
    name: `${scenario.name} (copie)`,
    createdAt: new Date().toISOString()
  };
  
  scenarios.push(newScenario);
  await chrome.storage.local.set({ scenarios });
  await loadScenarios();
  
  alert('Scénario dupliqué avec succès!');
}

// Supprimer un scénario
async function deleteScenario(id) {
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  const scenario = scenarios.find(s => s.id === id);
  
  if (!scenario) {
    alert('Scénario introuvable');
    return;
  }
  
  const confirm = window.confirm(`Voulez-vous vraiment supprimer le scénario "${scenario.name}"?`);
  
  if (!confirm) return;
  
  const filteredScenarios = scenarios.filter(s => s.id !== id);
  await chrome.storage.local.set({ scenarios: filteredScenarios });
  await loadScenarios();
  
  alert('Scénario supprimé avec succès!');
}

// Exporter un scénario
exportBtn.addEventListener('click', async () => {
  const result = await chrome.storage.local.get(['scenarios']);
  const scenarios = result.scenarios || [];
  
  if (scenarios.length === 0) {
    alert('Aucun scénario à exporter');
    return;
  }
  
  const dataStr = JSON.stringify(scenarios, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `scenarios-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
});

// Importer un scénario
importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  if (!file) return;
  
  try {
    const text = await file.text();
    const importedScenarios = JSON.parse(text);
    
    if (!Array.isArray(importedScenarios)) {
      alert('Format de fichier invalide');
      return;
    }
    
    const result = await chrome.storage.local.get(['scenarios']);
    const scenarios = result.scenarios || [];
    
    // Ajouter les scénarios importés avec de nouveaux IDs
    importedScenarios.forEach(scenario => {
      scenarios.push({
        ...scenario,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      });
    });
    
    await chrome.storage.local.set({ scenarios });
    await loadScenarios();
    
    alert(`${importedScenarios.length} scénario(s) importé(s) avec succès!`);
  } catch (error) {
    alert('Erreur lors de l\'import: ' + error.message);
  }
  
  importFile.value = '';
});

// Fonctions utilitaires
function updateStatus(status, message = '') {
  statusDiv.className = `status ${status}`;
  
  if (status === 'recording') {
    statusDiv.textContent = '🔴 Enregistrement en cours...';
  } else if (status === 'idle') {
    statusDiv.textContent = message || '✅ Prêt à enregistrer';
  }
}

function updateCounter(count) {
  counterDiv.textContent = `Actions: ${count}`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function truncateUrl(url, maxLength = 40) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function getActionTypeLabel(type) {
  const labels = {
    'click': '🖱️ Clic',
    'input': '⌨️ Saisie',
    'select': '📋 Sélection',
    'checkbox': '☑️ Case à cocher',
    'radio': '🔘 Bouton radio',
    'keypress': '⌨️ Touche'
  };
  return labels[type] || type;
}
