# HP Store

Reproduction simplifiée de la boutique en ligne HP (https://www.hp.com/fr-fr/shop/), réalisée en équipe de 3 dans un cadre pédagogique.

Le site de HP sert de référence : le projet n'est pas une copie exacte. Il s'agit d'une **démonstration front-end** : aucune commande n'est réellement traitée et aucune donnée bancaire n'est demandée.

**Site en ligne :** https://serena2007.github.io/hp-store/ (à vérifier une fois GitHub Pages activé)
**Dépôt :** https://github.com/serena2007/hp-store

## Fonctionnalités

- Page d'accueil avec bannière à défilement automatique (bouton Pause), catégories, offres du moment, partenaires, programmes avantages et inscription à la newsletter.
- Catalogue des produits avec recherche, filtres et tri.
- Fiche détaillée d'un produit.
- Panier : ajout, modification de la quantité, suppression, total.
- Commande : formulaire de livraison fictif, récapitulatif, message de confirmation.
- Case « Inclure la TVA » qui bascule l'affichage des prix entre TTC et HT.
- Règles de vente simulées : livraison gratuite dès 30 €, sinon 5 € ; codes promo AUTOMNE20 (-20 % dès 500 €) et AUTOMNE25 (-25 % dès 2000 €).

## Technologies

- HTML5, CSS3, JavaScript (sans framework JavaScript)
- Bootstrap 5.3.3 (chargé par CDN)
- Police DM Sans (Google Fonts)
- Git et GitHub (branches, Pull Requests, GitHub Pages)

## Structure du projet

```
hp-store/
├── index.html
├── pages/
│   ├── catalogue.html
│   ├── produit.html
│   ├── panier.html
│   ├── commande.html
│   └── modele.html
├── css/
│   ├── style.css
│   ├── catalogue.css
│   ├── panier.css
│   └── commande.css
├── js/
│   ├── main.js
│   ├── catalogue.js
│   ├── panier.js
│   └── commande.js
├── data/
│   └── produits.json
├── images/
├── .gitignore
└── README.md
```

`pages/modele.html` est un modèle de page (en-tête et pied de page communs) à copier pour créer une nouvelle page.

## Lancer le projet en local

1. Cloner le dépôt :

   ```
   git clone https://github.com/serena2007/hp-store.git
   cd hp-store
   ```

2. Ouvrir le dossier dans VS Code et installer l'extension **Live Server**.
3. Clic droit sur `index.html`, puis **Open with Live Server**.

Il faut passer par un serveur (Live Server ou GitHub Pages) : `fetch()` ne peut pas lire `data/produits.json` si la page est ouverte par un simple double-clic.

## Gestion des données

- **Produits** : fichier `data/produits.json` (id, nom, référence, catégorie, usage, prix TTC, stock, image, caractéristiques), lu avec `fetch()`.
- **Panier** : stocké dans le `localStorage` du navigateur, sous la clé `panier`, au format `[{ "id": 1, "quantite": 2 }]`.
- **Code promo** (facultatif) : clé `codePromo` du `localStorage`, par exemple `AUTOMNE20`.

Adresses utilisées entre les pages :

| Adresse | Rôle |
|---|---|
| `pages/catalogue.html?categorie=pc-portables` | Catalogue filtré (pc-portables, pc-bureau, imprimantes, accessoires) |
| `pages/catalogue.html?q=souris` | Recherche par mot |
| `pages/produit.html?id=1` | Fiche du produit n° 1 |

## Critères de qualité

- **Normes W3C** : chaque page HTML est validée sur https://validator.w3.org et chaque CSS sur https://jigsaw.w3.org/css-validator, avec 0 erreur.
- **Temps de chargement raisonnable** : images en WebP et compressées, `width` et `height` sur les images, `loading="lazy"`, une seule version de Bootstrap, une seule police.
- **Responsive design** : approche mobile first avec la grille Bootstrap, testée à 360 px, 768 px et 1200 px.
- **Accessibilité de base** : lien d'évitement, `alt` sur les images, `label` sur les champs, un seul `h1` par page, focus visible, bouton Pause sur la bannière automatique.

## Répartition du travail

| Membre | Responsabilités |
|---|---|
| Membre 1 : [Nom] | Page d'accueil, styles communs (`style.css`), en-tête et pied de page, modèle de page, page de commande, responsive global, intégration, GitHub Pages |
| Membre 2 : [Nom] | Catalogue, fiche produit, recherche, filtres et tri, logique du panier (`panier.js`) |
| Membre 3 : [Nom] | Données (`produits.json`), images, page panier, validation W3C, tests, README |

## Organisation Git

- Une branche par fonctionnalité (`feature/accueil`, `feature/commande`, `feature/catalogue`...), jamais de travail direct sur `main`.
- Commits avec un préfixe : `feat:` (nouveauté), `fix:` (correction), `docs:` (texte), `style:` (présentation).
- Une Pull Request par branche, relue par un autre membre avant la fusion vers `main`.
- Les bugs sont signalés dans les Issues, avec une capture d'écran.

## Crédits et mentions

- Projet pédagogique sans but commercial. HP et les noms de produits, de processeurs et de systèmes cités appartiennent à leurs propriétaires respectifs.
- Les images utilisées servent uniquement à la démonstration.# hp-store
boutique d'appareils HP en ligne
