import nodemailer from "nodemailer";

import { env } from "../config/env";

export const canSendEmail = () =>
  Boolean(env.email.host && env.email.user && env.email.pass && env.email.from);

export const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!canSendEmail()) {
    throw new Error("Servicio de correo no configurado.");
  }

  const transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });

  await transporter.sendMail({
    from: env.email.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
};
