import { Router } from 'express';
import {
  crearProducto,
  obtenerProductos,
  obtenerProducto,
  actualizarProducto,
  buscarProductos,
  eliminarProducto,
  obtenerOfertas,
  obtenerProductosCreador,
  actualizarStock,
  buscarProductosByCategory,
} from '../controllers/productosController.js';
import checkAuth from '../middleware/checkAuth.js';
import uploads from '../middleware/uploads.js';
import fileUpload from 'express-fileupload';

const productoRoutes = Router();

//? http://localhost:4000/api/productos

// -------------------- RUTAS PRIVADAS --------------------

// Crear producto
productoRoutes.post(
  '/',
  checkAuth,
  fileUpload({
    useTempFiles: false,
  }),
  uploads,
  crearProducto,
);

// Actualizar un producto por su id
productoRoutes.put(
  '/:id',
  checkAuth,
  fileUpload({
    useTempFiles: false,
  }),
  uploads,
  actualizarProducto,
);

// Acualizar stock
productoRoutes.patch('/stock/:id', actualizarStock);

// Obtener todos los productos
productoRoutes.get('/', obtenerProductos);

// Obtener un producto por su url
productoRoutes.get('/:url', obtenerProducto);

// Eliminar un producto por su id
productoRoutes.delete('/:id', checkAuth, eliminarProducto);

// Buscar productos por nombre
productoRoutes.get('/search/producto', buscarProductos);

// Buscar productos por nombre y categoria
productoRoutes.get('/search/producto/:coleccionId', buscarProductosByCategory);

// Obtener las ofertas
productoRoutes.get('/ofertas/semana', obtenerOfertas);

// Obtener los productos creados por un usuario
productoRoutes.get('/creador/productos', checkAuth, obtenerProductosCreador);

export default productoRoutes;
