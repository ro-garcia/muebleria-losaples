import cors from "cors";
import express from "express";
import serverlessHttp from "serverless-http";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";
import { almacenRoutes } from "./routes/almacenRoutes";
import { carritoRoutes } from "./routes/carritoRoutes";
import { categoriaRoutes } from "./routes/categoriaRoutes";
import { clienteRoutes } from "./routes/clienteRoutes";
import { colorRoutes } from "./routes/colorRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { detalleFacturaRoutes } from "./routes/detalleFacturaRoutes";
import { detOrdenVentaRoutes } from "./routes/detOrdenVentaRoutes";
import { empleadoRoutes } from "./routes/empleadoRoutes";
import { facturaRoutes } from "./routes/facturaRoutes";
import { impuestoRoutes } from "./routes/impuestoRoutes";
import { materialRoutes } from "./routes/materialRoutes";
import { materiaPrimaRoutes } from "./routes/materiaPrimaRoutes";
import { metodoPagoRoutes } from "./routes/metodoPagoRoutes";
import { ordenProduccionRoutes } from "./routes/ordenProduccionRoutes";
import { ordenVentaRoutes } from "./routes/ordenVentaRoutes";
import { precioProductoRoutes } from "./routes/precioProductoRoutes";
import { productoRoutes } from "./routes/productoRoutes";
import { shopAuthRoutes } from "./routes/shopAuthRoutes";
import { shopCheckoutRoutes } from "./routes/shopCheckoutRoutes";
import { stockMateriaPrimaRoutes } from "./routes/stockMateriaPrimaRoutes";
import { stockProductoRoutes } from "./routes/stockProductoRoutes";
import { tiendaRoutes } from "./routes/tiendaRoutes";

const app = express();

app.use(cors());
app.use((req, res, next) => {
  res.set("Content-Type", "application/json; charset=utf-8");
  next();
});
app.use(express.json({ type: ["application/json", "text/plain"] }));

app.use("/health", healthRoutes);

app.use("/tiendas", tiendaRoutes);
app.use("/metodos-pago", metodoPagoRoutes);
app.use("/impuestos", impuestoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/colores", colorRoutes);
app.use("/materiales", materialRoutes);
app.use("/productos", productoRoutes);
app.use("/precios-producto", precioProductoRoutes);
app.use("/almacenes", almacenRoutes);
app.use("/stock-producto", stockProductoRoutes);
app.use("/materias-primas", materiaPrimaRoutes);
app.use("/stock-materia-prima", stockMateriaPrimaRoutes);
app.use("/empleados", empleadoRoutes);
app.use("/ordenes-produccion", ordenProduccionRoutes);
app.use("/carrito", carritoRoutes);
app.use("/ordenes-venta", ordenVentaRoutes);
app.use("/det-orden-venta", detOrdenVentaRoutes);
app.use("/facturas", facturaRoutes);
app.use("/detalle-factura", detalleFacturaRoutes);
app.use("/shop/auth", shopAuthRoutes);
app.use("/shop/checkout", shopCheckoutRoutes);
app.use("/admin/clientes", clienteRoutes);

app.use(notFound);
app.use(errorHandler);

export const handler = serverlessHttp(app);