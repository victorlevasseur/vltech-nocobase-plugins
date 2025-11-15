# Tests Unitaires - Workflow Duplicate Record Plugin

Ce document décrit les tests unitaires pour le plugin NocoBase Workflow Duplicate Record.

## Structure des Tests

Les tests sont organisés dans le répertoire `src/__tests__/server/`:

```
src/__tests__/
└── server/
    ├── DuplicateRecordInstruction.test.ts  # Tests pour la classe principale d'instruction
    └── plugin.test.ts                       # Tests pour le plugin
```

**Note**: Les tests sont placés dans `src/__tests__/` plutôt que dans `src/server/__tests__/` car la configuration Vitest de NocoBase exclut les fichiers dans `packages/**/src/server/**/*`.

## Configuration

### Framework de Test

Ce plugin utilise **Vitest** comme framework de test, qui est intégré à NocoBase via la commande `nocobase test`.

Vitest offre:
- Compatibilité avec l'API de Jest
- Exécution très rapide avec support ESM natif
- Hot Module Replacement pour les tests
- Support TypeScript intégré

### Dépendances de Test

Les dépendances de test sont gérées au niveau du workspace NocoBase. Le plugin nécessite `@nocobase/test` comme peer dependency qui fournit Vitest et les utilitaires de test.

## Exécution des Tests

### Lancer tous les tests du projet

Depuis la racine du workspace:

```bash
yarn test
```

Cette commande exécutera automatiquement tous les tests trouvés dans les dossiers `__tests__` (fichiers `.ts` ou `.tsx`).

### Lancer les tests pour ce plugin spécifiquement

```bash
# Depuis la racine
yarn test packages/plugins/@vltech/nocobase-plugin-workflow-duplicate-record

# OU depuis le répertoire du plugin
cd packages/plugins/@vltech/nocobase-plugin-workflow-duplicate-record
yarn test
```

### Options de test utiles

```bash
# Mode watch (relance automatiquement les tests lors de modifications)
yarn test --watch

# Générer le rapport de couverture
yarn test --coverage

# Filtrer les tests par nom
yarn test -t "should duplicate"

# Mode UI interactif
yarn test --ui
```

## Couverture des Tests

### DuplicateRecordInstruction.test.ts

Ce fichier teste la classe `DuplicateRecordInstruction` qui gère la duplication des enregistrements dans les workflows.

#### Tests de Validation de Configuration

- ✓ Erreur si la collection n'est pas fournie
- ✓ Erreur si la collection n'existe pas
- ✓ Erreur si l'ID de l'enregistrement source n'est pas fourni
- ✓ Utilisation de l'ID depuis le job précédent si non fourni dans la config
- ✓ Erreur si l'enregistrement source n'est pas trouvé

#### Tests de Duplication Réussie

- ✓ Duplication réussie avec des champs basiques
- ✓ Exclusion des champs internes (id, createdAt, updatedAt, etc.)
- ✓ Exclusion des champs de relation (belongsTo, hasOne, hasMany, belongsToMany)
- ✓ Application correcte des surcharges de champs
- ✓ Protection contre la surcharge du champ 'id'

#### Tests de Gestion d'Erreurs

- ✓ Statut FAILED en cas d'erreur par défaut
- ✓ Statut RESOLVED avec erreur si ignoreFail est true

#### Tests de Logging

- ✓ Journalisation des étapes d'exécution
- ✓ Journalisation des surcharges de champs

#### Tests de la Méthode resume()

- ✓ Retourne le job inchangé si non échoué
- ✓ Retourne le job inchangé si échoué mais ignoreFail est false
- ✓ Change le statut à RESOLVED si échoué et ignoreFail est true

#### Tests de Filtrage des Champs

- ✓ Gestion des champs qui n'existent pas dans le schéma
- ✓ Copie des clés étrangères belongsTo
- ✓ Gestion correcte des champs de relation hasOne

### plugin.test.ts

Ce fichier teste la classe `PluginWorkflowDuplicateRecord` qui gère l'enregistrement du plugin.

#### Tests de load()

- ✓ Enregistrement de l'instruction duplicate-record avec le plugin workflow
- ✓ Message de succès dans les logs lors du chargement
- ✓ Erreur si le plugin workflow n'est pas disponible

#### Tests des Hooks de Cycle de Vie

- ✓ Présence de tous les hooks (afterAdd, beforeLoad, install, etc.)
- ✓ Exécution sans erreur de tous les hooks

## Détails des Tests

### Mocks Utilisés

Les tests utilisent Vitest pour créer des mocks avec `vi.fn()`:

- **Database**: Mock de la base de données NocoBase
- **Repository**: Mock du repository pour les opérations CRUD
- **Collection**: Mock de la collection avec ses champs
- **Processor**: Mock du processeur de workflow avec logger
- **Workflow Plugin**: Mock du plugin workflow pour l'enregistrement d'instructions

Exemple de mock avec Vitest:

```typescript
import { vi } from 'vitest';

const mockRepository = {
  findOne: vi.fn(),
  create: vi.fn(),
};
```

### Cas de Test Principaux

1. **Validation des Entrées**: S'assure que toutes les configurations requises sont validées
2. **Duplication de Données**: Vérifie que les données sont correctement copiées
3. **Filtrage de Champs**: Confirme que les champs internes et relations sont exclus
4. **Surcharges**: Teste l'application des valeurs personnalisées
5. **Gestion d'Erreurs**: Vérifie le comportement en cas d'erreur
6. **Logging**: S'assure que les événements sont correctement journalisés

## Métriques de Couverture

Les tests visent une couverture de code de 100% pour:

- Toutes les méthodes publiques
- Tous les chemins d'exécution (branches)
- Toutes les conditions d'erreur

Les fichiers exclus de la couverture:

- Fichiers de définition TypeScript (.d.ts)
- Fichiers d'index
- Fichiers de locale
- Fichiers client

## Ajout de Nouveaux Tests

Pour ajouter de nouveaux tests:

1. Créer un nouveau fichier `*.test.ts` dans `src/__tests__/server/` (ou `src/__tests__/client/` pour les tests client)
2. Importer les utilitaires de test depuis Vitest
3. Suivre le pattern existant avec `describe()` et `it()`
4. Utiliser `beforeEach()` pour initialiser les mocks
5. S'assurer que chaque test est isolé et indépendant
6. Utiliser des noms descriptifs pour les tests
7. Adapter les imports relatifs selon l'emplacement du fichier

Exemple pour un test server dans `src/__tests__/server/MyFeature.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MyFeature from '../../server/MyFeature'; // Import relatif

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup avec mocks Vitest
  });

  it('should do something specific', () => {
    // Arrange
    const input = ...;

    // Act
    const result = ...;

    // Assert
    expect(result).toBe(...);
  });
});
```

## Intégration Continue

Les tests peuvent être intégrés dans un pipeline CI/CD:

```yaml
# Exemple GitHub Actions
- name: Run Unit Tests
  run: |
    cd packages/plugins/@vltech/nocobase-plugin-workflow-duplicate-record
    yarn test --ci --coverage
```

## Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Guide de Migration Jest vers Vitest](https://vitest.dev/guide/migration.html)
- [Documentation NocoBase](https://docs.nocobase.com/)
- [API Vitest](https://vitest.dev/api/)
