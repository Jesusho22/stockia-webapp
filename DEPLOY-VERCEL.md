# Despliegue en Vercel — StockIA Web Application (Vue + Vite)

La Web Application es un sitio estático: `npm run build` genera `dist/` y Vercel lo publica. No necesita
variables secretas; la URL de la API está en `.env.production`.

## Proyecto existente (`stockia-platform`)

Si el proyecto de Vercel ya estaba conectado a este repositorio con el preset de Angular, revisa en
**Settings → Build and Deployment**:

| Opción | Valor |
| :--- | :--- |
| Framework Preset | Vite |
| Root Directory | `webapp` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

`vercel.json` ya declara el framework, el build, la salida y el rewrite a `index.html`, que evita el 404 al
recargar una ruta como `/app/inventory`.

## Proyecto nuevo

1. En Vercel: **Add New… → Project** y elige el repositorio.
2. En **Root Directory** selecciona `webapp`.
3. Vercel detecta Vite; deja los valores de la tabla anterior y presiona **Deploy**.

Con Vercel CLI:

```bash
cd webapp
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
