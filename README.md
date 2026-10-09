# ELS.SHOP — Boutique Streetwear & Revente de Marques

Boutique e-commerce moderne dédiée à la revente de vêtements et sneakers streetwear authentifiés, fondée par **Eliott Quinzain & Ilies**.

![Dark Streetwear Theme](https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=80)

---

## ⚡ Caractéristiques Principales

- **Direction Artistique Dark Streetwear** : Thème sombre inspiré de Goat, Grailed et Supreme, typographie percutante, micro-interactions, badges d'authenticité et de rareté.
- **Catalogue & Drops** : Pièces emblématiques (Corteiz, Stüssy, Arc'teryx, Travis Scott x Jordan, Sp5der, Trapstar, Essentials).
- **Filtres Avancés & Recherche Live** : Filtrage par catégorie, marque, état (10/10 DS, 9.5/10), tri par prix ou nouveautés, et barre de recherche instantanée.
- **Panier Interactif (Slide-over Drawer)** :
  - Sélection des tailles et gestion des quantités
  - Jauge de livraison offerte (Colissimo offert dès 150 €)
  - Système de codes promotionnels (`ELS10` pour -10%)
  - Calcul dynamique du sous-total et des frais d'expédition
- **Intégration Stripe Checkout** : API serverless `/api/checkout` créant des sessions sécurisées avec encaissement CB / Apple Pay.
- **Module Rachat Cash / Dépôt Vente** : Formulaire permettant aux particuliers de soumettre leurs vêtements à la vente auprès d'Eliott et Ilies avec offre sous 24h.
- **Protocole d'Authenticité & Legit Check** : Explication détaillée des 4 étapes de vérification et scellé de garantie.
- **Avis Clients & Témoignages** : Retours d'acheteurs vérifiés avec pièces et notations.

---

## 📁 Structure du Projet

```text
els-shop/
├── index.html              # Vitrine e-commerce complète & interactive
├── confirmation.html       # Page de confirmation de commande post-checkout
├── vercel.json             # Configuration de déploiement et routage Vercel
├── package.json            # Métadonnées du projet
├── api/
│   ├── checkout.js         # API Serverless Stripe Checkout
│   ├── products.js         # API Serverless catalogue & filtres
│   └── rachat.js           # API Serverless soumission rachat cash
├── deploy_to_vercel.sh     # Script de déploiement Vercel automatique
└── sync_github.sh          # Synchronisation automatique avec le repo GitHub
```

---

## 🚀 Déploiement & Technologies

- **Hébergement** : Vercel Serverless
- **Paiements** : Stripe Checkout (Test & Production)
- **Code & Versioning** : GitHub (`eliottquinzain-cell/els-shop`)
- **Fondateurs** : Eliott & Ilies
