"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, MapPin, Package, User } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  shopAuthApi,
  shopCheckoutApi,
  type ClienteProfile,
  type OrderDetailItem,
  type ShopOrder,
  type ShopOrderDetail,
} from "../../lib/api";
import { useSession } from "../hooks/useSession";

type Tab = "perfil" | "pedidos" | "direcciones";

type ProfileForm = Record<string, string>;

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

const profileFields = [
  "CLI_Primer_Nombre",
  "CLI_Segundo_Nombre",
  "CLI_Primer_Apellido",
  "CLI_Segundo_Apellido",
  "CLI_Departamento",
  "CLI_Municipio",
  "CLI_Zona_Aldea",
  "CLI_Telefono",
  "CLI_Pais",
  "CLI_Tipo_Documento",
  "CLI_Numero_Documento",
  "CLI_Correo_Electronico",
  "PER_Tipo_Documento",
  "PER_Nombre",
  "PER_Primer_Apellido",
  "PER_Segundo_Apellido",
  "PER_Correo",
  "PER_Telefono",
  "PER_Pais",
  "PER_Departamento",
  "PER_Municipio",
  "PER_Zona_Aldea",
  "PER_Domicilio",
] as const;

const buildForm = (profile: ClienteProfile | null): ProfileForm =>
  profileFields.reduce<ProfileForm>((acc, key) => {
    acc[key] = String(profile?.[key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase() as keyof ClienteProfile] ?? profile?.[key as keyof ClienteProfile] ?? "");
    return acc;
  }, {});

const formatPrimaryAddress = (profile: ClienteProfile | null) =>
  [
    profile?.DIR_ZONA_ALDEA ?? profile?.CLI_ZONA_ALDEA ?? profile?.PER_DOMICILIO ?? profile?.PER_ZONA_ALDEA,
    profile?.DIR_MUNICIPIO ?? profile?.CLI_MUNICIPIO ?? profile?.PER_MUNICIPIO,
    profile?.DIR_DEPARTAMENTO ?? profile?.CLI_DEPARTAMENTO ?? profile?.PER_DEPARTAMENTO,
    profile?.DIR_PAIS ?? profile?.CLI_PAIS ?? profile?.PER_PAIS,
  ]
    .filter(Boolean)
    .join(", ");

const getOrderFactura = (detail: ShopOrderDetail | null) =>
  detail?.facturas?.[0] ?? null;

const getItemTax = (item: OrderDetailItem) => Number(item.DFA_IMPUESTO ?? 0);

function SidebarButton({
  active,
  icon,
  label,
  onClick,
  danger,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
        active
          ? "border-black bg-black text-white"
          : danger
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </label>
  );
}

export default function Cuenta() {
  const router = useRouter();
  const { user, token, saveSession, isAuthenticated, logout, initialized } = useSession();

  const [tab, setTab] = useState<Tab>("perfil");
  const [pedidos, setPedidos] = useState<ShopOrder[]>([]);
  const [perfil, setPerfil] = useState<ClienteProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => buildForm(null));
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderDetail, setOrderDetail] = useState<ShopOrderDetail | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  const cargarCuenta = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setLoadingPedidos(false);
      return;
    }

    setLoading(true);
    setLoadingPedidos(true);
    setError("");

    try {
      const [orders, me] = await Promise.all([
        shopCheckoutApi.listarOrdenes(),
        shopAuthApi.me(),
      ]);

      setPedidos(Array.isArray(orders) ? orders : []);
      setPerfil(me.profile);
      setForm(buildForm(me.profile));
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setLoading(false);
      setLoadingPedidos(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.push("/shop/login");
      return;
    }
    void cargarCuenta();
  }, [cargarCuenta, initialized, isAuthenticated, router]);

  const hasPersonaData = useMemo(
    () =>
      Boolean(
        perfil?.PER_PERSONA ||
          perfil?.PER_NOMBRE ||
          perfil?.PER_CORREO ||
          perfil?.PER_DOMICILIO,
      ),
    [perfil],
  );

  const direccionValida = Number(perfil?.DIRECCION_VALIDA ?? 0) === 1;
  const direccionResumen = formatPrimaryAddress(perfil);
  const facturaSeleccionada = getOrderFactura(orderDetail);

  const updateField = (key: keyof ProfileForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const guardarPerfil = async () => {
    if (!form.CLI_Primer_Nombre.trim()) {
      setError("El primer nombre del cliente es obligatorio.");
      return;
    }

    if (!form.CLI_Primer_Apellido.trim()) {
      setError("El primer apellido del cliente es obligatorio.");
      return;
    }

    if (!form.CLI_Correo_Electronico.trim()) {
      setError("El correo electronico del cliente es obligatorio.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim() || null]),
      );
      const result = await shopAuthApi.updateProfile(payload);
      setPerfil(result.profile);
      setForm(buildForm(result.profile));

      saveSession(token ?? "", {
        clienteId: user?.clienteId ?? result.profile.CLI_CLIENTE,
        username: user?.username ?? String(result.profile.USU_NOMBRE_USUARIO ?? ""),
        correo:
          String(result.profile.CLI_CORREO_ELECTRONICO ?? user?.correo ?? ""),
        nombreCompleto: [
          String(result.profile.CLI_PRIMER_NOMBRE ?? ""),
          String(result.profile.CLI_PRIMER_APELLIDO ?? ""),
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
      });

      setEditMode(false);
      setSuccess("Tu informacion fue actualizada correctamente.");
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setSaving(false);
    }
  };

  const cargarDetallePedido = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setLoadingOrderDetail(true);
    setError("");

    try {
      const detalle = await shopCheckoutApi.obtenerOrden(orderId);
      setOrderDetail(detalle);
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
      setOrderDetail(null);
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  return (
    <main className="bg-white text-black">
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-4 md:px-10">
        <div className="space-y-2">
          <SidebarButton
            active={tab === "perfil"}
            icon={<User className="h-4 w-4" />}
            label="Mi perfil"
            onClick={() => setTab("perfil")}
          />
          <SidebarButton
            active={tab === "pedidos"}
            icon={<Package className="h-4 w-4" />}
            label="Mis pedidos"
            onClick={() => setTab("pedidos")}
          />
          <SidebarButton
            active={tab === "direcciones"}
            icon={<MapPin className="h-4 w-4" />}
            label="Direcciones"
            onClick={() => setTab("direcciones")}
          />
          <SidebarButton
            icon={<LogOut className="h-4 w-4" />}
            label="Cerrar sesion"
            danger
            onClick={() => {
              logout();
              router.push("/shop/login");
            }}
          />
        </div>

        <div className="md:col-span-3">
          {loading && (
            <div className="space-y-6">
              <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
              <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {!loading && tab === "perfil" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Informacion de cliente</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Administra tus datos personales, de contacto y ubicacion principal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode((current) => !current);
                      setError("");
                      setSuccess("");
                      setForm(buildForm(perfil));
                    }}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  >
                    {editMode ? "Cancelar edicion" : "Editar informacion"}
                  </button>
                </div>

                {!editMode && (
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                      <p className="font-semibold text-gray-900">Cliente</p>
                      <div className="mt-3 space-y-2 text-gray-600">
                        <p>
                          <strong>Nombre:</strong>{" "}
                          {[perfil?.CLI_PRIMER_NOMBRE, perfil?.CLI_SEGUNDO_NOMBRE, perfil?.CLI_PRIMER_APELLIDO, perfil?.CLI_SEGUNDO_APELLIDO]
                            .filter(Boolean)
                            .join(" ") || "Sin registro"}
                        </p>
                        <p><strong>Correo:</strong> {perfil?.CLI_CORREO_ELECTRONICO ?? "Sin registro"}</p>
                        <p><strong>Telefono:</strong> {perfil?.CLI_TELEFONO ?? "Sin registro"}</p>
                        <p>
                          <strong>Documento:</strong>{" "}
                          {[perfil?.CLI_TIPO_DOCUMENTO, perfil?.CLI_NUMERO_DOCUMENTO]
                            .filter(Boolean)
                            .join(" ") || "Sin registro"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                      <p className="font-semibold text-gray-900">Direccion principal</p>
                      <div className="mt-3 space-y-2 text-gray-600">
                        <p><strong>Estado:</strong> {direccionValida ? "Completa" : "Pendiente"}</p>
                        <p><strong>Direccion:</strong> {direccionResumen || "Sin registro"}</p>
                        <p><strong>Telefono:</strong> {perfil?.DIR_TELEFONO ?? perfil?.CLI_TELEFONO ?? perfil?.PER_TELEFONO ?? "Sin registro"}</p>
                        <p><strong>Usuario:</strong> {perfil?.USU_NOMBRE_USUARIO ?? "Sin usuario asociado"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className="mt-6 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Datos del cliente
                      </h3>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Primer nombre" value={form.CLI_Primer_Nombre} onChange={(value) => updateField("CLI_Primer_Nombre", value)} />
                        <Field label="Segundo nombre" value={form.CLI_Segundo_Nombre} onChange={(value) => updateField("CLI_Segundo_Nombre", value)} />
                        <Field label="Primer apellido" value={form.CLI_Primer_Apellido} onChange={(value) => updateField("CLI_Primer_Apellido", value)} />
                        <Field label="Segundo apellido" value={form.CLI_Segundo_Apellido} onChange={(value) => updateField("CLI_Segundo_Apellido", value)} />
                        <Field label="Correo electronico" type="email" value={form.CLI_Correo_Electronico} onChange={(value) => updateField("CLI_Correo_Electronico", value)} />
                        <Field label="Telefono" value={form.CLI_Telefono} onChange={(value) => updateField("CLI_Telefono", value)} />
                        <Field label="Pais" value={form.CLI_Pais} onChange={(value) => updateField("CLI_Pais", value)} />
                        <Field label="Departamento" value={form.CLI_Departamento} onChange={(value) => updateField("CLI_Departamento", value)} />
                        <Field label="Municipio" value={form.CLI_Municipio} onChange={(value) => updateField("CLI_Municipio", value)} />
                        <Field label="Zona / Aldea" value={form.CLI_Zona_Aldea} onChange={(value) => updateField("CLI_Zona_Aldea", value)} />
                        <Field label="Tipo de documento" value={form.CLI_Tipo_Documento} onChange={(value) => updateField("CLI_Tipo_Documento", value)} />
                        <Field label="Numero de documento" value={form.CLI_Numero_Documento} onChange={(value) => updateField("CLI_Numero_Documento", value)} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Datos de persona relacionada
                      </h3>
                      {!hasPersonaData && (
                        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                          No hay una persona relacionada visible para este cliente en la sesion actual.
                        </p>
                      )}
                      {hasPersonaData && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Field label="Tipo de documento" value={form.PER_Tipo_Documento} onChange={(value) => updateField("PER_Tipo_Documento", value)} />
                          <Field label="Nombre" value={form.PER_Nombre} onChange={(value) => updateField("PER_Nombre", value)} />
                          <Field label="Primer apellido" value={form.PER_Primer_Apellido} onChange={(value) => updateField("PER_Primer_Apellido", value)} />
                          <Field label="Segundo apellido" value={form.PER_Segundo_Apellido} onChange={(value) => updateField("PER_Segundo_Apellido", value)} />
                          <Field label="Correo" type="email" value={form.PER_Correo} onChange={(value) => updateField("PER_Correo", value)} />
                          <Field label="Telefono" value={form.PER_Telefono} onChange={(value) => updateField("PER_Telefono", value)} />
                          <Field label="Pais" value={form.PER_Pais} onChange={(value) => updateField("PER_Pais", value)} />
                          <Field label="Departamento" value={form.PER_Departamento} onChange={(value) => updateField("PER_Departamento", value)} />
                          <Field label="Municipio" value={form.PER_Municipio} onChange={(value) => updateField("PER_Municipio", value)} />
                          <Field label="Zona / Aldea" value={form.PER_Zona_Aldea} onChange={(value) => updateField("PER_Zona_Aldea", value)} />
                          <Field label="Domicilio" value={form.PER_Domicilio} onChange={(value) => updateField("PER_Domicilio", value)} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => void guardarPerfil()}
                        disabled={saving}
                        className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setForm(buildForm(perfil));
                          setError("");
                        }}
                        className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && tab === "direcciones" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Direcciones</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Este proyecto trabaja con una direccion principal usando los datos reales del cliente y, si existe, de persona.
                </p>

                <div
                  className={`mt-6 rounded-xl border p-4 text-sm ${
                    direccionValida
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <p className="font-semibold">
                    {direccionValida
                      ? "Tu direccion principal esta lista para comprar."
                      : "Necesitas completar tu direccion principal para poder comprar."}
                  </p>
                  <p className="mt-2">
                    {direccionResumen || "Sin direccion registrada"}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Pais" value={form.CLI_Pais} onChange={(value) => updateField("CLI_Pais", value)} />
                  <Field label="Departamento" value={form.CLI_Departamento} onChange={(value) => updateField("CLI_Departamento", value)} />
                  <Field label="Municipio" value={form.CLI_Municipio} onChange={(value) => updateField("CLI_Municipio", value)} />
                  <Field label="Zona / Aldea" value={form.CLI_Zona_Aldea} onChange={(value) => updateField("CLI_Zona_Aldea", value)} />
                  <Field label="Telefono" value={form.CLI_Telefono} onChange={(value) => updateField("CLI_Telefono", value)} />
                  {hasPersonaData && (
                    <Field label="Domicilio de persona" value={form.PER_Domicilio} onChange={(value) => updateField("PER_Domicilio", value)} />
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void guardarPerfil()}
                    disabled={saving}
                    className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {saving ? "Guardando..." : "Guardar direccion principal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("perfil");
                      setEditMode(true);
                    }}
                    className="rounded-lg border px-5 py-3 text-sm font-semibold hover:bg-gray-100"
                  >
                    Editar perfil completo
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && tab === "pedidos" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold">Mis pedidos</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Revisa tus ordenes, estados, factura relacionada y detalle de productos.
                </p>

                {loadingPedidos && (
                  <div className="mt-6 space-y-4">
                    {Array.from({ length: 3 }, (_, index) => (
                      <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                  </div>
                )}

                {!loadingPedidos && pedidos.length === 0 && (
                  <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                    Aun no hay pedidos registrados.
                  </div>
                )}

                {!loadingPedidos && pedidos.length > 0 && (
                  <div className="mt-6 space-y-4">
                    {pedidos.map((pedido) => (
                      <button
                        type="button"
                        key={pedido.ODV_ORDEN_VENTA}
                        onClick={() => void cargarDetallePedido(pedido.ODV_ORDEN_VENTA)}
                        className={`w-full rounded-xl border p-4 text-left transition hover:border-black ${
                          selectedOrderId === pedido.ODV_ORDEN_VENTA
                            ? "border-black bg-gray-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold">ORD-{pedido.ODV_ORDEN_VENTA}</p>
                            <p className="mt-1 text-sm text-gray-500">
                              {formatDate(pedido.ODV_FECHA)}
                            </p>
                            {pedido.RESUMEN_PRODUCTOS && (
                              <p className="mt-2 text-sm text-gray-500">
                                {pedido.RESUMEN_PRODUCTOS}
                              </p>
                            )}
                          </div>
                          <div className="text-left md:text-right">
                            <p className="font-semibold">{formatCurrency(pedido.ODV_TOTAL)}</p>
                            <p className="text-sm text-gray-500">{pedido.ODV_ESTADO}</p>
                            {pedido.MET_NOMBRE && (
                              <p className="text-sm text-gray-500">{pedido.MET_NOMBRE}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedOrderId && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold">Detalle del pedido</h3>

                  {loadingOrderDetail && (
                    <div className="mt-6 h-40 animate-pulse rounded-xl bg-gray-100" />
                  )}

                  {!loadingOrderDetail && orderDetail && (
                    <div className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                          <p className="font-semibold">Orden</p>
                          <p className="mt-2">#{String(orderDetail.orden.ODV_ORDEN_VENTA ?? selectedOrderId)}</p>
                          <p className="text-gray-500">{String(orderDetail.orden.ODV_ESTADO ?? "Sin estado")}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                          <p className="font-semibold">Fecha</p>
                          <p className="mt-2">{formatDate(String(orderDetail.orden.ODV_FECHA ?? ""))}</p>
                          <p className="text-gray-500">{String(orderDetail.orden.TIE_NOMBRE ?? "Sin tienda")}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                          <p className="font-semibold">Cliente</p>
                          <p className="mt-2">
                            {[
                              orderDetail.cliente?.CLI_PRIMER_NOMBRE,
                              orderDetail.cliente?.CLI_PRIMER_APELLIDO,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Sin registro"}
                          </p>
                          <p className="text-gray-500">
                            {orderDetail.cliente?.CLI_CORREO_ELECTRONICO ?? "Sin correo"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
                          <p className="font-semibold">Direccion</p>
                          <p className="mt-2">
                            {String(orderDetail.orden.DIRECCION_RESUMEN ?? "Sin direccion registrada")}
                          </p>
                          <p className="text-gray-500">
                            {String(orderDetail.orden.DIR_TELEFONO ?? "Sin telefono")}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[760px] text-sm">
                          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-4 py-3">Producto</th>
                              <th className="px-4 py-3">Cant.</th>
                              <th className="px-4 py-3 text-right">Precio</th>
                              <th className="px-4 py-3 text-right">Descuento</th>
                              <th className="px-4 py-3 text-right">Impuesto</th>
                              <th className="px-4 py-3 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {orderDetail.items.map((item, index) => (
                              <tr key={`${item.DOV_DET_ORDEN_VENTA ?? index}-${item.PRO_PRODUCTO ?? index}`}>
                                <td className="px-4 py-3">
                                  <p className="font-medium">{item.PRO_NOMBRE ?? "Producto"}</p>
                                  <p className="text-xs text-gray-500">{item.PRO_CODIGO ?? "Sin codigo"}</p>
                                </td>
                                <td className="px-4 py-3">{item.DOV_CANTIDAD ?? item.DFA_CANTIDAD ?? 0}</td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(Number(item.DOV_PRECIO_UNITARIO ?? item.DFA_PRECIO ?? 0))}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(Number(item.DOV_DESCUENTO ?? item.DFA_DESCUENTO ?? 0))}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(getItemTax(item))}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  {formatCurrency(Number(item.DOV_SUBTOTAL ?? item.DFA_SUBTOTAL ?? 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 p-4 text-sm">
                          <p className="font-semibold">Factura relacionada</p>
                          {facturaSeleccionada ? (
                            <div className="mt-3 space-y-2 text-gray-600">
                              <p><strong>Factura:</strong> #{String(facturaSeleccionada.FAC_FACTURA ?? "Sin numero")}</p>
                              <p><strong>Serie / numero:</strong> {[facturaSeleccionada.FAC_SERIE, facturaSeleccionada.FAC_NUMERO].filter(Boolean).join(" / ") || "Sin registro"}</p>
                              <p><strong>Metodo de pago:</strong> {facturaSeleccionada.MET_NOMBRE ?? "Sin registro"}</p>
                              <p><strong>Estado:</strong> {facturaSeleccionada.FAC_ESTADO_FACTURA ?? "Sin estado"}</p>
                              <p><strong>Total pagado:</strong> {formatCurrency(Number(facturaSeleccionada.FAC_TOTAL_PAGADO ?? 0))}</p>
                              <p><strong>Pendiente:</strong> {formatCurrency(Number(facturaSeleccionada.FAC_PENDIENTE_PAGO ?? 0))}</p>
                            </div>
                          ) : (
                            <p className="mt-3 text-gray-500">Aun no existe factura asociada.</p>
                          )}
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4 text-sm">
                          <p className="font-semibold">Totales</p>
                          <div className="mt-3 space-y-2 text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>Subtotal</span>
                              <strong>{formatCurrency(Number(orderDetail.orden.ODV_SUBTOTAL ?? 0))}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Descuento</span>
                              <strong>{formatCurrency(Number(orderDetail.orden.ODV_DESCUENTO ?? 0))}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Impuesto</span>
                              <strong>{formatCurrency(Number(orderDetail.orden.ODV_IMPUESTO ?? 0))}</strong>
                            </div>
                            <div className="flex items-center justify-between border-t pt-2 text-base text-black">
                              <span>Total</span>
                              <strong>{formatCurrency(Number(orderDetail.orden.ODV_TOTAL ?? 0))}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
