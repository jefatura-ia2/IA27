# Guía del Profesor · IA 1º Bachillerato

## Acceso al panel de profesor

1. Entra en la app con la cuenta `profesor`.
2. Pulsa **👩‍🏫 Profesor** en la barra superior. Pestañas:
   - **📁 Entregas**: todas las entregas de los alumnos, con enlace al archivo y a su carpeta. Escribe la **nota (0-10)** y un **comentario** en cada fila: se guardan solos en tu hoja. Filtros por sesión y por «sin corregir».
   - **🎓 Calificaciones**: ponderación de las actividades y nota final de cada alumno (media ponderada). Exportación a CSV para Rayuela/Excel.
   - **👥 Usuarios**: cuentas locales e importación desde Sheets.
   - **📄 Fichas**: publicar fichas nuevas subiendo un archivo HTML.
   - **⚙️ Configuración**: clave de administrador, URL del Apps Script y `config.json`.

## Apps Script (`backend/apps-script/upload.gs`, v4)

1. En [script.google.com](https://script.google.com) pega el código completo de `upload.gs`.
2. Rellena `HOJA_ID`, `CODIGO_CLASE` y **`CLAVE_ADMIN`** (inventa una clave).
3. Implementar → Gestionar implementaciones → ✏️ → Versión: **Nueva versión** → Implementar
   (Ejecutar como: Yo · Acceso: Cualquier usuario). Acepta los permisos.
4. En la app: ⚙️ Configuración → escribe la misma clave en **Clave de administrador**.
5. Pulsa **Probar**: debe decir `Apps Script v4 activo · ✓ hoja «cuentas» accesible`.

## Notas y ponderación

- Las notas y comentarios se guardan en las columnas `nota` y `feedback` de la pestaña `entregas` de tu hoja.
- En **🎓 Calificaciones** das un **peso** a cada actividad (o a cada sesión completa, con el selector *Por sesión*).
  Los pesos se reparten en proporción: no tienen que sumar 100. Peso 0 = no cuenta.
- Opción *Las actividades no entregadas cuentan como 0*: si está desmarcada, solo cuentan las entregadas.
- Una entrega sin nota (⏳) no cuenta hasta que la corrijas. Si hay varias entregas de la misma actividad, cuenta la última corregida.
- La ponderación se guarda en la pestaña `ponderacion` de tu hoja (pulsa **Guardar ponderación**).

## Carpeta de Drive de cada alumno

La primera vez que un alumno entra, la app le pide la URL de **su** carpeta de Drive:

1. El alumno crea una carpeta (p. ej. `IA27_ejercicios`) en su Drive.
2. La comparte con tu cuenta como **Editor** (la app le muestra tu correo).
3. Pega la URL en la app. Se guarda en la columna `carpeta` de tu hoja de cuentas.

Puede cambiarla cuando quiera con el botón **📁 Mi carpeta**.

Cada entrega se guarda en `carpeta del alumno / S01, S02… / archivo`:

- En los **Ejercicios de práctica** (fichas 04, 05…), cada ejercicio tiene el botón **📤 Subir mi .py**.
  El archivo se guarda con el código del ejercicio delante, p. ej. `S04/EJ-02A_mi_codigo.py`.
- En los **Ejercicios propuestos** de cada ficha, el botón **📤** sube la respuesta del ejercicio.
- **📨 Entregar** (barra de la ficha) sube la actividad final de la sesión.

Nada se sobrescribe: si el archivo ya existe se le añade la fecha y hora.
Cada entrega queda anotada en la pestaña `entregas` de tu hoja.

## Publicar fichas nuevas desde el panel

1. Descarga la **plantilla de ficha** (Panel → 📄 Fichas) y edítala con tu contenido,
   manteniendo sus bloques (cabecera, índice, secciones, ejercicios, tarjetas, entrega).
2. Panel → 📄 Fichas: nº de sesión, título, fecha, estado, descripción y el archivo HTML.
3. **👁 Vista previa** para revisarla y **⬆ Publicar ficha**.

La ficha queda guardada en la carpeta `IA27_fichas` de tu Drive (se crea sola) y aparece
al momento a todos los alumnos, sin tocar GitHub. Si usas un número que ya existe, la sustituye.
Si el HTML no trae cabecera, la app añade la estándar con el logo y el título.
**Retirar** la quita del panel (las fichas del repositorio no se borran).

## Configuración permanente (`frontend/config.json`)

La URL del Apps Script y la hoja de usuarios se fijan en `frontend/config.json`.
Ese archivo está en el repositorio, así que vale para **todos los dispositivos** y
no se pierde al borrar el navegador. Solo cambia cuando el administrador lo sustituye.

```json
{
  "driveUrl":  "https://script.google.com/macros/s/XXXX/exec",
  "sheetsUrl": "https://docs.google.com/spreadsheets/d/XXXX/edit#gid=0",
  "actualizado": "2026-10-30"
}
```

Cómo modificarlo:
1. Panel Profesor → pestaña **Drive** → bloque **📌 Configuración permanente**
2. Pega la URL `/exec` del Apps Script y la URL de la hoja de Sheets → **Probar hoja**
3. **⬇ Descargar config.json** → copia el archivo en `frontend/` (sustituye el anterior)
4. GitHub Desktop → Commit → Push. Netlify redespliega en ~1 minuto.

Para dejar de usar la hoja o cambiar de carpeta, repite el proceso con los nuevos valores
(o deja el campo vacío).

## Registro de alumnos (se añaden solos a la hoja)

Los alumnos crean su cuenta en **Crear cuenta** con usuario, contraseña y el **código de clase**.
El Apps Script comprueba el código y añade una fila a la hoja de cuentas (`usuario, contraseña, caduca, alta`).

- El código se cambia en `CODIGO_CLASE` dentro de `upload.gs` (no es público).
- Para cerrar el registro: `CODIGO_CLASE = ''` y nueva versión de la implementación.
- Para dar de baja a un alumno o cambiar su contraseña: edita o borra su fila en la hoja.

## Credenciales de alumnos (Google Sheets)

1. Crea una hoja con dos columnas (tercera opcional):

   | usuario | contraseña | caduca |
   |---------|-----------|--------|
   | ia_01   | Pz7k      | 2027-06-30 |

   Solo usuarios genéricos: **nunca nombre y apellidos**.
2. Compartir → *Cualquier persona con el enlace* → **Lector**.
3. Pon su URL en `sheetsUrl` de `config.json` (ver arriba).

Funcionamiento: en cada inicio de sesión la app lee la hoja, así que altas, bajas y
cambios de contraseña en Sheets se aplican al momento sin subir nada a GitHub.
Si la hoja no responde, se usa la última copia leída en ese navegador.

Con hoja configurada solo entran los alumnos de la hoja (más la cuenta `profesor`).
Sin hoja, funcionan las cuentas por defecto `al01`–`al25` / `IA2627`.

> Aviso: cualquiera que tenga el enlace de la hoja puede ver las contraseñas.
> Usa contraseñas de clase, no personales.

## Añadir o modificar sesiones

La lista de sesiones está en **`frontend/sesiones.json`** (ya no hace falta tocar `index.html`).
Cada sesión es un bloque así:

```json
{ "id": "06", "status": "active", "title": "Machine Learning: tipos de aprendizaje y workflow",
  "date": "30 Oct", "tags": ["concept","practice"], "desc": "Texto corto de la tarjeta" }
```

Valores de `status`: `done` (✓ Completada) · `active` (▶ En curso) · `plan` (Planificada) · `upcoming` (Próximamente).

Para publicar una ficha nueva basta con subir **dos cosas**:
1. `frontend/fichas/XX.html` (la ficha)
2. `frontend/sesiones.json` con la nueva entrada

Si la ficha usa imágenes o PDFs, van en `frontend/img/sXX/` y `frontend/descargas/sXX/`.
Las fichas pueden incluir su propio `<script>`: la app lo ejecuta al abrirlas.
