const validarRol = ({ rol }) => {
  const roles = ["admin", "usuario", "empresa"];
  return roles.includes(rol);
};

export default validarRol;
