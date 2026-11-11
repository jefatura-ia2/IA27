# IA 1º Bachillerato · IES Valle del Jerte · Curso 2026-27

Aplicación web educativa para la materia de **Inteligencia Artificial** de 1º de Bachillerato.

## Estructura del proyecto

```
ia27/
├── frontend/          ← SPA estática (publicada en Netlify)
│   ├── index.html     ← Shell principal con hash routing
│   ├── fichas/        ← Fichas de sesión (01-05)
│   ├── sandbox/       ← REPL Python con Pyodide
│   ├── laboratorios/  ← Laboratorios interactivos (eda-regresion: péndulo)
│   ├── plantillas/    ← Plantilla HTML para fichas nuevas
│   ├── assets/        ← CSS/JS adicional
│   ├── descargas/     ← Materiales descargables
│   ├── img/           ← Imágenes
│   └── recursos/      ← Recursos externos
├── backend/           ← Funciones de servidor (futuro)
├── data/              ← Datos de sesiones y contenidos
├── docs/              ← Documentación del proyecto
├── firmware/          ← Código MicroPython para microcontroladores
├── netlify/
│   └── functions/     ← Funciones serverless de Netlify
├── scripts/           ← Utilidades de build y despliegue
├── tests/             ← Tests básicos
├── .env.example       ← Variables de entorno (copia como .env)
├── netlify.toml       ← Configuración de Netlify
└── package.json       ← Scripts npm
```

## Configuración permanente

`frontend/config.json` guarda la URL de la carpeta de entregas (Apps Script) y la de la
hoja de usuarios (Google Sheets). Detalles en [`docs/guia-profesor.md`](docs/guia-profesor.md).

## Credenciales de acceso

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `profesor` | `profIA2627` | Administrador |
| `al01`–`al25` | `IA2627` | Alumno por defecto (solo si no hay hoja de Sheets en `config.json`) |

## Desarrollo local

```bash
npm install
npm run dev      # Sirve frontend/ en http://localhost:3000
```

## Despliegue en Netlify

Arrastra la **carpeta `frontend/`** al área de Netlify Drops, o conecta el repo y configura:
- **Publish directory:** `frontend`

## Sesiones

| # | Título | Estado |
|---|--------|--------|
| 01 | Terminal CMD | ✅ Completada |
| 02 | PowerShell | ✅ Completada |
| 03 | Estadística descriptiva | ✅ Completada |
| 04 | Python con VSCode | ✅ Completada |
| 05 | Estructuras de datos | 📋 Planificada |
