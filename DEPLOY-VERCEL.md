# Despliegue en Vercel — StockIA Web Application (Vue + Vite)

La Web Application es un sitio estático: `npm run build` genera `dist/` y Vercel lo publica. No necesita
variables secretas; la URL de la API está en `.env.production`.

## Crear el proyecto en Vercel

1. En Vercel: **Add New… → Project** y elige el repositorio `stockia-webapp`.
2. Vercel detecta Vite. Deja estos valores (ya están en `vercel.json`) y presiona **Deploy**:

| Opción | Valor |
| :--- | :--- |
| Framework Preset | Vite |
| Root Directory | `./` (raíz del repositorio) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

`vercel.json` también define el rewrite a `index.html`, que evita el 404 al recargar una ruta como
`/app/inventory`.

Si prefieres reutilizar el proyecto `stockia-platform` (que hoy publica la versión en Angular), conéctalo a este
repositorio en **Settings → Git**, cambia el **Framework Preset** a Vite y deja **Root Directory** vacío.

Con Vercel CLI, desde la raíz del repositorio:

```bash
npm install -g vercel
vercel          # preview
vercel --prod   # producción
```

## Verificación después del deploy

- [ ] La URL carga `/auth/sign-in` en inglés y sin errores en la consola.
- [ ] Con `admin@databitecorp.com` / `stockia123` se llega al Dashboard.
- [ ] Recargar estando en `/app/inventory` no da 404.
- [ ] El selector EN / ES cambia todos los textos y se mantiene al recargar.
- [ ] "Sell one" en Recipes registra la venta en Sales history y descuenta el stock en Inventory.
- [ ] "Generate new forecast (AI)" en Demand forecast muestra una proyección nueva.

## Cambiar a la API real

Edita `VITE_STOCKIA_API_URL` en `.env.production`, haz commit y push: Vercel vuelve a desplegar.
