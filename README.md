# StockIA — Frontend Web Application

Web Application de StockIA para el equipo de un restaurante: inventario, recetas, ventas, predicción de demanda,
alertas, recomendaciones, equipo y planes.

- Producción: se despliega en Vercel (ver [`DEPLOY-VERCEL.md`](./DEPLOY-VERCEL.md)).
- API: mientras se construye el RESTful API, consume la API simulada con json-server
  [`stockia-mock-api`](https://github.com/Jesusho22/stockia-mock-api), desplegada en Render.

Credenciales de prueba: `admin@databitecorp.com` / `stockia123` (Administrador) y
`empleado@databitecorp.com` / `stockia123` (Empleado).

## Technology Stack

- Vue 3 (Composition API con `<script setup>`)
- Vite
- PrimeVue 4 (tema Aura con la paleta de StockIA) + PrimeFlex + PrimeIcons
- Pinia (stores de la capa de aplicación)
- Vue Router (rutas con carga diferida y guardas por sesión y rol)
- vue-i18n (inglés por defecto, español)
- Axios

## Prerequisites

- Node.js 20.19 o superior (LTS recomendado)
- npm

## Quick Start

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente `http://localhost:5173`).

## Available Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción en `dist/`.
- `npm run preview`: sirve el build de producción en local.

## Environment Variables

La URL de la API se lee de las variables de Vite (`import.meta.env`):

| Variable | Descripción |
| :--- | :--- |
| `VITE_STOCKIA_API_URL` | URL base de la API (`https://stockia-mock-api.onrender.com/api/v1`) |
| `VITE_USERS_ENDPOINT_PATH` | `/users` |
| `VITE_INVENTORY_ITEMS_ENDPOINT_PATH` | `/inventoryItems` |
| `VITE_RECIPES_ENDPOINT_PATH` | `/recipes` |
| `VITE_SALES_ENDPOINT_PATH` | `/sales` |
| `VITE_DEMAND_FORECASTS_ENDPOINT_PATH` | `/demandForecasts` |
| `VITE_ALERTS_ENDPOINT_PATH` | `/alerts` |
| `VITE_RECOMMENDATIONS_ENDPOINT_PATH` | `/recommendations` |
| `VITE_PLANS_ENDPOINT_PATH` | `/plans` |
| `VITE_SUBSCRIPTIONS_ENDPOINT_PATH` | `/subscriptions` |

`.env.development` se usa con `npm run dev` y `.env.production` con `npm run build`. Para apuntar a la mock API
en tu máquina (`npm start` en `stockia-mock-api`) sin tocar esos archivos, crea `.env.development.local` (no se
sube al repositorio):

```bash
VITE_STOCKIA_API_URL="http://localhost:3000/api/v1"
```

Cuando el RESTful API en ASP.NET Core esté desplegado, solo cambia `VITE_STOCKIA_API_URL`.

## Project Structure

```text
src/
  iam/                    # User & Access Management
  product-inventory/      # Inventory & Recipe Management
  sales-order/            # Sales & Order Management
  demand-forecasting/     # Demand Forecasting
  alerts/                 # Alerts & Recommendations
  subscription/           # Subscription & Billing
  dashboard/              # Dashboard & Analytics (solo presentación)
  shared/
    domain/model/         # BusinessRuleError
    infrastructure/       # BaseApi (Axios) y BaseEndpoint (CRUD)
    presentation/         # layout, language switcher, form field, page header, tema
  locales/                # en.json, es.json
  i18n.js
  router.js
  main.js
  app.vue
```

Cada Bounded Context tiene sus capas:

- `domain/model/`: entidades y enums (`*.entity.js`), sin dependencias de Vue ni de HTTP.
- `application/`: store de Pinia (`*.store.js`) con los casos de uso y las reglas que coordinan varias entidades.
- `infrastructure/`: cliente de la API (`*-api.js`, extiende `BaseApi`) y assemblers (`*.assembler.js`) que
  convierten recursos en entidades y viceversa.
- `presentation/`: vistas (`views/`) y componentes (`components/`). No llaman a la API: usan el store.

Un Bounded Context solo usa a otro a través de su store. Por ejemplo, `sales.store.js` valida el stock con
`inventory.store.js` antes de confirmar la venta y, después, le pide descontar los insumos de la receta.

## Conventions

- Archivos en kebab-case con sufijo de tipo: `inventory-item.entity.js`, `inventory.store.js`,
  `inventory-api.js`, `inventory-item.assembler.js`, `inventory-list.vue`.
- Componentes de PrimeVue registrados con prefijo `pv-` (`<pv-button>`, `<pv-data-table>`).
- Textos de la interfaz siempre con `t('...')`; las claves viven en `src/locales/en.json` y `es.json`.
- Los errores de negocio se lanzan como `BusinessRuleError(code, params)` y la vista los traduce con `t`.

## Internationalization

- Configuración: `src/i18n.js` (inglés por defecto; el idioma elegido se guarda en el navegador).
- Diccionarios: `src/locales/en.json`, `src/locales/es.json`.
- `app.vue` actualiza el atributo `lang` del documento al cambiar de idioma.

## Accessibility

- Enlace "Skip to main content", landmarks (`nav`, `main`, `aside`, `footer`) y un solo `h1` por vista.
- Cada campo tiene `label`; las validaciones usan `aria-invalid` y `aria-describedby`.
- Los botones solo con ícono tienen `aria-label`; los estados se muestran con texto además del color.
- Colores con contraste de al menos 4.5:1 (WCAG 2.1 AA).
