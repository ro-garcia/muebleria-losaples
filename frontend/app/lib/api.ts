const DEFAULT_API_URL = "http://localhost:4000";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/$/, "");

const readNumberEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const DEFAULT_CLIENTE_ID = readNumberEnv(
  process.env.NEXT_PUBLIC_CLIENTE_ID,
  1,
);

export const DEFAULT_TIENDA_ID = readNumberEnv(
  process.env.NEXT_PUBLIC_TIENDA_ID,
  1,
);

export interface ApiValidationError {
  campo: string;
  mensaje: string;
}

interface ApiResponse<T> {
  ok?: boolean;
  data?: T;
  message?: string;
  error?: string;
  errores?: ApiValidationError[];
}

export interface AuthUser {
  clienteId: number;
  username: string;
  correo: string;
  nombreCompleto: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface ShopOrder {
  ODV_ORDEN_VENTA: number;
  CLI_CLIENTE: number;
  TIE_TIENDA: number;
  ODV_FECHA?: string;
  ODV_ESTADO: string;
  ODV_SUBTOTAL: number;
  ODV_DESCUENTO: number;
  ODV_IMPUESTO: number;
  ODV_TOTAL: number;
  FAC_FACTURA?: number | null;
  FAC_NUMERO?: string | null;
  FAC_ESTADO_FACTURA?: string | null;
  FAC_TOTAL_PAGADO?: number | null;
  FAC_PENDIENTE_PAGO?: number | null;
  MET_METODO_PAGO?: number | null;
  MET_NOMBRE?: string | null;
  RESUMEN_PRODUCTOS?: string | null;
}

export interface ClienteAdmin {
  CLI_CLIENTE: number;
  CLI_PRIMER_NOMBRE?: string | null;
  CLI_SEGUNDO_NOMBRE?: string | null;
  CLI_PRIMER_APELLIDO?: string | null;
  CLI_SEGUNDO_APELLIDO?: string | null;
  CLI_TIPO_DOCUMENTO?: string | null;
  CLI_NUMERO_DOCUMENTO?: string | null;
  CLI_CORREO_ELECTRONICO?: string | null;
  CLI_TELEFONO?: string | null;
  CLI_DEPARTAMENTO?: string;
  CLI_MUNICIPIO?: string;
  CLI_PAIS?: string | null;
  CLI_ZONA_ALDEA?: string | null;
  DIRECCION_VALIDA?: number;
  DIRECCION_RESUMEN?: string | null;
}

export interface ClienteProfile {
  CLI_CLIENTE: number;
  CLI_PRIMER_NOMBRE?: string | null;
  CLI_SEGUNDO_NOMBRE?: string | null;
  CLI_PRIMER_APELLIDO?: string | null;
  CLI_SEGUNDO_APELLIDO?: string | null;
  CLI_DEPARTAMENTO?: string | null;
  CLI_MUNICIPIO?: string | null;
  CLI_ZONA_ALDEA?: string | null;
  CLI_TELEFONO?: string | null;
  CLI_PAIS?: string | null;
  CLI_TIPO_DOCUMENTO?: string | null;
  CLI_NUMERO_DOCUMENTO?: string | null;
  CLI_CORREO_ELECTRONICO?: string | null;
  PER_PERSONA?: number | null;
  PER_TIPO_DOCUMENTO?: string | null;
  PER_NOMBRE?: string | null;
  PER_PRIMER_APELLIDO?: string | null;
  PER_SEGUNDO_APELLIDO?: string | null;
  PER_CORREO?: string | null;
  PER_TELEFONO?: string | null;
  PER_PAIS?: string | null;
  PER_DEPARTAMENTO?: string | null;
  PER_MUNICIPIO?: string | null;
  PER_ZONA_ALDEA?: string | null;
  PER_DOMICILIO?: string | null;
  USU_USUARIO?: number | null;
  USU_NOMBRE_USUARIO?: string | null;
  USU_PASSWORD_STATUS?: string | null;
  DIRECCION_VALIDA?: number;
  DIRECCION_RESUMEN?: string | null;
  DIR_PAIS?: string | null;
  DIR_DEPARTAMENTO?: string | null;
  DIR_MUNICIPIO?: string | null;
  DIR_ZONA_ALDEA?: string | null;
  DIR_TELEFONO?: string | null;
}

export interface ClienteCompraRow {
  ODV_ORDEN_VENTA?: number;
  ODV_FECHA?: string;
  ODV_ESTADO?: string;
  ODV_SUBTOTAL?: number;
  ODV_DESCUENTO?: number;
  ODV_IMPUESTO?: number;
  ODV_TOTAL?: number;
  TIE_TIENDA?: number;
  TIE_NOMBRE?: string | null;
  FAC_FACTURA?: number | null;
  FAC_SERIE?: string | null;
  FAC_NUMERO?: string | null;
  FAC_UUID?: string | null;
  FAC_FECHA_EMISION?: string;
  FAC_ESTADO_FACTURA?: string | null;
  FAC_SUBTOTAL?: number;
  FAC_DESCUENTO_TOTAL?: number;
  FAC_IMPUESTO_TOTAL?: number;
  FAC_TOTAL?: number;
  FAC_PENDIENTE_PAGO?: number;
  FAC_TOTAL_PAGADO?: number;
  MET_METODO_PAGO?: number | null;
  MET_NOMBRE?: string | null;
  DOV_DET_ORDEN_VENTA?: number | null;
  PRO_PRODUCTO?: number | null;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE?: string | null;
  DOV_CANTIDAD?: number;
  DOV_PRECIO_UNITARIO?: number;
  DOV_DESCUENTO?: number;
  DOV_SUBTOTAL?: number;
  DFA_DETALLE_FACTURA?: number | null;
  DFA_CANTIDAD?: number;
  DFA_PRECIO?: number;
  DFA_DESCUENTO?: number;
  DFA_IMPUESTO?: number;
  DFA_SUBTOTAL?: number;
  IMP_IMPUESTO?: number | null;
  IMP_NOMBRE?: string | null;
  IMP_PORCENTAJE?: number | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errores: ApiValidationError[] = [],
  ) {
    super(message);
  }
}

const readJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export const getApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    const validation = error.errores.map((item) => item.mensaje).join(" ");
    return validation ? `${error.message}. ${validation}` : error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo completar la operacion.";
};

const apiRequest = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers);
  const bearerToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("shop_token") ?? ""
      : "";

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  if (bearerToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  const payload = await readJson<ApiResponse<T>>(response);

  if (!response.ok || payload?.ok === false) {
    throw new ApiError(
      payload?.message ?? `Error HTTP ${response.status}`,
      response.status,
      payload?.errores ?? [],
    );
  }

  if (payload && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
};

export interface Producto {
  PRO_Producto: number;
  PRO_PRODUCTO: number;
  PRO_Codigo?: string | null;
  PRO_CODIGO?: string | null;
  PRO_Nombre: string;
  PRO_NOMBRE: string;
  PRO_Estado?: string;
  PRO_ESTADO?: string;
  DEP_Detalle_Producto?: number | null;
  DEP_DETALLE_PRODUCTO?: number | null;
  TIP_Tipo_Producto?: number | null;
  TIP_TIPO_PRODUCTO?: number | null;
  TIP_Nombre?: string | null;
  TIP_NOMBRE?: string | null;
  MAP_Material?: number | null;
  MAP_MATERIAL?: number | null;
  MAP_Nombre?: string | null;
  MAP_NOMBRE?: string | null;
  COP_Color_Producto?: number | null;
  COP_COLOR_PRODUCTO?: number | null;
  COP_Nombre?: string | null;
  COP_NOMBRE?: string | null;
  DEP_Peso?: number | null;
  DEP_PESO?: number | null;
  DEP_Longitud?: number | null;
  DEP_LONGITUD?: number | null;
  PRE_Precio?: number | null;
  PRE_PRECIO?: number | null;
  STOCK_DISPONIBLE?: number | null;
}

export interface Material {
  MAP_MATERIAL_PRODUCTO: number;
  MAP_Material_Producto?: number;
  MAP_NOMBRE: string;
  MAP_Nombre?: string;
  MAP_DETALLE?: string | null;
  MAP_Detalle?: string | null;
}

export interface Color {
  COP_COLOR_PRODUCTO: number;
  COP_Color_Producto?: number;
  COP_NOMBRE: string;
  COP_Nombre?: string;
  COP_ESTADO?: string;
  COP_Estado?: string;
}

export interface ColorPayload {
  COP_Nombre: string;
  COP_Estado?: string;
}

export interface MaterialPayload {
  MAP_Nombre: string;
  MAP_Detalle?: string | null;
}

export interface ProductoPayload {
  PRO_Codigo: string;
  PRO_Nombre: string;
  PRO_Estado?: string;
  TIP_Tipo_Producto?: number | null;
  MAP_Material?: number | null;
  COP_Color_Producto?: number | null;
  DEP_Peso?: number | null;
  DEP_Longitud?: number | null;
  PRE_Precio?: number | null;
  PRE_Fecha_Inicio?: string | null;
}

export interface Categoria {
  TIP_TIPO_PRODUCTO: number;
  TIP_Tipo_Producto?: number;
  TIP_NOMBRE: string;
  TIP_Nombre?: string;
}

export interface CategoriaPayload {
  TIP_Nombre: string;
}

export interface Tienda {
  TIE_TIENDA: number;
  TIE_NOMBRE: string;
  TIE_DEPARTAMENTO?: string | null;
  TIE_MUNICIPIO?: string | null;
  TIE_ZONA_ALDEA?: string | null;
  TIE_DOMICILIO?: string | null;
  TIE_TELEFONO?: string | null;
  TIE_ESTADO?: string;
}

export interface MetodoPago {
  MET_METODO_PAGO: number;
  MET_NOMBRE: string;
  MET_ESTADO?: string;
}

export interface Impuesto {
  IMP_IMPUESTO: number;
  IMP_NOMBRE: string;
  IMP_PORCENTAJE: number;
  IMP_ESTADO?: string;
}

export interface OrdenVenta {
  ODV_ORDEN_VENTA: number;
  CLI_CLIENTE: number;
  TIE_TIENDA: number;
  ODV_FECHA?: string;
  ODV_ESTADO: string;
  ODV_SUBTOTAL: number;
  ODV_DESCUENTO: number;
  ODV_IMPUESTO: number;
  ODV_TOTAL: number;
  CLI_TIPO_DOCUMENTO?: string | null;
  CLI_NUMERO_DOCUMENTO?: string | null;
  CLI_CORREO_ELECTRONICO?: string | null;
  CLI_TELEFONO?: string | null;
  CLIENTE_NOMBRE?: string | null;
  TIE_NOMBRE?: string | null;
  FAC_FACTURA?: number | null;
  FAC_ESTADO_FACTURA?: string | null;
  MET_NOMBRE?: string | null;
  RESUMEN_PRODUCTOS?: string | null;
}

export interface OrderDetailItem {
  DOV_DET_ORDEN_VENTA?: number;
  ODV_ORDEN_VENTA?: number;
  PRO_PRODUCTO?: number;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE?: string | null;
  DOV_CANTIDAD?: number;
  DOV_PRECIO_UNITARIO?: number;
  DOV_DESCUENTO?: number;
  DOV_SUBTOTAL?: number;
  DFA_DETALLE_FACTURA?: number | null;
  DFA_CANTIDAD?: number;
  DFA_PRECIO?: number;
  DFA_DESCUENTO?: number;
  DFA_IMPUESTO?: number;
  DFA_SUBTOTAL?: number;
  IMP_IMPUESTO?: number | null;
  IMP_NOMBRE?: string | null;
  IMP_PORCENTAJE?: number | null;
}

export interface FacturaResumenDetalle extends Factura {
  MET_NOMBRE?: string | null;
}

export interface ShopOrderDetail {
  orden: Record<string, unknown>;
  cliente?: ClienteProfile;
  items: OrderDetailItem[];
  facturas: FacturaResumenDetalle[];
}

export interface AdminOrderDetail {
  orden: Record<string, unknown>;
  items: OrderDetailItem[];
  facturas: FacturaResumenDetalle[];
}

export interface FacturaDetailItem {
  DFA_DETALLE_FACTURA?: number;
  FAC_FACTURA?: number;
  PRO_PRODUCTO?: number;
  IMP_IMPUESTO?: number | null;
  DFA_CANTIDAD?: number;
  DFA_PRECIO?: number;
  DFA_DESCUENTO?: number;
  DFA_IMPUESTO?: number;
  DFA_SUBTOTAL?: number;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE?: string | null;
  IMP_NOMBRE?: string | null;
  IMP_PORCENTAJE?: number | null;
}

export interface FacturaDetail {
  factura: Record<string, unknown>;
  items: FacturaDetailItem[];
}

export interface CarritoItem {
  DOV_DET_ORDEN_VENTA: number;
  ODV_ORDEN_VENTA: number;
  PRO_PRODUCTO: number;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE: string;
  DOV_CANTIDAD: number;
  DOV_PRECIO_UNITARIO: number;
  DOV_DESCUENTO: number;
  DOV_SUBTOTAL: number;
}

export interface Carrito {
  orden: OrdenVenta;
  items: CarritoItem[];
}

export interface Factura {
  FAC_FACTURA: number;
  ORD_ORDEN_VENTA: number;
  MET_METODO_PAGO: number;
  FAC_FECHA_EMISION?: string;
  FAC_UUID?: string | null;
  FAC_SERIE?: string | null;
  FAC_NUMERO?: string | null;
  FAC_SUBTOTAL: number;
  FAC_DESCUENTO_TOTAL: number;
  FAC_IMPUESTO_TOTAL: number;
  FAC_TOTAL: number;
  FAC_PENDIENTE_PAGO: number;
  FAC_TOTAL_PAGADO: number;
  FAC_ESTADO_FACTURA: string;
  CLI_CLIENTE?: number | null;
  CLI_TIPO_DOCUMENTO?: string | null;
  CLI_NUMERO_DOCUMENTO?: string | null;
  CLI_CORREO_ELECTRONICO?: string | null;
  CLIENTE_NOMBRE?: string | null;
  MET_NOMBRE?: string | null;
}

export interface Almacen {
  ALM_ALMACEN: number;
  ALM_NOMBRE: string;
  ALM_DEPARTAMENTO?: string | null;
  ALM_MUNICIPIO?: string | null;
  ALM_ZONA_ALDEA?: string | null;
  ALM_DOMICILIO?: string | null;
  ALM_TELEFONO?: string | null;
  ALM_ESTADO?: string | null;
}

export interface AlmacenPayload {
  ALM_Nombre: string;
  ALM_Departamento?: string | null;
  ALM_Municipio?: string | null;
  ALM_Zona_Aldea?: string | null;
  ALM_Domicilio?: string | null;
  ALM_Telefono?: string | null;
  ALM_Estado?: string;
}

export interface MateriaPrima {
  MAP_MATERIA_PRIMA: number;
  MAP_NOMBRE: string;
  MAP_UNIDAD_MEDIDA?: string | null;
  MAP_COSTO_REFERENCIAL?: number | null;
  MAP_ESTADO?: string | null;
}

export interface MateriaPrimaPayload {
  MAP_Nombre: string;
  MAP_Unidad_Medida?: string | null;
  MAP_Costo_Referencial?: number | null;
  MAP_Estado?: string;
}

export interface StockProducto {
  STP_STOCK_PRODUCTO: number;
  ALM_ALMACEN: number;
  PRO_PRODUCTO: number;
  STP_CANTIDAD: number;
  STP_STOCK_MINIMO?: number | null;
  STP_STOCK_MAXIMO?: number | null;
  STP_ULTIMA_ACTUALIZACION?: string | null;
  ALM_NOMBRE?: string | null;
  ALM_ESTADO?: string | null;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE?: string | null;
  PRO_ESTADO?: string | null;
  STOCK_BAJO?: number | null;
}

export interface StockProductoPayload {
  ALM_almacen: number;
  PRO_Producto: number;
  STP_Cantidad: number;
  STP_Stock_Minimo?: number | null;
  STP_Stock_Maximo?: number | null;
}

export interface StockMateriaPrima {
  SMP_STOCK_MAT_PRIMA: number;
  MAP_MATERIA_PRIMA: number;
  SMP_CANTIDAD: number;
  SMP_STOCK_MINIMO?: number | null;
  SMP_STOCK_MAXIMO?: number | null;
  SMP_ULTIMA_ACTUALIZACION?: string | null;
  MAP_NOMBRE?: string | null;
  MAP_UNIDAD_MEDIDA?: string | null;
  MAP_COSTO_REFERENCIAL?: number | null;
  MAP_ESTADO?: string | null;
  STOCK_BAJO?: number | null;
}

export interface StockMateriaPrimaPayload {
  MAP_Materia_Prima: number;
  SMP_Cantidad: number;
  SMP_Stock_Minimo?: number | null;
  SMP_Stock_Maximo?: number | null;
}

export interface Empleado {
  EMP_EMPLEADO: number;
  PER_PERSONA?: number | null;
  EMP_ESTADO?: string | null;
  EMP_TIPO_CONTRATO?: string | null;
  PER_NOMBRE?: string | null;
  PER_PRIMER_APELLIDO?: string | null;
  PER_SEGUNDO_APELLIDO?: string | null;
  PER_TIPO_DOCUMENTO?: string | null;
  PER_CORREO?: string | null;
  PER_TELEFONO?: string | null;
  PER_PAIS?: string | null;
  PER_DEPARTAMENTO?: string | null;
  PER_MUNICIPIO?: string | null;
  PER_ZONA_ALDEA?: string | null;
  PER_DOMICILIO?: string | null;
  EMPLEADO_NOMBRE?: string | null;
  DEM_DETALLE_EMPLEADO?: number | null;
  CAR_CARGO?: number | null;
  CAR_NOMBRE?: string | null;
  PUE_PUESTO?: number | null;
  PUE_NOMBRE?: string | null;
  DEP_DEPARTAMENTO?: number | null;
  DEP_NOMBRE?: string | null;
  DEM_FECHA_INICIO?: string | null;
  DEM_FECHA_FIN?: string | null;
  DEM_SALARIO?: number | null;
  DEM_ESTADO?: string | null;
}

export interface EmpleadoDetalleLaboral {
  DEM_DETALLE_EMPLEADO: number;
  EMP_EMPLEADO: number;
  CAR_CARGO?: number | null;
  CAR_NOMBRE?: string | null;
  PUE_PUESTO?: number | null;
  PUE_NOMBRE?: string | null;
  DEP_DEPARTAMENTO?: number | null;
  DEP_NOMBRE?: string | null;
  DEM_FECHA_INICIO?: string | null;
  DEM_FECHA_FIN?: string | null;
  DEM_SALARIO?: number | null;
  DEM_ESTADO?: string | null;
}

export interface EmpleadoDetalleResponse {
  empleado: Empleado;
  detalles: EmpleadoDetalleLaboral[];
}

export interface EmpleadoCatalogoItem {
  id: number;
  nombre: string;
  estado?: string | null;
}

export interface CargoPayload {
  CAR_Nombre: string;
}

export interface PuestoPayload {
  PUE_Nombre: string;
  PUE_Estado?: "ACTIVO" | "INACTIVO";
}

export interface DepartamentoLaboralPayload {
  DEP_Nombre: string;
  DEP_Estado?: "ACTIVO" | "INACTIVO";
}

export interface EmpleadoPayload {
  PER_Tipo_Documento: string;
  PER_Nombre: string;
  PER_Primer_Apellido: string;
  PER_Segundo_Apellido?: string | null;
  PER_Correo?: string | null;
  PER_Telefono?: string | null;
  PER_Pais?: string | null;
  PER_Departamento?: string | null;
  PER_Municipio?: string | null;
  PER_Zona_Aldea?: string | null;
  PER_Domicilio?: string | null;
  EMP_Tipo_Contrato: string;
  EMP_Estado: "ACTIVO" | "INACTIVO";
  CAR_Cargo: number;
  PUE_Puesto: number;
  DEP_Departamento: number;
  DEM_Fecha_Inicio: string;
  DEM_Fecha_Fin?: string | null;
  DEM_Salario: number;
  DEM_Estado: "ACTIVO" | "INACTIVO";
}

export interface PrecioProducto {
  PRE_PRECIO_PRODUCTO: number;
  PRO_PRODUCTO: number;
  PRE_PRECIO: number;
  PRE_FECHA_INICIO: string;
  PRE_FECHA_FIN?: string | null;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE?: string | null;
  ES_VIGENTE?: number | null;
}

export interface PrecioProductoPayload {
  PRO_Producto: number;
  PRE_Precio: number;
  PRE_Fecha_Inicio: string;
  PRE_Fecha_Fin?: string | null;
}

export interface OrdenProduccion {
  OPR_ORDENPRODUCCION: number;
  PRO_PRODUCTO: number;
  EMP_EMPLEADO: number;
  OPR_FECHA_CREACION?: string | null;
  OPR_FECHA_INICIO?: string | null;
  OPR_FECHA_FIN?: string | null;
  OPR_CANTIDAD_PROGRAMADA: number;
  OPR_CANTIDAD_PRODUCIDA?: number | null;
  OPR_ESTADO: string;
  PRO_CODIGO?: string | null;
  PRO_NOMBRE?: string | null;
  EMPLEADO_NOMBRE?: string | null;
  TOTAL_DETALLES?: number | null;
}

export interface OrdenProduccionPayload {
  PRO_Producto: number;
  EMP_Empleado: number;
  OPR_Cantidad_Programada: number;
  OPR_Cantidad_Producida?: number | null;
  OPR_Fecha_Inicio?: string | null;
  OPR_Fecha_Fin?: string | null;
  OPR_Estado?: string;
}

export interface OrdenProduccionDetalle {
  DOP_DETALLE_ORDENPRODUCCION: number;
  OPR_ORDENPRODUCCION: number;
  MAP_MATERIA_PRIMA: number;
  DOP_CANTIDAD_REQUERIDA: number;
  DOP_CANTIDAD_UTILIZADA?: number | null;
  MAP_NOMBRE?: string | null;
  MAP_UNIDAD_MEDIDA?: string | null;
  MAP_COSTO_REFERENCIAL?: number | null;
  STOCK_DISPONIBLE?: number | null;
}

export interface OrdenProduccionDetallePayload {
  MAP_Materia_Prima: number;
  DOP_Cantidad_Requerida: number;
  DOP_Cantidad_Utilizada?: number | null;
}

export interface OrdenProduccionDetailResponse {
  orden: OrdenProduccion;
  detalles: OrdenProduccionDetalle[];
}

export interface AdminClienteListFilters {
  search?: string;
  documento?: string;
  nombre?: string;
  correo?: string;
}

export interface TiendaPayload {
  TIE_Nombre: string;
  TIE_Departamento?: string | null;
  TIE_Municipio?: string | null;
  TIE_Zona_Aldea?: string | null;
  TIE_Domicilio?: string | null;
  TIE_Telefono?: string | null;
  TIE_Estado?: string;
}

export interface MetodoPagoPayload {
  MET_Nombre: string;
  MET_Estado?: string;
}

export interface ImpuestoPayload {
  IMP_Nombre: string;
  IMP_Porcentaje: number;
  IMP_Estado?: string;
}

export interface FacturaPayload {
  ORD_Orden_Venta: number;
  MET_Metodo_Pago: number;
  FAC_Subtotal: number;
  FAC_Total: number;
  FAC_Descuento_Total?: number;
  FAC_Impuesto_Total?: number;
  FAC_Pendiente_Pago?: number;
  FAC_Total_Pagado?: number;
  FAC_Estado_Factura?: string;
}

export interface RegisterClientePayload {
  CLI_Primer_Nombre: string;
  CLI_Segundo_Nombre?: string | null;
  CLI_Primer_Apellido: string;
  CLI_Segundo_Apellido?: string | null;
  CLI_Departamento?: string | null;
  CLI_Municipio?: string | null;
  CLI_Zona_Aldea?: string | null;
  CLI_Telefono?: string | null;
  CLI_Pais?: string | null;
  CLI_Tipo_Documento?: string | null;
  CLI_Numero_Documento?: string | null;
  CLI_Correo_Electronico: string;
  PER_Tipo_Documento?: string | null;
  PER_Nombre?: string | null;
  PER_Primer_Apellido?: string | null;
  PER_Segundo_Apellido?: string | null;
  PER_Correo?: string | null;
  PER_Telefono?: string | null;
  PER_Pais?: string | null;
  PER_Departamento?: string | null;
  PER_Municipio?: string | null;
  PER_Zona_Aldea?: string | null;
  PER_Domicilio?: string | null;
  username?: string;
  password: string;
}

export const formatCurrency = (value: number | null | undefined) =>
  `Q${new Intl.NumberFormat("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))}`;

export const formatDate = (value: string | undefined) => {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const productImages = [
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
  "https://images.unsplash.com/photo-1505693314120-0d443867891c",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://images.unsplash.com/photo-1615874959474-d609969a20ed",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4",
];

export const getProductImage = (productoId?: number | null) => {
  if (!productoId || !Number.isFinite(productoId)) {
    return productImages[0];
  }

  return productImages[Math.abs(productoId - 1) % productImages.length];
};

const categoryImages = [
  "https://images.unsplash.com/photo-1567016432779-094069958ea5",
  "https://images.unsplash.com/photo-1505693314120-0d443867891c",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
  "https://plus.unsplash.com/premium_photo-1771848251492-75d7c4881784",
  "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4",
];

export const getCategoryImage = (
  categoriaId?: number | null,
  index = 0,
) => {
  const seed =
    categoriaId && Number.isFinite(categoriaId)
      ? Math.abs(categoriaId - 1)
      : Math.abs(index);
  return categoryImages[seed % categoryImages.length];
};

export const inferProductCategory = (name: string) => {
  const lower = name.toLowerCase();

  if (lower.includes("cama") || lower.includes("dormitorio")) {
    return "dormitorio";
  }

  if (lower.includes("mesa") || lower.includes("comedor")) {
    return "comedor";
  }

  if (lower.includes("escritorio") || lower.includes("oficina")) {
    return "oficina";
  }

  if (lower.includes("sofa") || lower.includes("sillon")) {
    return "living";
  }

  return "decoracion";
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const normalizeProducto = (item: unknown): Producto => {
  const row = item as Record<string, unknown>;
  const proProducto =
    toNumberOrNull(row.PRO_Producto ?? row.PRO_PRODUCTO) ?? 0;
  const tipTipoProducto = toNumberOrNull(
    row.TIP_Tipo_Producto ?? row.TIP_TIPO_PRODUCTO,
  );
  const mapMaterial = toNumberOrNull(row.MAP_Material ?? row.MAP_MATERIAL);
  const copColor = toNumberOrNull(
    row.COP_Color_Producto ?? row.COP_COLOR_PRODUCTO,
  );
  const depDetalle = toNumberOrNull(
    row.DEP_Detalle_Producto ?? row.DEP_DETALLE_PRODUCTO,
  );
  const depPeso = toNumberOrNull(row.DEP_Peso ?? row.DEP_PESO);
  const depLongitud = toNumberOrNull(row.DEP_Longitud ?? row.DEP_LONGITUD);
  const prePrecio = toNumberOrNull(row.PRE_Precio ?? row.PRE_PRECIO);
  const proCodigo = (row.PRO_Codigo ?? row.PRO_CODIGO ?? null) as
    | string
    | null;
  const proNombre = String(row.PRO_Nombre ?? row.PRO_NOMBRE ?? "");
  const proEstado = (row.PRO_Estado ?? row.PRO_ESTADO ?? "ACTIVO") as string;
  const tipNombre = (row.TIP_Nombre ?? row.TIP_NOMBRE ?? null) as string | null;
  const mapNombre = (row.MAP_Nombre ?? row.MAP_NOMBRE ?? null) as string | null;
  const copNombre = (row.COP_Nombre ?? row.COP_NOMBRE ?? null) as string | null;
  const stockDisponible = toNumberOrNull(row.STOCK_DISPONIBLE);

  return {
    PRO_Producto: proProducto,
    PRO_PRODUCTO: proProducto,
    PRO_Codigo: proCodigo,
    PRO_CODIGO: proCodigo,
    PRO_Nombre: proNombre,
    PRO_NOMBRE: proNombre,
    PRO_Estado: proEstado,
    PRO_ESTADO: proEstado,
    DEP_Detalle_Producto: depDetalle,
    DEP_DETALLE_PRODUCTO: depDetalle,
    TIP_Tipo_Producto: tipTipoProducto,
    TIP_TIPO_PRODUCTO: tipTipoProducto,
    TIP_Nombre: tipNombre,
    TIP_NOMBRE: tipNombre,
    MAP_Material: mapMaterial,
    MAP_MATERIAL: mapMaterial,
    MAP_Nombre: mapNombre,
    MAP_NOMBRE: mapNombre,
    COP_Color_Producto: copColor,
    COP_COLOR_PRODUCTO: copColor,
    COP_Nombre: copNombre,
    COP_NOMBRE: copNombre,
    DEP_Peso: depPeso,
    DEP_PESO: depPeso,
    DEP_Longitud: depLongitud,
    DEP_LONGITUD: depLongitud,
    PRE_Precio: prePrecio,
    PRE_PRECIO: prePrecio,
    STOCK_DISPONIBLE: stockDisponible,
  };
};

const normalizeCategoria = (item: unknown): Categoria => {
  const row = item as Record<string, unknown>;
  const id = toNumberOrNull(row.TIP_TIPO_PRODUCTO ?? row.TIP_Tipo_Producto) ?? 0;
  const nombre = String(row.TIP_NOMBRE ?? row.TIP_Nombre ?? "");
  return {
    TIP_TIPO_PRODUCTO: id,
    TIP_Tipo_Producto: id,
    TIP_NOMBRE: nombre,
    TIP_Nombre: nombre,
  };
};

const normalizeMaterial = (item: unknown): Material => {
  const row = item as Record<string, unknown>;
  const id =
    toNumberOrNull(row.MAP_MATERIAL_PRODUCTO ?? row.MAP_Material_Producto) ?? 0;
  const nombre = String(row.MAP_NOMBRE ?? row.MAP_Nombre ?? "");
  const detalle = (row.MAP_DETALLE ?? row.MAP_Detalle ?? null) as string | null;
  return {
    MAP_MATERIAL_PRODUCTO: id,
    MAP_Material_Producto: id,
    MAP_NOMBRE: nombre,
    MAP_Nombre: nombre,
    MAP_DETALLE: detalle,
    MAP_Detalle: detalle,
  };
};

const normalizeColor = (item: unknown): Color => {
  const row = item as Record<string, unknown>;
  const id =
    toNumberOrNull(row.COP_COLOR_PRODUCTO ?? row.COP_Color_Producto) ?? 0;
  const nombre = String(row.COP_NOMBRE ?? row.COP_Nombre ?? "");
  const estado = (row.COP_ESTADO ?? row.COP_Estado ?? undefined) as
    | string
    | undefined;
  return {
    COP_COLOR_PRODUCTO: id,
    COP_Color_Producto: id,
    COP_NOMBRE: nombre,
    COP_Nombre: nombre,
    COP_ESTADO: estado,
    COP_Estado: estado,
  };
};

const normalizeAlmacen = (item: unknown): Almacen => {
  const row = item as Record<string, unknown>;
  return {
    ALM_ALMACEN: toNumberOrNull(row.ALM_ALMACEN ?? row.ALM_almacen) ?? 0,
    ALM_NOMBRE: String(row.ALM_NOMBRE ?? row.ALM_Nombre ?? ""),
    ALM_DEPARTAMENTO: (row.ALM_DEPARTAMENTO ?? row.ALM_Departamento ?? null) as string | null,
    ALM_MUNICIPIO: (row.ALM_MUNICIPIO ?? row.ALM_Municipio ?? null) as string | null,
    ALM_ZONA_ALDEA: (row.ALM_ZONA_ALDEA ?? row.ALM_Zona_Aldea ?? null) as string | null,
    ALM_DOMICILIO: (row.ALM_DOMICILIO ?? row.ALM_Domicilio ?? null) as string | null,
    ALM_TELEFONO: (row.ALM_TELEFONO ?? row.ALM_Telefono ?? null) as string | null,
    ALM_ESTADO: (row.ALM_ESTADO ?? row.ALM_Estado ?? null) as string | null,
  };
};

const normalizeMateriaPrima = (item: unknown): MateriaPrima => {
  const row = item as Record<string, unknown>;
  return {
    MAP_MATERIA_PRIMA:
      toNumberOrNull(row.MAP_MATERIA_PRIMA ?? row.MAP_Materia_Prima) ?? 0,
    MAP_NOMBRE: String(row.MAP_NOMBRE ?? row.MAP_Nombre ?? ""),
    MAP_UNIDAD_MEDIDA:
      (row.MAP_UNIDAD_MEDIDA ?? row.MAP_Unidad_Medida ?? null) as string | null,
    MAP_COSTO_REFERENCIAL:
      toNumberOrNull(row.MAP_COSTO_REFERENCIAL ?? row.MAP_Costo_Referencial),
    MAP_ESTADO: (row.MAP_ESTADO ?? row.MAP_Estado ?? null) as string | null,
  };
};

const normalizeStockProducto = (item: unknown): StockProducto => {
  const row = item as Record<string, unknown>;
  return {
    STP_STOCK_PRODUCTO:
      toNumberOrNull(row.STP_STOCK_PRODUCTO ?? row.STP_Stock_Producto) ?? 0,
    ALM_ALMACEN: toNumberOrNull(row.ALM_ALMACEN ?? row.ALM_almacen) ?? 0,
    PRO_PRODUCTO: toNumberOrNull(row.PRO_PRODUCTO ?? row.PRO_Producto) ?? 0,
    STP_CANTIDAD: toNumberOrNull(row.STP_CANTIDAD ?? row.STP_Cantidad) ?? 0,
    STP_STOCK_MINIMO:
      toNumberOrNull(row.STP_STOCK_MINIMO ?? row.STP_Stock_Minimo),
    STP_STOCK_MAXIMO:
      toNumberOrNull(row.STP_STOCK_MAXIMO ?? row.STP_Stock_Maximo),
    STP_ULTIMA_ACTUALIZACION:
      (row.STP_ULTIMA_ACTUALIZACION ?? row.STP_Ultima_Actualizacion ?? null) as string | null,
    ALM_NOMBRE: (row.ALM_NOMBRE ?? row.ALM_Nombre ?? null) as string | null,
    ALM_ESTADO: (row.ALM_ESTADO ?? row.ALM_Estado ?? null) as string | null,
    PRO_CODIGO: (row.PRO_CODIGO ?? row.PRO_Codigo ?? null) as string | null,
    PRO_NOMBRE: (row.PRO_NOMBRE ?? row.PRO_Nombre ?? null) as string | null,
    PRO_ESTADO: (row.PRO_ESTADO ?? row.PRO_Estado ?? null) as string | null,
    STOCK_BAJO: toNumberOrNull(row.STOCK_BAJO),
  };
};

const normalizeStockMateriaPrima = (item: unknown): StockMateriaPrima => {
  const row = item as Record<string, unknown>;
  return {
    SMP_STOCK_MAT_PRIMA:
      toNumberOrNull(row.SMP_STOCK_MAT_PRIMA ?? row.SMP_Stock_Mat_Prima) ?? 0,
    MAP_MATERIA_PRIMA:
      toNumberOrNull(row.MAP_MATERIA_PRIMA ?? row.MAP_Materia_Prima) ?? 0,
    SMP_CANTIDAD: toNumberOrNull(row.SMP_CANTIDAD ?? row.SMP_Cantidad) ?? 0,
    SMP_STOCK_MINIMO:
      toNumberOrNull(row.SMP_STOCK_MINIMO ?? row.SMP_Stock_Minimo),
    SMP_STOCK_MAXIMO:
      toNumberOrNull(row.SMP_STOCK_MAXIMO ?? row.SMP_Stock_Maximo),
    SMP_ULTIMA_ACTUALIZACION:
      (row.SMP_ULTIMA_ACTUALIZACION ?? row.SMP_Ultima_Actualizacion ?? null) as string | null,
    MAP_NOMBRE: (row.MAP_NOMBRE ?? row.MAP_Nombre ?? null) as string | null,
    MAP_UNIDAD_MEDIDA:
      (row.MAP_UNIDAD_MEDIDA ?? row.MAP_Unidad_Medida ?? null) as string | null,
    MAP_COSTO_REFERENCIAL:
      toNumberOrNull(row.MAP_COSTO_REFERENCIAL ?? row.MAP_Costo_Referencial),
    MAP_ESTADO: (row.MAP_ESTADO ?? row.MAP_Estado ?? null) as string | null,
    STOCK_BAJO: toNumberOrNull(row.STOCK_BAJO),
  };
};

const normalizeEmpleado = (item: unknown): Empleado => {
  const row = item as Record<string, unknown>;
  return {
    EMP_EMPLEADO: toNumberOrNull(row.EMP_EMPLEADO ?? row.EMP_Empleado) ?? 0,
    PER_PERSONA: toNumberOrNull(row.PER_PERSONA ?? row.PER_Persona),
    EMP_ESTADO: (row.EMP_ESTADO ?? row.EMP_Estado ?? null) as string | null,
    EMP_TIPO_CONTRATO:
      (row.EMP_TIPO_CONTRATO ?? row.EMP_Tipo_Contrato ?? null) as string | null,
    PER_NOMBRE: (row.PER_NOMBRE ?? row.PER_Nombre ?? null) as string | null,
    PER_PRIMER_APELLIDO:
      (row.PER_PRIMER_APELLIDO ?? row.PER_Primer_Apellido ?? null) as string | null,
    PER_SEGUNDO_APELLIDO:
      (row.PER_SEGUNDO_APELLIDO ?? row.PER_Segundo_Apellido ?? null) as string | null,
    PER_TIPO_DOCUMENTO:
      (row.PER_TIPO_DOCUMENTO ?? row.PER_Tipo_Documento ?? null) as string | null,
    PER_CORREO: (row.PER_CORREO ?? row.PER_Correo ?? null) as string | null,
    PER_TELEFONO: (row.PER_TELEFONO ?? row.PER_Telefono ?? null) as string | null,
    PER_PAIS: (row.PER_PAIS ?? row.PER_Pais ?? null) as string | null,
    PER_DEPARTAMENTO:
      (row.PER_DEPARTAMENTO ?? row.PER_Departamento ?? null) as string | null,
    PER_MUNICIPIO:
      (row.PER_MUNICIPIO ?? row.PER_Municipio ?? null) as string | null,
    PER_ZONA_ALDEA:
      (row.PER_ZONA_ALDEA ?? row.PER_Zona_Aldea ?? null) as string | null,
    PER_DOMICILIO:
      (row.PER_DOMICILIO ?? row.PER_Domicilio ?? null) as string | null,
    EMPLEADO_NOMBRE:
      (row.EMPLEADO_NOMBRE ?? row.empleado_nombre ?? null) as string | null,
    DEM_DETALLE_EMPLEADO:
      toNumberOrNull(row.DEM_DETALLE_EMPLEADO ?? row.DEM_Detalle_Empleado),
    CAR_CARGO: toNumberOrNull(row.CAR_CARGO ?? row.CAR_Cargo),
    CAR_NOMBRE: (row.CAR_NOMBRE ?? row.CAR_Nombre ?? null) as string | null,
    PUE_PUESTO: toNumberOrNull(row.PUE_PUESTO ?? row.PUE_Puesto),
    PUE_NOMBRE: (row.PUE_NOMBRE ?? row.PUE_Nombre ?? null) as string | null,
    DEP_DEPARTAMENTO:
      toNumberOrNull(row.DEP_DEPARTAMENTO ?? row.DEP_Departamento),
    DEP_NOMBRE: (row.DEP_NOMBRE ?? row.DEP_Nombre ?? null) as string | null,
    DEM_FECHA_INICIO:
      (row.DEM_FECHA_INICIO ?? row.DEM_Fecha_Inicio ?? null) as string | null,
    DEM_FECHA_FIN:
      (row.DEM_FECHA_FIN ?? row.DEM_Fecha_Fin ?? null) as string | null,
    DEM_SALARIO: toNumberOrNull(row.DEM_SALARIO ?? row.DEM_Salario),
    DEM_ESTADO: (row.DEM_ESTADO ?? row.DEM_Estado ?? null) as string | null,
  };
};

const normalizeEmpleadoDetalle = (item: unknown): EmpleadoDetalleLaboral => {
  const row = item as Record<string, unknown>;
  return {
    DEM_DETALLE_EMPLEADO:
      toNumberOrNull(row.DEM_DETALLE_EMPLEADO ?? row.DEM_Detalle_Empleado) ?? 0,
    EMP_EMPLEADO: toNumberOrNull(row.EMP_EMPLEADO ?? row.EMP_Empleado) ?? 0,
    CAR_CARGO: toNumberOrNull(row.CAR_CARGO ?? row.CAR_Cargo),
    CAR_NOMBRE: (row.CAR_NOMBRE ?? row.CAR_Nombre ?? null) as string | null,
    PUE_PUESTO: toNumberOrNull(row.PUE_PUESTO ?? row.PUE_Puesto),
    PUE_NOMBRE: (row.PUE_NOMBRE ?? row.PUE_Nombre ?? null) as string | null,
    DEP_DEPARTAMENTO:
      toNumberOrNull(row.DEP_DEPARTAMENTO ?? row.DEP_Departamento),
    DEP_NOMBRE: (row.DEP_NOMBRE ?? row.DEP_Nombre ?? null) as string | null,
    DEM_FECHA_INICIO:
      (row.DEM_FECHA_INICIO ?? row.DEM_Fecha_Inicio ?? null) as string | null,
    DEM_FECHA_FIN:
      (row.DEM_FECHA_FIN ?? row.DEM_Fecha_Fin ?? null) as string | null,
    DEM_SALARIO: toNumberOrNull(row.DEM_SALARIO ?? row.DEM_Salario),
    DEM_ESTADO: (row.DEM_ESTADO ?? row.DEM_Estado ?? null) as string | null,
  };
};

const normalizeEmpleadoDetalleResponse = (item: unknown): EmpleadoDetalleResponse => {
  const row = item as { empleado?: unknown; detalles?: unknown[] } | null;
  return {
    empleado: normalizeEmpleado(row?.empleado ?? {}),
    detalles: Array.isArray(row?.detalles)
      ? row!.detalles.map(normalizeEmpleadoDetalle)
      : [],
  };
};

const normalizeEmpleadoCatalogo = (
  item: unknown,
  config: {
    idKeys: string[];
    nombreKeys: string[];
    estadoKeys?: string[];
  },
): EmpleadoCatalogoItem => {
  const row = item as Record<string, unknown>;
  const findValue = (keys: string[]) =>
    keys.reduce<unknown>((current, key) => (current ?? row[key]), undefined);

  return {
    id: toNumberOrNull(findValue(config.idKeys)) ?? 0,
    nombre: String(findValue(config.nombreKeys) ?? ""),
    estado: config.estadoKeys
      ? (findValue(config.estadoKeys) as string | null | undefined) ?? null
      : null,
  };
};

const normalizePrecioProducto = (item: unknown): PrecioProducto => {
  const row = item as Record<string, unknown>;
  return {
    PRE_PRECIO_PRODUCTO:
      toNumberOrNull(row.PRE_PRECIO_PRODUCTO ?? row.PRE_Precio_Producto) ?? 0,
    PRO_PRODUCTO: toNumberOrNull(row.PRO_PRODUCTO ?? row.PRO_Producto) ?? 0,
    PRE_PRECIO: toNumberOrNull(row.PRE_PRECIO ?? row.PRE_Precio) ?? 0,
    PRE_FECHA_INICIO: String(row.PRE_FECHA_INICIO ?? row.PRE_Fecha_Inicio ?? ""),
    PRE_FECHA_FIN: (row.PRE_FECHA_FIN ?? row.PRE_Fecha_Fin ?? null) as string | null,
    PRO_CODIGO: (row.PRO_CODIGO ?? row.PRO_Codigo ?? null) as string | null,
    PRO_NOMBRE: (row.PRO_NOMBRE ?? row.PRO_Nombre ?? null) as string | null,
    ES_VIGENTE: toNumberOrNull(row.ES_VIGENTE),
  };
};

const normalizeOrdenProduccion = (item: unknown): OrdenProduccion => {
  const row = item as Record<string, unknown>;
  return {
    OPR_ORDENPRODUCCION:
      toNumberOrNull(row.OPR_ORDENPRODUCCION ?? row.OPR_Ordenproduccion) ?? 0,
    PRO_PRODUCTO: toNumberOrNull(row.PRO_PRODUCTO ?? row.PRO_Producto) ?? 0,
    EMP_EMPLEADO: toNumberOrNull(row.EMP_EMPLEADO ?? row.EMP_Empleado) ?? 0,
    OPR_FECHA_CREACION:
      (row.OPR_FECHA_CREACION ?? row.OPR_Fecha_Creacion ?? null) as string | null,
    OPR_FECHA_INICIO:
      (row.OPR_FECHA_INICIO ?? row.OPR_Fecha_Inicio ?? null) as string | null,
    OPR_FECHA_FIN:
      (row.OPR_FECHA_FIN ?? row.OPR_Fecha_Fin ?? null) as string | null,
    OPR_CANTIDAD_PROGRAMADA:
      toNumberOrNull(row.OPR_CANTIDAD_PROGRAMADA ?? row.OPR_Cantidad_Programada) ?? 0,
    OPR_CANTIDAD_PRODUCIDA:
      toNumberOrNull(row.OPR_CANTIDAD_PRODUCIDA ?? row.OPR_Cantidad_Producida),
    OPR_ESTADO: String(row.OPR_ESTADO ?? row.OPR_Estado ?? ""),
    PRO_CODIGO: (row.PRO_CODIGO ?? row.PRO_Codigo ?? null) as string | null,
    PRO_NOMBRE: (row.PRO_NOMBRE ?? row.PRO_Nombre ?? null) as string | null,
    EMPLEADO_NOMBRE: (row.EMPLEADO_NOMBRE ?? null) as string | null,
    TOTAL_DETALLES: toNumberOrNull(row.TOTAL_DETALLES),
  };
};

const normalizeOrdenProduccionDetalle = (item: unknown): OrdenProduccionDetalle => {
  const row = item as Record<string, unknown>;
  return {
    DOP_DETALLE_ORDENPRODUCCION:
      toNumberOrNull(row.DOP_DETALLE_ORDENPRODUCCION ?? row.DOP_Detalle_OrdenProduccion) ?? 0,
    OPR_ORDENPRODUCCION:
      toNumberOrNull(row.OPR_ORDENPRODUCCION ?? row.OPR_Ordenproduccion) ?? 0,
    MAP_MATERIA_PRIMA:
      toNumberOrNull(row.MAP_MATERIA_PRIMA ?? row.MAP_Materia_Prima) ?? 0,
    DOP_CANTIDAD_REQUERIDA:
      toNumberOrNull(row.DOP_CANTIDAD_REQUERIDA ?? row.DOP_Cantidad_Requerida) ?? 0,
    DOP_CANTIDAD_UTILIZADA:
      toNumberOrNull(row.DOP_CANTIDAD_UTILIZADA ?? row.DOP_Cantidad_Utilizada),
    MAP_NOMBRE: (row.MAP_NOMBRE ?? row.MAP_Nombre ?? null) as string | null,
    MAP_UNIDAD_MEDIDA:
      (row.MAP_UNIDAD_MEDIDA ?? row.MAP_Unidad_Medida ?? null) as string | null,
    MAP_COSTO_REFERENCIAL:
      toNumberOrNull(row.MAP_COSTO_REFERENCIAL ?? row.MAP_Costo_Referencial),
    STOCK_DISPONIBLE: toNumberOrNull(row.STOCK_DISPONIBLE),
  };
};

const buildQueryString = (params: Record<string, string | number | undefined | null>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};


export const productosApi = {
  listar: async (categoriaId?: number) => {
    const data = await apiRequest<unknown[]>(
      categoriaId !== undefined
        ? `/productos?categoriaId=${categoriaId}`
        : "/productos",
    );
    return Array.isArray(data) ? data.map(normalizeProducto) : [];
  },
  listarTodos: async () => {
    const data = await apiRequest<unknown[]>("/productos?todos=true");
    return Array.isArray(data) ? data.map(normalizeProducto) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/productos/${id}`);
    return normalizeProducto(data);
  },
  listarMateriales: async () => {
    const data = await apiRequest<unknown[]>("/productos/materiales");
    return Array.isArray(data) ? data.map(normalizeMaterial) : [];
  },
  listarColores: async () => {
    const data = await apiRequest<unknown[]>("/productos/colores");
    return Array.isArray(data) ? data.map(normalizeColor) : [];
  },
  crear: (payload: ProductoPayload) =>
    apiRequest<Producto>("/productos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: ProductoPayload) =>
    apiRequest<Producto>(`/productos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstado: (id: number, estado: string) =>
    apiRequest<unknown>(`/productos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ PRO_Estado: estado }),
    }),
  asignarCategoria: (id: number, categoriaId: number) =>
    apiRequest<unknown>(`/productos/${id}/categoria`, {
      method: "PATCH",
      body: JSON.stringify({ TIP_Tipo_Producto: categoriaId }),
    }),
};

export const categoriasApi = {
  listar: async () => {
    const data = await apiRequest<unknown[]>("/categorias");
    return Array.isArray(data) ? data.map(normalizeCategoria) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/categorias/${id}`);
    return normalizeCategoria(data);
  },
  crear: (payload: CategoriaPayload) =>
    apiRequest<{ TIP_Tipo_Producto: number }>("/categorias", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: CategoriaPayload) =>
    apiRequest<unknown>(`/categorias/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/categorias/${id}`, {
      method: "DELETE",
    }),
};

export const coloresApi = {
  listar: async () => {
    const data = await apiRequest<unknown[]>("/colores");
    return Array.isArray(data) ? data.map(normalizeColor) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/colores/${id}`);
    return normalizeColor(data);
  },
  crear: (payload: ColorPayload) =>
    apiRequest<{ COP_Color_Producto: number }>("/colores", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: ColorPayload) =>
    apiRequest<unknown>(`/colores/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstado: (id: number, estado: string) =>
    apiRequest<unknown>(`/colores/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ COP_Estado: estado }),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/colores/${id}`, {
      method: "DELETE",
    }),
};

export const materialesApi = {
  listar: async () => {
    const data = await apiRequest<unknown[]>("/materiales");
    return Array.isArray(data) ? data.map(normalizeMaterial) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/materiales/${id}`);
    return normalizeMaterial(data);
  },
  crear: (payload: MaterialPayload) =>
    apiRequest<{ MAP_Material_Producto: number }>("/materiales", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: MaterialPayload) =>
    apiRequest<unknown>(`/materiales/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/materiales/${id}`, {
      method: "DELETE",
    }),
};

export const carritoApi = {
  obtenerPorCliente: (clienteId: number) =>
    apiRequest<Carrito | null>(`/carrito/cliente/${clienteId}`),
  obtenerPorId: (ordenId: number) =>
    apiRequest<Carrito | null>(`/carrito/${ordenId}`),
  agregarItemActivo: (payload: {
    CLI_Cliente: number;
    TIE_Tienda: number;
    PRO_Producto: number;
    DOV_Cantidad: number;
    DOV_Descuento?: number;
  }) =>
    apiRequest<Carrito>("/carrito/items", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizarItem: (
    detalleId: number,
    payload: { DOV_Cantidad: number; DOV_Descuento?: number },
  ) =>
    apiRequest<Carrito>(`/carrito/items/${detalleId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminarItem: (detalleId: number) =>
    apiRequest<Carrito>(`/carrito/items/${detalleId}`, {
      method: "DELETE",
    }),
  vaciar: (ordenId: number) =>
    apiRequest<Carrito>(`/carrito/${ordenId}`, {
      method: "DELETE",
    }),
  finalizar: (ordenId: number) =>
    apiRequest<Carrito>(`/carrito/${ordenId}/finalizar`, {
      method: "PATCH",
    }),
};

export const tiendasApi = {
  listar: () => apiRequest<Tienda[]>("/tiendas"),
  crear: (payload: TiendaPayload) =>
    apiRequest<{ TIE_Tienda: number }>("/tiendas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: TiendaPayload) =>
    apiRequest<unknown>(`/tiendas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/tiendas/${id}`, {
      method: "DELETE",
    }),
};

export const metodosPagoApi = {
  listar: () => apiRequest<MetodoPago[]>("/metodos-pago"),
  crear: (payload: MetodoPagoPayload) =>
    apiRequest<{ MET_Metodo_Pago: number }>("/metodos-pago", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: MetodoPagoPayload) =>
    apiRequest<unknown>(`/metodos-pago/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/metodos-pago/${id}`, {
      method: "DELETE",
    }),
};

export const impuestosApi = {
  listar: () => apiRequest<Impuesto[]>("/impuestos"),
  crear: (payload: ImpuestoPayload) =>
    apiRequest<{ IMP_Impuesto: number }>("/impuestos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: ImpuestoPayload) =>
    apiRequest<unknown>(`/impuestos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/impuestos/${id}`, {
      method: "DELETE",
    }),
};

export const ordenesVentaApi = {
  listar: (search?: string) =>
    apiRequest<OrdenVenta[]>(`/ordenes-venta${buildQueryString({ search })}`),
  obtener: (id: number) => apiRequest<OrdenVenta>(`/ordenes-venta/${id}`),
  obtenerDetalle: (id: number) =>
    apiRequest<AdminOrderDetail>(`/ordenes-venta/${id}/detalle`),
  listarPorCliente: (clienteId: number) =>
    apiRequest<OrdenVenta[]>(`/ordenes-venta/cliente/${clienteId}`),
  cambiarEstado: (id: number, ODV_Estado: "ACTIVO" | "ANULADO" | "FINALIZADO") =>
    apiRequest<unknown>(`/ordenes-venta/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ ODV_Estado }),
    }),
};

export const facturasApi = {
  listar: (search?: string) =>
    apiRequest<Factura[]>(`/facturas${buildQueryString({ search })}`),
  obtener: (id: number) => apiRequest<Factura>(`/facturas/${id}`),
  obtenerDetalle: (id: number) =>
    apiRequest<FacturaDetail>(`/facturas/${id}/detalle`),
  listarPorOrden: (ordenId: number) =>
    apiRequest<Factura[]>(`/facturas/orden/${ordenId}`),
  crear: (payload: FacturaPayload) =>
    apiRequest<{ FAC_Factura: number }>("/facturas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  registrarPago: (id: number, monto: number) =>
    apiRequest<unknown>(`/facturas/${id}/pago`, {
      method: "PATCH",
      body: JSON.stringify({ monto }),
    }),
};

export const shopAuthApi = {
  register: (payload: RegisterClientePayload) =>
    apiRequest<AuthSession>("/shop/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { username: string; password: string }) =>
    apiRequest<AuthSession>("/shop/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () =>
    apiRequest<{
      clienteId: number;
      username: string;
      profile: ClienteProfile;
    }>("/shop/auth/me"),
  updateProfile: (payload: Partial<RegisterClientePayload>) =>
    apiRequest<{ profile: ClienteProfile }>("/shop/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const shopCheckoutApi = {
  checkout: (payload: {
    metodoPagoId: number;
    ordenId?: number;
    tarjeta?: {
      titular?: string;
      numero?: string;
      vencimiento?: string;
      cvv?: string;
    };
  }) =>
    apiRequest<{
      ordenId: number;
      facturaId: number;
      referencia: string;
      subtotal: number;
      descuento: number;
      impuesto: number;
      total: number;
      metodoPagoId: number;
      items: Array<{
        PRO_Producto: number;
        PRO_Codigo: string | null;
        PRO_Nombre: string;
        DOV_Cantidad: number;
        DOV_Precio_Unitario: number;
        DOV_Descuento: number;
        DOV_Subtotal: number;
      }>;
    }>("/shop/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listarOrdenes: () => apiRequest<ShopOrder[]>("/shop/checkout/orders"),
  obtenerOrden: (id: number) =>
    apiRequest<ShopOrderDetail>(`/shop/checkout/orders/${id}`),
};

export const adminClientesApi = {
  listar: (filters: AdminClienteListFilters = {}) =>
    apiRequest<ClienteAdmin[]>(
      `/admin/clientes${buildQueryString({
        search: filters.search,
        documento: filters.documento,
        nombre: filters.nombre,
        correo: filters.correo,
      })}`,
    ),
  obtener: (id: number) => apiRequest<ClienteProfile>(`/admin/clientes/${id}`),
  compras: (id: number) =>
    apiRequest<ClienteCompraRow[]>(`/admin/clientes/${id}/compras`),
  crear: (payload: RegisterClientePayload) =>
    apiRequest<ClienteProfile>("/admin/clientes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (
    id: number,
    payload: Partial<Omit<RegisterClientePayload, "password" | "username">>,
  ) =>
    apiRequest<ClienteProfile>(`/admin/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/admin/clientes/${id}`, {
      method: "DELETE",
    }),
};

export const almacenesApi = {
  listar: async () => {
    const data = await apiRequest<unknown[]>("/almacenes");
    return Array.isArray(data) ? data.map(normalizeAlmacen) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/almacenes/${id}`);
    return normalizeAlmacen(data);
  },
  crear: (payload: AlmacenPayload) =>
    apiRequest<{ ALM_almacen: number }>("/almacenes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: AlmacenPayload) =>
    apiRequest<unknown>(`/almacenes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstado: (id: number, estado: "ACTIVO" | "INACTIVO") =>
    apiRequest<unknown>(`/almacenes/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ ALM_Estado: estado }),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/almacenes/${id}`, {
      method: "DELETE",
    }),
};

export const materiasPrimasApi = {
  listar: async () => {
    const data = await apiRequest<unknown[]>("/materias-primas");
    return Array.isArray(data) ? data.map(normalizeMateriaPrima) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/materias-primas/${id}`);
    return normalizeMateriaPrima(data);
  },
  crear: (payload: MateriaPrimaPayload) =>
    apiRequest<{ MAP_Materia_Prima: number }>("/materias-primas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: MateriaPrimaPayload) =>
    apiRequest<unknown>(`/materias-primas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstado: (id: number, estado: "ACTIVO" | "INACTIVO") =>
    apiRequest<unknown>(`/materias-primas/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ MAP_Estado: estado }),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/materias-primas/${id}`, {
      method: "DELETE",
    }),
};

export const stockProductoApi = {
  listar: async (filters?: { productoId?: number; almacenId?: number }) => {
    const data = await apiRequest<unknown[]>(
      `/stock-producto${buildQueryString({
        productoId: filters?.productoId,
        almacenId: filters?.almacenId,
      })}`,
    );
    return Array.isArray(data) ? data.map(normalizeStockProducto) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/stock-producto/${id}`);
    return normalizeStockProducto(data);
  },
  crear: (payload: StockProductoPayload) =>
    apiRequest<{ STP_Stock_Producto: number }>("/stock-producto", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: StockProductoPayload) =>
    apiRequest<unknown>(`/stock-producto/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/stock-producto/${id}`, {
      method: "DELETE",
    }),
};

export const stockMateriaPrimaApi = {
  listar: async (filters?: { materiaPrimaId?: number }) => {
    const data = await apiRequest<unknown[]>(
      `/stock-materia-prima${buildQueryString({
        materiaPrimaId: filters?.materiaPrimaId,
      })}`,
    );
    return Array.isArray(data) ? data.map(normalizeStockMateriaPrima) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/stock-materia-prima/${id}`);
    return normalizeStockMateriaPrima(data);
  },
  crear: (payload: StockMateriaPrimaPayload) =>
    apiRequest<{ SMP_Stock_Mat_Prima: number }>("/stock-materia-prima", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: StockMateriaPrimaPayload) =>
    apiRequest<unknown>(`/stock-materia-prima/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/stock-materia-prima/${id}`, {
      method: "DELETE",
    }),
};

export const empleadosApi = {
  listar: async (soloActivos = true) => {
    const data = await apiRequest<unknown[]>(
      `/empleados${buildQueryString({ activos: soloActivos ? undefined : "false" })}`,
    );
    return Array.isArray(data) ? data.map(normalizeEmpleado) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<{
      empleado: unknown;
      detalles: unknown[];
    }>(`/empleados/${id}`);
    return normalizeEmpleadoDetalleResponse(data);
  },
  crear: (payload: EmpleadoPayload) =>
    apiRequest<unknown>("/empleados", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then(normalizeEmpleadoDetalleResponse),
  actualizar: (id: number, payload: EmpleadoPayload) =>
    apiRequest<unknown>(`/empleados/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }).then(normalizeEmpleadoDetalleResponse),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/empleados/${id}`, {
      method: "DELETE",
    }),
  listarCargos: async () => {
    const data = await apiRequest<unknown[]>("/empleados/catalogos/cargos");
    return Array.isArray(data)
      ? data.map((item) =>
          normalizeEmpleadoCatalogo(item, {
            idKeys: ["CAR_CARGO", "CAR_Cargo"],
            nombreKeys: ["CAR_NOMBRE", "CAR_Nombre"],
          }),
        )
      : [];
  },
  crearCargo: (payload: CargoPayload) =>
    apiRequest<{ CAR_Cargo: number }>("/empleados/catalogos/cargos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizarCargo: (id: number, payload: CargoPayload) =>
    apiRequest<unknown>(`/empleados/catalogos/cargos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminarCargo: (id: number) =>
    apiRequest<unknown>(`/empleados/catalogos/cargos/${id}`, {
      method: "DELETE",
    }),
  listarPuestos: async (soloActivos = true) => {
    const data = await apiRequest<unknown[]>(
      `/empleados/catalogos/puestos${buildQueryString({
        activos: soloActivos ? undefined : "false",
      })}`,
    );
    return Array.isArray(data)
      ? data.map((item) =>
          normalizeEmpleadoCatalogo(item, {
            idKeys: ["PUE_PUESTO", "PUE_Puesto"],
            nombreKeys: ["PUE_NOMBRE", "PUE_Nombre"],
            estadoKeys: ["PUE_ESTADO", "PUE_Estado"],
          }),
        )
      : [];
  },
  crearPuesto: (payload: PuestoPayload) =>
    apiRequest<{ PUE_Puesto: number }>("/empleados/catalogos/puestos", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizarPuesto: (id: number, payload: PuestoPayload) =>
    apiRequest<unknown>(`/empleados/catalogos/puestos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstadoPuesto: (id: number, estado: "ACTIVO" | "INACTIVO") =>
    apiRequest<unknown>(`/empleados/catalogos/puestos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ PUE_Estado: estado }),
    }),
  eliminarPuesto: (id: number) =>
    apiRequest<unknown>(`/empleados/catalogos/puestos/${id}`, {
      method: "DELETE",
    }),
  listarDepartamentos: async (soloActivos = true) => {
    const data = await apiRequest<unknown[]>(
      `/empleados/catalogos/departamentos${buildQueryString({
        activos: soloActivos ? undefined : "false",
      })}`,
    );
    return Array.isArray(data)
      ? data.map((item) =>
          normalizeEmpleadoCatalogo(item, {
            idKeys: ["DEP_DEPARTAMENTO", "DEP_Departamento"],
            nombreKeys: ["DEP_NOMBRE", "DEP_Nombre"],
            estadoKeys: ["DEP_ESTADO", "DEP_Estado"],
          }),
        )
      : [];
  },
  crearDepartamento: (payload: DepartamentoLaboralPayload) =>
    apiRequest<{ DEP_Departamento: number }>(
      "/empleados/catalogos/departamentos",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  actualizarDepartamento: (id: number, payload: DepartamentoLaboralPayload) =>
    apiRequest<unknown>(`/empleados/catalogos/departamentos/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstadoDepartamento: (id: number, estado: "ACTIVO" | "INACTIVO") =>
    apiRequest<unknown>(`/empleados/catalogos/departamentos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ DEP_Estado: estado }),
    }),
  eliminarDepartamento: (id: number) =>
    apiRequest<unknown>(`/empleados/catalogos/departamentos/${id}`, {
      method: "DELETE",
    }),
};

export const preciosProductoApi = {
  listar: async (productoId?: number) => {
    const data = await apiRequest<unknown[]>(
      `/precios-producto${buildQueryString({ productoId })}`,
    );
    return Array.isArray(data) ? data.map(normalizePrecioProducto) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/precios-producto/${id}`);
    return normalizePrecioProducto(data);
  },
  crear: (payload: PrecioProductoPayload) =>
    apiRequest<{ PRE_Precio_Producto: number }>("/precios-producto", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: PrecioProductoPayload) =>
    apiRequest<unknown>(`/precios-producto/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminar: (id: number) =>
    apiRequest<unknown>(`/precios-producto/${id}`, {
      method: "DELETE",
    }),
};

export const ordenesProduccionApi = {
  listar: async (filters?: { estado?: string; productoId?: number }) => {
    const data = await apiRequest<unknown[]>(
      `/ordenes-produccion${buildQueryString({
        estado: filters?.estado,
        productoId: filters?.productoId,
      })}`,
    );
    return Array.isArray(data) ? data.map(normalizeOrdenProduccion) : [];
  },
  obtener: async (id: number) => {
    const data = await apiRequest<unknown>(`/ordenes-produccion/${id}`);
    return normalizeOrdenProduccion(data);
  },
  obtenerDetalle: async (id: number) => {
    const data = await apiRequest<{
      orden: unknown;
      detalles: unknown[];
    }>(`/ordenes-produccion/${id}/detalle`);
    return {
      orden: normalizeOrdenProduccion(data.orden),
      detalles: Array.isArray(data.detalles)
        ? data.detalles.map(normalizeOrdenProduccionDetalle)
        : [],
    } satisfies OrdenProduccionDetailResponse;
  },
  crear: (payload: OrdenProduccionPayload) =>
    apiRequest<{ OPR_Ordenproduccion: number }>("/ordenes-produccion", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  actualizar: (id: number, payload: OrdenProduccionPayload) =>
    apiRequest<unknown>(`/ordenes-produccion/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cambiarEstado: (id: number, OPR_Estado: string) =>
    apiRequest<unknown>(`/ordenes-produccion/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ OPR_Estado }),
    }),
  finalizar: (id: number, ALM_almacen?: number) =>
    apiRequest<unknown>(`/ordenes-produccion/${id}/finalizar`, {
      method: "PATCH",
      body: JSON.stringify(
        ALM_almacen ? { ALM_almacen } : {},
      ),
    }),
  agregarDetalle: (id: number, payload: OrdenProduccionDetallePayload) =>
    apiRequest<{ DOP_Detalle_OrdenProduccion: number }>(
      `/ordenes-produccion/${id}/detalles`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  actualizarDetalle: (
    detalleId: number,
    payload: OrdenProduccionDetallePayload,
  ) =>
    apiRequest<unknown>(`/ordenes-produccion/detalles/${detalleId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  eliminarDetalle: (detalleId: number) =>
    apiRequest<unknown>(`/ordenes-produccion/detalles/${detalleId}`, {
      method: "DELETE",
    }),
};
