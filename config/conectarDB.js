import mongoose from "mongoose";

// Funcion que conecta la base de datos
const conectarDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const url = `${db.connection.host} : ${db.connection.port}`;
    console.log(`MongoDB conectado en ${url}`);
  } catch (error) {
    console.log(error.message);
    process.exit();
  }
};

export default conectarDB;
