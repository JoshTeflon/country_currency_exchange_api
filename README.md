# 🌍 Country Currency & Exchange API

This project implements the **Backend Wizards Country Currency & Exchange API**, which:
- Fetches **country** data from an external API.
- Fetches **exchange rates** for currencies.
- Computes an estimated GDP for each country.
- Stores everything in a **MySQL** database.
- Provides full **CRUD operations** and **summary image generation**.

---

## 🧰 Features

- `POST /countries/refresh` → Fetches and caches country data + generates summary image  
- `GET /countries` → Retrieve all countries with filters and sorting  
- `GET /countries/:name` → Retrieve one country by name  
- `DELETE /countries/:name` → Delete a country record  
- `GET /countries/image` → Serve generated summary image  
- `GET /status` → Show total countries and last refresh timestamp  

---

## 📦 Prerequisites

Make sure you have installed:
- **Node.js** (v18+)
- **pnpm** or **yarn**
- **MySQL** running locally or remotely

---

## ⚙️ Setup Instructions

### 1. Clone and enter project folder
```bash
git clone https://github.com/<your-username>/country-currency-api.git
cd country-currency-api
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Configure environment variables

Create a .env file in the root directory:
```bash
PORT=3000
DATABASE_URL="mysql://user:password@localhost:3306/country_db"
EXCHANGE_API_URL="https://open.er-api.com/v6/latest/USD"
COUNTRY_API_URL="https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
```

### 4. Setup the database
```bash
npx prisma migrate dev --name init
```

### 5. Run the project

For development:
```bash
pnpm dev
```

For production:
```bash
pnpm build && pnpm start
```

Server will be available at:
👉 http://localhost:3000