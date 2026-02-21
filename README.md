# 🌿 BioXplore

**Plateforme éthique de découverte, d'éducation et de commerce de formes de vie rares.**

BioXplore connecte chercheurs, éducateurs et collectionneurs passionnés avec des spécimens rares sourcés de manière 100% éthique, en conformité avec les réglementations CITES internationales.

---

## 📦 Stack technique

| Couche | Technologie |
|---|---|
| Frontend | HTML · CSS · JavaScript (vanilla) |
| Backend | Node.js · Express.js |
| Base de données | Supabase (PostgreSQL) |
| Authentification | JWT (JSON Web Tokens) |
| Stockage fichiers | Supabase Storage |
| Déploiement frontend | VS Code Live Server / static hosting |

---

## 🗂️ Structure du projet

```
BioXplore/
├── frontend user/          # Pages HTML du site public
│   ├── home.html
│   ├── marketplace.html
│   ├── species.html
│   ├── bioeducation.html
│   ├── ethics.html
│   ├── profile.html
│   ├── cart.html
│   ├── login.html
│   ├── signup.html
│   ├── about.html
│   ├── contact.html
│   ├── admin.html
│   ├── auth-nav.js         # Gestion auth partagée
│   ├── privacy-policy.html
│   ├── terms-of-service.html
│   ├── shipping-policy.html
│   ├── returns.html
│   ├── cookie-policy.html
│   └── accessibility.html
│
└── backend/
    ├── src/
    │   ├── server.js           # Point d'entrée Express
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   ├── profileController.js
    │   │   ├── productsController.js
    │   │   ├── checkoutController.js
    │   │   └── ordersWishlistController.js
    │   ├── routes/
    │   │   ├── authRoutes.js
    │   │   ├── profileRoutes.js
    │   │   ├── productsRoutes.js
    │   │   ├── adminRoutes.js
    │   │   └── ordersWishlistRoutes.js
    │   ├── middleware/
    │   │   └── auth.js         # authenticateToken · requireAdmin
    │   └── supabase.js         # Client Supabase
    ├── database/
    │   └── auth-tables.sql     # Schéma SQL
    ├── .env.example            # Modèle des variables d'environnement
    ├── package.json
    └── package-lock.json
```

---

## 🚀 Installation locale

### Prérequis
- Node.js v18+
- Un compte [Supabase](https://supabase.com) (gratuit)
- VS Code avec l'extension **Live Server** (pour le frontend)

### 1. Cloner le dépôt

```bash
git clone https://github.com/TON_USERNAME/bioxplore.git
cd bioxplore
```

### 2. Configurer le backend

```bash
cd backend
npm install
```

Copie le fichier d'environnement et remplis tes valeurs :

```bash
cp .env.example .env
# Édite .env avec ton éditeur préféré
```

Variables à renseigner dans `.env` :
- `SUPABASE_URL` — l'URL de ton projet Supabase
- `SUPABASE_ANON_KEY` — la clé anon publique
- `SUPABASE_SERVICE_ROLE_KEY` — la clé service role (admin)
- `JWT_SECRET` — une chaîne aléatoire longue (32+ chars)

### 3. Initialiser la base de données

Exécute le fichier SQL dans l'éditeur SQL de Supabase :

```
backend/database/auth-tables.sql
```

### 4. Démarrer le serveur backend

```bash
npm run dev
# Le serveur tourne sur http://localhost:5000
```

### 5. Lancer le frontend

Ouvre `frontend user/home.html` avec **Live Server** dans VS Code.  
Le site est accessible sur `http://localhost:5500`.

---

## 🔑 Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `user` | Navigation, wishlist, commandes, profil |
| `admin` | Tout + dashboard admin (gestion produits & commandes) |

Pour créer un admin, modifie directement dans Supabase :
```sql
UPDATE users SET role = 'admin' WHERE email = 'ton@email.com';
```

---

## 🌐 API Endpoints principaux

### Auth
```
POST   /api/auth/register     Inscription
POST   /api/auth/login        Connexion
POST   /api/auth/logout       Déconnexion
```

### Profil
```
GET    /api/profile           Profil de l'utilisateur connecté
PUT    /api/profile           Mettre à jour le profil
```

### Produits
```
GET    /api/products          Liste tous les produits
GET    /api/products/:id      Détail d'un produit
POST   /api/admin/products    Créer un produit (admin)
PUT    /api/admin/products/:id Modifier un produit (admin)
DELETE /api/admin/products/:id Supprimer un produit (admin)
```

### Commandes & Wishlist
```
GET    /api/orders            Commandes de l'utilisateur
GET    /api/wishlist          Wishlist de l'utilisateur
POST   /api/wishlist/:id      Ajouter à la wishlist
DELETE /api/wishlist/:id      Retirer de la wishlist
POST   /api/checkout          Créer une commande
```

### Admin
```
GET    /api/admin/orders              Toutes les commandes
PUT    /api/admin/orders/:id/status   Changer le statut
```

---

## 🗺️ Roadmap

- [x] Authentification JWT (inscription / connexion)
- [x] Marketplace avec panier et wishlist
- [x] Système de commandes avec workflow WhatsApp
- [x] Dashboard admin (produits + commandes)
- [x] Pages légales (Privacy, Terms, Shipping, Returns, Cookies, Accessibility)
- [x] Pages About et Contact
- [ ] **v2 — Marketplace multi-vendeurs** (vendeurs vérifiés, licences, modération)
- [ ] **v2 — Messagerie sécurisée** acheteur ↔ vendeur
- [ ] **v2 — Paiement intégré** (Stripe Connect)
- [ ] **v2 — Application mobile** (React Native)

---

## 🤝 Contribution

Ce projet est actuellement en développement privé. Pour proposer des améliorations, ouvre une Issue ou contacte l'équipe via [contact@bioxplore.com](mailto:contact@bioxplore.com).

---

## 📄 Licence

© 2025 BioXplore. Tous droits réservés.  
Voir [Terms of Service](frontend%20user/terms-of-service.html) pour les conditions d'utilisation.
