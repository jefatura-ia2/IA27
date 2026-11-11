/**
 * IA 1º Bachillerato · IES Valle del Jerte — Apps Script v3
 * ──────────────────────────────────────────────────────────
 *  · Registro de alumnos en la hoja de cuentas
 *  · Carpeta de Drive de cada alumno (la guarda en la hoja, columna «carpeta»)
 *  · Entregas: se guardan en la carpeta del ALUMNO › S01, S02…
 *    y quedan registradas en la pestaña «entregas» de la hoja
 *  · Fichas nuevas publicadas por el profesor desde el panel
 *  · Notas y comentarios del profesor a cada entrega + ponderación
 *
 * INSTALACIÓN / ACTUALIZACIÓN
 * 1. script.google.com → tu proyecto → sustituye TODO el código por este
 * 2. Rellena las constantes de abajo
 * 3. Implementar → Gestionar implementaciones → ✏️ Editar →
 *    Versión: «Nueva versión» → Implementar  (la URL /exec no cambia)
 *    Ejecutar como: Yo · Acceso: Cualquier usuario
 *    Acepta los permisos de Drive y Hojas de cálculo.
 */

// ID de la hoja de cuentas: la parte de la URL entre /d/ y /edit
var HOJA_ID = 'PON_AQUI_EL_ID_DE_TU_HOJA_DE_CUENTAS';

// Código que das a los alumnos para crear su cuenta ('' = registro cerrado)
var CODIGO_CLASE = 'IAVJ2627';

// Clave del profesor para ver entregas y publicar fichas desde el panel.
// ¡Cámbiala! Escribe la misma en la app: Panel → ⚙️ Configuración → Clave de administrador
var CLAVE_ADMIN = 'CAMBIA_ESTA_CLAVE';

// Caducidad de las cuentas nuevas
var CADUCIDAD = '2027-06-30';

var VERSION = 'v4';


// ══════════════════════════════════════════════════════════════
//  ENTRADA
// ══════════════════════════════════════════════════════════════
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.accion === 'fichas')   return json_({ ok: true, fichas: listarFichas_() });
    if (p.accion === 'ficha')    return json_({ ok: true, html: leerFicha_(p.id) });
    if (p.accion === 'entregas') { comprobarClave_(p.clave); return json_({ ok: true, entregas: listarEntregas_(), ponderacion: leerPonderacion_() }); }
    return json_(diagnostico_());
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    switch (d.accion) {
      case 'registro':    return json_(registrar_(d));
      case 'carpeta':     return json_(guardarCarpeta_(d));
      case 'entrega':     return json_(guardarEntrega_(d));
      case 'subirFicha':  comprobarClave_(d.clave); return json_(subirFicha_(d));
      case 'borrarFicha': comprobarClave_(d.clave); return json_(borrarFicha_(d));
      case 'calificar':   comprobarClave_(d.clave); return json_(calificar_(d));
      case 'guardarPonderacion': comprobarClave_(d.clave); return json_(guardarPonderacion_(d));
    }
    throw new Error('Acción desconocida. ¿La app está actualizada?');
  } catch (err) {
    return json_({ ok: false, error: err.message });
  }
}

function diagnostico_() {
  var hoja;
  try { hoja = '✓ hoja «' + SpreadsheetApp.openById(HOJA_ID).getName() + '» accesible'; }
  catch (err) { hoja = '✗ no puedo abrir la hoja de cuentas (revisa HOJA_ID)'; }
  return {
    ok: true,
    version: VERSION,
    email: Session.getEffectiveUser().getEmail(),
    msg: 'Apps Script ' + VERSION + ' activo · ' + hoja +
         ' · registro ' + (CODIGO_CLASE ? 'ABIERTO' : 'CERRADO') +
         (CLAVE_ADMIN === 'CAMBIA_ESTA_CLAVE' ? ' · ⚠️ cambia CLAVE_ADMIN' : '')
  };
}

function comprobarClave_(clave) {
  if (!CLAVE_ADMIN || CLAVE_ADMIN === 'CAMBIA_ESTA_CLAVE') throw new Error('Define CLAVE_ADMIN en el Apps Script.');
  if (String(clave || '') !== CLAVE_ADMIN) throw new Error('Clave de administrador incorrecta.');
}


// ══════════════════════════════════════════════════════════════
//  HOJA DE CUENTAS (primera pestaña): usuario | contraseña | caduca | alta | carpeta
// ══════════════════════════════════════════════════════════════
function hojaCuentas_() {
  var h = SpreadsheetApp.openById(HOJA_ID).getSheets()[0];
  if (h.getLastRow() === 0) {
    h.appendRow(['usuario', 'contraseña', 'caduca', 'alta', 'carpeta']);
    h.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  return h;
}
function norm_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
}
// Devuelve {hoja, fila (1-based), cols:{usuario,password,carpeta}} o fila=-1
function buscarUsuario_(usuario) {
  var h = hojaCuentas_();
  var datos = h.getDataRange().getValues();
  var cab = datos[0].map(norm_);
  var cols = {
    usuario:  cab.findIndex(function (x) { return x.indexOf('usuario') === 0 || x === 'user'; }),
    password: cab.findIndex(function (x) { return x.indexOf('contrasen') === 0 || x === 'password' || x === 'clave'; }),
    carpeta:  cab.findIndex(function (x) { return x.indexOf('carpeta') === 0 || x === 'drive'; })
  };
  if (cols.usuario < 0) cols.usuario = 0;
  if (cols.password < 0) cols.password = 1;
  if (cols.carpeta < 0) {                       // crear columna «carpeta» si no existe
    cols.carpeta = datos[0].length;
    h.getRange(1, cols.carpeta + 1).setValue('carpeta').setFontWeight('bold');
  }
  var u = String(usuario || '').trim().toLowerCase();
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][cols.usuario]).trim().toLowerCase() === u) {
      return { hoja: h, fila: i + 1, cols: cols, datos: datos[i] };
    }
  }
  return { hoja: h, fila: -1, cols: cols };
}
function autenticar_(usuario, password) {
  var r = buscarUsuario_(usuario);
  if (r.fila < 0 || String(r.datos[r.cols.password]) !== String(password || '')) {
    throw new Error('Usuario o contraseña no válidos. Vuelve a iniciar sesión.');
  }
  return r;
}

function registrar_(d) {
  if (!CODIGO_CLASE) throw new Error('El registro está cerrado. Pide tu cuenta al profesor/a.');
  if (String(d.codigo || '').trim() !== CODIGO_CLASE) throw new Error('Código de clase incorrecto.');
  var usuario = String(d.usuario || '').trim().toLowerCase();
  var password = String(d.password || '');
  if (!/^[a-z0-9_]{3,20}$/.test(usuario)) throw new Error('Usuario no válido (3–20 caracteres: minúsculas, números y _).');
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  if (/^(profesor|admin)/.test(usuario)) throw new Error('Ese nombre de usuario está reservado.');

  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var r = buscarUsuario_(usuario);
    if (r.fila > 0) throw new Error('Ese usuario ya existe. Elige otro.');
    var h = r.hoja, fila = h.getLastRow() + 1;
    var ancho = Math.max(h.getLastColumn(), 4);
    var valores = new Array(ancho).fill('');
    valores[r.cols.usuario] = usuario;
    valores[r.cols.password] = password;
    valores[2] = valores[2] || CADUCIDAD;
    valores[3] = valores[3] || Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd HH:mm');
    var rango = h.getRange(fila, 1, 1, ancho);
    rango.setNumberFormat('@');
    rango.setValues([valores]);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { ok: true, usuario: usuario, caduca: CADUCIDAD };
}


// ══════════════════════════════════════════════════════════════
//  CARPETA DEL ALUMNO
// ══════════════════════════════════════════════════════════════
function idCarpeta_(url) {
  var m = String(url || '').match(/folders\/([\w-]{10,})/) || String(url || '').match(/[?&]id=([\w-]{10,})/);
  if (m) return m[1];
  if (/^[\w-]{20,}$/.test(String(url || '').trim())) return String(url).trim();
  throw new Error('La URL no es de una carpeta de Drive (debe contener /folders/).');
}
function abrirCarpetaAlumno_(url) {
  var carpeta;
  try { carpeta = DriveApp.getFolderById(idCarpeta_(url)); }
  catch (err) {
    throw new Error('No puedo acceder a tu carpeta. Compártela con ' +
      Session.getEffectiveUser().getEmail() + ' como Editor y vuelve a intentarlo.');
  }
  var yo = Session.getEffectiveUser().getEmail();
  var acceso = carpeta.getAccess(yo);
  if (acceso !== DriveApp.Permission.EDIT && acceso !== DriveApp.Permission.OWNER) {
    throw new Error('Tu carpeta está compartida solo para ver. Dale permiso de Editor a ' + yo + '.');
  }
  return carpeta;
}
function guardarCarpeta_(d) {
  var r = autenticar_(d.usuario, d.password);
  var carpeta = abrirCarpetaAlumno_(d.url);
  var url = carpeta.getUrl();
  r.hoja.getRange(r.fila, r.cols.carpeta + 1).setValue(url);
  return { ok: true, url: url, nombre: carpeta.getName() };
}


// ══════════════════════════════════════════════════════════════
//  ENTREGAS → carpeta del alumno / S01 … / archivo
// ══════════════════════════════════════════════════════════════
var CAB_ENTREGAS = ['fecha', 'usuario', 'sesion', 'ejercicio', 'archivo', 'url', 'enlace', 'comentario', 'carpeta', 'id', 'nota', 'feedback'];
function hojaEntregas_() {
  var ss = SpreadsheetApp.openById(HOJA_ID);
  var h = ss.getSheetByName('entregas');
  if (!h) {
    h = ss.insertSheet('entregas');
    h.appendRow(CAB_ENTREGAS);
    h.setFrozenRows(1);
  } else if (h.getLastColumn() < CAB_ENTREGAS.length) {      // hoja de la v3: añadir columnas nuevas
    h.getRange(1, 1, 1, CAB_ENTREGAS.length).setValues([CAB_ENTREGAS]);
  }
  h.getRange(1, 1, 1, CAB_ENTREGAS.length).setFontWeight('bold');
  h.getRange('C:C').setNumberFormat('@');   // «04» no se convierte en 4
  return h;
}
function pad2_(s) { s = String(s || '').trim(); return /^\d$/.test(s) ? '0' + s : s; }
function nuevoId_() { return Utilities.getUuid().slice(0, 8); }
function guardarEntrega_(d) {
  var r = autenticar_(d.usuario, d.password);
  var urlCarpeta = r.datos[r.cols.carpeta];
  if (!urlCarpeta) throw new Error('Primero indica tu carpeta de Drive (botón «📁 Mi carpeta»).');
  var sesion = ('0' + String(d.sesion || '0')).slice(-2);
  var nombreSub = 'S' + sesion;
  var archivoNombre = '', archivoUrl = '';

  if (d.base64) {
    var raiz = abrirCarpetaAlumno_(urlCarpeta);
    var it = raiz.getFoldersByName(nombreSub);
    var sub = it.hasNext() ? it.next() : raiz.createFolder(nombreSub);

    var ej = String(d.ejercicio || '').replace(/[^\wÁÉÍÓÚáéíóúÑñ\-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    var base = String(d.fileName || 'archivo').replace(/[\\\/:*?"<>|]+/g, '_');
    if (ej && base.toUpperCase().indexOf(ej.toUpperCase()) !== 0) base = ej + '_' + base;
    // No se sobrescribe nada: si ya existe, se añade fecha y hora
    if (sub.getFilesByName(base).hasNext()) {
      var sello = Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyyMMdd-HHmm');
      base = base.replace(/(\.[^.]+)?$/, function (ext) { return '_' + sello + (ext || ''); });
    }
    var blob = Utilities.newBlob(Utilities.base64Decode(d.base64), d.mimeType || 'application/octet-stream', base);
    var archivo = sub.createFile(blob);
    archivoNombre = archivo.getName(); archivoUrl = archivo.getUrl();
  } else if (!d.enlace) {
    throw new Error('No hay archivo ni enlace que entregar.');
  }

  hojaEntregas_().appendRow([
    Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd HH:mm'),
    String(d.usuario).toLowerCase(), sesion, d.ejercicio || '', archivoNombre, archivoUrl,
    d.enlace || '', d.comentario || '', urlCarpeta, nuevoId_(), '', ''
  ]);
  return { ok: true, url: archivoUrl, archivo: archivoNombre, carpeta: nombreSub };
}
function listarEntregas_() {
  var h = hojaEntregas_();
  var v = h.getDataRange().getDisplayValues();
  var out = [], sinId = [];
  for (var i = 1; i < v.length; i++) {
    var id = v[i][9];
    if (!id) { id = nuevoId_(); sinId.push([i + 1, id]); }   // entregas antiguas sin id
    out.push({ fecha: v[i][0], usuario: v[i][1], sesion: pad2_(v[i][2]), ejercicio: v[i][3], archivo: v[i][4],
               url: v[i][5], enlace: v[i][6], comentario: v[i][7], carpeta: v[i][8],
               id: id, nota: v[i][10], feedback: v[i][11] });
  }
  sinId.forEach(function (x) { h.getRange(x[0], 10).setValue(x[1]); });
  return out;
}
// ══════════════════════════════════════════════════════════════
//  NOTAS Y PONDERACIÓN
// ══════════════════════════════════════════════════════════════
function calificar_(d) {
  var lista = Array.isArray(d.notas) ? d.notas : [{ id: d.id, nota: d.nota, feedback: d.feedback }];
  var h = hojaEntregas_();
  var ids = h.getRange(1, 10, h.getLastRow(), 1).getDisplayValues().map(function (r) { return r[0]; });
  var hechos = 0;
  lista.forEach(function (n) {
    var fila = ids.indexOf(String(n.id));
    if (fila < 1) return;
    var nota = (n.nota === '' || n.nota == null) ? '' : Number(String(n.nota).replace(',', '.'));
    if (nota !== '' && (isNaN(nota) || nota < 0 || nota > 10)) throw new Error('La nota debe estar entre 0 y 10.');
    h.getRange(fila + 1, 11, 1, 2).setValues([[nota, n.feedback || '']]);
    hechos++;
  });
  return { ok: true, guardadas: hechos };
}
function hojaPonderacion_() {
  var ss = SpreadsheetApp.openById(HOJA_ID);
  var h = ss.getSheetByName('ponderacion');
  if (!h) {
    h = ss.insertSheet('ponderacion');
    h.appendRow(['sesion', 'ejercicio', 'peso']);
    h.getRange(1, 1, 1, 3).setFontWeight('bold');
    h.getRange('E1').setValue('no_entregadas_cuentan_0'); h.getRange('F1').setValue('si');
  }
  return h;
}
function leerPonderacion_() {
  var h = hojaPonderacion_();
  var v = h.getDataRange().getDisplayValues();
  var pesos = [];
  for (var i = 1; i < v.length; i++) {
    if (v[i][0] === '' && v[i][1] === '') continue;
    pesos.push({ sesion: pad2_(v[i][0]), ejercicio: v[i][1], peso: Number(String(v[i][2]).replace(',', '.')) || 0 });
  }
  return { pesos: pesos, ceros: String(h.getRange('F1').getDisplayValue()).toLowerCase() !== 'no' };
}
function guardarPonderacion_(d) {
  var h = hojaPonderacion_();
  var filas = (d.pesos || []).map(function (p) { return [String(p.sesion), String(p.ejercicio), Number(p.peso) || 0]; });
  if (h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 3).clearContent();
  if (filas.length) {
    h.getRange(2, 1, filas.length, 2).setNumberFormat('@');
    h.getRange(2, 1, filas.length, 3).setValues(filas);
  }
  h.getRange('F1').setValue(d.ceros === false ? 'no' : 'si');
  return { ok: true };
}


// ══════════════════════════════════════════════════════════════
//  FICHAS PUBLICADAS DESDE EL PANEL
//  Se guardan en la carpeta «IA27_fichas» de tu Drive (se crea sola)
// ══════════════════════════════════════════════════════════════
function carpetaFichas_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CARPETA_FICHAS_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var c = DriveApp.createFolder('IA27_fichas');
  props.setProperty('CARPETA_FICHAS_ID', c.getId());
  return c;
}
function leerIndice_(c) {
  var it = c.getFilesByName('fichas.json');
  return it.hasNext() ? JSON.parse(it.next().getBlob().getDataAsString('UTF-8')) : [];
}
function escribirIndice_(c, lista) {
  var it = c.getFilesByName('fichas.json');
  var txt = JSON.stringify(lista, null, 2);
  if (it.hasNext()) it.next().setContent(txt); else c.createFile('fichas.json', txt, 'application/json');
}
function listarFichas_() { return leerIndice_(carpetaFichas_()); }
function leerFicha_(id) {
  id = ('0' + String(id || '')).slice(-2);
  var it = carpetaFichas_().getFilesByName(id + '.html');
  if (!it.hasNext()) throw new Error('La ficha ' + id + ' no existe.');
  return it.next().getBlob().getDataAsString('UTF-8');
}
function subirFicha_(d) {
  var m = d.meta || {};
  var id = ('0' + String(m.id || '')).slice(-2);
  if (!/^\d\d$/.test(id)) throw new Error('Nº de sesión no válido.');
  if (!d.html) throw new Error('La ficha está vacía.');
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var c = carpetaFichas_();
    var it = c.getFilesByName(id + '.html');
    if (it.hasNext()) it.next().setContent(d.html);
    else c.createFile(id + '.html', d.html, 'text/html');
    var lista = leerIndice_(c).filter(function (s) { return s.id !== id; });
    lista.push({ id: id, title: m.title || ('Sesión ' + id), date: m.date || '', status: m.status || 'active',
                 desc: m.desc || '', tags: m.tags || ['concept', 'practice'] });
    lista.sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    escribirIndice_(c, lista);
  } finally { lock.releaseLock(); }
  return { ok: true, id: id };
}
function borrarFicha_(d) {
  var id = ('0' + String(d.id || '')).slice(-2);
  var c = carpetaFichas_();
  var it = c.getFilesByName(id + '.html');
  while (it.hasNext()) it.next().setTrashed(true);
  escribirIndice_(c, leerIndice_(c).filter(function (s) { return s.id !== id; }));
  return { ok: true };
}
