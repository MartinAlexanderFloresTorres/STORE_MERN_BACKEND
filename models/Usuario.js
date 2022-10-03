import bcrypt from "bcrypt";
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import generarId from "../helpers/generarId.js";

const usuarioShema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
    imagen: {
      type: Object,
      default: {
        asset_id: generarId(),
        original_filename: `userdefaul_${generarId()}`,
        public_id: generarId(),
        secure_url:
          "https://res.cloudinary.com/dcj09lsnh/image/upload/v1663819464/hlpiqgelomlsx0ujotx2.svg",
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      default: null,
    },
    fechaNacimiento: {
      type: Date,
      required: true,
    },
    genero: {
      type: String,
      enum: ["Hombre", "Mujer", "Unisex"],
      default: "Unisex",
      required: true,
    },
    token: {
      type: String,
      default: null,
    },
    confirmado: {
      type: Boolean,
      default: false,
    },
    empresa: {
      type: Object,
      default: null,
    },
    rol: {
      type: String,
      enum: ["admin", "usuario", "empresa"],
      default: "usuario",
    },
  },
  {
    // crea dos columnas de creado y actualizado
    timestamps: true,
  }
);

// Añadir el plugin de paginación
usuarioShema.plugin(mongoosePaginate);

// Encriptar el password antes de almacenarlo
usuarioShema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const saltRounds = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Comprobar password
usuarioShema.methods.comprobarPassword = async function (passwordForm) {
  return await bcrypt.compare(passwordForm, this.password);
};

// Crear el modelo
const Usuario = mongoose.model("Usuario", usuarioShema);

export default Usuario;
