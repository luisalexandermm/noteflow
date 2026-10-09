// ═══════════════════════════════════════════════════════════
// NoteFlow · servicios/correo.js
// Envía el código de acceso por correo (SMTP con nodemailer).
//
// Variables del .env (ejemplo con Gmail):
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PUERTO=465
//   SMTP_USUARIO=tucorreo@gmail.com
//   SMTP_CLAVE=la "contraseña de aplicación" de 16 letras
//
// Sin SMTP configurado y en desarrollo, el código se muestra en la
// consola del servidor (así puedes probar sin enviar correos).
// ═══════════════════════════════════════════════════════════

const nodemailer = require("nodemailer");

function correoConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USUARIO && process.env.SMTP_CLAVE);
}

let transporte = null;
function obtenerTransporte() {
  if (!transporte) {
    const puerto = Number(process.env.SMTP_PUERTO || 465);
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465, // 465 = cifrado desde el inicio; 587 = STARTTLS
      auth: { user: process.env.SMTP_USUARIO, pass: process.env.SMTP_CLAVE }
    });
  }
  return transporte;
}

async function enviarCodigoPorCorreo(destino, codigo) {
  if (!correoConfigurado()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("El envío de correos no está configurado (SMTP_HOST, SMTP_USUARIO, SMTP_CLAVE)");
    }
    console.log(`\n  ✉  [MODO DESARROLLO] Código para ${destino}: ${codigo}\n`);
    return;
  }

  await obtenerTransporte().sendMail({
    from: `"NoteFlow" <${process.env.CORREO_REMITENTE || process.env.SMTP_USUARIO}>`,
    to: destino,
    subject: `${codigo} es tu código de NoteFlow`,
    text: `Tu código para entrar a NoteFlow es: ${codigo}\n\nVence en 10 minutos. Si no lo pediste, ignora este correo.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;color:#15161c">
        <h2 style="margin:0 0 8px">Tu código de NoteFlow</h2>
        <p style="color:#5b6070">Escríbelo en la página para entrar:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:20px 0;color:#4a4ee0">${codigo}</p>
        <p style="color:#979cab;font-size:13px">Vence en 10 minutos. Si no lo pediste, ignora este correo.</p>
      </div>`
  });
}

module.exports = { enviarCodigoPorCorreo, correoConfigurado };
