import jwt from "jsonwebtoken";

/**
 *  Genera un json web token
 * @param {string} id
 * @returns {object}
 */
const generarJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
};

export default generarJWT;
