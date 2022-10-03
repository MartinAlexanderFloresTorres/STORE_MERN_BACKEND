import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const pedidoShema = mongoose.Schema(
  {
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    productos: {
      type: Array,
      required: true,
      default: [],
    },
    total: {
      type: Number,
      required: true,
    },
  },
  {
    // Añade dos columnas de creado y actualizado
    timestamps: true,
  }
);

// Paginación
pedidoShema.plugin(mongoosePaginate);

const Pedido = mongoose.model("Pedido", pedidoShema);

export default Pedido;
