"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  Plus,
  ReceiptText,
  Save,
  Sofa,
  Store,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  adminClientesApi,
  categoriasApi,
  coloresApi,
  facturasApi,
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  impuestosApi,
  materialesApi,
  metodosPagoApi,
  ordenesVentaApi,
  productosApi,
  tiendasApi,
  type AdminOrderDetail,
  type Categoria,
  type ClienteAdmin,
  type ClienteCompraRow,
  type ClienteProfile,
  type Color,
  type Factura,
  type FacturaDetail,
  type Impuesto,
  type Material,
  type MetodoPago,
  type OrdenVenta,
  type Producto,
  type RegisterClientePayload,
  type Tienda,
} from "../lib/api";
import { AdminAlmacenesSection } from "./components/AdminAlmacenesSection";
import { AdminEmpleadosSection } from "./components/AdminEmpleadosSection";
import { AdminFacturaDocumento } from "./components/AdminFacturaDocumento";
import { AdminMateriaPrimaSection } from "./components/AdminMateriaPrimaSection";
import { AdminOrdenesProduccionSection } from "./components/AdminOrdenesProduccionSection";
import { AdminPreciosProductoSection } from "./components/AdminPreciosProductoSection";
import { AdminStockMateriaPrimaSection } from "./components/AdminStockMateriaPrimaSection";
import { AdminStockProductoSection } from "./components/AdminStockProductoSection";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Tab =
  | "dashboard"
  | "muebles"
  | "colores"
  | "materiales"
  | "precios"
  | "almacenes"
  | "stock-producto"
  | "materias-primas"
  | "stock-materia-prima"
  | "produccion"
  | "categorias"
  | "tiendas"
  | "metodos"
  | "impuestos"
  | "ordenes"
  | "facturas"
  | "empleados"
  | "clientes"
  | "reportes";

interface ProductoForm {
  id: number | null;
  codigo: string;
  nombre: string;
  estado: string;
  tipTipoProducto: string;
  mapMaterial: string;
  copColor: string;
  peso: string;
  longitud: string;
  precio: string;
}

interface CategoriaForm {
  id: number | null;
  nombre: string;
}

interface TiendaForm {
  id: number | null;
  nombre: string;
  departamento: string;
  municipio: string;
  zona: string;
  domicilio: string;
  telefono: string;
  estado: string;
}

interface MetodoForm {
  id: number | null;
  nombre: string;
  estado: string;
}

interface ImpuestoForm {
  id: number | null;
  nombre: string;
  porcentaje: string;
  estado: string;
}

interface ColorForm {
  id: number | null;
  nombre: string;
  estado: string;
}

interface MaterialForm {
  id: number | null;
  nombre: string;
  detalle: string;
}

interface ClienteForm {
  id: number | null;
  CLI_Primer_Nombre: string;
  CLI_Segundo_Nombre: string;
  CLI_Primer_Apellido: string;
  CLI_Segundo_Apellido: string;
  CLI_Departamento: string;
  CLI_Municipio: string;
  CLI_Zona_Aldea: string;
  CLI_Telefono: string;
  CLI_Pais: string;
  CLI_Tipo_Documento: string;
  CLI_Numero_Documento: string;
  CLI_Correo_Electronico: string;
  PER_Tipo_Documento: string;
  PER_Nombre: string;
  PER_Primer_Apellido: string;
  PER_Segundo_Apellido: string;
  PER_Correo: string;
  PER_Telefono: string;
  PER_Pais: string;
  PER_Departamento: string;
  PER_Municipio: string;
  PER_Zona_Aldea: string;
  PER_Domicilio: string;
  username: string;
  password: string;
}

interface OrdenProcesamientoForm {
  ordenId: number | null;
  empresaTransporte: string;
  numeroGuia: string;
}

interface OrdenEnvioFicticio {
  empresaTransporte: string;
  numeroGuia: string;
  procesadoEn: string;
}

// ─── Valores vacíos ───────────────────────────────────────────────────────────

const emptyProductoForm: ProductoForm = {
  id: null,
  codigo: "",
  nombre: "",
  estado: "ACTIVO",
  tipTipoProducto: "",
  mapMaterial: "",
  copColor: "",
  peso: "",
  longitud: "",
  precio: "",
};

const emptyCategoriaForm: CategoriaForm = { id: null, nombre: "" };

const emptyTiendaForm: TiendaForm = {
  id: null,
  nombre: "",
  departamento: "",
  municipio: "",
  zona: "",
  domicilio: "",
  telefono: "",
  estado: "ACTIVO",
};

const emptyMetodoForm: MetodoForm = { id: null, nombre: "", estado: "ACTIVO" };

const emptyImpuestoForm: ImpuestoForm = {
  id: null,
  nombre: "",
  porcentaje: "",
  estado: "ACTIVO",
};

const emptyColorForm: ColorForm = {
  id: null,
  nombre: "",
  estado: "ACTIVO",
};

const emptyMaterialForm: MaterialForm = {
  id: null,
  nombre: "",
  detalle: "",
};

const emptyClienteForm: ClienteForm = {
  id: null,
  CLI_Primer_Nombre: "",
  CLI_Segundo_Nombre: "",
  CLI_Primer_Apellido: "",
  CLI_Segundo_Apellido: "",
  CLI_Departamento: "",
  CLI_Municipio: "",
  CLI_Zona_Aldea: "",
  CLI_Telefono: "",
  CLI_Pais: "",
  CLI_Tipo_Documento: "",
  CLI_Numero_Documento: "",
  CLI_Correo_Electronico: "",
  PER_Tipo_Documento: "",
  PER_Nombre: "",
  PER_Primer_Apellido: "",
  PER_Segundo_Apellido: "",
  PER_Correo: "",
  PER_Telefono: "",
  PER_Pais: "",
  PER_Departamento: "",
  PER_Municipio: "",
  PER_Zona_Aldea: "",
  PER_Domicilio: "",
  username: "",
  password: "",
};

const emptyOrdenProcesamientoForm: OrdenProcesamientoForm = {
  ordenId: null,
  empresaTransporte: "",
  numeroGuia: "",
};

const POWER_BI_DASHBOARD_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiODdkZmYxZWQtMGM4NC00NGVjLWE3NDEtYzFkNTM3YmIxYjhmIiwidCI6IjgwMjVkMGE2LWM4MDctNDIwYS05YTZjLTg1YzA0ZDU5Nzg2ZiIsImMiOjR9";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const optionalText = (value: string) => {
  const t = value.trim();
  return t || null;
};

const joinValues = (...values: Array<string | null | undefined>) =>
  values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

const joinAddress = (...values: Array<string | null | undefined>) =>
  values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(", ");

const getFulfilled = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
  r.status === "fulfilled" ? r.value : fallback;

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado?: string }) {
  const map: Record<string, string> = {
    ACTIVO: "bg-green-100 text-green-800",
    ACTIVA: "bg-green-100 text-green-800",
    INACTIVO: "bg-gray-100 text-gray-600",
    FINALIZADO: "bg-blue-100 text-blue-800",
    ANULADO: "bg-red-100 text-red-800",
    ANULADA: "bg-red-100 text-red-800",
    PAGADA: "bg-green-100 text-green-800",
    PENDIENTE: "bg-yellow-100 text-yellow-800",
  };
  const cls = map[estado ?? ""] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {estado ?? "—"}
    </span>
  );
}

function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400";

const selectCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

interface ManualCorrectionField {
  id: string;
  label: string;
  area: string;
}

const manualCorrectionFields: ManualCorrectionField[] = [
  { id: "nombre", label: "Nombre", area: "Cliente" },
  { id: "documento", label: "Documento", area: "Cliente" },
  { id: "correo", label: "Correo", area: "Cliente" },
  { id: "telefono", label: "Telefono", area: "Cliente" },
  { id: "direccion", label: "Direccion", area: "Cliente" },
  { id: "producto", label: "Producto", area: "Venta" },
  { id: "categoria", label: "Categoria", area: "Catalogo" },
  { id: "precio", label: "Precio", area: "Venta" },
  { id: "cantidad", label: "Cantidad", area: "Inventario" },
  { id: "orden", label: "Orden", area: "Venta" },
  { id: "factura", label: "Factura", area: "Facturacion" },
  { id: "metodo-pago", label: "Metodo de pago", area: "Pago" },
];

function ManualCorrectionPills({
  fields,
  selectedIds,
  counts,
  onToggle,
}: {
  fields: ManualCorrectionField[];
  selectedIds: string[];
  counts: Record<string, number>;
  onToggle: (fieldId: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((field) => {
        const active = selectedIds.includes(field.id);
        const count = counts[field.id] ?? 0;

        return (
          <button
            key={field.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(field.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
              active
                ? "border-black bg-black text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            <span>{field.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] ${
                active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function DetailModal({
  open,
  onClose,
  maxWidth = "max-w-6xl",
  children,
}: {
  open: boolean;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-end border-b border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <X size={16} />
            Cerrar
          </button>
        </div>
        <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const initialLoadRef = useRef(false);

  // Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenVenta[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [clientesAdmin, setClientesAdmin] = useState<ClienteAdmin[]>([]);
  const [clienteDetalle, setClienteDetalle] = useState<ClienteProfile | null>(
    null,
  );
  const [clienteCompras, setClienteCompras] = useState<ClienteCompraRow[]>([]);
  const [ordenDetalle, setOrdenDetalle] = useState<AdminOrderDetail | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<FacturaDetail | null>(null);
  const [showClienteDetalleModal, setShowClienteDetalleModal] = useState(false);
  const [showOrdenDetalleModal, setShowOrdenDetalleModal] = useState(false);
  const [showFacturaDetalleModal, setShowFacturaDetalleModal] = useState(false);
  const [showProcesarOrdenModal, setShowProcesarOrdenModal] = useState(false);
  const [loadingClienteDetalle, setLoadingClienteDetalle] = useState(false);
  const [loadingOrdenDetalle, setLoadingOrdenDetalle] = useState(false);
  const [loadingFacturaDetalle, setLoadingFacturaDetalle] = useState(false);
  const [clienteBusqueda, setClienteBusqueda] = useState({
    documento: "",
    nombre: "",
    correo: "",
  });
  const [ordenSearch, setOrdenSearch] = useState("");
  const [facturaSearch, setFacturaSearch] = useState("");
  const [manualCorrectionSelection, setManualCorrectionSelection] = useState<
    string[]
  >([]);
  const [manualCorrectionCounts, setManualCorrectionCounts] = useState<
    Record<string, number>
  >({});

  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);
  const [ordenProcesamientoForm, setOrdenProcesamientoForm] =
    useState<OrdenProcesamientoForm>(emptyOrdenProcesamientoForm);
  const [ordenesEnvioFicticio, setOrdenesEnvioFicticio] = useState<
    Record<number, OrdenEnvioFicticio>
  >({});
  const [clienteForm, setClienteForm] = useState<ClienteForm>(emptyClienteForm);
  const [clienteFormMode, setClienteFormMode] = useState<"create" | "edit">(
    "create",
  );

  // Formularios
  const [productoForm, setProductoForm] =
    useState<ProductoForm>(emptyProductoForm);
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [tiendaForm, setTiendaForm] = useState<TiendaForm>(emptyTiendaForm);
  const [metodoForm, setMetodoForm] = useState<MetodoForm>(emptyMetodoForm);
  const [impuestoForm, setImpuestoForm] =
    useState<ImpuestoForm>(emptyImpuestoForm);
  const [colorForm, setColorForm] = useState<ColorForm>(emptyColorForm);
  const [materialForm, setMaterialForm] =
    useState<MaterialForm>(emptyMaterialForm);
  const [categoriaForm, setCategoriaForm] =
    useState<CategoriaForm>(emptyCategoriaForm);
  const [furnitureMenuOpen, setFurnitureMenuOpen] = useState(true);

  // Visor categoría → productos
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<
    number | null
  >(null);
  const [productosCategoria, setProductosCategoria] = useState<Producto[]>([]);
  const [loadingProdCat, setLoadingProdCat] = useState(false);

  const focusAdminForm = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ─── Carga de datos ───────────────────────────────────────────────────────

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");

    const [
      prodResult,
      catResult,
      matResult,
      colResult,
      tiendaResult,
      metResult,
      impResult,
      ordResult,
      facResult,
      cliResult,
    ] = await Promise.allSettled([
      productosApi.listarTodos(),
      categoriasApi.listar(),
      materialesApi.listar(),
      coloresApi.listar(),
      tiendasApi.listar(),
      metodosPagoApi.listar(),
      impuestosApi.listar(),
      ordenesVentaApi.listar(optionalText(ordenSearch) ?? undefined),
      facturasApi.listar(optionalText(facturaSearch) ?? undefined),
      adminClientesApi.listar({
        documento: optionalText(clienteBusqueda.documento) ?? undefined,
        nombre: optionalText(clienteBusqueda.nombre) ?? undefined,
        correo: optionalText(clienteBusqueda.correo) ?? undefined,
      }),
    ]);

    setProductos(getFulfilled(prodResult, []));
    setCategorias(getFulfilled(catResult, []));
    setMateriales(getFulfilled(matResult, []));
    setColores(getFulfilled(colResult, []));
    setTiendas(getFulfilled(tiendaResult, []));
    setMetodos(getFulfilled(metResult, []));
    setImpuestos(getFulfilled(impResult, []));
    setOrdenes(getFulfilled(ordResult, []));
    setFacturas(getFulfilled(facResult, []));
    setClientesAdmin(getFulfilled(cliResult, []));

    const errors = [
      prodResult,
      catResult,
      tiendaResult,
      metResult,
      impResult,
      ordResult,
      facResult,
      cliResult,
    ].filter((r) => r.status === "rejected");

    if (errors.length > 0) {
      setError("Algunos datos no pudieron cargarse desde la API.");
    }

    setLoading(false);
  }, [clienteBusqueda, facturaSearch, ordenSearch]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    void cargarDatos();
  }, [cargarDatos]);

  const setOperacionExitosa = async (msg: string) => {
    setNotice(msg);
    await cargarDatos();
  };

  const fillClienteForm = useCallback((profile: ClienteProfile) => {
    setClienteForm({
      id: profile.CLI_CLIENTE,
      CLI_Primer_Nombre: String(profile.CLI_PRIMER_NOMBRE ?? ""),
      CLI_Segundo_Nombre: String(profile.CLI_SEGUNDO_NOMBRE ?? ""),
      CLI_Primer_Apellido: String(profile.CLI_PRIMER_APELLIDO ?? ""),
      CLI_Segundo_Apellido: String(profile.CLI_SEGUNDO_APELLIDO ?? ""),
      CLI_Departamento: String(profile.CLI_DEPARTAMENTO ?? ""),
      CLI_Municipio: String(profile.CLI_MUNICIPIO ?? ""),
      CLI_Zona_Aldea: String(profile.CLI_ZONA_ALDEA ?? ""),
      CLI_Telefono: String(profile.CLI_TELEFONO ?? ""),
      CLI_Pais: String(profile.CLI_PAIS ?? ""),
      CLI_Tipo_Documento: String(profile.CLI_TIPO_DOCUMENTO ?? ""),
      CLI_Numero_Documento: String(profile.CLI_NUMERO_DOCUMENTO ?? ""),
      CLI_Correo_Electronico: String(profile.CLI_CORREO_ELECTRONICO ?? ""),
      PER_Tipo_Documento: String(profile.PER_TIPO_DOCUMENTO ?? ""),
      PER_Nombre: String(profile.PER_NOMBRE ?? ""),
      PER_Primer_Apellido: String(profile.PER_PRIMER_APELLIDO ?? ""),
      PER_Segundo_Apellido: String(profile.PER_SEGUNDO_APELLIDO ?? ""),
      PER_Correo: String(profile.PER_CORREO ?? ""),
      PER_Telefono: String(profile.PER_TELEFONO ?? ""),
      PER_Pais: String(profile.PER_PAIS ?? ""),
      PER_Departamento: String(profile.PER_DEPARTAMENTO ?? ""),
      PER_Municipio: String(profile.PER_MUNICIPIO ?? ""),
      PER_Zona_Aldea: String(profile.PER_ZONA_ALDEA ?? ""),
      PER_Domicilio: String(profile.PER_DOMICILIO ?? ""),
      username: String(profile.USU_NOMBRE_USUARIO ?? ""),
      password: "",
    });
    setClienteFormMode("edit");
    setShowClienteForm(true);
    focusAdminForm();
  }, [focusAdminForm]);

  const resetClienteForm = useCallback(() => {
    setClienteForm(emptyClienteForm);
    setClienteFormMode("create");
    setShowClienteForm(false);
  }, []);

  const cargarClientesListado = useCallback(
    async (filters = clienteBusqueda) => {
      const data = await adminClientesApi.listar({
        documento: optionalText(filters.documento) ?? undefined,
        nombre: optionalText(filters.nombre) ?? undefined,
        correo: optionalText(filters.correo) ?? undefined,
      });
      const rows = Array.isArray(data) ? data : [];
      setClientesAdmin(rows);

      if (
        clienteDetalle &&
        !rows.some((cliente) => Number(cliente.CLI_CLIENTE) === Number(clienteDetalle.CLI_CLIENTE))
      ) {
        setClienteDetalle(null);
        setClienteCompras([]);
        setShowClienteDetalleModal(false);
      }

      return rows;
    },
    [clienteBusqueda, clienteDetalle],
  );

  const cargarOrdenesListado = useCallback(
    async (search = ordenSearch) => {
      const data = await ordenesVentaApi.listar(optionalText(search) ?? undefined);
      const rows = Array.isArray(data) ? data : [];
      setOrdenes(rows);

      const currentOrderId = Number(ordenDetalle?.orden?.ODV_ORDEN_VENTA ?? 0);
      if (currentOrderId > 0 && !rows.some((orden) => orden.ODV_ORDEN_VENTA === currentOrderId)) {
        setOrdenDetalle(null);
        setShowOrdenDetalleModal(false);
        setShowProcesarOrdenModal(false);
        setOrdenProcesamientoForm(emptyOrdenProcesamientoForm);
      }

      return rows;
    },
    [ordenDetalle, ordenSearch],
  );

  const cargarFacturasListado = useCallback(
    async (search = facturaSearch) => {
      const data = await facturasApi.listar(optionalText(search) ?? undefined);
      const rows = Array.isArray(data) ? data : [];
      setFacturas(rows);

      const currentFacturaId = Number(facturaDetalle?.factura?.FAC_FACTURA ?? 0);
      if (
        currentFacturaId > 0 &&
        !rows.some((factura) => factura.FAC_FACTURA === currentFacturaId)
      ) {
        setFacturaDetalle(null);
        setShowFacturaDetalleModal(false);
      }

      return rows;
    },
    [facturaDetalle, facturaSearch],
  );

  // ─── Ver productos de una categoría ──────────────────────────────────────

  const recargarProductosCategoria = useCallback(async (catId: number) => {
    setLoadingProdCat(true);
    try {
      const data = await productosApi.listar(catId);
      setProductosCategoria(Array.isArray(data) ? data : []);
    } catch {
      setProductosCategoria([]);
    } finally {
      setLoadingProdCat(false);
    }
  }, []);

  const verProductosCategoria = useCallback(async (catId: number) => {
    if (selectedCategoriaId === catId) {
      setSelectedCategoriaId(null);
      setProductosCategoria([]);
      return;
    }

    setSelectedCategoriaId(catId);
    await recargarProductosCategoria(catId);
  }, [selectedCategoriaId, recargarProductosCategoria]);

  // ─── CRUD Productos ───────────────────────────────────────────────────────

  const guardarProducto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!productoForm.nombre.trim()) {
      setError("El nombre del producto es requerido.");
      return;
    }

    if (!productoForm.codigo.trim()) {
      setError("El código del producto es requerido.");
      return;
    }

    if (!productoForm.tipTipoProducto) {
      setError("La categoría es requerida.");
      return;
    }

    if (!productoForm.mapMaterial) {
      setError("El material es requerido.");
      return;
    }

    if (!productoForm.copColor) {
      setError("El color es requerido.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        PRO_Codigo: productoForm.codigo.trim(),
        PRO_Nombre: productoForm.nombre.trim(),
        PRO_Estado: productoForm.estado,
        TIP_Tipo_Producto: productoForm.tipTipoProducto
          ? Number(productoForm.tipTipoProducto)
          : null,
        MAP_Material: productoForm.mapMaterial
          ? Number(productoForm.mapMaterial)
          : null,
        COP_Color_Producto: productoForm.copColor
          ? Number(productoForm.copColor)
          : null,
        DEP_Peso: productoForm.peso ? Number(productoForm.peso) : null,
        DEP_Longitud: productoForm.longitud
          ? Number(productoForm.longitud)
          : null,
        PRE_Precio: productoForm.precio ? Number(productoForm.precio) : null,
      };

      if (productoForm.id) {
        await productosApi.actualizar(productoForm.id, payload);
        await setOperacionExitosa("Producto actualizado correctamente.");
      } else {
        await productosApi.crear(payload);
        await setOperacionExitosa("Producto creado correctamente.");
      }

      setProductoForm(emptyProductoForm);
      setShowProductoForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const editarProducto = (p: Producto) => {
    setProductoForm({
      id: p.PRO_Producto,
      codigo: p.PRO_Codigo ?? "",
      nombre: p.PRO_Nombre,
      estado: p.PRO_Estado ?? "ACTIVO",
      tipTipoProducto: p.TIP_Tipo_Producto
        ? String(p.TIP_Tipo_Producto)
        : "",
      mapMaterial: p.MAP_Material ? String(p.MAP_Material) : "",
      copColor: p.COP_Color_Producto ? String(p.COP_Color_Producto) : "",
      peso: p.DEP_Peso ? String(p.DEP_Peso) : "",
      longitud: p.DEP_Longitud ? String(p.DEP_Longitud) : "",
      precio: p.PRE_Precio ? String(p.PRE_Precio) : "",
    });
    setShowProductoForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleEstadoProducto = async (p: Producto) => {
    const estadoActual = p.PRO_Estado ?? p.PRO_ESTADO ?? "ACTIVO";
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const confirmar = window.confirm(
      `Se cambiara el estado del producto a ${nuevoEstado}. Deseas continuar?`,
    );

    if (!confirmar) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await productosApi.cambiarEstado(p.PRO_Producto, nuevoEstado);
      await setOperacionExitosa(
        `Producto ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"} correctamente.`,
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD Categorías ──────────────────────────────────────────────────────

  const guardarCategoria = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!categoriaForm.nombre.trim()) {
      setError("El nombre de la categoría es requerido.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = { TIP_Nombre: categoriaForm.nombre.trim() };

      if (categoriaForm.id) {
        await categoriasApi.actualizar(categoriaForm.id, payload);
        await setOperacionExitosa("Categoría actualizada correctamente.");
      } else {
        await categoriasApi.crear(payload);
        await setOperacionExitosa("Categoría creada correctamente.");
      }

      setCategoriaForm(emptyCategoriaForm);
      // Cierra el visor para que el usuario abra la categoría editada con datos frescos
      setSelectedCategoriaId(null);
      setProductosCategoria([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eliminarCategoria = async (id: number) => {
    const confirmar = window.confirm(
      "Esta accion eliminara la categoria seleccionada. Deseas continuar?",
    );

    if (!confirmar) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await categoriasApi.eliminar(id);
      await setOperacionExitosa("Categoría eliminada correctamente.");
      setSelectedCategoriaId(null);
      setProductosCategoria([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD Tiendas ─────────────────────────────────────────────────────────

  const guardarTienda = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!tiendaForm.nombre.trim()) {
      setError("El nombre de la tienda es requerido.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        TIE_Nombre: tiendaForm.nombre.trim(),
        TIE_Departamento: optionalText(tiendaForm.departamento),
        TIE_Municipio: optionalText(tiendaForm.municipio),
        TIE_Zona_Aldea: optionalText(tiendaForm.zona),
        TIE_Domicilio: optionalText(tiendaForm.domicilio),
        TIE_Telefono: optionalText(tiendaForm.telefono),
        TIE_Estado: tiendaForm.estado,
      };

      if (tiendaForm.id) {
        await tiendasApi.actualizar(tiendaForm.id, payload);
        await setOperacionExitosa("Tienda actualizada correctamente.");
      } else {
        await tiendasApi.crear(payload);
        await setOperacionExitosa("Tienda creada correctamente.");
      }

      setTiendaForm(emptyTiendaForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eliminarTienda = async (id: number) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await tiendasApi.eliminar(id);
      await setOperacionExitosa("Tienda desactivada correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD Métodos de pago ─────────────────────────────────────────────────

  const guardarMetodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!metodoForm.nombre.trim()) {
      setError("El nombre del método de pago es requerido.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        MET_Nombre: metodoForm.nombre.trim(),
        MET_Estado: metodoForm.estado,
      };

      if (metodoForm.id) {
        await metodosPagoApi.actualizar(metodoForm.id, payload);
        await setOperacionExitosa("Método de pago actualizado correctamente.");
      } else {
        await metodosPagoApi.crear(payload);
        await setOperacionExitosa("Método de pago creado correctamente.");
      }

      setMetodoForm(emptyMetodoForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eliminarMetodo = async (id: number) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await metodosPagoApi.eliminar(id);
      await setOperacionExitosa("Método de pago desactivado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD Impuestos ───────────────────────────────────────────────────────

  const guardarImpuesto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const porcentaje = Number(impuestoForm.porcentaje);

    if (!impuestoForm.nombre.trim()) {
      setError("El nombre del impuesto es requerido.");
      return;
    }

    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      setError("El porcentaje debe ser un número entre 0 y 100.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        IMP_Nombre: impuestoForm.nombre.trim(),
        IMP_Porcentaje: porcentaje,
        IMP_Estado: impuestoForm.estado,
      };

      if (impuestoForm.id) {
        await impuestosApi.actualizar(impuestoForm.id, payload);
        await setOperacionExitosa("Impuesto actualizado correctamente.");
      } else {
        await impuestosApi.crear(payload);
        await setOperacionExitosa("Impuesto creado correctamente.");
      }

      setImpuestoForm(emptyImpuestoForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eliminarImpuesto = async (id: number) => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await impuestosApi.eliminar(id);
      await setOperacionExitosa("Impuesto desactivado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD Colores ─────────────────────────────────────────────────────────

  const guardarColor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!colorForm.nombre.trim()) {
      setError("El nombre del color es requerido.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        COP_Nombre: colorForm.nombre.trim(),
        COP_Estado: colorForm.estado,
      };

      if (colorForm.id) {
        await coloresApi.actualizar(colorForm.id, payload);
        await setOperacionExitosa("Color actualizado correctamente.");
      } else {
        await coloresApi.crear(payload);
        await setOperacionExitosa("Color creado correctamente.");
      }

      setColorForm(emptyColorForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstadoColor = async (id: number, estadoActual?: string) => {
    const nuevoEstado = estadoActual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const confirmar = window.confirm(
      `Se cambiara el estado del color a ${nuevoEstado}. Deseas continuar?`,
    );
    if (!confirmar) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await coloresApi.cambiarEstado(id, nuevoEstado);
      await setOperacionExitosa(
        `Color ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"} correctamente.`,
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD Materiales ───────────────────────────────────────────────────────

  const guardarMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!materialForm.nombre.trim()) {
      setError("El nombre del material es requerido.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        MAP_Nombre: materialForm.nombre.trim(),
        MAP_Detalle: optionalText(materialForm.detalle),
      };

      if (materialForm.id) {
        await materialesApi.actualizar(materialForm.id, payload);
        await setOperacionExitosa("Material actualizado correctamente.");
      } else {
        await materialesApi.crear(payload);
        await setOperacionExitosa("Material creado correctamente.");
      }

      setMaterialForm(emptyMaterialForm);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eliminarMaterial = async (id: number) => {
    const confirmar = window.confirm(
      "Esta accion eliminara el material seleccionado. Deseas continuar?",
    );
    if (!confirmar) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await materialesApi.eliminar(id);
      await setOperacionExitosa("Material eliminado correctamente.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ─── Derivados ────────────────────────────────────────────────────────────

  const manualCorrectionRanking = useMemo(
    () =>
      manualCorrectionFields
        .map((field) => ({
          ...field,
          count: manualCorrectionCounts[field.id] ?? 0,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    [manualCorrectionCounts],
  );

  const toggleManualCorrectionField = useCallback((fieldId: string) => {
    setManualCorrectionSelection((current) =>
      current.includes(fieldId)
        ? current.filter((id) => id !== fieldId)
        : [...current, fieldId],
    );
  }, []);

  const clearManualCorrectionSelection = useCallback(() => {
    setManualCorrectionSelection([]);
  }, []);

  const registerManualCorrectionSelection = useCallback(() => {
    if (manualCorrectionSelection.length === 0) {
      setNotice("No seleccionaste campos corregidos manualmente.");
      return;
    }

    setManualCorrectionCounts((current) => {
      const next = { ...current };
      for (const fieldId of manualCorrectionSelection) {
        next[fieldId] = (next[fieldId] ?? 0) + 1;
      }
      return next;
    });
    setManualCorrectionSelection([]);
    setNotice("Campos corregidos registrados para analisis.");
  }, [manualCorrectionSelection]);

  const cargarDetalleCliente = async (clienteId: number) => {
    setLoadingClienteDetalle(true);
    setError("");
    try {
      const [detalle, compras] = await Promise.all([
        adminClientesApi.obtener(clienteId),
        adminClientesApi.compras(clienteId),
      ]);
      setClienteDetalle(detalle);
      setClienteCompras(Array.isArray(compras) ? compras : []);
      return detalle;
    } catch (err) {
      setError(getApiErrorMessage(err));
      return null;
    } finally {
      setLoadingClienteDetalle(false);
    }
  };

  const guardarCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!clienteForm.CLI_Primer_Nombre.trim()) {
      setError("El primer nombre del cliente es obligatorio.");
      return;
    }

    if (!clienteForm.CLI_Primer_Apellido.trim()) {
      setError("El primer apellido del cliente es obligatorio.");
      return;
    }

    if (!clienteForm.CLI_Correo_Electronico.trim()) {
      setError("El correo del cliente es obligatorio.");
      return;
    }

    if (clienteFormMode === "create" && clienteForm.password.trim().length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const basePayload: Partial<RegisterClientePayload> = {
        CLI_Primer_Nombre: clienteForm.CLI_Primer_Nombre.trim(),
        CLI_Segundo_Nombre: optionalText(clienteForm.CLI_Segundo_Nombre),
        CLI_Primer_Apellido: clienteForm.CLI_Primer_Apellido.trim(),
        CLI_Segundo_Apellido: optionalText(clienteForm.CLI_Segundo_Apellido),
        CLI_Departamento: optionalText(clienteForm.CLI_Departamento),
        CLI_Municipio: optionalText(clienteForm.CLI_Municipio),
        CLI_Zona_Aldea: optionalText(clienteForm.CLI_Zona_Aldea),
        CLI_Telefono: optionalText(clienteForm.CLI_Telefono),
        CLI_Pais: optionalText(clienteForm.CLI_Pais),
        CLI_Tipo_Documento: optionalText(clienteForm.CLI_Tipo_Documento),
        CLI_Numero_Documento: optionalText(clienteForm.CLI_Numero_Documento),
        CLI_Correo_Electronico: clienteForm.CLI_Correo_Electronico.trim().toLowerCase(),
        PER_Tipo_Documento: optionalText(clienteForm.PER_Tipo_Documento),
        PER_Nombre: optionalText(clienteForm.PER_Nombre),
        PER_Primer_Apellido: optionalText(clienteForm.PER_Primer_Apellido),
        PER_Segundo_Apellido: optionalText(clienteForm.PER_Segundo_Apellido),
        PER_Correo: optionalText(clienteForm.PER_Correo),
        PER_Telefono: optionalText(clienteForm.PER_Telefono),
        PER_Pais: optionalText(clienteForm.PER_Pais),
        PER_Departamento: optionalText(clienteForm.PER_Departamento),
        PER_Municipio: optionalText(clienteForm.PER_Municipio),
        PER_Zona_Aldea: optionalText(clienteForm.PER_Zona_Aldea),
        PER_Domicilio: optionalText(clienteForm.PER_Domicilio),
      };

      if (clienteFormMode === "edit" && clienteForm.id) {
        const updated = await adminClientesApi.actualizar(clienteForm.id, basePayload);
        setNotice("Cliente actualizado correctamente.");
        await cargarClientesListado();
        setClienteDetalle(updated);
        await cargarDetalleCliente(updated.CLI_CLIENTE);
        resetClienteForm();
      } else {
        const created = await adminClientesApi.crear({
          ...(basePayload as RegisterClientePayload),
          CLI_Primer_Nombre: clienteForm.CLI_Primer_Nombre.trim(),
          CLI_Primer_Apellido: clienteForm.CLI_Primer_Apellido.trim(),
          CLI_Correo_Electronico: clienteForm.CLI_Correo_Electronico.trim().toLowerCase(),
          username: optionalText(clienteForm.username) ?? undefined,
          password: clienteForm.password.trim(),
        });
        setNotice("Cliente registrado correctamente.");
        await cargarClientesListado();
        setClienteDetalle(created);
        setClienteCompras([]);
        resetClienteForm();
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const eliminarClienteSeleccionado = async () => {
    if (!clienteDetalle) return;

    if (clienteCompras.length > 0) {
      setError(
        "No se puede eliminar este cliente porque ya tiene compras registradas.",
      );
      return;
    }

    const confirmar = window.confirm(
      `Se eliminara el cliente #${clienteDetalle.CLI_CLIENTE}. Deseas continuar?`,
    );
    if (!confirmar) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await adminClientesApi.eliminar(clienteDetalle.CLI_CLIENTE);
      setNotice("Cliente eliminado correctamente.");
      await cargarClientesListado();
      setClienteDetalle(null);
      setClienteCompras([]);
      setShowClienteDetalleModal(false);
      resetClienteForm();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const buscarClientes = async () => {
    setSaving(true);
    setError("");
    try {
      await cargarClientesListado();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cargarDetalleOrden = async (ordenId: number) => {
    setLoadingOrdenDetalle(true);
    setError("");
    try {
      const detalle = await ordenesVentaApi.obtenerDetalle(ordenId);
      setOrdenDetalle(detalle);
      return detalle;
    } catch (err) {
      setError(getApiErrorMessage(err));
      setOrdenDetalle(null);
      return null;
    } finally {
      setLoadingOrdenDetalle(false);
    }
  };

  const buscarOrdenes = async () => {
    setSaving(true);
    setError("");
    try {
      await cargarOrdenesListado();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstadoOrden = async (
    ordenId: number,
    estado: "ACTIVO" | "ANULADO" | "FINALIZADO",
  ) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await ordenesVentaApi.cambiarEstado(ordenId, estado);
      setNotice(`Orden actualizada a estado ${estado}.`);
      await cargarOrdenesListado();
      await cargarDetalleOrden(ordenId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const cerrarProcesarOrdenModal = useCallback(() => {
    setShowProcesarOrdenModal(false);
    setOrdenProcesamientoForm(emptyOrdenProcesamientoForm);
  }, []);

  const abrirProcesarOrdenModal = useCallback((ordenId: number) => {
    setError("");
    const envioActual = ordenesEnvioFicticio[ordenId];
    setOrdenProcesamientoForm({
      ordenId,
      empresaTransporte: envioActual?.empresaTransporte ?? "",
      numeroGuia: envioActual?.numeroGuia ?? "",
    });
    setShowProcesarOrdenModal(true);
  }, [ordenesEnvioFicticio]);

  const confirmarProcesamientoOrden = async () => {
    const ordenId = Number(ordenProcesamientoForm.ordenId ?? 0);

    if (!ordenId) {
      setError("No se pudo identificar la orden a procesar.");
      return;
    }

    if (!ordenProcesamientoForm.empresaTransporte.trim()) {
      setError("Ingresa la empresa de transporte para continuar.");
      return;
    }

    if (!ordenProcesamientoForm.numeroGuia.trim()) {
      setError("Ingresa el número de guía para continuar.");
      return;
    }

    setOrdenesEnvioFicticio((current) => ({
      ...current,
      [ordenId]: {
        empresaTransporte: ordenProcesamientoForm.empresaTransporte.trim(),
        numeroGuia: ordenProcesamientoForm.numeroGuia.trim(),
        procesadoEn: new Date().toISOString(),
      },
    }));
    setNotice("Datos de envío registrados de forma visual. La orden continúa en estado ACTIVO hasta que la finalices o la anules.");
    cerrarProcesarOrdenModal();
  };

  const cargarDetalleFactura = async (facturaId: number) => {
    setLoadingFacturaDetalle(true);
    setError("");
    try {
      const detalle = await facturasApi.obtenerDetalle(facturaId);
      setFacturaDetalle(detalle);
      return detalle;
    } catch (err) {
      setError(getApiErrorMessage(err));
      setFacturaDetalle(null);
      return null;
    } finally {
      setLoadingFacturaDetalle(false);
    }
  };

  const buscarFacturas = async () => {
    setSaving(true);
    setError("");
    try {
      await cargarFacturasListado();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const limpiarBusquedaClientes = async () => {
    const nextFilters = { documento: "", nombre: "", correo: "" };
    setClienteBusqueda(nextFilters);
    setSaving(true);
    setError("");
    try {
      await cargarClientesListado(nextFilters);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const limpiarBusquedaOrdenes = async () => {
    setOrdenSearch("");
    setSaving(true);
    setError("");
    try {
      await cargarOrdenesListado("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const limpiarBusquedaFacturas = async () => {
    setFacturaSearch("");
    setSaving(true);
    setError("");
    try {
      await cargarFacturasListado("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const facturaPrincipalOrden = ordenDetalle?.facturas?.[0] ?? null;
  const envioFicticioOrdenActual = ordenDetalle
    ? ordenesEnvioFicticio[Number(ordenDetalle.orden.ODV_ORDEN_VENTA ?? 0)] ?? null
    : null;

  // ─── Navegación ───────────────────────────────────────────────────────────

  const navItems: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "categorias",label: "Categorías",icon: <Tag size={18} /> },
    { key: "tiendas",   label: "Tiendas",   icon: <Store size={18} /> },
    { key: "metodos",   label: "Pagos",     icon: <CreditCard size={18} /> },
    { key: "impuestos", label: "Impuestos", icon: <Percent size={18} /> },
    { key: "ordenes",   label: "Órdenes",   icon: <Package size={18} /> },
    { key: "facturas",  label: "Facturas",  icon: <ReceiptText size={18} /> },
    { key: "empleados", label: "Empleados", icon: <Users size={18} /> },
    { key: "clientes",  label: "Clientes",  icon: <Users size={18} /> },
    { key: "reportes",  label: "Reportes",  icon: <BarChart3 size={18} /> },
  ];

  const titleByTab: Record<Tab, string> = {
    dashboard: "Dashboard",
    muebles: "Muebles",
    colores: "Colores",
    materiales: "Materiales",
    precios: "Precios",
    almacenes: "Almacenes",
    "stock-producto": "Stock de producto",
    "materias-primas": "Materia prima",
    "stock-materia-prima": "Stock de materia prima",
    produccion: "Producción",
    categorias: "Categorías",
    tiendas: "Tiendas",
    metodos: "Pagos",
    impuestos: "Impuestos",
    ordenes: "Órdenes",
    facturas: "Facturas",
    empleados: "Empleados",
    clientes: "Clientes",
    reportes: "Reportes",
  };

  const handleNav = (key: Tab) => {
    setTab(key);
    setSidebarOpen(false);
    setError("");
    setNotice("");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen bg-gray-50 text-black">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-64 bg-gray-900 lg:block" />

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-200 lg:relative lg:z-10 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header sidebar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/60">
              Admin
            </p>
            <p className="text-lg font-bold">Los Alpes</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <button
            type="button"
            onClick={() => setFurnitureMenuOpen((prev) => !prev)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              [
                "muebles",
                "colores",
                "materiales",
                "precios",
                "almacenes",
                "stock-producto",
                "materias-primas",
                "stock-materia-prima",
                "produccion",
              ].includes(tab)
                ? "bg-white/10 font-semibold text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Sofa size={18} />
            <span className="flex-1 text-left">Muebles</span>
            {furnitureMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {furnitureMenuOpen && (
            <div className="ml-7 mt-1 space-y-0.5 border-l border-white/15 pl-3">
              {[
                { key: "muebles" as Tab, label: "Muebles" },
                { key: "colores" as Tab, label: "Colores" },
                { key: "materiales" as Tab, label: "Materiales" },
                { key: "precios" as Tab, label: "Precios" },
                { key: "almacenes" as Tab, label: "Almacenes" },
                { key: "stock-producto" as Tab, label: "Stock producto" },
                { key: "materias-primas" as Tab, label: "Materia prima" },
                {
                  key: "stock-materia-prima" as Tab,
                  label: "Stock materia prima",
                },
                { key: "produccion" as Tab, label: "Producción" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNav(item.key)}
                  className={`block w-full rounded-md px-2 py-2 text-left text-xs transition-colors ${
                    tab === item.key
                      ? "bg-white/15 font-semibold text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {navItems.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleNav(key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                tab === key
                  ? "bg-white/10 font-semibold text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">

        {/* Header mobile */}
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <p className="font-semibold">Panel Admin</p>
          <div className="w-9" />
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">

          {/* Cabecera de sección */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {titleByTab[tab]}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Mueblería Los Alpes · Backend conectado
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  await cargarDatos();
                  setInventoryRefreshKey((current) => current + 1);
                })();
              }}
              disabled={loading}
              className="w-fit rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Actualizar datos
            </button>
          </div>

          {/* Alertas */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="mt-0.5 shrink-0">⚠</span>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="ml-auto shrink-0 font-bold"
              >
                ×
              </button>
            </div>
          )}

          {notice && (
            <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <span>✓</span>
              <p>{notice}</p>
              <button
                type="button"
                onClick={() => setNotice("")}
                className="ml-auto font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Skeleton de carga global */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-white shadow-sm" />
              ))}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              DASHBOARD
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "dashboard" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <iframe
                title="Reportes Proyecto (2)"
                src={POWER_BI_DASHBOARD_URL}
                className="h-[calc(100vh-11rem)] min-h-[520px] w-full"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MUEBLES / PRODUCTOS
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "muebles" && (
            <div className="space-y-6">

              {/* Botón agregar */}
              {!showProductoForm && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setProductoForm(emptyProductoForm);
                      setShowProductoForm(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    <Plus size={16} />
                    Agregar mueble
                  </button>
                </div>
              )}

              {/* Formulario */}
              {showProductoForm && (
                <form
                  onSubmit={(e) => void guardarProducto(e)}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {productoForm.id ? "Editar mueble" : "Nuevo mueble"}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductoForm(false);
                        setProductoForm(emptyProductoForm);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>

                  <SectionCard
                    title="Información básica"
                    subtitle="Datos obligatorios del mueble"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <FormField label="Código" required>
                        <input
                          className={inputCls}
                          placeholder="Ej. MUE-001"
                          value={productoForm.codigo}
                          onChange={(e) =>
                            setProductoForm({ ...productoForm, codigo: e.target.value })
                          }
                        />
                      </FormField>

                      <FormField label="Nombre" required>
                        <input
                          className={inputCls}
                          placeholder="Ej. Sofá Madrid 3 plazas"
                          value={productoForm.nombre}
                          onChange={(e) =>
                            setProductoForm({ ...productoForm, nombre: e.target.value })
                          }
                        />
                      </FormField>

                      <FormField label="Estado">
                        <select
                          className={selectCls}
                          value={productoForm.estado}
                          onChange={(e) =>
                            setProductoForm({ ...productoForm, estado: e.target.value })
                          }
                        >
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="INACTIVO">INACTIVO</option>
                        </select>
                      </FormField>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Clasificación"
                    subtitle="Tipo, material y color (los tres campos son requeridos para guardar la clasificación)"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <FormField label="Tipo / Categoría" required>
                        <select
                          className={selectCls}
                          value={productoForm.tipTipoProducto}
                          onChange={(e) =>
                            setProductoForm({
                              ...productoForm,
                              tipTipoProducto: e.target.value,
                            })
                          }
                        >
                          <option value="">Sin categoría</option>
                          {categorias.map((c) => (
                            <option
                              key={c.TIP_Tipo_Producto}
                              value={c.TIP_Tipo_Producto}
                            >
                              {c.TIP_Nombre}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Material" required>
                        <select
                          className={selectCls}
                          value={productoForm.mapMaterial}
                          onChange={(e) =>
                            setProductoForm({
                              ...productoForm,
                              mapMaterial: e.target.value,
                            })
                          }
                        >
                          <option value="">Sin material</option>
                          {materiales.map((m) => (
                            <option
                              key={m.MAP_Material_Producto}
                              value={m.MAP_Material_Producto}
                            >
                              {m.MAP_Nombre}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Color" required>
                        <select
                          className={selectCls}
                          value={productoForm.copColor}
                          onChange={(e) =>
                            setProductoForm({
                              ...productoForm,
                              copColor: e.target.value,
                            })
                          }
                        >
                          <option value="">Sin color</option>
                          {colores
                            .filter((c) => (c.COP_ESTADO ?? "ACTIVO") === "ACTIVO")
                            .map((c) => (
                            <option
                              key={c.COP_Color_Producto}
                              value={c.COP_Color_Producto}
                            >
                              {c.COP_Nombre}
                            </option>
                            ))}
                        </select>
                      </FormField>

                      <FormField label="Peso (kg)">
                        <input
                          className={inputCls}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Ej. 25.5"
                          value={productoForm.peso}
                          onChange={(e) =>
                            setProductoForm({ ...productoForm, peso: e.target.value })
                          }
                        />
                      </FormField>

                      <FormField label="Longitud (cm)">
                        <input
                          className={inputCls}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Ej. 180"
                          value={productoForm.longitud}
                          onChange={(e) =>
                            setProductoForm({
                              ...productoForm,
                              longitud: e.target.value,
                            })
                          }
                        />
                      </FormField>

                      <FormField label="Precio (Q)">
                        <input
                          className={inputCls}
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="Ej. 150000"
                          value={productoForm.precio}
                          onChange={(e) =>
                            setProductoForm({
                              ...productoForm,
                              precio: e.target.value,
                            })
                          }
                        />
                      </FormField>
                    </div>
                  </SectionCard>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      <Save size={16} />
                      {saving
                        ? "Guardando..."
                        : productoForm.id
                          ? "Actualizar"
                          : "Crear mueble"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProductoForm(false);
                        setProductoForm(emptyProductoForm);
                      }}
                      className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Tabla de productos */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <p className="font-semibold">
                    Muebles registrados
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {productos.length}
                    </span>
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1320px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3">Código</th>
                        <th className="min-w-[280px] px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Tipo (TIP)</th>
                        <th className="px-5 py-3">Categoría</th>
                        <th className="px-5 py-3">Material</th>
                        <th className="px-5 py-3">Color</th>
                        <th className="px-5 py-3">Peso</th>
                        <th className="px-5 py-3">Longitud</th>
                        <th className="px-5 py-3">Precio</th>
                        <th className="px-5 py-3">Stock actual</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {productos.length === 0 && (
                        <tr>
                          <td
                            colSpan={13}
                            className="px-5 py-8 text-center text-gray-400"
                          >
                            No hay muebles registrados.
                          </td>
                        </tr>
                      )}

                      {productos.map((p) => (
                        <tr
                          key={p.PRO_Producto}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-xs text-gray-400">
                            {p.PRO_Producto}
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">
                            {p.PRO_Codigo ?? p.PRO_Producto}
                          </td>
                          <td className="min-w-[280px] px-5 py-3 align-top">
                            <p className="max-w-[320px] whitespace-normal break-words text-pretty leading-6 text-gray-900">
                              {p.PRO_Nombre}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.TIP_Tipo_Producto ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.TIP_Nombre ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.MAP_Nombre ?? p.MAP_Material ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.COP_Nombre ?? p.COP_Color_Producto ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.DEP_Peso ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.DEP_Longitud ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            {formatCurrency(p.PRE_Precio)}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {p.STOCK_DISPONIBLE ?? 0}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={p.PRO_Estado} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => editarProducto(p)}
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void toggleEstadoProducto(p)}
                                disabled={saving}
                                className="text-sm font-medium text-gray-500 hover:underline disabled:opacity-50"
                              >
                                {p.PRO_ESTADO === "ACTIVO"
                                  ? "Desactivar"
                                  : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              COLORES
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "colores" && (
            <div className="space-y-6">
              <SectionCard
                title={colorForm.id ? "Editar color" : "Nuevo color"}
                subtitle="Catálogo de colores para muebles"
              >
                <form
                  onSubmit={(e) => void guardarColor(e)}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                  <FormField label="Nombre" required>
                    <input
                      className={inputCls}
                      placeholder="Ej. Nogal, Blanco, Caoba"
                      value={colorForm.nombre}
                      onChange={(e) =>
                        setColorForm({ ...colorForm, nombre: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField label="Estado">
                    <select
                      className={selectCls}
                      value={colorForm.estado}
                      onChange={(e) =>
                        setColorForm({ ...colorForm, estado: e.target.value })
                      }
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      {colorForm.id ? "Actualizar" : "Crear"}
                    </button>
                    {colorForm.id && (
                      <button
                        type="button"
                        onClick={() => setColorForm(emptyColorForm)}
                        className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </SectionCard>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <p className="font-semibold">Colores registrados</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {colores.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                            No hay colores registrados.
                          </td>
                        </tr>
                      )}
                      {colores.map((c) => (
                        <tr key={c.COP_COLOR_PRODUCTO} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">
                            {c.COP_COLOR_PRODUCTO}
                          </td>
                          <td className="px-5 py-3 font-medium">{c.COP_NOMBRE}</td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={c.COP_ESTADO} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setColorForm({
                                    id: c.COP_COLOR_PRODUCTO,
                                    nombre: c.COP_NOMBRE,
                                    estado: c.COP_ESTADO ?? "ACTIVO",
                                  })
                                }
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  void toggleEstadoColor(
                                    c.COP_COLOR_PRODUCTO,
                                    c.COP_ESTADO,
                                  )
                                }
                                className="text-sm font-medium text-gray-500 hover:underline disabled:opacity-50"
                              >
                                {c.COP_ESTADO === "ACTIVO" ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MATERIALES
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "materiales" && (
            <div className="space-y-6">
              <SectionCard
                title={materialForm.id ? "Editar material" : "Nuevo material"}
                subtitle="Catálogo de materiales para muebles"
              >
                <form
                  onSubmit={(e) => void guardarMaterial(e)}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                  <FormField label="Nombre" required>
                    <input
                      className={inputCls}
                      placeholder="Ej. Madera, Melamina, Acero"
                      value={materialForm.nombre}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, nombre: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField label="Detalle">
                    <input
                      className={inputCls}
                      placeholder="Detalle opcional del material"
                      value={materialForm.detalle}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, detalle: e.target.value })
                      }
                    />
                  </FormField>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      {materialForm.id ? "Actualizar" : "Crear"}
                    </button>
                    {materialForm.id && (
                      <button
                        type="button"
                        onClick={() => setMaterialForm(emptyMaterialForm)}
                        className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </SectionCard>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <p className="font-semibold">Materiales registrados</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Detalle</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {materiales.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                            No hay materiales registrados.
                          </td>
                        </tr>
                      )}
                      {materiales.map((m) => (
                        <tr key={m.MAP_MATERIAL_PRODUCTO} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">
                            {m.MAP_MATERIAL_PRODUCTO}
                          </td>
                          <td className="px-5 py-3 font-medium">{m.MAP_NOMBRE}</td>
                          <td className="px-5 py-3 text-gray-500">
                            {m.MAP_DETALLE ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setMaterialForm({
                                    id: m.MAP_MATERIAL_PRODUCTO,
                                    nombre: m.MAP_NOMBRE,
                                    detalle: m.MAP_DETALLE ?? "",
                                  })
                                }
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => void eliminarMaterial(m.MAP_MATERIAL_PRODUCTO)}
                                className="text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === "precios" && (
            <AdminPreciosProductoSection
              active={tab === "precios"}
              refreshKey={inventoryRefreshKey}
              productos={productos}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {!loading && tab === "almacenes" && (
            <AdminAlmacenesSection
              active={tab === "almacenes"}
              refreshKey={inventoryRefreshKey}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {!loading && tab === "stock-producto" && (
            <AdminStockProductoSection
              active={tab === "stock-producto"}
              refreshKey={inventoryRefreshKey}
              productos={productos}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {!loading && tab === "materias-primas" && (
            <AdminMateriaPrimaSection
              active={tab === "materias-primas"}
              refreshKey={inventoryRefreshKey}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {!loading && tab === "stock-materia-prima" && (
            <AdminStockMateriaPrimaSection
              active={tab === "stock-materia-prima"}
              refreshKey={inventoryRefreshKey}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {!loading && tab === "produccion" && (
            <AdminOrdenesProduccionSection
              active={tab === "produccion"}
              refreshKey={inventoryRefreshKey}
              productos={productos}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              CATEGORÍAS
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "categorias" && (
            <div className="space-y-6">

              {/* Formulario categoría */}
              <SectionCard
                title={categoriaForm.id ? "Editar categoría" : "Nueva categoría"}
                subtitle="Tipos de producto del catálogo"
              >
                <form
                  onSubmit={(e) => void guardarCategoria(e)}
                  className="flex flex-col gap-4 sm:flex-row"
                >
                  <div className="flex-1 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Ej. Living, Dormitorio, Oficina..."
                      value={categoriaForm.nombre}
                      onChange={(e) =>
                        setCategoriaForm({ ...categoriaForm, nombre: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      <Save size={15} />
                      {categoriaForm.id ? "Actualizar" : "Crear"}
                    </button>

                    {categoriaForm.id && (
                      <button
                        type="button"
                        onClick={() => setCategoriaForm(emptyCategoriaForm)}
                        className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </SectionCard>

              {/* Tabla de categorías */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <p className="font-semibold">
                    Categorías registradas
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {categorias.length}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Selecciona una para ver sus muebles vinculados
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">ID</th>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categorias.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                            No hay categorías registradas.
                          </td>
                        </tr>
                      )}

                      {categorias.map((cat) => (
                        <React.Fragment key={cat.TIP_TIPO_PRODUCTO}>
                          <tr
                            className={`cursor-pointer transition-colors ${
                              selectedCategoriaId === cat.TIP_TIPO_PRODUCTO
                                ? "bg-gray-50"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => void verProductosCategoria(cat.TIP_TIPO_PRODUCTO)}
                          >
                            <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                              {cat.TIP_TIPO_PRODUCTO}
                            </td>
                            <td className="px-5 py-3 font-medium">
                              <span className="flex items-center gap-2">
                                {selectedCategoriaId === cat.TIP_TIPO_PRODUCTO
                                  ? <ChevronDown size={14} className="text-gray-400" />
                                  : <ChevronRight size={14} className="text-gray-400" />}
                                {cat.TIP_NOMBRE}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div
                                className="flex flex-wrap items-center gap-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCategoriaForm({
                                      id: cat.TIP_TIPO_PRODUCTO,
                                      nombre: cat.TIP_NOMBRE,
                                    })
                                  }
                                  className="text-sm font-medium text-blue-600 hover:underline"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void eliminarCategoria(cat.TIP_TIPO_PRODUCTO)}
                                  disabled={saving}
                                  className="flex items-center gap-1 text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                                >
                                  <Trash2 size={13} />
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Panel de productos de esta categoría */}
                          {selectedCategoriaId === cat.TIP_TIPO_PRODUCTO && (
                            <tr key={`${cat.TIP_TIPO_PRODUCTO}-products`}>
                              <td colSpan={3} className="bg-gray-50 px-5 py-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                  Muebles en «{cat.TIP_NOMBRE}»
                                </p>

                                {loadingProdCat && (
                                  <div className="space-y-2">
                                    {Array.from({ length: 3 }, (_, i) => (
                                      <div key={i} className="h-8 animate-pulse rounded bg-gray-200" />
                                    ))}
                                  </div>
                                )}

                                {!loadingProdCat && productosCategoria.length === 0 && (
                                  <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                                    No hay muebles vinculados a esta categoría.
                                  </p>
                                )}

                                {!loadingProdCat && productosCategoria.length > 0 && (
                                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                    <table className="w-full min-w-[480px] text-sm">
                                      <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-500">
                                        <tr>
                                          <th className="px-4 py-2 text-left">Código</th>
                                          <th className="px-4 py-2 text-left">Nombre</th>
                                          <th className="px-4 py-2 text-left">Precio</th>
                                          <th className="px-4 py-2 text-left">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {productosCategoria.map((p) => (
                                          <tr key={p.PRO_PRODUCTO} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-mono text-xs text-gray-400">
                                              {p.PRO_CODIGO ?? p.PRO_PRODUCTO}
                                            </td>
                                            <td className="px-4 py-2 font-medium">
                                              {p.PRO_NOMBRE}
                                            </td>
                                            <td className="px-4 py-2">
                                              {formatCurrency(p.PRE_PRECIO)}
                                            </td>
                                            <td className="px-4 py-2">
                                              <StatusBadge estado={p.PRO_ESTADO} />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TIENDAS
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "tiendas" && (
            <div className="space-y-6">
              <SectionCard
                title={tiendaForm.id ? "Editar tienda" : "Nueva tienda"}
                subtitle="Sucursales de la mueblería"
              >
                <form
                  onSubmit={(e) => void guardarTienda(e)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField label="Nombre" required>
                      <input
                        className={inputCls}
                        placeholder="Nombre de la tienda"
                        value={tiendaForm.nombre}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, nombre: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Departamento">
                      <input
                        className={inputCls}
                        placeholder="Ej. Guatemala"
                        value={tiendaForm.departamento}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, departamento: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Municipio">
                      <input
                        className={inputCls}
                        placeholder="Ej. Villa Nueva"
                        value={tiendaForm.municipio}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, municipio: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Zona o aldea">
                      <input
                        className={inputCls}
                        placeholder="Ej. Zona 10"
                        value={tiendaForm.zona}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, zona: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Domicilio">
                      <input
                        className={inputCls}
                        placeholder="Dirección exacta"
                        value={tiendaForm.domicilio}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, domicilio: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Teléfono">
                      <input
                        className={inputCls}
                        placeholder="+502 0000-0000"
                        value={tiendaForm.telefono}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, telefono: e.target.value })
                        }
                      />
                    </FormField>

                    <FormField label="Estado">
                      <select
                        className={selectCls}
                        value={tiendaForm.estado}
                        onChange={(e) =>
                          setTiendaForm({ ...tiendaForm, estado: e.target.value })
                        }
                      >
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="INACTIVO">INACTIVO</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      <Save size={15} />
                      {tiendaForm.id ? "Actualizar" : "Crear tienda"}
                    </button>

                    {tiendaForm.id && (
                      <button
                        type="button"
                        onClick={() => setTiendaForm(emptyTiendaForm)}
                        className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </SectionCard>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <p className="font-semibold">Tiendas registradas</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Ubicación</th>
                        <th className="px-5 py-3">Teléfono</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tiendas.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                            No hay tiendas registradas.
                          </td>
                        </tr>
                      )}

                      {tiendas.map((t) => (
                        <tr key={t.TIE_TIENDA} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">{t.TIE_NOMBRE}</td>
                          <td className="px-5 py-3 text-gray-500">
                            {[t.TIE_DEPARTAMENTO, t.TIE_MUNICIPIO]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {t.TIE_TELEFONO ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={t.TIE_ESTADO} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setTiendaForm({
                                    id: t.TIE_TIENDA,
                                    nombre: t.TIE_NOMBRE,
                                    departamento: t.TIE_DEPARTAMENTO ?? "",
                                    municipio: t.TIE_MUNICIPIO ?? "",
                                    zona: t.TIE_ZONA_ALDEA ?? "",
                                    domicilio: t.TIE_DOMICILIO ?? "",
                                    telefono: t.TIE_TELEFONO ?? "",
                                    estado: t.TIE_ESTADO ?? "ACTIVO",
                                  })
                                }
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void eliminarTienda(t.TIE_TIENDA)}
                                disabled={saving}
                                className="flex items-center gap-1 text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                              >
                                <Trash2 size={13} />
                                Desactivar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MÉTODOS DE PAGO
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "metodos" && (
            <div className="space-y-6">
              <SectionCard
                title={metodoForm.id ? "Editar método" : "Nuevo método de pago"}
              >
                <form
                  onSubmit={(e) => void guardarMetodo(e)}
                  className="flex flex-col gap-4 sm:flex-row sm:items-end"
                >
                  <FormField label="Nombre" required>
                    <input
                      className={`${inputCls} sm:w-64`}
                      placeholder="Ej. Efectivo, Tarjeta, Transferencia"
                      value={metodoForm.nombre}
                      onChange={(e) =>
                        setMetodoForm({ ...metodoForm, nombre: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField label="Estado">
                    <select
                      className={`${selectCls} sm:w-40`}
                      value={metodoForm.estado}
                      onChange={(e) =>
                        setMetodoForm({ ...metodoForm, estado: e.target.value })
                      }
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      <Save size={15} />
                      {metodoForm.id ? "Actualizar" : "Crear"}
                    </button>

                    {metodoForm.id && (
                      <button
                        type="button"
                        onClick={() => setMetodoForm(emptyMetodoForm)}
                        className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </SectionCard>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {metodos.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                            No hay métodos registrados.
                          </td>
                        </tr>
                      )}

                      {metodos.map((m) => (
                        <tr key={m.MET_METODO_PAGO} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">{m.MET_NOMBRE}</td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={m.MET_ESTADO} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setMetodoForm({
                                    id: m.MET_METODO_PAGO,
                                    nombre: m.MET_NOMBRE,
                                    estado: m.MET_ESTADO ?? "ACTIVO",
                                  })
                                }
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void eliminarMetodo(m.MET_METODO_PAGO)}
                                disabled={saving}
                                className="flex items-center gap-1 text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                              >
                                <Trash2 size={13} /> Desactivar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              IMPUESTOS
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "impuestos" && (
            <div className="space-y-6">
              <SectionCard
                title={impuestoForm.id ? "Editar impuesto" : "Nuevo impuesto"}
              >
                <form
                  onSubmit={(e) => void guardarImpuesto(e)}
                  className="flex flex-col gap-4 sm:flex-row sm:items-end"
                >
                  <FormField label="Nombre" required>
                    <input
                      className={`${inputCls} sm:w-56`}
                      placeholder="Ej. IVA, ISR"
                      value={impuestoForm.nombre}
                      onChange={(e) =>
                        setImpuestoForm({ ...impuestoForm, nombre: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField label="Porcentaje (%)" required>
                    <input
                      className={`${inputCls} sm:w-28`}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      placeholder="Ej. 12"
                      value={impuestoForm.porcentaje}
                      onChange={(e) =>
                        setImpuestoForm({ ...impuestoForm, porcentaje: e.target.value })
                      }
                    />
                  </FormField>

                  <FormField label="Estado">
                    <select
                      className={`${selectCls} sm:w-36`}
                      value={impuestoForm.estado}
                      onChange={(e) =>
                        setImpuestoForm({ ...impuestoForm, estado: e.target.value })
                      }
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      <Save size={15} />
                      {impuestoForm.id ? "Actualizar" : "Crear"}
                    </button>

                    {impuestoForm.id && (
                      <button
                        type="button"
                        onClick={() => setImpuestoForm(emptyImpuestoForm)}
                        className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </SectionCard>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-5 py-3">Porcentaje</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {impuestos.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                            No hay impuestos registrados.
                          </td>
                        </tr>
                      )}

                      {impuestos.map((imp) => (
                        <tr key={imp.IMP_IMPUESTO} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">{imp.IMP_NOMBRE}</td>
                          <td className="px-5 py-3">{imp.IMP_PORCENTAJE}%</td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={imp.IMP_ESTADO} />
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setImpuestoForm({
                                    id: imp.IMP_IMPUESTO,
                                    nombre: imp.IMP_NOMBRE,
                                    porcentaje: String(imp.IMP_PORCENTAJE),
                                    estado: imp.IMP_ESTADO ?? "ACTIVO",
                                  })
                                }
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void eliminarImpuesto(imp.IMP_IMPUESTO)}
                                disabled={saving}
                                className="flex items-center gap-1 text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                              >
                                <Trash2 size={13} /> Desactivar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              ÓRDENES
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "ordenes" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="font-semibold">Órdenes de venta</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Busca por número y consulta el detalle real de cada orden.
                      </p>
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void buscarOrdenes();
                      }}
                      className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                      <div className="sm:min-w-[260px]">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Número de orden
                        </label>
                        <input
                          value={ordenSearch}
                          onChange={(event) => setOrdenSearch(event.target.value)}
                          placeholder="Ej. 1024"
                          className={inputCls}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                        >
                          {saving ? "Buscando..." : "Buscar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void limpiarBusquedaOrdenes()}
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                        >
                          Limpiar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Orden</th>
                        <th className="px-5 py-3">Cliente</th>
                        <th className="px-5 py-3">Tienda</th>
                        <th className="px-5 py-3">Fecha</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Método</th>
                        <th className="px-5 py-3">Productos</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ordenes.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-5 py-8 text-center text-gray-400">
                            No hay órdenes que coincidan con la búsqueda actual.
                          </td>
                        </tr>
                      )}
                      {ordenes.map((orden) => (
                        <tr key={orden.ODV_ORDEN_VENTA} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">
                            #{orden.ODV_ORDEN_VENTA}
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-medium">
                              {orden.CLIENTE_NOMBRE ?? `Cliente #${orden.CLI_CLIENTE}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {orden.CLI_NUMERO_DOCUMENTO ?? orden.CLI_CORREO_ELECTRONICO ?? "Sin documento"}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-gray-600">
                            {orden.TIE_NOMBRE ?? `Tienda #${orden.TIE_TIENDA}`}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {formatDate(orden.ODV_FECHA)}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={orden.ODV_ESTADO} />
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {orden.MET_NOMBRE ?? "Sin factura"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {orden.RESUMEN_PRODUCTOS ?? "Sin detalle"}
                          </td>
                          <td className="px-5 py-3 text-right font-medium">
                            {formatCurrency(orden.ODV_TOTAL)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setShowOrdenDetalleModal(true);
                                void cargarDetalleOrden(orden.ODV_ORDEN_VENTA);
                              }}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <DetailModal
                open={showOrdenDetalleModal}
                onClose={() => {
                  setShowOrdenDetalleModal(false);
                  setOrdenDetalle(null);
                  cerrarProcesarOrdenModal();
                }}
              >
                {loadingOrdenDetalle && (
                  <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
                )}

                {!loadingOrdenDetalle && ordenDetalle && (
                <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                  <div className="flex flex-col gap-6 border-b border-gray-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Orden
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-gray-900">
                        #{String(ordenDetalle.orden.ODV_ORDEN_VENTA ?? "—")}
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        {formatDate(String(ordenDetalle.orden.ODV_FECHA ?? ""))}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 lg:text-right">
                      <p>
                        <strong>Estado:</strong>{" "}
                        {String(ordenDetalle.orden.ODV_ESTADO ?? "—")}
                      </p>
                      <p>
                        <strong>Factura:</strong>{" "}
                        {facturaPrincipalOrden
                          ? `#${String(facturaPrincipalOrden.FAC_FACTURA ?? "—")}`
                          : "Sin factura"}
                      </p>
                      <p>
                        <strong>Método:</strong>{" "}
                        {String(facturaPrincipalOrden?.MET_NOMBRE ?? "Sin registro")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                      <p className="font-semibold">Cliente</p>
                      <div className="mt-3 space-y-2 text-gray-600">
                        <p>
                          {joinValues(
                            String(ordenDetalle.orden.CLI_PRIMER_NOMBRE ?? ""),
                            String(ordenDetalle.orden.CLI_SEGUNDO_NOMBRE ?? ""),
                            String(ordenDetalle.orden.CLI_PRIMER_APELLIDO ?? ""),
                            String(ordenDetalle.orden.CLI_SEGUNDO_APELLIDO ?? ""),
                          ) || "Sin registro"}
                        </p>
                        <p>
                          {joinValues(
                            String(ordenDetalle.orden.CLI_TIPO_DOCUMENTO ?? ""),
                            String(ordenDetalle.orden.CLI_NUMERO_DOCUMENTO ?? ""),
                          ) || "Sin documento"}
                        </p>
                        <p>{String(ordenDetalle.orden.CLI_CORREO_ELECTRONICO ?? "Sin correo")}</p>
                        <p>{String(ordenDetalle.orden.CLI_TELEFONO ?? "Sin telefono")}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                      <p className="font-semibold">Entrega</p>
                      <div className="mt-3 space-y-2 text-gray-600">
                        <p>
                          {joinAddress(
                            String(ordenDetalle.orden.CLI_ZONA_ALDEA ?? ""),
                            String(ordenDetalle.orden.CLI_MUNICIPIO ?? ""),
                            String(ordenDetalle.orden.CLI_DEPARTAMENTO ?? ""),
                            String(ordenDetalle.orden.CLI_PAIS ?? ""),
                          ) || "Sin direccion registrada"}
                        </p>
                        <p>
                          <strong>Telefono:</strong>{" "}
                          {String(ordenDetalle.orden.CLI_TELEFONO ?? "Sin telefono")}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                      <p className="font-semibold">Tienda y pago</p>
                      <div className="mt-3 space-y-2 text-gray-600">
                        <p>
                          <strong>Tienda:</strong>{" "}
                          {String(ordenDetalle.orden.TIE_NOMBRE ?? "Sin tienda")}
                        </p>
                        <p>
                          <strong>Metodo:</strong>{" "}
                          {String(facturaPrincipalOrden?.MET_NOMBRE ?? "Sin factura")}
                        </p>
                        <p>
                          <strong>Factura:</strong>{" "}
                          {facturaPrincipalOrden
                            ? `#${String(facturaPrincipalOrden.FAC_FACTURA ?? "—")}`
                            : "Sin factura"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {envioFicticioOrdenActual && (
                    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold">Datos de envío.</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-3">
                        <p>
                          <strong>Empresa:</strong>{" "}
                          {envioFicticioOrdenActual.empresaTransporte}
                        </p>
                        <p>
                          <strong>Guía:</strong>{" "}
                          {envioFicticioOrdenActual.numeroGuia}
                        </p>
                        <p>
                          <strong>Registro visual:</strong>{" "}
                          {formatDate(envioFicticioOrdenActual.procesadoEn)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <tr>
                          <th className="px-5 py-3">Producto</th>
                          <th className="px-5 py-3">Cant.</th>
                          <th className="px-5 py-3 text-right">Precio</th>
                          <th className="px-5 py-3 text-right">Descuento</th>
                          <th className="px-5 py-3 text-right">Impuesto</th>
                          <th className="px-5 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ordenDetalle.items.map((item, index) => (
                          <tr
                            key={`${item.DOV_DET_ORDEN_VENTA ?? index}-${item.PRO_PRODUCTO ?? index}`}
                          >
                            <td className="px-5 py-3">
                              <p className="font-medium">{String(item.PRO_NOMBRE ?? "—")}</p>
                              <p className="text-xs text-gray-500">
                                {String(item.PRO_CODIGO ?? "Sin codigo")}
                              </p>
                            </td>
                            <td className="px-5 py-3">
                              {String(item.DOV_CANTIDAD ?? item.DFA_CANTIDAD ?? 0)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {formatCurrency(Number(item.DOV_PRECIO_UNITARIO ?? item.DFA_PRECIO ?? 0))}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {formatCurrency(Number(item.DOV_DESCUENTO ?? item.DFA_DESCUENTO ?? 0))}
                            </td>
                            <td className="px-5 py-3 text-right">
                              {formatCurrency(Number(item.DFA_IMPUESTO ?? 0))}
                            </td>
                            <td className="px-5 py-3 text-right font-medium">
                              {formatCurrency(Number(item.DOV_SUBTOTAL ?? item.DFA_SUBTOTAL ?? 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="rounded-xl border border-gray-200 p-4 text-sm">
                      <p className="font-semibold">Procesamiento de la orden</p>
                      <p className="mt-2 text-gray-500">
                        Para procesar la orden se necesita el numero de guia y la empresa de transporte a a la que se envió el pedido.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={saving || ordenDetalle.orden.ODV_ESTADO !== "ACTIVO"}
                          onClick={() =>
                            abrirProcesarOrdenModal(
                              Number(ordenDetalle.orden.ODV_ORDEN_VENTA ?? 0),
                            )
                          }
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {envioFicticioOrdenActual ? "Editar envío" : "Procesar"}
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            void cambiarEstadoOrden(
                              Number(ordenDetalle.orden.ODV_ORDEN_VENTA ?? 0),
                              "FINALIZADO",
                            )
                          }
                          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                          Finalizar
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            void cambiarEstadoOrden(
                              Number(ordenDetalle.orden.ODV_ORDEN_VENTA ?? 0),
                              "ANULADO",
                            )
                          }
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Anular
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <strong>{formatCurrency(Number(ordenDetalle.orden.ODV_SUBTOTAL ?? 0))}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Descuento</span>
                        <strong>{formatCurrency(Number(ordenDetalle.orden.ODV_DESCUENTO ?? 0))}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Impuesto</span>
                        <strong>{formatCurrency(Number(ordenDetalle.orden.ODV_IMPUESTO ?? 0))}</strong>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2 text-base text-black">
                        <span>Total</span>
                        <strong>{formatCurrency(Number(ordenDetalle.orden.ODV_TOTAL ?? 0))}</strong>
                      </div>
                      {facturaPrincipalOrden && (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Total pagado</span>
                            <strong>
                              {formatCurrency(Number(facturaPrincipalOrden.FAC_TOTAL_PAGADO ?? 0))}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Pendiente</span>
                            <strong>
                              {formatCurrency(Number(facturaPrincipalOrden.FAC_PENDIENTE_PAGO ?? 0))}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </DetailModal>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              FACTURAS
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "facturas" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="font-semibold">Facturas</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Busca por número de factura y consulta el detalle fiscal disponible.
                      </p>
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void buscarFacturas();
                      }}
                      className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                      <div className="sm:min-w-[260px]">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Número de factura
                        </label>
                        <input
                          value={facturaSearch}
                          onChange={(event) => setFacturaSearch(event.target.value)}
                          placeholder="Ej. 501"
                          className={inputCls}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                        >
                          {saving ? "Buscando..." : "Buscar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void limpiarBusquedaFacturas()}
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                        >
                          Limpiar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Factura</th>
                        <th className="px-5 py-3">Cliente</th>
                        <th className="px-5 py-3">Orden</th>
                        <th className="px-5 py-3">Método</th>
                        <th className="px-5 py-3">Fecha</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-right">Pagado</th>
                        <th className="px-5 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {facturas.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-5 py-8 text-center text-gray-400">
                            No hay facturas que coincidan con la búsqueda actual.
                          </td>
                        </tr>
                      )}
                      {facturas.map((factura) => (
                        <tr key={factura.FAC_FACTURA} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-xs text-gray-500">
                            #{factura.FAC_FACTURA}
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-medium">
                              {factura.CLIENTE_NOMBRE ?? `Cliente #${factura.CLI_CLIENTE ?? "—"}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {factura.CLI_NUMERO_DOCUMENTO ?? factura.CLI_CORREO_ELECTRONICO ?? "Sin dato fiscal"}
                            </p>
                          </td>
                          <td className="px-5 py-3">#{factura.ORD_ORDEN_VENTA}</td>
                          <td className="px-5 py-3 text-gray-500">
                            {factura.MET_NOMBRE ?? `#${factura.MET_METODO_PAGO}`}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {formatDate(factura.FAC_FECHA_EMISION)}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={factura.FAC_ESTADO_FACTURA} />
                          </td>
                          <td className="px-5 py-3 text-right font-medium">
                            {formatCurrency(factura.FAC_TOTAL)}
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500">
                            {formatCurrency(factura.FAC_TOTAL_PAGADO)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setShowFacturaDetalleModal(true);
                                void cargarDetalleFactura(factura.FAC_FACTURA);
                              }}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <DetailModal
                open={showFacturaDetalleModal}
                maxWidth="max-w-7xl"
                onClose={() => {
                  setShowFacturaDetalleModal(false);
                  setFacturaDetalle(null);
                }}
              >
                {loadingFacturaDetalle && (
                  <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
                )}

                {!loadingFacturaDetalle && facturaDetalle && (
                  <AdminFacturaDocumento facturaDetalle={facturaDetalle} />
                )}
              </DetailModal>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              EMPLEADOS
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "empleados" && (
            <AdminEmpleadosSection
              active={tab === "empleados"}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              CLIENTES
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "clientes" && (
            <div className="space-y-6">
              {/* Botón agregar */}
              {!showClienteForm && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setClienteForm(emptyClienteForm);
                      setClienteFormMode("create");
                      setShowClienteForm(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    <Plus size={16} />
                    Agregar cliente
                  </button>
                </div>
              )}

              {/* Formulario */}
              {showClienteForm && (
                <SectionCard
                title={
                  clienteFormMode === "edit" && clienteForm.id
                    ? `Editar cliente #${clienteForm.id}`
                    : "Registrar cliente"
                }
                subtitle="Usa los campos reales disponibles en cliente, persona y cuenta de acceso."
              >
                <form onSubmit={guardarCliente} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Datos del cliente
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FormField label="Primer nombre" required>
                        <input
                          value={clienteForm.CLI_Primer_Nombre}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Primer_Nombre: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Segundo nombre">
                        <input
                          value={clienteForm.CLI_Segundo_Nombre}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Segundo_Nombre: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Primer apellido" required>
                        <input
                          value={clienteForm.CLI_Primer_Apellido}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Primer_Apellido: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Segundo apellido">
                        <input
                          value={clienteForm.CLI_Segundo_Apellido}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Segundo_Apellido: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Correo electronico" required>
                        <input
                          type="email"
                          value={clienteForm.CLI_Correo_Electronico}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Correo_Electronico: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Telefono">
                        <input
                          value={clienteForm.CLI_Telefono}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Telefono: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Pais">
                        <input
                          value={clienteForm.CLI_Pais}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Pais: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Departamento">
                        <input
                          value={clienteForm.CLI_Departamento}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Departamento: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Municipio">
                        <input
                          value={clienteForm.CLI_Municipio}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Municipio: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Zona / Aldea">
                        <input
                          value={clienteForm.CLI_Zona_Aldea}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Zona_Aldea: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Tipo de documento">
                        <input
                          value={clienteForm.CLI_Tipo_Documento}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Tipo_Documento: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Numero de documento">
                        <input
                          value={clienteForm.CLI_Numero_Documento}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              CLI_Numero_Documento: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Datos de persona relacionada
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FormField label="Tipo de documento">
                        <input
                          value={clienteForm.PER_Tipo_Documento}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Tipo_Documento: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Nombre">
                        <input
                          value={clienteForm.PER_Nombre}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Nombre: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Primer apellido">
                        <input
                          value={clienteForm.PER_Primer_Apellido}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Primer_Apellido: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Segundo apellido">
                        <input
                          value={clienteForm.PER_Segundo_Apellido}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Segundo_Apellido: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Correo">
                        <input
                          type="email"
                          value={clienteForm.PER_Correo}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Correo: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Telefono">
                        <input
                          value={clienteForm.PER_Telefono}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Telefono: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Pais">
                        <input
                          value={clienteForm.PER_Pais}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Pais: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Departamento">
                        <input
                          value={clienteForm.PER_Departamento}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Departamento: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Municipio">
                        <input
                          value={clienteForm.PER_Municipio}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Municipio: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Zona / Aldea">
                        <input
                          value={clienteForm.PER_Zona_Aldea}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Zona_Aldea: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Domicilio">
                        <input
                          value={clienteForm.PER_Domicilio}
                          onChange={(event) =>
                            setClienteForm((current) => ({
                              ...current,
                              PER_Domicilio: event.target.value,
                            }))
                          }
                          className={inputCls}
                        />
                      </FormField>
                    </div>
                  </div>

                  {clienteFormMode === "create" && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Acceso al portal
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField label="Nombre de usuario">
                          <input
                            value={clienteForm.username}
                            onChange={(event) =>
                              setClienteForm((current) => ({
                                ...current,
                                username: event.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        </FormField>
                        <FormField label="Contraseña" required>
                          <input
                            type="password"
                            value={clienteForm.password}
                            onChange={(event) =>
                              setClienteForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            }
                            className={inputCls}
                          />
                        </FormField>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {saving
                        ? "Guardando..."
                        : clienteFormMode === "edit"
                          ? "Actualizar cliente"
                          : "Registrar cliente"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetClienteForm();
                        if (clienteFormMode === "create") {
                          setShowClienteForm(false);
                        }
                      }}
                      className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-100"
                    >
                      {clienteFormMode === "edit" ? "Cancelar edición" : "Cancelar"}
                    </button>
                  </div>
                </form>
                </SectionCard>
              )}

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="font-semibold">
                        Clientes registrados
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {clientesAdmin.length}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Busca por documento, nombre o correo y selecciona un cliente para ver su historial.
                      </p>
                    </div>

                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void buscarClientes();
                      }}
                      className="grid gap-3 md:grid-cols-3 xl:min-w-[740px]"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Documento
                        </label>
                        <input
                          value={clienteBusqueda.documento}
                          onChange={(event) =>
                            setClienteBusqueda((current) => ({
                              ...current,
                              documento: event.target.value,
                            }))
                          }
                          placeholder="Numero de documento"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Nombre
                        </label>
                        <input
                          value={clienteBusqueda.nombre}
                          onChange={(event) =>
                            setClienteBusqueda((current) => ({
                              ...current,
                              nombre: event.target.value,
                            }))
                          }
                          placeholder="Nombre o apellido"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Correo
                        </label>
                        <input
                          type="email"
                          value={clienteBusqueda.correo}
                          onChange={(event) =>
                            setClienteBusqueda((current) => ({
                              ...current,
                              correo: event.target.value,
                            }))
                          }
                          placeholder="cliente@correo.com"
                          className={inputCls}
                        />
                      </div>
                      <div className="md:col-span-3 flex gap-2">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                        >
                          {saving ? "Buscando..." : "Buscar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void limpiarBusquedaClientes()}
                          className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                        >
                          Limpiar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Cliente</th>
                        <th className="px-5 py-3">Documento</th>
                        <th className="px-5 py-3">Correo</th>
                        <th className="px-5 py-3">Telefono</th>
                        <th className="px-5 py-3">Direccion</th>
                        <th className="px-5 py-3">Estado direccion</th>
                        <th className="px-5 py-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientesAdmin.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                            No hay clientes que coincidan con la búsqueda actual.
                          </td>
                        </tr>
                      )}
                      {clientesAdmin.map((cliente) => (
                        <tr key={cliente.CLI_CLIENTE} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">
                            #{cliente.CLI_CLIENTE} {joinValues(
                              cliente.CLI_PRIMER_NOMBRE,
                              cliente.CLI_SEGUNDO_NOMBRE,
                              cliente.CLI_PRIMER_APELLIDO,
                              cliente.CLI_SEGUNDO_APELLIDO,
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {joinValues(
                              cliente.CLI_TIPO_DOCUMENTO,
                              cliente.CLI_NUMERO_DOCUMENTO,
                            ) || "Sin documento"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {cliente.CLI_CORREO_ELECTRONICO ?? "Sin correo"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {cliente.CLI_TELEFONO ?? "Sin telefono"}
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {cliente.DIRECCION_RESUMEN ??
                              (joinAddress(
                                cliente.CLI_ZONA_ALDEA,
                                cliente.CLI_MUNICIPIO,
                                cliente.CLI_DEPARTAMENTO,
                                cliente.CLI_PAIS,
                              ) || "Sin direccion")}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge estado={cliente.DIRECCION_VALIDA === 1 ? "ACTIVO" : "PENDIENTE"} />
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowClienteDetalleModal(true);
                                void cargarDetalleCliente(cliente.CLI_CLIENTE);
                              }}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <DetailModal
                open={showClienteDetalleModal}
                maxWidth="max-w-7xl"
                onClose={() => {
                  setShowClienteDetalleModal(false);
                  setClienteDetalle(null);
                  setClienteCompras([]);
                }}
              >
                {loadingClienteDetalle && (
                  <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
                )}

                {!loadingClienteDetalle && clienteDetalle && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClienteDetalleModal(false);
                        fillClienteForm(clienteDetalle);
                      }}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Editar cliente
                    </button>
                    <button
                      type="button"
                      disabled={saving || clienteCompras.length > 0}
                      onClick={() => void eliminarClienteSeleccionado()}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Eliminar cliente
                    </button>
                  </div>

                  {clienteCompras.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Este cliente ya tiene compras registradas, por lo que la eliminación se bloquea tanto en interfaz como en backend.
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <SectionCard title="Cliente" subtitle="Datos personales y de contacto">
                      <div className="space-y-2 text-sm">
                        <p><strong>ID:</strong> {String(clienteDetalle.CLI_CLIENTE ?? "—")}</p>
                        <p>
                          <strong>Nombre:</strong>{" "}
                          {joinValues(
                            clienteDetalle.CLI_PRIMER_NOMBRE,
                            clienteDetalle.CLI_SEGUNDO_NOMBRE,
                            clienteDetalle.CLI_PRIMER_APELLIDO,
                            clienteDetalle.CLI_SEGUNDO_APELLIDO,
                          ) || "Sin registro"}
                        </p>
                        <p><strong>Correo:</strong> {String(clienteDetalle.CLI_CORREO_ELECTRONICO ?? "Sin registro")}</p>
                        <p><strong>Telefono:</strong> {String(clienteDetalle.CLI_TELEFONO ?? "Sin registro")}</p>
                        <p>
                          <strong>Documento:</strong>{" "}
                          {joinValues(
                            clienteDetalle.CLI_TIPO_DOCUMENTO,
                            clienteDetalle.CLI_NUMERO_DOCUMENTO,
                          ) || "Sin registro"}
                        </p>
                      </div>
                    </SectionCard>

                    <SectionCard title="Persona" subtitle="Relacion MUE_PERSONA">
                      <div className="space-y-2 text-sm">
                        <p><strong>ID:</strong> {String(clienteDetalle.PER_PERSONA ?? "Sin relacion")}</p>
                        <p>
                          <strong>Nombre:</strong>{" "}
                          {joinValues(
                            clienteDetalle.PER_NOMBRE,
                            clienteDetalle.PER_PRIMER_APELLIDO,
                            clienteDetalle.PER_SEGUNDO_APELLIDO,
                          ) || "Sin registro"}
                        </p>
                        <p><strong>Correo:</strong> {String(clienteDetalle.PER_CORREO ?? "Sin registro")}</p>
                        <p><strong>Telefono:</strong> {String(clienteDetalle.PER_TELEFONO ?? "Sin registro")}</p>
                        <p><strong>Domicilio:</strong> {String(clienteDetalle.PER_DOMICILIO ?? "Sin registro")}</p>
                      </div>
                    </SectionCard>

                    <SectionCard title="Cuenta y direccion" subtitle="Usuario y entrega principal">
                      <div className="space-y-2 text-sm">
                        <p><strong>Usuario:</strong> {String(clienteDetalle.USU_NOMBRE_USUARIO ?? "Sin usuario")}</p>
                        <p><strong>Contrasena:</strong> {String(clienteDetalle.USU_PASSWORD_STATUS ?? "No registrada")}</p>
                        <p><strong>Direccion:</strong> {String(clienteDetalle.DIRECCION_RESUMEN ?? "Sin direccion")}</p>
                        <p><strong>Telefono de entrega:</strong> {String(clienteDetalle.DIR_TELEFONO ?? "Sin telefono")}</p>
                        <p><strong>Estado direccion:</strong> {Number(clienteDetalle.DIRECCION_VALIDA ?? 0) === 1 ? "Completa" : "Pendiente"}</p>
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard title="Historial de compras" subtitle="Ordenes, facturas y productos relacionados">
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full min-w-[980px] text-xs">
                        <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-3 py-2">Orden</th>
                            <th className="px-3 py-2">Fecha</th>
                            <th className="px-3 py-2">Estado</th>
                            <th className="px-3 py-2">Factura</th>
                            <th className="px-3 py-2">Metodo</th>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Cant.</th>
                            <th className="px-3 py-2 text-right">Impuesto</th>
                            <th className="px-3 py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {clienteCompras.length === 0 && (
                            <tr>
                              <td colSpan={9} className="px-3 py-5 text-center text-gray-400">
                                Sin compras registradas.
                              </td>
                            </tr>
                          )}
                          {clienteCompras.map((compra, index) => (
                            <tr key={`${compra.ODV_ORDEN_VENTA ?? index}-${compra.DOV_DET_ORDEN_VENTA ?? index}`}>
                              <td className="px-3 py-2">#{String(compra.ODV_ORDEN_VENTA ?? "—")}</td>
                              <td className="px-3 py-2">{formatDate(compra.ODV_FECHA)}</td>
                              <td className="px-3 py-2">{String(compra.ODV_ESTADO ?? "—")}</td>
                              <td className="px-3 py-2">#{String(compra.FAC_FACTURA ?? "—")}</td>
                              <td className="px-3 py-2">{String(compra.MET_NOMBRE ?? "—")}</td>
                              <td className="px-3 py-2">{String(compra.PRO_NOMBRE ?? "—")}</td>
                              <td className="px-3 py-2">{String(compra.DOV_CANTIDAD ?? compra.DFA_CANTIDAD ?? "—")}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(compra.DFA_IMPUESTO ?? 0))}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(Number(compra.DOV_SUBTOTAL ?? compra.DFA_SUBTOTAL ?? 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>
                </div>
                )}
              </DetailModal>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              REPORTES
          ══════════════════════════════════════════════════════════════ */}
          {!loading && tab === "reportes" && (
            <div className="space-y-6">
              <SectionCard
                title="Campos corregidos manualmente"
                subtitle="Selecciona cero o mas campos como pastillas horizontales para registrar cuales se corrigen con mayor frecuencia."
                actions={
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={clearManualCorrectionSelection}
                      disabled={manualCorrectionSelection.length === 0}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Limpiar
                    </button>
                    <button
                      type="button"
                      onClick={registerManualCorrectionSelection}
                      className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Registrar seleccion
                    </button>
                  </div>
                }
              >
                <div className="space-y-6">
                  <ManualCorrectionPills
                    fields={manualCorrectionFields}
                    selectedIds={manualCorrectionSelection}
                    counts={manualCorrectionCounts}
                    onToggle={toggleManualCorrectionField}
                  />

                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Seleccion actual
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      {manualCorrectionSelection.length > 0
                        ? manualCorrectionFields
                            .filter((field) =>
                              manualCorrectionSelection.includes(field.id),
                            )
                            .map((field) => field.label)
                            .join(", ")
                        : "Sin campos seleccionados. Puedes dejarlo en cero o seleccionar varios."}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3">Campo</th>
                          <th className="px-4 py-3">Area</th>
                          <th className="px-4 py-3 text-right">Correcciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {manualCorrectionRanking.map((field) => (
                          <tr key={field.id}>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {field.label}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {field.area}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {field.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          <DetailModal
            open={showProcesarOrdenModal}
            maxWidth="max-w-xl"
            onClose={cerrarProcesarOrdenModal}
          >
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Procesar orden
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  Datos de envío
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Esta captura es solo visual por ahora. No se guarda en backend,
                  pero al confirmar la orden sí pasa al estado real permitido.
                </p>
              </div>

              <div className="grid gap-4">
                <FormField label="Empresa de transporte" required>
                  <input
                    value={ordenProcesamientoForm.empresaTransporte}
                    onChange={(event) =>
                      setOrdenProcesamientoForm((current) => ({
                        ...current,
                        empresaTransporte: event.target.value,
                      }))
                    }
                    placeholder="Ej. Cargo Expreso, Guatex, Transporte interno"
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Número de guía" required>
                  <input
                    value={ordenProcesamientoForm.numeroGuia}
                    onChange={(event) =>
                      setOrdenProcesamientoForm((current) => ({
                        ...current,
                        numeroGuia: event.target.value,
                      }))
                    }
                    placeholder="Ingresa cualquier referencia de guía"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarProcesarOrdenModal}
                  className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void confirmarProcesamientoOrden()}
                  className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {saving ? "Procesando..." : "Aceptar y procesar"}
                </button>
              </div>
            </div>
          </DetailModal>
        </main>
      </div>
    </div>
  );
}
