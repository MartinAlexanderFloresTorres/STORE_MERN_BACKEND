const generarToken = () => {
  const fecha = Date.now().toString(32).substring(2);
  const ramdom = Math.random().toString(32).substring(2);
  return fecha + ramdom;
};

export default generarToken;
