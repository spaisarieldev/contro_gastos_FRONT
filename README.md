# Control de Gastos — Frontend

App Angular para llevar ganancias diarias de Uber, gastos mensuales/únicos y un resumen con gráficos.

## Stack

- Angular 18 (standalone components)
- Bootstrap 5 + Bootstrap Icons
- Chart.js + ng2-charts
- API: NestJS en `http://localhost:3000`

## Arranque

1. Levantá el backend (Docker + Nest) según el README de `contro_gastos_BACK`.
2. En esta carpeta:

```bash
npm install
npm start
```

Abrí `http://localhost:4200`.

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/uber` | Planilla diaria del mes (guarda al salir del input) |
| `/gastos` | CRUD de gastos + checkbox pagado + colores por tipo |
| `/resumen` | Totales + gráficos diario y mensual |

## Configuración API

La URL del backend está en `src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:3000'
```
