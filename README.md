# Guyunusa 🇺🇾

> IA conversacional con identidad uruguaya profunda.  
> Nombre en honor a Guyunusa, líder charrúa (1833) — símbolo de resistencia y puente entre mundos.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | HTML5 · CSS (ITCSS) · JS ES Modules |
| Backend  | Node.js · Express · better-sqlite3 |
| IA       | OpenRouter (primario) + DeepSeek (failover) |
| Desktop  | Electron |
| Mobile   | Capacitor (Android) |

## Inicio rápido

```bash
cd backend
cp .env.example .env
# Editar .env con tus API keys
npm install
npm run dev
```

Abrir `frontend/index.html` con Live Server o configurar Express para servirlo.

## Estructura

```
guyunusa/
├── frontend/       # HTML · CSS ITCSS · JS modular
├── backend/        # API REST Node.js + SQLite
├── desktop/        # Electron wrapper
├── android/        # Capacitor (generado)
├── shared/         # systemPrompt + constantes
└── docs/           # Documentación
```

## Dominios
- Web: https://guyunusa.uy
- API: https://api.guyunusa.uy
