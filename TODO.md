# TODO - Action Recorder Plugin

## ✅ Corrections Appliquées (Session Actuelle)

### 1. Détection Stricte des IDs Invalides
- ✅ Blocage des IDs contenant du code JavaScript
- ✅ Détection des mots-clés JS (function, return, throw, let, const, var, if, else)
- ✅ Détection des caractères invalides ({, }, (, ), [, ], ;, <, >)
- ✅ Limitation de longueur (max 50 caractères)

### 2. Filtrage des Classes Angular Dynamiques
- ✅ Exclusion des classes commençant par `ng-`
- ✅ Exclusion des classes d'état de validation (valid, invalid, pristine, dirty)
- ✅ Exclusion des classes d'état de toucher (touched, untouched)
- ✅ Exclusion des classes d'état de focus (focused)
- ✅ Exclusion des classes d'état de dropdown (opened, closed, bottom, top)
- ✅ Exclusion des classes d'état de sélection (selected, disabled)
- ✅ Utilisation uniquement des classes stables (ex: aon-ng-select)

### 3. Recherche par Texte pour Éléments Angular
- ✅ Fonction `findElementByText()` pour ng-option et labels
- ✅ Stockage du texte dans `action.text` lors de l'enregistrement
- ✅ Fallback automatique sur recherche par texte si sélecteur invalide
- ✅ Double recherche (exacte puis includes)

### 4. Gestion des Sélecteurs Invalides
- ✅ Détection des IDs avec code JS → recherche par texte
- ✅ Détection des labels avec `for` invalide → recherche par texte
- ✅ Détection des anciens attributs data personnalisés → recherche par texte
- ✅ Messages d'avertissement clairs dans la console

### 5. Hiérarchie de Priorités Optimisée
1. ✅ Radio/Checkbox: `name + type + value`
2. ✅ Inputs: `name` attribute
3. ✅ IDs: Validation stricte (bloque code JS)
4. ✅ Classes: Filtrage des classes dynamiques Angular
5. ✅ Attributs data-*
6. ✅ ng-option/labels: Chemin complet + texte
7. ✅ Labels: Attribut `for` (si valide)
8. ✅ Chemin complet avec nth-child

## 🎯 Problèmes Résolus

### Erreurs Corrigées
1. ✅ `#radio-input_function r(){...}` → Utilise maintenant `input[type="radio"][name="..."][value="..."]`
2. ✅ `ng-option:contains("Résidence principale")` → Recherche par texte avec `findElementByText()`
3. ✅ `label[for="radio-input_function r(){...}"]` → Recherche par texte du label
4. ✅ `.aon-ng-select.ng-select-focused.ng-select-opened...` → Utilise uniquement `.aon-ng-select`

### Comportement Attendu
- ✅ IDs dynamiques ignorés avec warning
- ✅ Classes d'état Angular filtrées
- ✅ Recherche par texte comme fallback
- ✅ Sélecteurs stables et réutilisables

## 📝 Tests à Effectuer

1. **Test d'enregistrement sur le site Angular**
   - [ ] Démarrer un nouvel enregistrement
   - [ ] Cliquer sur des boutons radio
   - [ ] Vérifier dans la console que les IDs dynamiques sont ignorés
   - [ ] Vérifier que les sélecteurs enregistrés utilisent name + type + value

2. **Test de lecture**
   - [ ] Charger un scénario enregistré
   - [ ] Vérifier que les éléments radio sont correctement trouvés
   - [ ] Vérifier qu'il n'y a plus d'erreurs "Élément introuvable"

3. **Test avec anciens enregistrements**
   - [ ] Charger un ancien scénario avec des IDs invalides
   - [ ] Vérifier que les warnings s'affichent
   - [ ] Vérifier que le plugin continue malgré les erreurs

## 🔄 Améliorations Futures Possibles

- [ ] Système de migration pour nettoyer anciens scénarios
- [ ] Détection améliorée par label associé
- [ ] Option de ré-enregistrement des actions problématiques
- [ ] Rapport de santé des scénarios
- [ ] Support XPath comme alternative aux sélecteurs CSS
- [ ] Mode debug avec logs détaillés

## 📊 Compatibilité

### Frameworks Supportés
- ✅ Angular 19 (avec composants dynamiques)
- ✅ Applications avec IDs générés dynamiquement
- ✅ Composants avec classes d'état temporaires

### Stratégies de Sélection
1. **Attributs stables** (name, type, value)
2. **Classes stables** (filtrage des états)
3. **Recherche par texte** (fallback robuste)
4. **Chemin DOM** (dernier recours)
