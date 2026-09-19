# Charte Graphique & Guide de Style (Style Guide)

## Typographies

Le projet utilise deux familles de polices chargées localement en format `.woff2` :

1. **Inter** (Police principale / Corps de texte et titres)
   - **Famille** : `"Inter", sans-serif`
   - **Styles** : Normal & Italique
   - **Graisses utilisées** :
     - `400` (Regular)
     - `500` (Medium)
     - `600` (Semi-Bold)
     - `700` (Bold)
   - **Optimisation** : Chargement ciblé sur le sous-ensemble Latin (`U+0000-00FF`...).

2. **Geist Pixel** (Police d'accentuation / Titres ou éléments techniques)
   - **Famille** : `"Geist Pixel", monospace`
   - **Styles** : Normal
   - **Graisses** : `400` (Regular)

## Stratégie CSS

- **Reset / Normalisation** : S'assurer d'inclure `box-sizing: border-box`.
- **Typographie responsive** : Utiliser des unités relatives (`rem`, `em`, `clamp()`).
- **Composants** : Garder un nommage clair et modulaire dans `styles.css`.
- **Images & Médias** : Toujours prévoir une taille par défaut pour éviter le *Layout Shift* (CLS).