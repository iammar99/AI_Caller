# Restaurant AI Agent

Phase 1: restaurant backend (Node.js + Express + MongoDB) with Menu and Orders.

## Setup

```bash
cd backend
npm install
# edit .env if your MongoDB isn't local
npm run seed    # loads the fake menu
npm run dev     # starts on http://localhost:5000
```

## API

| Method | Route            | Description                                       |
|--------|------------------|---------------------------------------------------|
| GET    | /api/menu        | List menu (`?available=true`, `?category=Drinks`) |
| GET    | /api/menu/:id    | Single menu item                                  |
| POST   | /api/orders      | Create an order                                   |
| GET    | /api/orders      | List orders (`?status=pending`, `?phone=...`)     |

### Example: create an order

```json
POST /api/orders
{
  "customerName": "Ali Raza",
  "phone": "03001234567",
  "address": "Peoples Colony, Faisalabad",
  "orderType": "delivery",
  "source": "call",
  "items": [
    { "menuItem": "<menu item _id>", "quantity": 2 },
    { "menuItem": "<menu item _id>", "quantity": 1 }
  ]
}
```

Prices and totals are calculated on the server from the menu, and unavailable items are rejected.

## Later phases
Restaurant, Calls and Complaints models will be added when the AI agent is connected.
