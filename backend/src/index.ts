import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { healthRoutes } from "./routes/healthRoutes";
import { detalleFacturaRoutes } from "./routes/detalleFacturaRoutes";
import { detOrdenVentaRoutes } from "./routes/detOrdenVentaRoutes";
import { facturaRoutes } from "./routes/facturaRoutes";
import { impuestoRoutes } from "./routes/impuestoRoutes";
import { metodoPagoRoutes } from "./routes/metodoPagoRoutes";
import { ordenVentaRoutes } from "./routes/ordenVentaRoutes";
import { tiendaRoutes } from "./routes/tiendaRoutes";

const app = express(); 

app.use(cors());
app.use(express.json());

// ─── Rutas de salud ───────────────────────────────────────────────────────────
app.use("/health", healthRoutes);

// ─── Rutas de la mueblería ────────────────────────────────────────────────────
app.use("/tiendas",          tiendaRoutes);
app.use("/metodos-pago",     metodoPagoRoutes);
app.use("/impuestos",        impuestoRoutes);
app.use("/ordenes-venta",    ordenVentaRoutes);
app.use("/det-orden-venta",  detOrdenVentaRoutes);
app.use("/facturas",         facturaRoutes);
app.use("/detalle-factura",  detalleFacturaRoutes);

// ─── Middlewares globales de error ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});
