# TODO - Action Recorder Plugin

## ✅ Corrections Appliquées

### 1. Amélioration de la détection des IDs invalides
- ✅ Ajout de validation stricte pour bloquer les IDs générés dynamiquement
- ✅ Détection des mots-clés JavaScript (function, return, throw, let, const, var, if, else)
- ✅ Détection des caractères invalides ({, }, (, ), [, ], ;, <, >)
- ✅ Limitation de la longueur des IDs (max 50 caractères)

### 2. Réorganisation des priorités pour les sélecteurs
- ✅ **PRIORITÉ 1**: Radio/Checkbox avec name + type + value (évite les IDs dynamiques)
- ✅ **PRIORITÉ 2**: Name pour les autres inputs
- ✅ **PRIORITÉ 3**: ID avec validation stricte
- ✅ **PRIORITÉ 4**: Attributs data-*
- ✅ **PRIORITÉ 5**: Attribut for pour les labels
- ✅ **PRIORITÉ 6**: Texte de l'élément
- ✅ **PRIORITÉ 7**: Chemin complet avec nth-child

### 3. Amélioration de findElement() pour les radio buttons
- ✅ Détection spéciale des sélecteurs invalides (IDs avec code JS)
- ✅ Fallback amélioré pour les radio/checkbox avec value
- ✅ Recherche par name + type + value pour identifier le bon radio
- ✅ Messages d'avertissement clairs pour les sélecteurs invalides

### 4. Logging amélioré
- ✅ Ajout de warnings pour les IDs dynamiques ignorés
- ✅ Messages d'erreur plus clairs avec emoji
- ✅ Affichage des sélecteurs invalides détectés

## 🎯 Résultat Attendu

Les erreurs suivantes ne devraient plus apparaître :
```
❌ Erreur sélecteur: #radio-input_function r(){if(St(n),n.value===mo){let o=null;throw new C(-950,o)}return n.value}_subscriber-type_aon-choice_0
```

À la place, le plugin devrait :
1. Ignorer les IDs générés dynamiquement lors de l'enregistrement
2. Utiliser `input[type="radio"][name="subscriber-type"][value="aon-choice"]` à la place
3. Retrouver correctement les éléments lors de la lecture du scénario

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

## 🔄 Prochaines Améliorations Possibles

- [ ] Ajouter un système de migration pour nettoyer les anciens scénarios
- [ ] Améliorer la détection des éléments par leur label associé
- [ ] Ajouter une option pour ré-enregistrer les actions problématiques
- [ ] Créer un rapport de santé des scénarios enregistrés
