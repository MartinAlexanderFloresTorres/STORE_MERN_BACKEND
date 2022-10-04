import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import conectarDB from "./config/conectarDB.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import productoRoutes from "./routes/productoRoutes.js";
import coleccionRouters from "./routes/coleccionRouters.js";
import pedidosRouter from "./routes/pedidosRouter.js";

const app = express();

// Hablilitar json
app.use(express.json());

// Habilitar form data
app.use(express.urlencoded({ extended: true }));

// Configuracion de env
dotenv.config();

// Configurar cloudinary
cloudinary.config({
  cloud_name: "dcj09lsnh",
  api_key: "222922371987432",
  api_secret: "BN4X5Lz4ItuWmnuZHGp-Ek7Q7XY",
  secure: true,
});

/* // Configurar cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_NAME,
  secure: true,
}); */

// Configuracion de CORS
const dominiosPermitidos = [
  process.env.FRONTEND_URL || "http://127.0.0.1:5173",
];
// Opciones
const corsOpciones = {
  origin: function (origin, callback) {
    if (dominiosPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Dominio no permitido por CORS"));
    }
  },
};
// CORS

app.use(cors(corsOpciones));

// Rutas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/productos", productoRoutes);
app.use("/api/colecciones", coleccionRouters);
app.use("/api/pedidos", pedidosRouter);

// Contectar mongodb
conectarDB();

// Arrancar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, (error) => {
  if (error) return console.log("Hubo un error"), process.exit(1);
  console.log(`El servidor corriendo: http://localhost:${PORT}`);
});
