import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const coleccionShema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    imagen: {
      type: Object,
      required: true,
    },
    banner: {
      type: Object,
      required: true,
    },
    productos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
      },
    ],
  },
  {
    // Añade dos columnas de creado y actualizado
    timestamps: true,
  }
);

// Paginación
coleccionShema.plugin(mongoosePaginate);

const Coleccion = mongoose.model("Coleccion", coleccionShema);

export default Coleccion;
