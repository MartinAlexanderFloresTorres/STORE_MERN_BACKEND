import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const productoShema = mongoose.Schema(
  {
    creador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    marca: {
      type: String,
      required: true,
      trim: true,
    },
    unidades: {
      type: Number,
      required: true,
    },
    genero: {
      type: String,
      enum: ["Hombre", "Mujer", "Unisex"],
      required: true,
    },
    descuento: {
      type: String,
      default: "0%",
    },
    precio: {
      type: Number,
      required: true,
    },
    ventas: {
      type: Number,
      default: 0,
    },
    coleccion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coleccion",
      required: true,
    },
    tallas: {
      type: Array,
      required: true,
    },
    colores: {
      type: Array,
      required: true,
    },
    caracteristicas: {
      type: Array,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    informacion: {
      type: String,
      required: true,
      trim: true,
    },
    portadas: {
      type: Array,
      required: true,
    },
    galeria: {
      type: Array,
      required: true,
    },
  },
  {
    // Añade dos columnas de creado y actualizado
    timestamps: true,
  }
);

// Paginación
productoShema.plugin(mongoosePaginate);

const Producto = mongoose.model("Producto", productoShema);

export default Producto;
