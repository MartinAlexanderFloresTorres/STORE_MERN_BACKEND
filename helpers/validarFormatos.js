/**
 *
 * @param {Object} files - mimetype - Archivos a validar
 * @return {boolean} true si es valido o false si no lo es
 */

function validarFormatos(files) {
  // Fomatos de imagenes permitidas
  const formatos = ["image/webp", "image/jpeg", "image/png", "image/avif"];

  // Validar formatos
  return files.every((file) => formatos.includes(file.mimetype));
}

export default validarFormatos;
