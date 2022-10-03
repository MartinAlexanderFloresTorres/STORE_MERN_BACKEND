import sharp from "sharp";
import fs from "fs";
import Coleccion from "../models/Coleccion.js";
import Producto from "../models/Producto.js";
import uploadImages from "../cloudinary/uploadImages.js";
import validarFormatos from "../helpers/validarFormatos.js";
import generarId from "../helpers/generarId.js";
import deleteImages from "../cloudinary/deleteImages.js";
import uploadVideo from "../cloudinary/uploadVideo.js";
import deleteVideo from "../cloudinary/deleteVideo.js";

// Agregar una coleccion
const agregarColeccion = async (req, res) => {
  let { nombre, encabezado, descripcion } = req.body;
  try {
    // No hay imagenes
    if (!req?.files) {
      const error = new Error("No se envio ninguna imagen o video");
      return res.status(400).json({ msg: error.message });
    }

    const { file } = req.files;

    // Validar formato de la imagen
    if (!validarFormatos([file[0]])) {
      const error = new Error("Formato de imagen no valido");
      return res.status(400).json({ msg: error.message });
    }

    // Validar formato del banner
    if (file[1].mimetype.includes("image")) {
      // Validar formato de la imagen
      if (!validarFormatos([file[1]])) {
        const error = new Error("Formato de imagen del banner no valido");
        return res.status(400).json({ msg: error.message });
      }
    } else if (file[1].mimetype.includes("video")) {
      // Validar formato del video
      if (file[1].mimetype !== "video/mp4") {
        const error = new Error("Formato de video del banner no valido");
        return res.status(400).json({ msg: error.message });
      }
    } else {
      const error = new Error("Formato de archivo no valido");
      return res.status(400).json({ msg: error.message });
    }

    // Validar Campos
    if (!nombre || !encabezado || !descripcion) {
      const error = new Error("Todos los campos son obligatorios");
      return res.status(400).json({ msg: error.message });
    }

    // Convertir el nombre en minusculas
    nombre = nombre.toLowerCase().trim();

    // Validar que no exista una coleccion con el mismo nombre
    const coleccion = await Coleccion.findOne({ nombre });
    if (coleccion) {
      const error = new Error("Ya existe una coleccion con ese nombre");
      return res.status(400).json({ msg: error.message });
    }

    // Promise all para subir las imagenes y el video
    const [args1, args2] = await Promise.all(
      file.map(async (file) => {
        // Generar nombre unico
        const { name, data } = file;
        const id = generarId();
        const nombre_ = name.split(".")[0];
        const ext = `${nombre_}_${id}`;

        // si es imagen
        if (file.mimetype.includes("image")) {
          // Generar un buffer con sharp para optimizar la imagen
          const buffer = await sharp(data).webp({ quality: 50 }).toBuffer();

          // Guardar la imagen en la carpeta uploads
          fs.writeFileSync(`./uploads/${ext}.webp`, buffer);

          // Subir la imagen de la carpeta uploads a cloudinary
          const resultado = await uploadImages({
            path: "./uploads/" + ext + ".webp",
            folder: "fotos_colecciones",
          });

          // Eliminar los archivos temporales de la carpeta uploads
          fs.unlinkSync("./uploads/" + ext + ".webp");

          // Extraer el resultado de cloudinary
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
            ...args
          } = resultado;
          return args;
        } else {
          // Guardar el video en la carpeta uploads
          fs.writeFileSync(`./uploads/${ext}.mp4`, data);

          // Subir el video a la carpeta uploads a cloudinary
          const resultado = await uploadVideo({
            path: "./uploads/" + ext + ".mp4",
            folder: "videos_colecciones",
          });

          // Eliminar los archivos temporales de la carpeta uploads
          fs.unlinkSync("./uploads/" + ext + ".mp4");
          // Extraer el resultado de cloudinary
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
            video,
            frame_rate,
            bit_rate,
            duration,
            rotation,
            nb_frames,
            ...args
          } = resultado;
          return args;
        }
      })
    );

    // Quita todo los caracteres especiales y deja solo las letras y numeros
    const _url = `${nombre.toLowerCase().trim().replace(/ /g, "-")}`.replace(
      /[^a-zA-Z0-9-]/g,
      ""
    );

    // Crear la coleccion
    const coleccionCreada = new Coleccion({
      nombre,
      url: _url,
      imagen: args1,
      banner: {
        data: args2,
        encabezado,
        descripcion,
      },
    });

    // Guardar la coleccion
    const coleccionAlmacenada = await coleccionCreada.save();

    res.json(coleccionAlmacenada);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      msg: "Error inesperado",
    });
  }
};
// Actualizar coleccion
const actualizarColeccion = async (req, res) => {
  let { nombre, encabezado, descripcion } = req.body;
  const { id } = req.params;
  try {
    if (!req?.files) {
      const error = new Error("No se envio ninguna imagen o video");
      return res.status(400).json({ msg: error.message });
    }

    const { file } = req.files;

    // Validar formato de la imagen
    if (!validarFormatos([file[0]])) {
      const error = new Error("Formato de imagen no valido");
      return res.status(400).json({ msg: error.message });
    }

    // Validar formato del banner
    if (file[1].mimetype.includes("image")) {
      // Validar formato de la imagen
      if (!validarFormatos([file[1]])) {
        const error = new Error("Formato de imagen del banner no valido");
        return res.status(400).json({ msg: error.message });
      }
    } else if (file[1].mimetype.includes("video")) {
      // Validar formato del video
      if (file[1].mimetype !== "video/mp4") {
        const error = new Error("Formato de video del banner no valido");
        return res.status(400).json({ msg: error.message });
      }
    } else {
      const error = new Error("Formato de archivo no valido");
      return res.status(400).json({ msg: error.message });
    }

    // Validar Campos
    if (!nombre || !encabezado || !descripcion) {
      const error = new Error("Todos los campos son obligatorios");
      return res.status(400).json({ msg: error.message });
    }

    // Convertir el nombre en minusculas
    nombre = nombre.toLowerCase().trim();

    // si en el nombre hay este signo ? significa que solo quieren actualizar la imagen
    if (!nombre.endsWith("?")) {
      // Validar que no exista una coleccion con el mismo nombre
      const coleccion = await Coleccion.findOne({ nombre });
      if (coleccion) {
        const error = new Error("Ya existe una coleccion con ese nombre");
        return res.status(400).json({ msg: error.message });
      }
    }

    // Obtener la coleccion
    const coleccionEncontrada = await Coleccion.findById(id).populate(
      "productos"
    );

    // Promise all para subir las imagenes y el video
    const [args1, args2] = await Promise.all(
      file.map(async (file) => {
        // Generar nombre unico
        const { name, data } = file;
        const id = generarId();
        const nombre_ = name.split(".")[0];
        const ext = `${nombre_}_${id}`;

        // si es imagen
        if (file.mimetype.includes("image")) {
          // Generar un buffer con sharp para optimizar la imagen
          const buffer = await sharp(data).webp({ quality: 50 }).toBuffer();

          // Guardar la imagen en la carpeta uploads
          fs.writeFileSync(`./uploads/${ext}.webp`, buffer);

          // Subir la imagen de la carpeta uploads a cloudinary
          const resultado = await uploadImages({
            path: "./uploads/" + ext + ".webp",
            folder: "fotos_colecciones",
          });

          // Eliminar los archivos temporales de la carpeta uploads
          fs.unlinkSync("./uploads/" + ext + ".webp");

          // Extraer el resultado de cloudinary
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
            ...args
          } = resultado;
          return args;
        } else {
          // Guardar el video en la carpeta uploads
          fs.writeFileSync(`./uploads/${ext}.mp4`, data);

          // Subir el video a la carpeta uploads a cloudinary
          const resultado = await uploadVideo({
            path: "./uploads/" + ext + ".mp4",
            folder: "videos_colecciones",
          });

          // Eliminar los archivos temporales de la carpeta uploads
          fs.unlinkSync("./uploads/" + ext + ".mp4");
          // Extraer el resultado de cloudinary
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
            video,
            frame_rate,
            bit_rate,
            duration,
            rotation,
            nb_frames,
            ...args
          } = resultado;
          return args;
        }
      })
    );

    // Promise all para eliminar las imagenes y el video
    await Promise.all([
      // Eliminar la imagen anterior de cloudinary
      await deleteImages({
        public_id: coleccionEncontrada.imagen.public_id,
        folder: "fotos_colecciones",
      }),
      // Eliminar el video anterior de cloudinary
      await deleteVideo({
        public_id: coleccionEncontrada.banner.data.public_id,
        folder: "videos_colecciones",
      }),
    ]);

    // Quita todo los caracteres especiales y deja solo las letras y numeros
    const _url = `${nombre.toLowerCase().trim().replace(/ /g, "-")}`.replace(
      /[^a-zA-Z0-9-]/g,
      ""
    );

    // Actualizar la coleccion
    if (!nombre.endsWith("?")) {
      coleccionEncontrada.nombre = nombre;
      coleccionEncontrada.url = _url;
    }

    coleccionEncontrada.imagen = args1;
    coleccionEncontrada.banner = {
      data: args2,
      encabezado,
      descripcion,
    };
    // Guardar la coleccion
    const coleccionActualizada = await coleccionEncontrada.save();

    // Respuesta
    res.json(coleccionActualizada);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      msg: error.message,
    });
  }
};

// obtener las colecciones
const obtenerColecciones = async (req, res) => {
  try {
    // traer todas las colecciones pero solo traer 10 productos de cada coleccion
    const colecciones = await Coleccion.find().populate({
      path: "productos",
      options: { limit: 10 },
      select: "portadas nombre precio descuento marca unidades url _id",
    });

    /* const colecciones = await Coleccion.find().populate("productos"); */
    if (colecciones.length === 0) {
      const error = new Error("No hay colecciones por el momento");
      return res.status(404).json({ msg: error.message });
    }

    res.json(colecciones);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// obtener una coleccion
const obtenerColeccionProductos = async (req, res) => {
  const { id } = req.params;

  // agregar la paginacion de mongoose-paginate-v2
  const page = parseInt(req.query.page) || 1;

  // traer los productos por el genero
  const genero = req.query.genero || "Hombre";

  // Si genero es invalido enviar error
  if (genero !== "Hombre" && genero !== "Mujer" && genero !== "Unisex") {
    const error = new Error("El genero no es valido");
    return res.status(400).json({ msg: error.message });
  }

  const limit = 12;

  /* 
   (Filtros)
   1- mas vendidos
   2- A-Z
   3- Z-A
   4- Descuentos de mayor a menor
   5- Descuentos de menor a mayor
   6- precio mejor a mayor
   7- precio mayor a menor
   8- Fecha de antigua a reciente
   9- Fecha de reciente a antiguo
   10- genero - Hombre - Mujer - Unisex
  */

  try {
    // filtrar lo mas vendidos
    if (req.query.orden === "mas-vendidos") {
      // traer productos mas vendidos y por el genero
      // si genero es unisex traer todos los productos de todos los generos
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { ventas: -1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por A-Z
    else if (req.query.orden === "A-Z") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { nombre: 1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por Z-A
    else if (req.query.orden === "Z-A") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { nombre: -1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de mayor a menor
    else if (req.query.orden === "descuento-mayor-menor") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { descuento: -1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de menor a mayor
    else if (req.query.orden === "descuento-menor-mayor") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { descuento: 1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de menor a mayor
    else if (req.query.orden === "precio-menor-mayor") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { precio: 1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de mayor a menor
    else if (req.query.orden === "precio-mayor-menor") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { precio: -1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de antigua a reciente
    else if (req.query.orden === "fecha-antigua-reciente") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { createdAt: 1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de reciente a antigua
    else if (req.query.orden === "fecha-reciente-antigua") {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          sort: { createdAt: -1 },
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // si no hay orden
    else {
      const productos = await Producto.paginate(
        genero === "Unisex" ? { coleccion: id } : { coleccion: id, genero },
        {
          page,
          limit,
          select: "portadas nombre precio descuento marca unidades url _id",
        }
      );

      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error("No se encontraron productos");
        return res.status(404).json({ msg: error.message });
      }

      res.json(productos);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: "ID no valido" });
  }
};

// obtener una coleccion
const obtenerColeccion = async (req, res) => {
  const { url } = req.params;

  try {
    const coleccion = await Coleccion.findOne({ url }).select("-productos");
    if (!coleccion) {
      const error = new Error("La coleccion no existe");
      return res.status(404).json({ msg: error.message });
    }
    res.json(coleccion);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

export {
  obtenerColeccion,
  obtenerColecciones,
  agregarColeccion,
  actualizarColeccion,
  obtenerColeccionProductos,
};
