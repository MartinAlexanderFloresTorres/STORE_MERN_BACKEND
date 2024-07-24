import Producto from '../models/Producto.js';
import deleteImages from '../cloudinary/deleteImages.js';
import Coleccion from '../models/Coleccion.js';
import generarId from '../helpers/generarId.js';

// Crear producto
const crearProducto = async (req, res) => {
  const { usuario } = req;
  const { portadas, galeria } = req;
  const { nombre, marca, unidades, descuento, precio, coleccion, tallas, colores, genero, caracteristicas, descripcion, informacion } = req.body;

  try {
    // Traer la coleccion
    const coleccionSelect = await Coleccion.findById(coleccion);

    // Coleccion no existe
    if (!coleccionSelect || usuario.empresa.productosCreados > 6) {
      // Eliminar las imagenes de cloudinary
      await Promise.all(
        productoCreado.galeria.map(async (file) => {
          const { public_id } = file;
          return await deleteImages({ public_id, folder: 'productos' });
        }),
      );

      // Productos creados al maximo
      if (usuario.empresa.productosCreados > 6) {
        const error = new Error('Lo sentimos a llegado a su maximo de crear 6 productos');
        return res.status(401).json({ msg: error.message });
      }
      if (!coleccionSelect) {
        const error = new Error('La coleccion no existe');
        return res.status(404).json({ msg: error.message });
      }
    }

    // Quita todo los caracteres especiales y deja solo las letras y numeros
    const _url = `${nombre.toLowerCase().trim().replace(/ /g, '-')}${generarId()}`.replace(/[^a-zA-Z0-9-]/g, '');

    // crear producto
    const productoCreado = new Producto({
      creador: usuario._id,
      nombre,
      url: _url,
      marca,
      unidades,
      descuento,
      precio,
      coleccion: coleccionSelect._id,
      tallas,
      colores,
      caracteristicas,
      descripcion,
      genero,
      informacion,
      portadas,
      galeria,
    });

    // Aumentar el contador
    usuario.empresa.productosCreados += 1;

    // Guardar el producto en la coleccion
    coleccionSelect.productos.push(productoCreado._id);

    // Almacenar la coleccion y el producto
    const [, productoAlmacenado] = await Promise.all([await coleccionSelect.save(), await productoCreado.save(), await usuario.save()]);

    res.json(productoAlmacenado);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Actualizar un producto por su id
const actualizarProducto = async (req, res) => {
  const { nombre, marca, unidades, descuento, precio, coleccion, tallas, colores, genero, caracteristicas, descripcion, informacion } = req.body;

  const { producto, portadas, galeria } = req;

  try {
    // Traer la coleccion
    const coleccionSelect = await Coleccion.findById(coleccion);

    // No hay coleccion¡
    if (!coleccionSelect) {
      const error = new Error('La coleccion del producto no existe');
      return res.status(404).json({ msg: error.message });
    }

    // la coleccion es direrente que elimine la coleccion actual del producto
    if (producto.coleccion._id.toString() !== coleccion) {
      const coleccionDelete = await Coleccion.findById(producto.coleccion._id.toString());
      // Eliminar el producto de la colecciones
      coleccionDelete.productos.pull(producto._id);
      // Buscar la coleccion para guardar el producto
      coleccionSelect.productos.push(producto._id);
      await Promise.all([await coleccionDelete.save(), await coleccionSelect.save()]);
    }
    // Eliminar las imagenes de cloudinary
    await Promise.all(
      producto.galeria.map(async (file) => {
        const { public_id } = file;
        await deleteImages({ public_id, folder: 'productos' });
      }),
    );

    // Quita todo los caracteres especiales y deja solo las letras y numeros
    const _url = `${nombre.toLowerCase().trim().replace(/ /g, '-')}${generarId()}`.replace(/[^a-zA-Z0-9-]/g, '');

    // Actualizar producto
    producto.nombre = nombre;
    producto.url = _url;
    producto.marca = marca;
    producto.unidades = unidades;
    producto.descuento = descuento;
    producto.precio = precio;
    producto.coleccion = coleccion;
    producto.tallas = tallas;
    producto.colores = colores;
    producto.genero = genero;
    producto.caracteristicas = caracteristicas;
    producto.descripcion = descripcion;
    producto.informacion = informacion;
    producto.portadas = portadas;
    producto.galeria = galeria;

    // Almacenar producto
    const productoActualizado = await producto.save();

    // Respuesta
    res.json(productoActualizado);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  // agregar la paginacion de mongoose-paginate-v2
  const page = parseInt(req.query.page) || 1;

  // traer los productos por el genero
  const genero = req.query.genero || 'Hombre';

  // Si genero es invalido enviar error
  if (genero !== 'Hombre' && genero !== 'Mujer' && genero !== 'Unisex') {
    const error = new Error('El genero no es valido');
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
    if (req.query.orden === 'mas-vendidos') {
      // traer productos mas vendidos y por el genero
      // si genero es unisex traer todos los productos de todos los generos
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { ventas: -1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por A-Z
    else if (req.query.orden === 'A-Z') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { nombre: 1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por Z-A
    else if (req.query.orden === 'Z-A') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { nombre: -1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de mayor a menor
    else if (req.query.orden === 'descuento-mayor-menor') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { descuento: -1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de menor a mayor
    else if (req.query.orden === 'descuento-menor-mayor') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { descuento: 1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de menor a mayor
    else if (req.query.orden === 'precio-menor-mayor') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { precio: 1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de mayor a menor
    else if (req.query.orden === 'precio-mayor-menor') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { precio: -1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de antigua a reciente
    else if (req.query.orden === 'fecha-antigua-reciente') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { createdAt: 1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de reciente a antigua
    else if (req.query.orden === 'fecha-reciente-antigua') {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, {
        page,
        limit,
        sort: { createdAt: -1 },
      });
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // si no hay orden
    else {
      const productos = await Producto.paginate(genero === 'Unisex' ? null : { genero }, { page, limit });

      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }

      res.json(productos);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Obtener un producto por su id
const obtenerProducto = async (req, res) => {
  const { url } = req.params;

  try {
    const producto = await Producto.findOne({ url })
      .populate('creador')
      // de la coleccion solo quiero el nombre, url y _id
      .populate('coleccion', 'nombre _id url');

    // No Hay producto¡
    if (!producto) {
      const error = new Error('No se a encontrado el producto');
      return res.status(404).json({ msg: error.message });
    }

    const obtj = {
      _id: producto._id,
      caracteristicas: producto.caracteristicas,
      coleccion: producto.coleccion,
      colores: producto.colores,
      creador: {
        _id: producto.creador._id,
        nombre: producto.creador.nombre,
        apellido: producto.creador.apellido,
        empresa: producto.creador.empresa,
        imagen: producto.creador.imagen,
        email: producto.creador.email,
        pais: producto.creador.paisEmpresa,
        ciudad: producto.creador.ciudadEmpresa,
        codigoPostal: producto.creador.codigoPostalEmpresa,
      },
      createdAt: producto.createdAt,
      descripcion: producto.descripcion,
      descuento: producto.descuento,
      empresa: producto.empresa,
      galeria: producto.galeria,
      genero: producto.genero,
      informacion: producto.informacion,
      marca: producto.marca,
      nombre: producto.nombre,
      portadas: producto.portadas,
      precio: producto.precio,
      tallas: producto.tallas,
      unidades: producto.unidades,
      updatedAt: producto.updatedAt,
      url: producto.url,
      ventas: producto.ventas,
    };
    res.json(obtj);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Buscar  productos por su nombre
const buscarProductos = async (req, res) => {
  const { q = '', orden } = req.query;

  // agregar la paginacion de mongoose-paginate-v2
  const page = parseInt(req.query.page) || 1;

  // traer los productos por el genero
  const genero = req.query.genero || 'Hombre';

  // Si genero es invalido enviar error
  if (genero !== 'Hombre' && genero !== 'Mujer' && genero !== 'Unisex') {
    const error = new Error('El genero no es valido');
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
    // Buscar productos

    const regex = new RegExp(q, 'i');
    // filtar por busqueda y ordenar por los filtros
    if (orden) {
      // filtrar lo mas vendidos
      if (orden === 'mas-vendidos') {
        // si genero es unisex traer todos los productos de todos los generos
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },
          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { ventas: -1 },
          },
        );

        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por A-Z
      else if (orden === 'A-Z') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },
          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { nombre: 1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por Z-A
      else if (orden === 'Z-A') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },
          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { nombre: -1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por descuentos de mayor a menor
      else if (orden === 'descuento-mayor-menor') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },

          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { descuento: -1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por descuentos de menor a mayor
      else if (orden === 'descuento-menor-mayor') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },

          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { descuento: 1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por precio de menor a mayor
      else if (orden === 'precio-menor-mayor') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },

          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { precio: 1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por precio de mayor a menor
      else if (orden === 'precio-mayor-menor') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },

          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { precio: -1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por fecha de antigua a reciente
      else if (orden === 'fecha-antigua-reciente') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },

          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { createdAt: 1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      }
      // filtrar por fecha de reciente a antigua
      else if (orden === 'fecha-reciente-antigua') {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },

          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { createdAt: -1 },
          },
        );
        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron productos de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
        res.json(productos);
      } else {
        const productos = await Producto.paginate(
          genero === 'Unisex'
            ? {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              }
            : {
                $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
                genero,
              },
          {
            page,
            limit,
            select: 'portadas nombre precio descuento marca unidades url _id',
            sort: { ventas: -1 },
          },
        );

        // No Hay productos¡
        if (productos.docs.length === 0) {
          const error = new Error('No se encontraron resultados de la busqueda ' + q);
          return res.status(404).json({ msg: error.message });
        }
      }
    } else {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? {
              $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
            }
          : {
              $or: [{ nombre: regex }, { descripcion: regex }, { informacion: regex }],
              genero,
            },
        {
          page,
          limit,
          select: 'portadas nombre precio descuento marca unidades url _id',
          sort: { ventas: -1 },
        },
      );

      // No Hay productos¡
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron resultados de la busqueda ' + q);
        return res.status(404).json({ msg: error.message });
      }

      // Enviar productos
      res.json(productos);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Eliminar un producto por su id
const eliminarProducto = async (req, res) => {
  const { usuario } = req;
  const { id } = req.params;

  try {
    const producto = await Producto.findById(id);

    // Producto no existe¡
    if (!producto) {
      const error = new Error('Producto no existe');
      return res.status(404).json({ msg: error.message });
    }

    // Traer la coleccion
    const coleccionSelect = await Coleccion.findById(producto.coleccion);

    // No hay coleccion¡
    if (!coleccionSelect) {
      const error = new Error('La coleccion del producto no existe');
      return res.status(404).json({ msg: error.message });
    }

    // Eliminar el producto de la colecciones
    coleccionSelect.productos.pull(producto._id);

    // Eliminar las imagenes de cloudinary
    await Promise.all(
      producto.galeria.map(async (file) => {
        const { public_id } = file;
        return await deleteImages({ public_id, folder: 'productos' });
      }),
    );
    // Disminuir el contador
    usuario.productosCreados -= 1;
    // Actualizar la coleccion y  Eliminar producto
    await Promise.all([await coleccionSelect.save(), await producto.deleteOne(), await usuario.save()]);
    res.json({ msg: 'El producto a sido eliminado correctamente' });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Obtener las ofertas de la colecciones
const obtenerOfertas = async (req, res) => {
  // agregar la paginacion de mongoose-paginate-v2
  const page = parseInt(req.query.page) || 1;

  // traer los productos por el genero
  const genero = req.query.genero || 'Hombre';

  // Si genero es invalido enviar error
  if (genero !== 'Hombre' && genero !== 'Mujer' && genero !== 'Unisex') {
    const error = new Error('El genero no es valido');
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
    if (req.query.orden === 'mas-vendidos') {
      // traer productos mas vendidos y por el genero
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { ventas: -1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por A-Z
    else if (req.query.orden === 'A-Z') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { nombre: 1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por Z-A
    else if (req.query.orden === 'Z-A') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { nombre: -1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de mayor a menor
    else if (req.query.orden === 'descuento-mayor-menor') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de menor a mayor
    else if (req.query.orden === 'descuento-menor-mayor') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { descuento: 1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de menor a mayor
    else if (req.query.orden === 'precio-menor-mayor') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { precio: 1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de mayor a menor
    else if (req.query.orden === 'precio-mayor-menor') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { precio: -1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de antigua a reciente
    else if (req.query.orden === 'fecha-antigua-reciente') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { createdAt: 1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de reciente a antigua
    else if (req.query.orden === 'fecha-reciente-antigua') {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { createdAt: -1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // si no hay orden
    else {
      const productos = await Producto.paginate(
        genero === 'Unisex'
          ? { descuento: { $gt: 0 }, unidades: { $gt: 0 } }
          : {
              descuento: { $gt: 0 },
              unidades: { $gt: 0 },
              genero,
            },
        {
          page,
          limit,
          sort: { createdAt: -1, descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );

      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }

      res.json(productos);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Obtener los productos del creador
const obtenerProductosCreador = async (req, res) => {
  try {
    const { _id } = req.usuario;

    // agregar la paginacion de mongoose-paginate-v2
    const page = parseInt(req.query.page) || 1;

    // traer los productos por el genero
    const genero = req.query.genero || 'Hombre';

    // Si genero es invalido enviar error
    if (genero !== 'Hombre' && genero !== 'Mujer' && genero !== 'Unisex') {
      const error = new Error('El genero no es valido');
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
    // filtrar lo mas vendidos
    if (req.query.orden === 'mas-vendidos') {
      // traer productos mas vendidos y por el genero
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { ventas: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por A-Z
    else if (req.query.orden === 'A-Z') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { nombre: 1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por Z-A
    else if (req.query.orden === 'Z-A') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { nombre: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de mayor a menor
    else if (req.query.orden === 'descuento-mayor-menor') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { descuento: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por descuentos de menor a mayor
    else if (req.query.orden === 'descuento-menor-mayor') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { descuento: 1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de menor a mayor
    else if (req.query.orden === 'precio-menor-mayor') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { precio: 1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por precio de mayor a menor
    else if (req.query.orden === 'precio-mayor-menor') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { precio: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de antigua a reciente
    else if (req.query.orden === 'fecha-antigua-reciente') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { createdAt: 1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // filtrar por fecha de reciente a antigua
    else if (req.query.orden === 'fecha-reciente-antigua') {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          sort: { createdAt: -1 },
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );
      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }
      res.json(productos);
    }
    // si no hay orden
    else {
      const productos = await Producto.paginate(
        { creador: _id, genero },
        {
          page,
          limit,
          select: 'portadas nombre precio descuento marca unidades url _id',
        },
      );

      // si no hay productos
      if (productos.docs.length === 0) {
        const error = new Error('No se encontraron productos');
        return res.status(404).json({ msg: error.message });
      }

      res.json(productos);
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// Exportar las funciones
export { crearProducto, obtenerProductos, obtenerProducto, actualizarProducto, buscarProductos, eliminarProducto, obtenerOfertas, obtenerProductosCreador };
