# 🎬 Action Recorder & Player - Plugin Chrome

## 📋 Description

**Action Recorder & Player** est un plugin Chrome puissant qui vous permet d'enregistrer toutes vos interactions sur une page web et de les rejouer automatiquement avec les délais réels observés.

## ✨ Fonctionnalités

### 🎯 Capture complète des interactions
- ✅ Clics sur tous les éléments
- ✅ Saisie de texte (input, textarea)
- ✅ Sélection dans les listes déroulantes (select)
- ✅ Cases à cocher (checkbox)
- ✅ Boutons radio
- ✅ Touches spéciales (Enter, Tab, Escape, etc.)
- ✅ Enregistrement des délais réels entre chaque action

### 📁 Gestion des scénarios
- ✅ Enregistrement de scénarios complets
- ✅ Stockage illimité de scénarios
- ✅ Renommer, éditer ou supprimer un scénario
- ✅ Dupliquer un scénario existant
- ✅ Édition manuelle des actions et délais
- ✅ Export/Import au format JSON

### 🔁 Relecture intelligente
- ✅ Respect de l'ordre exact des actions
- ✅ Respect des délais réels enregistrés
- ✅ Saisie caractère par caractère
- ✅ Scroll automatique vers les éléments
- ✅ Mise en évidence des éléments pendant l'exécution
- ✅ Gestion des erreurs avec continuation

### 🎨 Interface utilisateur
- ✅ Interface moderne et intuitive
- ✅ Démarrage/arrêt de l'enregistrement en un clic
- ✅ Compteur d'actions en temps réel
- ✅ Liste des scénarios avec informations détaillées
- ✅ Modal d'édition pour modifier les scénarios
- ✅ Notifications visuelles

## 🚀 Installation

### Installation en mode développeur

1. **Télécharger le plugin**
   - Téléchargez tous les fichiers du plugin dans un dossier local

2. **Ouvrir Chrome**
   - Tapez `chrome://extensions/` dans la barre d'adresse

3. **Activer le mode développeur**
   - Activez le bouton "Mode développeur" en haut à droite

4. **Charger l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier contenant les fichiers du plugin

5. **C'est prêt!**
   - L'icône du plugin apparaît dans la barre d'outils Chrome

## 📖 Guide d'utilisation

### Enregistrer un scénario

1. **Ouvrir le plugin**
   - Cliquez sur l'icône du plugin dans la barre d'outils

2. **Démarrer l'enregistrement**
   - Cliquez sur "⏺️ Démarrer l'enregistrement"
   - Une notification apparaît pour confirmer

3. **Effectuer vos actions**
   - Naviguez et interagissez normalement avec la page
   - Toutes vos actions sont enregistrées automatiquement
   - Le compteur d'actions se met à jour en temps réel

4. **Arrêter l'enregistrement**
   - Cliquez sur "⏹️ Arrêter l'enregistrement"
   - Donnez un nom à votre scénario
   - Cliquez sur "💾 Sauvegarder"

### Rejouer un scénario

1. **Ouvrir le plugin**
   - Cliquez sur l'icône du plugin

2. **Sélectionner un scénario**
   - Trouvez le scénario dans la liste

3. **Lancer la lecture**
   - Cliquez sur "▶️ Jouer"
   - Le scénario se lance automatiquement
   - Les actions sont exécutées avec les délais réels

### Éditer un scénario

1. **Ouvrir l'éditeur**
   - Cliquez sur "✏️ Éditer" sur un scénario

2. **Modifier le scénario**
   - Changez le nom si nécessaire
   - Modifiez les délais entre les actions
   - Supprimez des actions spécifiques

3. **Sauvegarder les modifications**
   - Cliquez sur "💾 Sauvegarder"

### Exporter/Importer des scénarios

**Exporter:**
- Cliquez sur "📤 Exporter"
- Un fichier JSON est téléchargé avec tous vos scénarios

**Importer:**
- Cliquez sur "📥 Importer"
- Sélectionnez un fichier JSON contenant des scénarios
- Les scénarios sont ajoutés à votre liste

## 🔧 Structure du projet

```
plugin-mkp/
├── manifest.json          # Configuration du plugin
├── popup.html            # Interface utilisateur
├── popup.css             # Styles de l'interface
├── popup.js              # Logique de l'interface
├── content.js            # Script d'enregistrement et de lecture
├── background.js         # Service worker
├── icons/               # Icônes du plugin
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # Documentation
```

## 🎯 Cas d'usage

- **Tests automatisés**: Enregistrez des scénarios de test et rejouez-les
- **Démonstrations**: Créez des tutoriels interactifs
- **Remplissage de formulaires**: Automatisez le remplissage répétitif
- **Tests de régression**: Vérifiez que votre site fonctionne correctement
- **Formation**: Montrez des processus étape par étape

## 🔒 Sécurité et confidentialité

- ✅ Toutes les données sont stockées localement dans votre navigateur
- ✅ Aucune donnée n'est envoyée à des serveurs externes
- ✅ Le plugin fonctionne uniquement sur les pages où vous l'activez
- ✅ Vous contrôlez totalement vos scénarios enregistrés

## 🛠️ Technologies utilisées

- **Manifest V3**: Dernière version du système d'extensions Chrome
- **Chrome Storage API**: Stockage local des scénarios
- **Content Scripts**: Injection de code dans les pages web
- **Service Worker**: Gestion des événements en arrière-plan
- **Vanilla JavaScript**: Pas de dépendances externes

## 📝 Limitations connues

- Les sélecteurs peuvent devenir invalides si la structure de la page change significativement
- Certains sites avec des protections anti-automatisation peuvent bloquer la relecture
- Les iframes ne sont pas supportées dans cette version
- Les fichiers uploadés ne peuvent pas être enregistrés

## 🚀 Améliorations futures

- [ ] Support des iframes
- [ ] Enregistrement des mouvements de souris
- [ ] Variables et conditions dans les scénarios
- [ ] Capture d'écran à chaque étape
- [ ] Assertions pour les tests automatisés
- [ ] Export en Selenium/Puppeteer
- [ ] Mode debug avec breakpoints
- [ ] Statistiques d'exécution

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à:
- Signaler des bugs
- Proposer des nouvelles fonctionnalités
- Améliorer la documentation
- Soumettre des pull requests

## 📄 Licence

Ce projet est sous licence MIT. Vous êtes libre de l'utiliser, le modifier et le distribuer.

## 👨‍💻 Auteur

Créé avec ❤️ pour automatiser vos tâches répétitives sur le web.

## 📞 Support

Si vous rencontrez des problèmes ou avez des questions:
1. Vérifiez que vous êtes en mode développeur dans chrome://extensions/
2. Consultez la console du navigateur (F12) pour les erreurs
3. Rechargez l'extension et la page web
4. Ouvrez une issue sur le dépôt du projet

---

**Note**: Ce plugin est fourni "tel quel" sans garantie. Utilisez-le de manière responsable et respectez les conditions d'utilisation des sites web sur lesquels vous l'utilisez.
