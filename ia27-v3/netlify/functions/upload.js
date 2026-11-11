/**
 * Netlify Function: upload.js
 * Proxy para subir archivos a Google Drive via Apps Script
 * Evita exponer la URL del Web App en el frontend
 *
 * POST /api/upload
 * Body: { fileName, mimeType, base64, alumno, sesion }
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const DRIVE_URL = process.env.DRIVE_WEBAPP_URL;
  if (!DRIVE_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'DRIVE_WEBAPP_URL not configured' }) };
  }

  try {
    const payload = JSON.parse(event.body);
    const response = await fetch(DRIVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.text();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
