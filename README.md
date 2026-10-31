# StockIA — Frontend Web Application

Web Application de StockIA para el equipo de un restaurante: inventario, recetas, ventas, predicción de demanda,
alertas, recomendaciones, equipo y planes.

- Producción: se despliega en Vercel (ver [`DEPLOY-VERCEL.md`](./DEPLOY-VERCEL.md)).
- API: consume el RESTful API en ASP.NET Core
  [`stockia-platform-api`](https://github.com/Jesusho22/stockia-platform-api) (JWT, MySQL y modelo ML de
  pronóstico de demanda). La API simulada [`stockia-mock-api`](https://github.com/Jesusho22/stockia-mock-api)
  queda solo como referencia.

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
| `VITE_STOCKIA_API_URL` | URL base de la API (`http://localhost:5000/api/v1` en local) |
| `VITE_AUTHENTICATION_ENDPOINT_PATH` | `/authentication` |
| `VITE_USERS_ENDPOINT_PATH` | `/users` |
| `VITE_RESTAURANTS_ENDPOINT_PATH` | `/restaurants` |
| `VITE_RESTAURANT_REGISTRATIONS_ENDPOINT_PATH` | `/restaurant-registrations` |
| `VITE_INVENTORY_ITEMS_ENDPOINT_PATH` | `/inventory-items` |
| `VITE_RECIPES_ENDPOINT_PATH` | `/recipes` |
| `VITE_SALES_ENDPOINT_PATH` | `/sales` |
| `VITE_DEMAND_FORECASTS_ENDPOINT_PATH` | `/demand-forecasts` |
| `VITE_ALERTS_ENDPOINT_PATH` | `/alerts` |
| `VITE_RECOMMENDATIONS_ENDPOINT_PATH` | `/recommendations` |
| `VITE_PLANS_ENDPOINT_PATH` | `/plans` |
| `VITE_SUBSCRIPTIONS_ENDPOINT_PATH` | `/subscriptions` |
| `VITE_DASHBOARD_ENDPOINT_PATH` | `/dashboard` |

`.env.development` se usa con `npm run dev` y `.env.production` con `npm run build`. Para correr la API en local:
`docker compose up` (o `dotnet run`) en `stockia-platform-api`; queda en `http://localhost:5000`. Para apuntar a
una API desplegada sin tocar esos archivos, crea `.env.production.local` o `.env.development.local` (no se suben):

```bash
VITE_STOCKIA_API_URL="https://<tu-api>/api/v1"
```

El dominio de la Web App debe estar en `STOCKIA_CORS_ORIGINS` de la API (los `*.vercel.app` ya están permitidos).

### Sesión con la API

- Al iniciar sesión la API devuelve un JWT; se guarda con el usuario en `localStorage` (`stockia.session`) y
  `BaseApi` lo envía como `Authorization: Bearer` en cada llamada.
- Si la API responde 401 (token vencido o inválido) se cierra la sesión y aparece "Your session expired".
- Los errores de la API llegan como ProblemDetails; `shared/infrastructure/api-error.js` traduce su código
  (`title`) a los mensajes i18n de cada Bounded Context.

## Project Structure

Las carpetas siguen los **8 Bounded Contexts del Capítulo IV del informe**, los mismos que la API:

```text
src/
  iam/                       # Identity & Access Management: sign-in, bloqueo de cuenta, recuperación y cambio
                             #   de contraseña, equipo y roles, ajustes de la cuenta
  restaurant-registration/   # Restaurant Registration: sign-up del restaurante y datos del restaurante
  subscription-payments/     # Subscription & Payments: planes y suscripción (pago simulado)
  stock-management/          # Stock Management: insumos (lotes), vencimiento y estado del stock
  recipes-management/        # Recipes Management: recetas y ventas ("Dish Sold" descuenta insumos)
  ml-recommendations/        # ML & Recommendations: predicción de demanda y recomendaciones
  notifications-messaging/   # Notifications & Messaging: alertas y su envío por WhatsApp/correo
  analytics-dashboard/       # Analytics & Dashboard: panel y ahorro semanal (Weekly Savings)
  shared/
    application/             # notifications (avisos de los guards del router)
    domain/model/            # BusinessRuleError, DecimalQuantity (cantidades de hasta 32 decimales)
    infrastructure/          # BaseApi (Axios), BaseEndpoint (CRUD), sesión, errores de la API
    presentation/            # layout, ajustes y centro de ayuda, form field, password/quantity input, tema
  locales/                   # en.json, es.json
  i18n.js
  router.js
  main.js
  app.vue
```

Descartados por el equipo (StockIA trabaja con un solo restaurante): Gamification Engine, Multi-Branch
Consolidator y Account Deactivation Component.

Cada Bounded Context tiene sus capas:

- `domain/model/`: entidades y enums (`*.entity.js`), sin dependencias de Vue ni de HTTP.
- `application/`: store de Pinia (`*.store.js`) con los casos de uso y las reglas que coordinan varias entidades.
- `infrastructure/`: cliente de la API (`*-api.js`, extiende `BaseApi`) y assemblers (`*.assembler.js`) que
  convierten recursos en entidades y viceversa.
- `presentation/`: vistas (`views/`) y componentes (`components/`). No llaman a la API: usan el store.

Un Bounded Context solo usa a otro a través de su store. Las reglas de negocio se validan en la API; la Web App
las refleja en pantalla (por ejemplo, `recipes-management.store.js` envía la venta y, si la API responde 422
`CannotSell`, muestra el diálogo con los insumos faltantes y vuelve a cargar el inventario).

## Business Rules

- Una venta solo se registra si todos los insumos de la receta tienen stock suficiente y no están vencidos
  (lo valida la API); si no, aparece el aviso "Sale not processed" y no se escribe nada en el historial ni en el stock.
- Dos insumos con el mismo nombre y unidad son lotes del mismo producto: se usa primero el lote más fresco que
  no esté vencido (lo aplica la API; la Web App lo muestra en `stock-management`).
- El precio de un plato es la suma de sus ingredientes (cantidad × precio unitario) y es el precio de la venta.
- Las cantidades aceptan hasta 32 decimales (decimal.js); la API las guarda exactas y las devuelve como texto.
- Las listas muestran primero lo último agregado.
- **Bloqueo de cuenta:** después de 5 contraseñas incorrectas seguidas la cuenta queda bloqueada 15 minutos; el
  inicio de sesión avisa cuántos intentos quedan y cuántos minutos falta. El Administrador puede desbloquear a un
  miembro desde "Roles y permisos".
- **Recuperación de contraseña:** "Forgot your password?" envía por correo un enlace con un código de 6 dígitos
  (vence en 30 minutos). La pantalla "Reset password" pide el código y la nueva contraseña; también desbloquea la cuenta.
  Como el correo es simulado, en local la Web App muestra la copia del correo con el enlace.
- **Ahorro semanal:** el panel del Administrador muestra el stock rescatado (insumos por vencer usados en ventas),
  la merma de la semana y el ahorro estimado frente a la semana anterior.

## Roles

| Funcionalidad | Administrador | Empleado |
| --- | --- | --- |
| Panel, inventario, recetas, ventas, predicción, alertas, ajustes y ayuda | Sí | Sí |
| Recomendaciones | Sí | No |
| Ahorro semanal en el panel | Sí | No |
| Desbloquear miembros | Sí | No |
| Roles y permisos | Sí | No |
| Tipo de suscripción y Mejorar plan | Sí | No |

Las rutas restringidas tienen `meta.adminOnly` en `src/router.js`; el menú lee la misma marca y el guard muestra
un aviso "Access denied" si un Empleado intenta abrirlas.

## Conventions

- Archivos en kebab-case con sufijo de tipo: `inventory-item.entity.js`, `stock-management.store.js`,
  `stock-management-api.js`, `inventory-item.assembler.js`, `inventory-list.vue`.
- Componentes de PrimeVue registrados con prefijo `pv-` (`<pv-button>`, `<pv-data-table>`).
- Textos de la interfaz siempre con `t('...')`; las claves viven en `src/locales/en.json` y `es.json`.
- Los errores de negocio se lanzan como `BusinessRuleError(code, params)` y la vista los traduce con `t`.

## Internationalization

- Configuración: `src/i18n.js` (la app siempre inicia en inglés; el selector EN/ES del encabezado cambia el idioma).
- Diccionarios: `src/locales/en.json`, `src/locales/es.json`.
- `app.vue` actualiza el atributo `lang` del documento al cambiar de idioma.

## Accessibility

- Enlace "Skip to main content", landmarks (`nav`, `main`, `aside`, `footer`) y un solo `h1` por vista.
- Cada campo tiene `label`; las validaciones usan `aria-invalid` y `aria-describedby`.
- Los botones solo con ícono tienen `aria-label`; los estados se muestran con texto además del color.
- Colores con contraste de al menos 4.5:1 (WCAG 2.1 AA).
