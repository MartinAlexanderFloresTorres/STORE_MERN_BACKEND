import fs from "fs";
import sharp from "sharp";
import Usuario from "../models/Usuario.js";
import generarToken from "../helpers/generarToken.js";
import generarJWT from "../helpers/generarJWT.js";
import uploadImages from "../cloudinary/uploadImages.js";
import validarFormatos from "../helpers/validarFormatos.js";
import generarId from "../helpers/generarId.js";
import deleteImages from "../cloudinary/deleteImages.js";
import validarRol from "../helpers/validarRol.js";
import emailRegistro from "../email/emailRegistro.js";
import emailOlvidePassword from "../email/emailOlvidePassword.js";

// Registrar
const registrar = async (req, res) => {
  const { nombre, apellidos, email, fechaNacimiento, genero, password } =
    req.body;

  try {
    // Campos vacios¡
    if (
      !nombre ||
      !apellidos ||
      !email ||
      !fechaNacimiento ||
      !genero ||
      !password
    ) {
      const error = new Error("Faltan campos de registro");
      return res.status(401).json({ msg: error.message });
    }

    // Buscar Usuario
    const usuario = await Usuario.findOne({ email });

    // El usuario ya existe¡
    if (usuario) {
      const error = new Error("El email ya esta registrado");
      return res.status(403).json({ msg: error.message });
    }

    // Crear usuario
    const user = {
      nombre,
      apellidos,
      email,
      fechaNacimiento,
      genero,
      password,
      token: generarToken(),
    };
    const nuevoUsuario = new Usuario(user);

    // Amacenar usuario
    await nuevoUsuario.save();

    emailRegistro(user);

    // Retornar mensaje
    res.json({
      msg: "Su cuenta a sido creada correctamente, Le hemos enviado un email para confirmar su cuenta, Gracias.",
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Confirmar Cuenta
const confirmarCuenta = async (req, res) => {
  const { token } = req.params;

  try {
    // Buscar Usuario
    const usuario = await Usuario.findOne({ token });

    // Token válido¡
    if (!usuario) {
      const error = new Error("Token no válido");
      return res.status(404).json({ msg: error.message });
    }

    // Confirmar usuario
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    // Retornar mensaje
    res.json({
      msg: "Su cuenta a sido confirmada correctamente. Ya puedes Iniciar Sesión",
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Olvide Password
const olvidePassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Email vacio¡
    if (!email) {
      const error = new Error("El email es requerido");
      return res.status(401).json({ msg: error.message });
    }

    // Buscar Usuario
    const usuario = await Usuario.findOne({ email });

    // El usuario no existe¡
    if (!usuario) {
      const error = new Error("El usuario no existe");
      return res.status(404).json({ msg: error.message });
    }

    // El usuario no esta confirmado
    if (!usuario.confirmado) {
      const error = new Error(
        "El usuario no a confirmado su cuenta, Por favor confirmarlo primero"
      );
      return res.status(403).json({ msg: error.message });
    }

    // Generar nuevo token
    usuario.token = generarToken();

    // Amacenar usuario
    await usuario.save();

    emailOlvidePassword(usuario);
    // Retornar mensaje
    res.json({
      msg: "Hemos enviado un email con las instruciónes para restablecer su password, Gracias.",
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Comprobar token
const comprobarToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Buscar Usuario
    const usuario = await Usuario.findOne({ token });

    // Token válido¡
    if (!usuario) {
      const error = new Error("Token no válido");
      return res.status(404).json({ msg: error.message });
    }

    // Retornar mensaje
    res.json({
      msg: "Token valido",
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Restablecer Password
const nuevoPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Password vacio¡
    if (!password) {
      const error = new Error("El password es requerido");
      return res.status(401).json({ msg: error.message });
    }

    // Buscar Usuario
    const usuario = await Usuario.findOne({ token });

    // Token válido¡
    if (!usuario) {
      const error = new Error("Token no válido");
      return res.status(404).json({ msg: error.message });
    }

    // Almacenar nuevo password
    usuario.token = null;
    usuario.password = password;
    await usuario.save();

    // Retornar mensaje
    res.json({
      msg: "El password a sido modificado correctamente, ya puedes Iniciar Sesión.",
    });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Autenticar
const autenticar = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Campos vacios¡
    if (!email || !password) {
      const error = new Error("Faltan campos de autenticación");
      return res.status(401).json({ msg: error.message });
    }

    // Buscar Usuario
    const usuario = await Usuario.findOne({ email });

    // El usuario no existe¡
    if (!usuario) {
      const error = new Error("El usuario no existe");
      return res.status(404).json({ msg: error.message });
    }

    // El usuario no esta confirmado
    if (!usuario.confirmado) {
      const error = new Error(
        "El usuario no a confirmado su cuenta, Por favor confirmarlo primero"
      );
      return res.status(403).json({ msg: error.message });
    }

    // Comprobar password
    const correcto = await usuario.comprobarPassword(password);

    if (correcto) {
      // Token jwt
      const token = generarJWT(usuario._id);
      // Retornar usuario
      const user = {
        _id: usuario._id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono,
        empresa: usuario.empresa,
        rol: usuario.rol,
        genero: usuario.genero,
        imagen: usuario.imagen,
        fechaNacimiento: usuario.fechaNacimiento,
      };
      res.json({ ...user, token });
    } else {
      res.status(403).json({
        msg: "El password es incorrecto.",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Perfil
const perfil = async (req, res) => {
  const { usuario } = req;
  res.json(usuario);
};

// Actualizar Perfil
const actualizarPerfil = async (req, res) => {
  const { usuario } = req;
  const { nombre, apellidos, email, fechaNacimiento, telefono, genero } =
    req.body;

  try {
    // Campos vacios¡
    if (!nombre || !apellidos || !email || !fechaNacimiento || !genero) {
      const error = new Error("Faltan campos de registro.");
      return res.status(401).json({ msg: error.message });
    }

    // Buscar Usuario
    const usuarioDB = await Usuario.findById(usuario._id).select(
      "-password -token -confirmado -createdAt -updatedAt -__v"
    );

    // El email ya existe¡
    if (usuario.email !== email) {
      const existe = await Usuario.findOne({ email });
      if (existe) {
        const error = new Error("El email ya esta en uso.");
        return res.status(400).json({ msg: error.message });
      }
    }

    // Actualizar usuario
    if (nombre) usuarioDB.nombre = nombre;
    if (apellidos) usuarioDB.apellidos = apellidos;
    if (email) usuarioDB.email = email;
    if (fechaNacimiento) usuarioDB.fechaNacimiento = fechaNacimiento;
    if (genero) usuarioDB.genero = genero;
    // campo opcional
    usuarioDB.telefono = telefono;

    if (req.files) {
      const { file } = req.files;

      // Validar formatos de las imagenes -> Si no es valido
      if (!validarFormatos([file])) {
        return res.status(402).json({
          msg: "Formato de archivo no permitido",
        });
      }

      // Elimina la imagen anterior
      if (usuarioDB.imagen) {
        const { public_id } = usuarioDB.imagen;
        await deleteImages({ public_id, folder: "fotos_perfil" });
      }

      // Subir la nueva imagen
      const { data, name } = file;
      // Generar nombre unico
      const id = generarId();
      const nombre = name.split(".")[0];
      const ext = `${nombre}_${id}`;

      // Generar un buffer con sharp para optimizar la imagen
      const buffer = await sharp(data).webp({ quality: 50 }).toBuffer();

      // Guardar la imagen en la carpeta uploads
      fs.writeFileSync(`./uploads/${ext}.webp`, buffer);

      // Subir la imagen de la carpeta uploads a cloudinary
      const resultado = await uploadImages({
        path: "./uploads/" + ext + ".webp",
        folder: "fotos_perfil",
      });

      // Eliminar los archivos temporales de la carpeta uploads
      fs.unlinkSync("./uploads/" + ext + ".webp");

      // retornar el resultado de cloudinary
      const {
        api_key,
        signature,
        version_id,
        version,
        created_at,
        tags,
        pages,
        etag,
        placeholder,
        url,
        type,
        resource_type,
        access_mode,
        bytes,
        folder,
        format,
        height,
        width,
        ...args
      } = resultado;
      usuarioDB.imagen = args;
    }

    // Almacenar
    const usuarioActualizado = await usuarioDB.save();

    // Retornar usuario actualizado
    const user = {
      _id: usuarioActualizado._id,
      nombre: usuarioActualizado.nombre,
      apellidos: usuarioActualizado.apellidos,
      email: usuarioActualizado.email,
      empresa: usuarioActualizado.empresa,
      rol: usuarioActualizado.rol,
      fechaNacimiento: usuarioActualizado.fechaNacimiento,
      telefono: usuarioActualizado.telefono,
      genero: usuarioActualizado.genero,
      imagen: usuarioActualizado.imagen,
    };
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Eliminar Cuenta
const eliminarCuenta = async (req, res) => {
  const { usuario } = req;
  const { id } = req.params;

  try {
    // Obtener el usuario a aliminar
    const usuarioDB = await Usuario.findById(id);

    // Usuario no existe
    if (!usuarioDB) {
      const error = new Error("El usuario no existe.");
      return res.status(404).json({ msg: error.message });
    }

    // Comprobar si el usuario es admin para eliminar cualquier cuenta
    if (usuario.rol !== "admin" && usuarioDB._id.toString() !== id) {
      const error = new Error("No tienes permisos para eliminar esta cuenta.");
      return res.status(401).json({ msg: error.message });
    }
    // Eliminar la foto de perfil
    if (usuarioDB?.imagen?.public_id) {
      const { public_id } = usuarioDB.imagen;
      await deleteImages({ public_id, folder: "fotos_perfil" });
    }

    // El usuario no es vendedor eliminarlo
    if (!usuarioDB.vendedor) {
      await usuarioDB.deleteOne();
    } else {
      // Eliminar el usuario
      const email = `${generarId().slice(6)}@gmail.com`;
      usuarioDB.nombre = "Yellow";
      usuarioDB.apellidos = `${generarId().slice(6)}`;
      usuarioDB.telefono = null;
      usuarioDB.password = "admin";
      usuarioDB.email = email;
      usuarioDB.confirmado = true;
      usuarioDB.rol = "usuario";
      usuarioDB.imagen = {
        asset_id: generarId(),
        original_filename: `userdefault_${generarId()}`,
        public_id: generarId(),
        secure_url:
          "https://res.cloudinary.com/dcj09lsnh/image/upload/v1663819464/hlpiqgelomlsx0ujotx2.svg",
      };
      await usuarioDB.save();
    }

    // mostar mensaje
    res.json({ msg: "Usuario eliminado correctamente." });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Cambiar Password
const cambiarPassword = async (req, res) => {
  const { _id } = req.usuario;
  const { password, passwordNuevo, passwordConfirmar } = req.body;

  try {
    // Password vacio¡
    if (!password || !passwordNuevo) {
      const error = new Error("El password es requerido");
      return res.status(401).json({ msg: error.message });
    }

    if (passwordConfirmar !== passwordNuevo) {
      const error = new Error("El password no coincide");
      return res.status(401).json({ msg: error.message });
    }

    // Buscar Usuario
    const usuario = await Usuario.findById(_id);

    // El usuario no existe¡
    if (!usuario) {
      const error = new Error("El usuario no existe");
      return res.status(404).json({ msg: error.message });
    }

    // Comprobar password
    const correcto = await usuario.comprobarPassword(password);

    if (correcto) {
      // Cambiar password
      usuario.password = passwordNuevo;

      // Almacenar
      await usuario.save();

      // Retornar mensaje
      res.json({ msg: "La contraseña a sido actualizada correctamente." });
    } else {
      // Retornar mensaje Error
      const error = new Error("La contraseña es incorrecta.");
      return res.status(401).json({ msg: error.message });
    }
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Convertir en vendedor
const convertirVendedor = async (req, res) => {
  const { _id } = req.usuario;
  const {
    nombreEmpresa,
    descripcionEmpresa,
    direccionEmpresa,
    paisEmpresa,
    ciudadEmpresa,
    codigoPostalEmpresa,
  } = req.body;
  try {
    // Validar campos
    if (
      !nombreEmpresa ||
      !descripcionEmpresa ||
      !direccionEmpresa ||
      !paisEmpresa ||
      !ciudadEmpresa ||
      !codigoPostalEmpresa
    ) {
      const error = new Error("Todos los campos son requeridos");
      return res.status(401).json({ msg: error.message });
    }

    // Validar imagen
    if (!req.files) {
      const error = new Error("La imagen es requerida.");
      return res.status(404).json({ msg: error.message });
    }

    // Obtener la imagen
    const { file } = req.files;
    // Validar formatos de las imagenes -> Si no es valido
    if (!validarFormatos([file])) {
      return res.status(402).json({
        msg: "Formato de archivo no permitido",
      });
    }

    // Buscar al Usuario
    const usuarioDB = await Usuario.findById(_id);

    // Usuario no existe
    if (!usuarioDB) {
      const error = new Error("El usuario no existe.");
      return res.status(404).json({ msg: error.message });
    }

    // Subir la nueva imagen
    const { data, name } = file;

    // Generar nombre unico
    const id = generarId();
    const nombre = name.split(".")[0];
    const ext = `${nombre}_${id}`;

    // Generar un buffer con sharp para optimizar la imagen
    const buffer = await sharp(data).webp({ quality: 50 }).toBuffer();

    // Guardar la imagen en la carpeta uploads
    fs.writeFileSync(`./uploads/${ext}.webp`, buffer);

    // Subir la imagen de la carpeta uploads a cloudinary
    const resultado = await uploadImages({
      path: "./uploads/" + ext + ".webp",
      folder: "fotos_empresa",
    });

    // Eliminar los archivos temporales de la carpeta uploads
    fs.unlinkSync("./uploads/" + ext + ".webp");

    // retornar el resultado de cloudinary
    const {
      api_key,
      signature,
      version_id,
      version,
      created_at,
      tags,
      pages,
      etag,
      placeholder,
      url,
      type,
      resource_type,
      access_mode,
      bytes,
      folder,
      format,
      height,
      width,
      ...args
    } = resultado;

    // Convertir en vendedor
    usuarioDB.rol = "empresa";
    usuarioDB.empresa = {
      nombre: nombreEmpresa,
      imagen: args,
      descripcion: descripcionEmpresa,
      direccion: direccionEmpresa,
      pais: paisEmpresa,
      ciudad: ciudadEmpresa,
      codigoPostal: codigoPostalEmpresa,
      productosCreados: 0,
    };

    // Almacenar
    const usuarioActualizado = await usuarioDB.save();

    // Retornar la empresa actualizada
    const user = {
      _id: usuarioActualizado._id,
      nombre: usuarioActualizado.nombre,
      apellidos: usuarioActualizado.apellidos,
      email: usuarioActualizado.email,
      empresa: usuarioActualizado.empresa,
      rol: usuarioActualizado.rol,
      fechaNacimiento: usuarioActualizado.fechaNacimiento,
      telefono: usuarioActualizado.telefono,
      genero: usuarioActualizado.genero,
      imagen: usuarioActualizado.imagen,
    };
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Actualizar Empresa
const actualizarEmpresa = async (req, res) => {
  const { _id } = req.usuario;
  const {
    nombreEmpresa,
    descripcionEmpresa,
    direccionEmpresa,
    paisEmpresa,
    ciudadEmpresa,
    codigoPostalEmpresa,
  } = req.body;
  try {
    // Validar campos
    if (
      !nombreEmpresa ||
      !descripcionEmpresa ||
      !direccionEmpresa ||
      !paisEmpresa ||
      !ciudadEmpresa ||
      !codigoPostalEmpresa
    ) {
      const error = new Error("Todos los campos son requeridos");
      return res.status(401).json({ msg: error.message });
    }

    // Validar imagen
    if (!req.files) {
      const error = new Error("La imagen es requerida.");
      return res.status(404).json({ msg: error.message });
    }

    // Obtener la imagen
    const { file } = req.files;
    // Validar formatos de las imagenes -> Si no es valido
    if (!validarFormatos([file])) {
      return res.status(402).json({
        msg: "Formato de archivo no permitido",
      });
    }

    // Buscar al Usuario
    const usuarioDB = await Usuario.findById(_id);

    // Usuario no existe
    if (!usuarioDB) {
      const error = new Error("El usuario no existe.");
      return res.status(404).json({ msg: error.message });
    }

    // Elimina la imagen anterior
    if (usuarioDB.empresa?.imagen) {
      const { public_id } = usuarioDB.empresa.imagen;
      await deleteImages({ public_id, folder: "fotos_empresa" });
    }

    // Subir la nueva imagen
    const { data, name } = file;
    // Generar nombre unico
    const id = generarId();
    const nombre = name.split(".")[0];
    const ext = `${nombre}_${id}`;

    // Generar un buffer con sharp para optimizar la imagen
    const buffer = await sharp(data).webp({ quality: 50 }).toBuffer();

    // Guardar la imagen en la carpeta uploads
    fs.writeFileSync(`./uploads/${ext}.webp`, buffer);

    // Subir la imagen de la carpeta uploads a cloudinary
    const resultado = await uploadImages({
      path: "./uploads/" + ext + ".webp",
      folder: "fotos_empresa",
    });

    // Eliminar los archivos temporales de la carpeta uploads
    fs.unlinkSync("./uploads/" + ext + ".webp");

    // retornar el resultado de cloudinary
    const {
      api_key,
      signature,
      version_id,
      version,
      created_at,
      tags,
      pages,
      etag,
      placeholder,
      url,
      type,
      resource_type,
      access_mode,
      bytes,
      folder,
      format,
      height,
      width,
      ...args
    } = resultado;

    // Actualizar el vendedor
    usuarioDB.empresa = {
      nombre: nombreEmpresa,
      imagen: args,
      descripcion: descripcionEmpresa,
      direccion: direccionEmpresa,
      pais: paisEmpresa,
      ciudad: ciudadEmpresa,
      codigoPostal: codigoPostalEmpresa,
      productosCreados: usuarioDB.empresa.productosCreados,
    };

    // Almacenar
    const empresaActualizada = await usuarioDB.save();

    // Retornar la empresa actualizada
    const user = {
      _id: empresaActualizada._id,
      nombre: empresaActualizada.nombre,
      apellidos: empresaActualizada.apellidos,
      email: empresaActualizada.email,
      empresa: empresaActualizada.empresa,
      rol: empresaActualizada.rol,
      fechaNacimiento: empresaActualizada.fechaNacimiento,
      telefono: empresaActualizada.telefono,
      genero: empresaActualizada.genero,
      imagen: empresaActualizada.imagen,
    };
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Obtener todo los usuarios
const obtenerUsuarios = async (req, res) => {
  // Buscar usuario por el nombre u apellidos
  const { nombre } = req.query;
  const { page } = req.query || 1;

  const limit = 12;
  try {
    // Buscar por nombre
    if (nombre) {
      const regex = new RegExp(nombre, "i");
      const usuarios = await Usuario.paginate(
        {
          $or: [{ nombre: regex }, { apellidos: regex }],
        },
        {
          page,
          limit,
          sort: { createdAt: -1 },
          select: "-password -__v -createdAt -updatedAt -token",
        }
      );

      return res.json(usuarios);
    }

    // En caso de que no se envie ningun parametro de busqueda se retornan todos los usuarios
    const usuarios = await Usuario.paginate(
      {},
      {
        page,
        limit,
        sort: { createdAt: -1 },
        select: "-password -__v -createdAt -updatedAt -token",
      }
    );
    res.json(usuarios);
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

// Cambiar el rol de un usuario
const cambiarRol = async (req, res) => {
  const { usuario } = req;
  const { id } = req.params;
  const { rol } = req.body;

  try {
    // validad campos
    if (!rol) {
      const error = new Error("El rol es requerido.");
      return res.status(401).json({ msg: error.message });
    }

    // Validar si el rol es valido
    if (!validarRol({ rol })) {
      const error = new Error("El rol no es valido.");
      return res.status(401).json({ msg: error.message });
    }

    // Validar que el usuario que se quiere cambiar el rol sea el admin
    if (usuario.rol !== "admin") {
      const error = new Error(
        "No tienes los permisos de admin para cambiar los roles"
      );
      return res.status(401).json({ msg: error.message });
    }

    // Buscar al usuario
    const usuarioDB = await Usuario.findById(id);

    // Validar si el usuario existe
    if (!usuarioDB) {
      const error = new Error("El usuario no existe.");
      return res.status(404).json({ msg: error.message });
    }

    // Cambiar rol
    usuarioDB.rol = rol;

    // Guardar
    await usuarioDB.save();

    res.json({ msg: "Rol cambiaro correctamente" });
  } catch (error) {
    console.log(error.message);
    res.status(404).json({ msg: error.message });
  }
};

export {
  registrar,
  confirmarCuenta,
  autenticar,
  olvidePassword,
  comprobarToken,
  nuevoPassword,
  perfil,
  actualizarPerfil,
  eliminarCuenta,
  cambiarPassword,
  convertirVendedor,
  actualizarEmpresa,
  obtenerUsuarios,
  cambiarRol,
};
