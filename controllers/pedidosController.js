import Pedido from "../models/Pedido.js";
import Producto from "../models/Producto.js";

// realizar los pedidos
const realizarPedido = async (req, res) => {
  const { usuario } = req;

  const { datos, productos, total } = req.body;
  try {
    // crear el pedido
    const pedido = new Pedido({
      cliente: usuario._id,
      datos,
      productos,
      total,
    });

    // Aumentar la cantidad de las ventas de los productos
    await Promise.all([
      productos.map(async (producto) => {
        const { _id, cantidad } = producto;
        const productoDB = await Producto.findById(_id);

        // Si el producto no existe
        if (!productoDB) {
          return res.status(400).json({
            msg: `El producto no existe`,
          });
        }

        // Si el producto no tiene stock
        if (productoDB.unidades < cantidad) {
          return res.status(400).json({
            msg: `El producto ${productoDB.nombre} no tiene stock (Agotado)`,
          });
        }

        productoDB.unidades -= cantidad;
        productoDB.ventas += cantidad;
        await productoDB.save();
      }),
      await pedido.save(),
    ]);

    // Respuesta
    res.json({
      msg: "Pedido realizado correctamente",
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// obtener los pedidos del usuario
const obtenerPedidos = async (req, res) => {
  const { usuario } = req;
  const { page = 1 } = req.query;

  const limit = 1;
  try {
    const pedidos = await Pedido.paginate(
      { cliente: usuario._id },
      {
        limit,
        page,
      }
    );

    // Si no hay pedidos
    if (pedidos.docs.length === 0) {
      return res.json({ msg: "Aún no hay pedidos", ...pedidos });
    }

    res.json(pedidos);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

// obtener todos los pedidos vendidos solo del creador
const obtenerPedidosVendidos = async (req, res) => {
  const { usuario } = req;
  const { page = 1 } = req.query;

  const limit = 10;
  try {
    // Obtener los productos vendidos solo del creador
    const productos = await Producto.paginate(
      { creador: usuario._id, ventas: { $gt: 0 } },
      {
        limit,
        page,
      }
    );

    res.json(productos);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ msg: error.message });
  }
};

export { realizarPedido, obtenerPedidos, obtenerPedidosVendidos };
