# Asignador de Talleres - Majón

Visualizador que asigna automáticamente talmidim a talleres en base a una encuesta pública en Google Sheets, optimizando 3 criterios con pesos ajustables en vivo:

- **Preferencia del talmid** (puntajes 1-5)
- **Equidad de tamaños** entre talleres
- **Mezcla de kitot** dentro de cada taller

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Sin backend — lee el sheet directo desde el browser vía `gviz/tq`

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy

Cualquier push a `main` deploya automáticamente a GitHub Pages vía Actions.
