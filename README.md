# ELS.SHOP — Boutique Streetwear & Sneakers de Marque

Boutique e-commerce moderne et épurée dédiée à la revente de vêtements et sneakers streetwear authentifiés.

---

## ⚡ Caractéristiques

- **Design Dark Streetwear Minimaliste** : Interface épurée et moderne, axée sur les pièces, contrastes soignés et réactivité maximale.
- **Catalogue & Catégories Simplifiées** :
  - Chaussures / Sneakers
  - Sweats & Hoodies
  - Vestes & Manteaux
  - T-Shirts
  - Pantalons & Cargos
  - Accessoires
- **Recherche Instantanée & Tri** : Recherche en direct et tri par prix ou nouveautés.
- **Panier Interactif (Slide-over)** : Gestion des tailles, quantités, frais de port Colissimo et codes promotionnels (`ELS10` pour -10%).
- **Paiements Sécurisés** : Intégration Stripe Checkout pour carte bancaire et Apple Pay.

---

## 📁 Structure du Projet

```text
els-shop/
├── index.html              # Vitrine e-commerce simplifiée & responsive
├── confirmation.html       # Confirmation de commande
├── vercel.json             # Configuration de routage Vercel
├── package.json            # Configuration du projet
├── api/
│   ├── checkout.js         # API Stripe Checkout
│   └── products.js         # API catalogue
├── deploy_to_vercel.sh     # Script de déploiement Vercel
└── sync_github.sh          # Synchronisation GitHub
```

---

## 🚀 Déploiement

- **Hébergement** : Vercel Serverless (`https://els-shop.vercel.app`)
- **Paiements** : Stripe Checkout
- **Code & Versioning** : GitHub (`eliottquinzain-cell/els-shop`)
