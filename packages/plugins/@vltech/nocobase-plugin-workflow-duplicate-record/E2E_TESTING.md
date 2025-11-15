# Tests E2E - Workflow Duplicate Record Plugin

Ce document décrit les tests End-to-End (E2E) pour le plugin NocoBase Workflow Duplicate Record.

## Emplacement des Tests

Les tests E2E sont situés dans:
```
packages/plugins/@vltech/nocobase-plugin-workflow-duplicate-record/src/__e2e__/
└── duplicate-record-basic.test.ts
```

**Important**: NocoBase utilise une convention spécifique pour les tests E2E:
- Les tests doivent être dans un dossier `__e2e__/` ou `e2e/`
- Les fichiers doivent se terminer par `.test.ts` (pas `.spec.ts`)
- Pattern de recherche: `/(.*\/e2e\/|.*\/__e2e__\/).+\.test\.[tj]sx*$/`

## Framework de Test

Les tests utilisent **Playwright** intégré via `@nocobase/test/e2e`.

### Configuration

La configuration Playwright est définie dans `/playwright.config.ts` qui utilise `defineConfig` de `@nocobase/test/e2e`.

## Structure des Tests

### `duplicate-record-basic.test.ts`

Tests de base pour vérifier le chargement et la disponibilité du plugin.

**Suites de tests:**

1. **Duplicate Record Plugin - Plugin Loading**
   - ✓ Chargement de l'interface admin NocoBase
   - ✓ Accessibilité du menu Workflow
   - ✓ Accès à la page de paramètres Workflow

2. **Duplicate Record Plugin - Availability**
   - Vérification de l'enregistrement de l'instruction duplicate-record

3. **Duplicate Record Plugin - Configuration UI** (skip)
   - Affichage du formulaire de configuration
   - Présence des champs attendus

4. **Duplicate Record Plugin - Basic Workflow** (skip)
   - Test d'intégration complet avec création et exécution de workflow

## Exécution des Tests

### Prérequis

1. NocoBase doit être installé et configuré
2. L'utilisateur admin doit être créé (`admin@nocobase.com` / `admin123`)
3. Le plugin duplicate-record doit être activé

### Commandes

```bash
# Lancer tous les tests E2E depuis la racine du workspace
yarn e2e test

# Lancer les tests du plugin spécifiquement
yarn e2e test duplicate-record

# Mode UI interactif
yarn e2e test --ui

# Mode debug
yarn e2e test --debug

# Voir le navigateur pendant l'exécution
yarn e2e test --headed

# Générer un rapport HTML
yarn e2e test --reporter=html
```

### Depuis le répertoire du plugin

```bash
cd packages/plugins/@vltech/nocobase-plugin-workflow-duplicate-record

# Les tests seront automatiquement détectés par Playwright
yarn e2e test
```

## Tests Implémentés

### ✅ Tests Actifs

- **Plugin Loading**: Vérification du chargement de l'interface
- **Menu Access**: Vérification de l'accès au menu Workflow
- **Settings Page**: Vérification de l'accès aux paramètres

### ⏭️ Tests Planifiés (Skipped)

Ces tests sont marqués `skip` car ils nécessitent des développements supplémentaires:

1. **Configuration UI Tests**
   - Affichage du formulaire de configuration
   - Validation des champs
   - Sauvegarde de la configuration

2. **Workflow Execution Tests**
   - Création complète d'un workflow
   - Exécution et vérification de la duplication
   - Tests avec surcharges de champs
   - Gestion d'erreurs avec ignoreFail

## Développer de Nouveaux Tests

### Structure d'un Test

```typescript
import { expect, test } from '@nocobase/test/e2e';

test.describe('Ma fonctionnalité', () => {
  test('devrait faire quelque chose', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Vos assertions ici
    await expect(page.locator('...')).toBeVisible();
  });
});
```

### Bonnes Pratiques

1. **Imports**: Toujours utiliser `@nocobase/test/e2e` pour les imports Playwright
2. **Navigation**: Utiliser `page.goto()` suivi de `waitForLoadState('networkidle')`
3. **Attentes**: Préférer les attentes explicites aux timeouts fixes
4. **Nettoyage**: Nettoyer les données de test après exécution
5. **Isolation**: Chaque test doit être indépendant

### Exemples de Patterns

#### Créer une Collection (API)

```typescript
test('should create test collection', async ({ page, request }) => {
  const response = await request.post('/api/collections:create', {
    data: {
      name: 'test_products',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'price', type: 'number' }
      ]
    }
  });
  expect(response.ok()).toBe(true);
});
```

#### Créer un Workflow (UI)

```typescript
test('should create workflow', async ({ page }) => {
  await page.goto('/admin/settings/workflow');
  await page.getByRole('button', { name: 'Add new' }).click();

  await page.getByLabel('Name').fill('Test Workflow');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByText('Test Workflow')).toBeVisible();
});
```

#### Vérifier l'Exécution d'un Workflow

```typescript
test('should execute workflow and duplicate record', async ({ page, request }) => {
  // Créer un enregistrement qui déclenche le workflow
  await request.post('/api/test_products:create', {
    data: { name: 'Product A', price: 100 }
  });

  // Attendre l'exécution du workflow
  await page.waitForTimeout(2000);

  // Vérifier que 2 enregistrements existent
  const response = await request.get('/api/test_products:list');
  const data = await response.json();
  expect(data.data.length).toBe(2);
});
```

## Debugging

### Mode Debug

```bash
yarn e2e test --debug
```

Cela ouvre le **Playwright Inspector** permettant de:
- Exécuter les tests pas à pas
- Inspecter le DOM
- Voir les screenshots
- Examiner les requêtes réseau

### Traces

Pour enregistrer une trace complète:

```bash
yarn e2e test --trace on
```

Visualiser la trace:

```bash
npx playwright show-trace storage/playwright/test-results/.../trace.zip
```

### Screenshots et Vidéos

Les artifacts sont automatiquement sauvegardés dans:
- `storage/playwright/test-results/` - Screenshots, traces
- `storage/playwright/tests-report-html/` - Rapport HTML

## Intégration Continue (CI/CD)

### Exemple GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: yarn install

      - name: Build
        run: yarn build

      - name: Run E2E tests
        run: yarn e2e test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: storage/playwright/tests-report-html/
```

## Tests à Implémenter

Pour rendre les tests complets, il faudrait:

### 1. Helpers de Test

Créer des fonctions utilitaires pour:
- Créer/supprimer des collections
- Créer/configurer des workflows
- Ajouter des instructions à un workflow
- Créer/supprimer des enregistrements
- Vérifier l'état des workflows

### 2. Fixtures

Créer des fixtures pour:
- Collections de test prédéfinies
- Workflows de test
- Données de test

### 3. Page Objects

Implémenter des Page Objects pour:
- Page de gestion des workflows
- Éditeur de workflow
- Formulaire de configuration d'instruction
- Liste des collections

### 4. Tests d'Intégration Complets

Implémenter des tests qui:
- Créent une collection via API
- Créent un workflow complet
- Exécutent le workflow
- Vérifient les résultats
- Nettoient les données de test

## Ressources

- [Documentation Playwright](https://playwright.dev/)
- [Documentation NocoBase E2E](https://docs.nocobase.com/development/testing)
- [API NocoBase](https://docs.nocobase.com/api)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Support

Pour les problèmes ou questions:
1. Vérifier les logs dans `storage/playwright/test-results/`
2. Consulter la documentation Playwright
3. Vérifier que NocoBase est bien démarré et accessible
4. Ouvrir une issue sur le repository du projet
