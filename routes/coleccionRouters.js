import { Router } from "express";
import checkAuth from "../middleware/checkAuth.js";
import fileUpload from "express-fileupload";
import {
  obtenerColeccion,
  obtenerColeccionProductos,
  obtenerColecciones,
  agregarColeccion,
  actualizarColeccion,
} from "../controllers/coleccionController.js";

const coleccionRouters = Router();

//? http://localhost:4000/api/colecciones

// -------------------- RUTAS PRUBLICAS --------------------

// Agregar una coleccion
coleccionRouters.post(
  "/",
  checkAuth,
  fileUpload({
    useTempFiles: false,
  }),
  agregarColeccion
);
// Obtener las colecciones
coleccionRouters.get("/", obtenerColecciones);

// Obtener los productos de una coleccion
coleccionRouters.get("/:id", obtenerColeccionProductos);

// -------------------- RUTAS PRIVADAS --------------------

// Actualizar una coleccion
coleccionRouters.put(
  "/actualizar/:id",
  checkAuth,
  fileUpload({
    useTempFiles: false,
  }),
  actualizarColeccion
);

// Obtener una coleccion
coleccionRouters.get("/coleccion/:url", checkAuth, obtenerColeccion);
export default coleccionRouters;
