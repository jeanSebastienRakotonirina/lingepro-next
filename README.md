# Text'eau — Gestion blanchisserie (Next.js)

Application mobile-first : commandes, tâches atelier automatiques, bons de livraison, machines, vêtements HV, finances admin.

## Démarrage

```bash
# MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7

cd lingepro-next
cp .env.example .env          # dotenv charge .env automatiquement
npm install
npm run seed                  # utilise dotenv
npm run dev                   # nodemon + next (rechargement auto)
```

→ http://localhost:3000

### dotenv + nodemon

| Outil | Rôle |
|-------|------|
| **dotenv** | Charge `.env` / `.env.local` (`lib/env.js`, seed, démarrage) |
| **nodemon** | Relance le serveur Next dès un changement dans `app/`, `lib/`, `components/`, `.env` |

Scripts : `npm run dev` (nodemon), `npm run dev:next` (Next seul), `npm run seed`.


## Automatisation

À la validation d’une commande :

1. Tâches **lavage / séchage / repassage / pliage** créées
2. **Bon de livraison** `BL-AAMMJJ-XXXX` planifié **J+1**
3. Compteurs **HV** incrémentés si articles réfléchissants

## Rôles

- **Admin** : CRUD complet + CA + utilisateurs
- **Opérateur** : commandes, tâches, machines (sans prix ni CA)
- **Livreur** : livraisons (sans prix)
- **Client** : commander, ses commandes, messages, HV

## Adresses

Rue, code postal, ville sur utilisateurs, commandes et BL.
