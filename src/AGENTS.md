# Instructions pour les Assistants IA & Développeurs

Ce document définit les règles de développement, les conventions et la structure du projet Web **Novelios**.

## Stack Technique & Arborescence

- **HTML5** : Sémantique, SEO-friendly et accessible.
- **CSS3** : CSS natif pur (pas de framework type Tailwind ou Bootstrap).
- **Fonts** : Polices locales (`Inter` et `Geist Pixel`) chargées via `@font-face` depuis `assets/fonts/`.
- **Assets** : Images et icônes stockées dans `assets/media/`.

/
├── assets/
│   ├── fonts/       # Fichiers .woff2 (Inter, Geist Pixel)
│   └── media/       # Images (hero-poster.png, favicon, etc.)
├── styles.css       # Styles globaux du site
├── index.html       # Page d'accueil
├── AGENTS.md        # Instructions IA (ce fichier)
├── PROJECT_PLAN.md  # Vision et feuille de route
└── STYLE_GUIDE.md   # System design et règles graphiques

## Directives de Code

### HTML
- Utiliser la balise `<!DOCTYPE html>` et l'attribut `lang="fr"`.
- Conserver la structure des balises SEO (Meta Open Graph, Twitter, JSON-LD Schema.org).
- Toujours renseigner les attributs `alt` sur les images.
- Préférer la sémantique HTML5 (`<header>`, `<main>`, `<section>`, `<footer>`, `<article>`).

### CSS & Performance
- Modifier le fichier `styles.css` existant au lieu d'ajouter des bibliothèques externes.
- Optimiser le chargement des polices : charger uniquement les variantes et segments Unicode (Latin) strictement nécessaires.
- Toujours utiliser `font-display: swap` sur les `@font-face`.
- Garantir un comportement fully responsive (Mobile First ou Desktop First réactif).

### Injections de Code & Modifications
- Fournir **toujours l'intégralité du code d'un fichier** lors d'une modification, jamais de morceaux à remplacer ou d'extraits incomplets.