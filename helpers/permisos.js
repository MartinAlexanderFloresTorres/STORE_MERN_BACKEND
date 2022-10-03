const permisos = ({ rol }) => {
  const ROLES_CREACION = ["admin", "empresa"];

  return ROLES_CREACION.includes(rol);
};

export default permisos;
