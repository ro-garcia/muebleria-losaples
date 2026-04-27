# Backend

API base con Node.js, Express y TypeScript.

## Scripts

```bash
npm run dev
npm run build
npm start
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores necesarios.

```txt
PORT=4000
```

## Health check

```txt
GET /health
GET /health/database
```

Respuesta:

```json
{
  "ok": true,
  "message": "Backend funcionando correctamente"
}
```

`GET /health/database` valida la conexion configurada en las variables `DB_*`.
