import { Router } from "express";
import {
  realizarPedido,
  obtenerPedidos,
  obtenerPedidosVendidos,
} from "../controllers/pedidosController.js";
import checkAuth from "../middleware/checkAuth.js";

const pedidosRouter = Router();

//? http://localhost:4000/api/pedidos

// -------------------- RUTAS PRIVADAS --------------------

// Obtener los pedidos del usuario
pedidosRouter.get("/", checkAuth, obtenerPedidos);

// Realizar pedidos
pedidosRouter.post("/", checkAuth, realizarPedido);

// Obtener todos los pedidos vendidos
pedidosRouter.get("/ventas", checkAuth, obtenerPedidosVendidos);

export default pedidosRouter;
