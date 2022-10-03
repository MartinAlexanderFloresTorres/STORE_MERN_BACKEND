import Producto from "../models/Producto.js";
import sharp from "sharp";
import uploadImages from "../cloudinary/uploadImages.js";
import validarFormatos from "../helpers/validarFormatos.js";
import generarId from "../helpers/generarId.js";
import fs from "fs";
import permisos from "../helpers/permisos.js";

const uploads = async (req, res, next) => {
  const { usuario } = req;
  const {
    nombre,
    marca,
    unidades,
    descuento,
    precio,
    coleccion,
    tallas,
    colores,
    genero,
    caracteristicas,
    descripcion,
    informacion,
  } = req.body;

  // Campos vacios¡
  if (
    !nombre ||
    !marca ||
    !unidades ||
    !descuento ||
    !precio ||
    !coleccion ||
    !tallas ||
    !colores ||
    !genero ||
    !caracteristicas ||
    !descripcion ||
    !informacion
  ) {
    const error = new Error("Faltan campos que son requeridos");
    return res.status(402).json({ msg: error.message });
  }

  // Si genero es invalido enviar error
  if (genero !== "Hombre" && genero !== "Mujer" && genero !== "Unisex") {
    const error = new Error("El genero no es valido");
    return res.status(400).json({ msg: error.message });
  }

  // El usuario no es admin
  if (!permisos({ rol: usuario.rol })) {
    const error = new Error("No tienes permisos para realizar esta acción");
    return res.status(400).json({ msg: error.message });
  }

  // Metodo para verificar el id valido
  const method = req.method;
  if (method === "PUT") {
    const { id } = req.params;
    try {
      const producto = await Producto.findById(id).populate("coleccion");

      // Producto no existe¡
      if (!producto) {
        const error = new Error("Producto no existe");
        return res.status(404).json({ msg: error.message });
      }
      req.producto = producto;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Error al buscar producto" });
    }
  }

  // Parsear los valores de los array
  req.body.tallas = JSON.parse(req.body.tallas);
  req.body.colores = JSON.parse(req.body.colores);
  req.body.caracteristicas = JSON.parse(req.body.caracteristicas);

  // No hay archivos
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(402).json({ msg: "No hay archivos que subir." });
  }

  const { file } = req.files;

  // No hay imagenes
  if (!file) {
    return res.status(402).json({
      msg: "Las imagenes son requeridas",
    });
  }

  // Las imagenes deben tener minimo 2 imagenes y maximo 6
  if (file.length < 4 && file.length < 7) {
    // No hay galeria minimo 3 imagenes
    return res.status(402).json({
      msg: "Las imagenes deben tener minimo 4 y maximos 6 imagenes",
    });
  }

  // Validar formatos de las imagenes -> Si no es valido
  if (!validarFormatos(file)) {
    return res.status(402).json({
      msg: "Formato de archivo no permitido",
    });
  }

  // Subir imagenes a cloudinary
  const imagenes = await Promise.all(
    file.map(async (file) => {
      const { data, name } = file;

      // Generar nombre unico
      const id = generarId();
      const nombre = name.split(".")[0];
      const ext = `${nombre}_${id}`;

      // Generar un buffer con sharp para optimizar la imagen
      const buffer = await sharp(data).webp({ quality: 70 }).toBuffer();

      // Guardar la imagen en la carpeta uploads
      fs.writeFileSync(`./uploads/${ext}.webp`, buffer);

      // Subir la imagen de la carpeta uploads a cloudinary
      const resultado = await uploadImages({
        path: "./uploads/" + ext + ".webp",
        folder: "productos",
      });

      // Eliminar los archivos temporales de la carpeta uploads
      fs.unlinkSync("./uploads/" + ext + ".webp");

      // retornar el resultado de cloudinary
      const {
        api_key,
        signature,
        version_id,
        version,
        created_at,
        tags,
        pages,
        etag,
        placeholder,
        url,
        type,
        resource_type,
        access_mode,
        bytes,
        folder,
        format,
        height,
        width,
        ...args
      } = resultado;
      return args;
    })
  );

  // Guardar las imagenes en el req
  req.portadas = imagenes.slice(0, 2);
  req.galeria = imagenes;

  // Ir al siguiente middleware
  return next();
};

export default uploads;
