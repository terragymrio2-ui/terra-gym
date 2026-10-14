# TerraGym

Aplicación web para administrar un gimnasio: membresías, pagos, asistencias,
planes de entrenamiento y notificaciones. Roles: ADMIN, PROFESOR y USUARIO.

## Stack
React + Vite + Tailwind + shadcn/ui · Node.js + Express · MySQL

## Requisitos
Node 20+ · MySQL 8 · Git

## Instalación

### Backend
```bash
cd server
npm install
cp .env.example .env   # completar valores
npm run dev            # http://localhost:4000
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev            # http://localhost:5173
```

### Base de datos
Crear la base y el usuario (ver sección "Base de datos" a completar en Etapa 1).

## Estructura
- `client/`: SPA en React
- `server/`: API REST en Express
- `database/`: migraciones y seeds

> README en construcción: se completa en cada etapa.