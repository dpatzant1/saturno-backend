/**
 * Utilidades para manejo de fechas en zona horaria de Guatemala
 * Guatemala está en UTC-6 (America/Guatemala)
 */

/**
 * Obtiene la fecha y hora actual en zona horaria de Guatemala
 * @returns {Date} Fecha actual en Guatemala
 */
function obtenerFechaGuatemala() {
  // Crear fecha actual
  const ahora = new Date();
  
  // Convertir a zona horaria de Guatemala
  // Guatemala es UTC-6 (sin horario de verano)
  const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
  const guatemalaOffset = -6 * 60; // -6 horas en minutos
  const guatemalaTime = new Date(utc + (guatemalaOffset * 60000));
  
  return guatemalaTime;
}

/**
 * Obtiene solo la fecha actual en formato YYYY-MM-DD (Guatemala)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
function obtenerFechaHoyGuatemala() {
  const fecha = obtenerFechaGuatemala();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha a zona horaria de Guatemala
 * @param {Date|string} fecha - Fecha a convertir
 * @returns {Date} Fecha en zona horaria de Guatemala
 */
function convertirAGuatemala(fecha) {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const utc = fechaObj.getTime() + (fechaObj.getTimezoneOffset() * 60000);
  const guatemalaOffset = -6 * 60; // -6 horas en minutos
  return new Date(utc + (guatemalaOffset * 60000));
}

/**
 * Obtiene una fecha futura en Guatemala
 * @param {number} dias - Número de días a agregar
 * @returns {Date} Fecha futura en Guatemala
 */
function obtenerFechaFuturaGuatemala(dias) {
  const fecha = obtenerFechaGuatemala();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

/**
 * Formatea una fecha en formato ISO para Guatemala
 * @param {Date} fecha - Fecha a formatear
 * @returns {string} Fecha en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
function formatearISO(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const hours = String(fecha.getHours()).padStart(2, '0');
  const minutes = String(fecha.getMinutes()).padStart(2, '0');
  const seconds = String(fecha.getSeconds()).padStart(2, '0');
  const ms = String(fecha.getMilliseconds()).padStart(3, '0');
  
  // Retornar en formato ISO con zona horaria de Guatemala (UTC-6)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}-06:00`;
}

/**
 * Calcula días entre dos fechas
 * @param {Date|string} fecha1 - Primera fecha
 * @param {Date|string} fecha2 - Segunda fecha
 * @returns {number} Número de días de diferencia
 */
function calcularDiasEntre(fecha1, fecha2) {
  const f1 = typeof fecha1 === 'string' ? new Date(fecha1) : fecha1;
  const f2 = typeof fecha2 === 'string' ? new Date(fecha2) : fecha2;
  const diff = Math.abs(f2 - f1);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

module.exports = {
  obtenerFechaGuatemala,
  obtenerFechaHoyGuatemala,
  convertirAGuatemala,
  obtenerFechaFuturaGuatemala,
  formatearISO,
  calcularDiasEntre
};
