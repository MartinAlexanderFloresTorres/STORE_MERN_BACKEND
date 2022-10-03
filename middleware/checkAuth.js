import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const checkAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  let token = null;

  // Si hay una authorizatio, Token con el Bearer
  if (
    authorization &&
    authorization?.startsWith("Bearer") &&
    authorization?.split(" ")[1]
  ) {
    try {
      // Token
      token = authorization?.split(" ")[1];

      // Comprobar token
      const { id } = await jwt.verify(token, process.env.JWT_SECRET);

      // Buscar Usuario
      const usuario = await Usuario.findById(id).select(
        "-password -token -confirmado -createdAt -updatedAt -__v"
      );

      // El usuario no existe¡
      if (!usuario) {
        const error = new Error("El usuario no existe");
        return res.status(404).json({ msg: error.message });
      }

      // añadir el usuario el request
      req.usuario = usuario;
      return next();
    } catch (e) {
      const error = new Error("Token no válido");
      return res.status(403).json({ msg: error.message });
    }
  }

  // Token no existe¡
  if (!token) {
    const error = new Error("Token requerido");
    return res.status(403).json({ msg: error.message });
  }

  next();
};

export default checkAuth;
