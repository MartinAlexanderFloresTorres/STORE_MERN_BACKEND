import express from "express";
import {
  registrar,
  confirmarCuenta,
  autenticar,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  perfil,
  actualizarPerfil,
  eliminarCuenta,
  cambiarPassword,
  convertirVendedor,
  actualizarEmpresa,
  obtenerUsuarios,
  cambiarRol,
} from "../controllers/usuarioController.js";
import checkAuth from "../middleware/checkAuth.js";
import fileUpload from "express-fileupload";

const usuarioRoutes = express.Router();

//? http://localhost:4000/api/usuarios

// -------------------- RUTAS PUBLICAS --------------------
// Registrar
usuarioRoutes.post("/registro", registrar);

// Confirmacion de cuenta
usuarioRoutes.get("/registro/:token", confirmarCuenta);

// Olvide password
usuarioRoutes.post("/olvide-password", olvidePassword);

usuarioRoutes
  .route("/olvide-password/:token")
  .get(comprobarToken) // Comprobar token
  .post(nuevoPassword); // Restablecer Password

// Autenticación
usuarioRoutes.post("/autenticar", autenticar);

// -------------------- RUTAS PRIVADAS --------------------

usuarioRoutes
  .route("/perfil")
  .get(checkAuth, perfil) // Obtener Perfil
  .put(
    checkAuth,
    fileUpload({
      useTempFiles: false,
    }),
    actualizarPerfil
  ); // Actualizar Perfil

usuarioRoutes.delete("/perfil/:id", checkAuth, eliminarCuenta); // Eliminar Cuenta
// Cambiar password
usuarioRoutes.put("/perfil/cambiar-password", checkAuth, cambiarPassword);

// Actualizar vendedor
usuarioRoutes.put(
  "/perfil/vendedor/actualizar",
  checkAuth,
  fileUpload({
    useTempFiles: false,
  }),
  actualizarEmpresa
);

// Convertir a vendedor
usuarioRoutes.put(
  "/perfil/vendedor",
  checkAuth,
  fileUpload({
    useTempFiles: false,
  }),
  convertirVendedor
);

// Obtener usuarios
usuarioRoutes.get("/", checkAuth, obtenerUsuarios);

// Cambiar el rol
usuarioRoutes.post("/rol/:id", checkAuth, cambiarRol);

export default usuarioRoutes;
