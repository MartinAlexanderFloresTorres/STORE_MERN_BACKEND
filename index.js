import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { v2 as cloudinary } from 'cloudinary'
import conectarDB from './config/conectarDB.js'
import usuarioRoutes from './routes/usuarioRoutes.js'
import productoRoutes from './routes/productoRoutes.js'
import coleccionRouters from './routes/coleccionRouters.js'
import pedidosRouter from './routes/pedidosRouter.js'

const app = express()

// Hablilitar json
app.use(express.json())

// Habilitar form data
app.use(express.urlencoded({ extended: true }))

// Configuracion de env
dotenv.config()

// Configurar cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_NAME,
  secure: true
})

// CORS
app.use(cors({ origin: '*' }))

// Rutas
app.use('/api/usuarios', usuarioRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/colecciones', coleccionRouters)
app.use('/api/pedidos', pedidosRouter)

// Contectar mongodb
conectarDB()

// Arrancar el servidor
const PORT = process.env.PORT || 4000
app.listen(PORT, (error) => {
  if (error) return console.log('Hubo un error'), process.exit(1)
  console.log(`El servidor corriendo: http://localhost:${PORT}`)
})
