"use client";

import { PackagePlus, Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  almacenesApi,
  empleadosApi,
  formatDate,
  getApiErrorMessage,
  materiasPrimasApi,
  ordenesProduccionApi,
  type Almacen,
  type Empleado,
  type MateriaPrima,
  type OrdenProduccion,
  type OrdenProduccionDetailResponse,
  type OrdenProduccionDetallePayload,
  type OrdenProduccionPayload,
  type Producto,
} from "../../lib/api";
import { FormField, inputCls, SectionCard, selectCls, StatusBadge } from "./primitives";

const emptyOrderForm = {
  id: null as number | null,
  productoId: "",
  empleadoId: "",
  cantidadProgramada: "",
  cantidadProducida: "",
  fechaInicio: "",
  fechaFin: "",
  estado: "ACTIVO",
};

const emptyDetailForm = {
  id: null as number | null,
  materiaPrimaId: "",
  cantidadRequerida: "",
  cantidadUtilizada: "",
};

function DetailModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
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

export function AdminOrdenesProduccionSection({
  active,
  refreshKey,
  productos,
  onNotice,
  onError,
}: {
  active: boolean;
  refreshKey: number;
  productos: Producto[];
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [rows, setRows] = useState<OrdenProduccion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDetalleForm, setShowDetalleForm] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [detailForm, setDetailForm] = useState(emptyDetailForm);
  const [selectedDetail, setSelectedDetail] =
    useState<OrdenProduccionDetailResponse | null>(null);
  const [almacenDestinoId, setAlmacenDestinoId] = useState("");

  const almacenesActivos = useMemo(
    () => almacenes.filter((item) => (item.ALM_ESTADO ?? "ACTIVO") === "ACTIVO"),
    [almacenes],
  );

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [ordenes, empleadosRows, materiasRows, almacenesRows] = await Promise.all([
        ordenesProduccionApi.listar(),
        empleadosApi.listar(),
        materiasPrimasApi.listar(),
        almacenesApi.listar(),
      ]);
      setRows(ordenes);
      setEmpleados(empleadosRows);
      setMateriasPrimas(materiasRows);
      setAlmacenes(almacenesRows);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [active, onError]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  const resetOrderForm = () => {
    setOrderForm(emptyOrderForm);
    setShowForm(false);
  };

  const resetDetailForm = () => {
    setDetailForm(emptyDetailForm);
    setShowDetalleForm(false);
  };

  const saveOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const productoId = Number(orderForm.productoId);
    const empleadoId = Number(orderForm.empleadoId);
    const cantidadProgramada = Number(orderForm.cantidadProgramada);
    const cantidadProducida = orderForm.cantidadProducida
      ? Number(orderForm.cantidadProducida)
      : null;

    if (!Number.isFinite(productoId) || productoId <= 0) {
      onError("Selecciona el producto a producir.");
      return;
    }
    if (!Number.isFinite(empleadoId) || empleadoId <= 0) {
      onError("Selecciona el empleado responsable.");
      return;
    }
    if (!Number.isFinite(cantidadProgramada) || cantidadProgramada <= 0) {
      onError("La cantidad programada debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const payload: OrdenProduccionPayload = {
        PRO_Producto: productoId,
        EMP_Empleado: empleadoId,
        OPR_Cantidad_Programada: cantidadProgramada,
        OPR_Cantidad_Producida: cantidadProducida,
        OPR_Fecha_Inicio: orderForm.fechaInicio || null,
        OPR_Fecha_Fin: orderForm.fechaFin || null,
        OPR_Estado: orderForm.estado,
      };
      if (orderForm.id) {
        await ordenesProduccionApi.actualizar(orderForm.id, payload);
        onNotice("Orden de produccion actualizada correctamente.");
      } else {
        await ordenesProduccionApi.crear(payload);
        onNotice("Orden de produccion creada correctamente.");
      }
      resetOrderForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editOrder = (row: OrdenProduccion) => {
    setOrderForm({
      id: row.OPR_ORDENPRODUCCION,
      productoId: String(row.PRO_PRODUCTO),
      empleadoId: String(row.EMP_EMPLEADO),
      cantidadProgramada: String(row.OPR_CANTIDAD_PROGRAMADA),
      cantidadProducida:
        row.OPR_CANTIDAD_PRODUCIDA != null ? String(row.OPR_CANTIDAD_PRODUCIDA) : "",
      fechaInicio: row.OPR_FECHA_INICIO ? String(row.OPR_FECHA_INICIO).slice(0, 10) : "",
      fechaFin: row.OPR_FECHA_FIN ? String(row.OPR_FECHA_FIN).slice(0, 10) : "",
      estado: row.OPR_ESTADO,
    });
    setShowForm(true);
  };

  const openDetail = async (row: OrdenProduccion) => {
    setSaving(true);
    try {
      const detalle = await ordenesProduccionApi.obtenerDetalle(row.OPR_ORDENPRODUCCION);
      setSelectedDetail(detalle);
      setShowDetailModal(true);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const refreshSelectedDetail = async (ordenId: number) => {
    const detalle = await ordenesProduccionApi.obtenerDetalle(ordenId);
    setSelectedDetail(detalle);
    await loadData();
  };

  const saveDetalle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDetail) return;

    const materiaPrimaId = Number(detailForm.materiaPrimaId);
    const cantidadRequerida = Number(detailForm.cantidadRequerida);
    const cantidadUtilizada = detailForm.cantidadUtilizada
      ? Number(detailForm.cantidadUtilizada)
      : null;

    if (!Number.isFinite(materiaPrimaId) || materiaPrimaId <= 0) {
      onError("Selecciona la materia prima.");
      return;
    }
    if (!Number.isFinite(cantidadRequerida) || cantidadRequerida <= 0) {
      onError("La cantidad requerida debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const payload: OrdenProduccionDetallePayload = {
        MAP_Materia_Prima: materiaPrimaId,
        DOP_Cantidad_Requerida: cantidadRequerida,
        DOP_Cantidad_Utilizada: cantidadUtilizada,
      };
      if (detailForm.id) {
        await ordenesProduccionApi.actualizarDetalle(detailForm.id, payload);
        onNotice("Detalle de produccion actualizado correctamente.");
      } else {
        await ordenesProduccionApi.agregarDetalle(
          selectedDetail.orden.OPR_ORDENPRODUCCION,
          payload,
        );
        onNotice("Materia prima agregada a la orden.");
      }
      resetDetailForm();
      await refreshSelectedDetail(selectedDetail.orden.OPR_ORDENPRODUCCION);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editDetalle = (detalle: OrdenProduccionDetailResponse["detalles"][number]) => {
    setDetailForm({
      id: detalle.DOP_DETALLE_ORDENPRODUCCION,
      materiaPrimaId: String(detalle.MAP_MATERIA_PRIMA),
      cantidadRequerida: String(detalle.DOP_CANTIDAD_REQUERIDA),
      cantidadUtilizada:
        detalle.DOP_CANTIDAD_UTILIZADA != null
          ? String(detalle.DOP_CANTIDAD_UTILIZADA)
          : "",
    });
    setShowDetalleForm(true);
  };

  const deleteDetalle = async (detalleId: number) => {
    if (!selectedDetail) return;
    setSaving(true);
    try {
      await ordenesProduccionApi.eliminarDetalle(detalleId);
      onNotice("Detalle de produccion eliminado correctamente.");
      await refreshSelectedDetail(selectedDetail.orden.OPR_ORDENPRODUCCION);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const finalizarOrden = async () => {
    if (!selectedDetail) return;
    setSaving(true);
    try {
      const almacenId = almacenDestinoId ? Number(almacenDestinoId) : undefined;
      await ordenesProduccionApi.finalizar(
        selectedDetail.orden.OPR_ORDENPRODUCCION,
        almacenId,
      );
      onNotice("Orden de produccion finalizada correctamente.");
      await refreshSelectedDetail(selectedDetail.orden.OPR_ORDENPRODUCCION);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (row: OrdenProduccion, estado: string) => {
    setSaving(true);
    try {
      await ordenesProduccionApi.cambiarEstado(row.OPR_ORDENPRODUCCION, estado);
      onNotice(`Orden de produccion actualizada a ${estado}.`);
      await loadData();
      if (
        selectedDetail &&
        selectedDetail.orden.OPR_ORDENPRODUCCION === row.OPR_ORDENPRODUCCION
      ) {
        await refreshSelectedDetail(row.OPR_ORDENPRODUCCION);
      }
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!showForm && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <PackagePlus size={16} />
            Nueva orden de produccion
          </button>
        </div>
      )}

      {showForm && (
        <SectionCard
          title={orderForm.id ? `Editar orden #${orderForm.id}` : "Nueva orden de produccion"}
          subtitle="Programa la fabricacion del producto y asigna un responsable."
        >
          <form onSubmit={saveOrder} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Producto" required>
                <select
                  className={selectCls}
                  value={orderForm.productoId}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      productoId: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecciona</option>
                  {productos.map((producto) => (
                    <option key={producto.PRO_Producto} value={producto.PRO_Producto}>
                      {producto.PRO_Nombre}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Empleado responsable" required>
                <select
                  className={selectCls}
                  value={orderForm.empleadoId}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      empleadoId: event.target.value,
                    }))
                  }
                >
                  <option value="">Selecciona</option>
                  {empleados.map((empleado) => (
                    <option key={empleado.EMP_EMPLEADO} value={empleado.EMP_EMPLEADO}>
                      {empleado.EMPLEADO_NOMBRE ?? `Empleado #${empleado.EMP_EMPLEADO}`}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Cantidad programada" required>
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={orderForm.cantidadProgramada}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      cantidadProgramada: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Cantidad producida">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={orderForm.cantidadProducida}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      cantidadProducida: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Fecha inicio">
                <input
                  type="date"
                  className={inputCls}
                  value={orderForm.fechaInicio}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      fechaInicio: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Fecha fin">
                <input
                  type="date"
                  className={inputCls}
                  value={orderForm.fechaFin}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      fechaFin: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Estado">
                <select
                  className={selectCls}
                  value={orderForm.estado}
                  onChange={(event) =>
                    setOrderForm((current) => ({ ...current, estado: event.target.value }))
                  }
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                  <option value="ANULADO">ANULADO</option>
                </select>
              </FormField>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
              >
                <Save size={16} />
                {saving ? "Guardando..." : orderForm.id ? "Actualizar" : "Crear orden"}
              </button>
              <button
                type="button"
                onClick={resetOrderForm}
                className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Ordenes de produccion" subtitle="Base funcional de fabricacion conectada al inventario.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Responsable</th>
                <th className="px-5 py-3">Programada</th>
                <th className="px-5 py-3">Producida</th>
                <th className="px-5 py-3">Inicio</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-gray-400">
                    No hay ordenes de produccion registradas.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.OPR_ORDENPRODUCCION} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.OPR_ORDENPRODUCCION}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{row.PRO_NOMBRE ?? `Producto #${row.PRO_PRODUCTO}`}</p>
                    <p className="text-xs text-gray-500">{row.PRO_CODIGO ?? "Sin codigo"}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {row.EMPLEADO_NOMBRE ?? `Empleado #${row.EMP_EMPLEADO}`}
                  </td>
                  <td className="px-5 py-3">{row.OPR_CANTIDAD_PROGRAMADA}</td>
                  <td className="px-5 py-3">{row.OPR_CANTIDAD_PRODUCIDA ?? 0}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDate(row.OPR_FECHA_INICIO ?? undefined)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge estado={row.OPR_ESTADO} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => void openDetail(row)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => editOrder(row)}
                        className="text-sm font-medium text-gray-600 hover:underline"
                      >
                        Editar
                      </button>
                      {row.OPR_ESTADO !== "FINALIZADO" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void cambiarEstado(row, "ANULADO")}
                          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <DetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDetail(null);
          resetDetailForm();
          setAlmacenDestinoId("");
        }}
      >
        {selectedDetail && (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <SectionCard title="Orden" subtitle="Resumen">
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>ID:</strong> #{selectedDetail.orden.OPR_ORDENPRODUCCION}</p>
                  <p><strong>Producto:</strong> {selectedDetail.orden.PRO_NOMBRE}</p>
                  <p><strong>Programada:</strong> {selectedDetail.orden.OPR_CANTIDAD_PROGRAMADA}</p>
                  <p><strong>Producida:</strong> {selectedDetail.orden.OPR_CANTIDAD_PRODUCIDA ?? 0}</p>
                </div>
              </SectionCard>
              <SectionCard title="Responsable" subtitle="Empleado asignado">
                <div className="space-y-2 text-sm text-gray-600">
                  <p>{selectedDetail.orden.EMPLEADO_NOMBRE ?? "Sin empleado"}</p>
                  <p><strong>Inicio:</strong> {formatDate(selectedDetail.orden.OPR_FECHA_INICIO ?? undefined)}</p>
                  <p><strong>Fin:</strong> {formatDate(selectedDetail.orden.OPR_FECHA_FIN ?? undefined)}</p>
                  <p><strong>Estado:</strong> {selectedDetail.orden.OPR_ESTADO}</p>
                </div>
              </SectionCard>
              <SectionCard title="Inventario destino" subtitle="Almacen para producto terminado">
                <div className="space-y-3 text-sm text-gray-600">
                  <select
                    className={selectCls}
                    value={almacenDestinoId}
                    onChange={(event) => setAlmacenDestinoId(event.target.value)}
                  >
                    <option value="">Usar almacen actual / primero activo</option>
                    {almacenesActivos.map((almacen) => (
                      <option key={almacen.ALM_ALMACEN} value={almacen.ALM_ALMACEN}>
                        {almacen.ALM_NOMBRE}
                      </option>
                    ))}
                  </select>
                  <p>
                    Al finalizar, aumenta el stock del producto terminado y descuenta
                    materia prima utilizada.
                  </p>
                </div>
              </SectionCard>
              <SectionCard title="Acciones" subtitle="Tracking productivo">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={saving || selectedDetail.orden.OPR_ESTADO === "FINALIZADO"}
                    onClick={() => void finalizarOrden()}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                  >
                    Finalizar
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void cambiarEstado(selectedDetail.orden, "ACTIVO")
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
                  >
                    Mantener activa
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void cambiarEstado(selectedDetail.orden, "ANULADO")
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Anular
                  </button>
                </div>
              </SectionCard>
            </div>

            {!showDetalleForm && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDetalleForm(true)}
                  className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Agregar materia prima
                </button>
              </div>
            )}

            {showDetalleForm && (
              <SectionCard
                title={detailForm.id ? "Editar detalle de produccion" : "Nueva materia prima para la orden"}
                subtitle="Cantidad requerida y realmente utilizada."
              >
                <form onSubmit={saveDetalle} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField label="Materia prima" required>
                      <select
                        className={selectCls}
                        value={detailForm.materiaPrimaId}
                        onChange={(event) =>
                          setDetailForm((current) => ({
                            ...current,
                            materiaPrimaId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona</option>
                        {materiasPrimas
                          .filter((item) => (item.MAP_ESTADO ?? "ACTIVO") === "ACTIVO")
                          .map((item) => (
                            <option key={item.MAP_MATERIA_PRIMA} value={item.MAP_MATERIA_PRIMA}>
                              {item.MAP_NOMBRE}
                            </option>
                          ))}
                      </select>
                    </FormField>
                    <FormField label="Cantidad requerida" required>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={inputCls}
                        value={detailForm.cantidadRequerida}
                        onChange={(event) =>
                          setDetailForm((current) => ({
                            ...current,
                            cantidadRequerida: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                    <FormField label="Cantidad utilizada">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className={inputCls}
                        value={detailForm.cantidadUtilizada}
                        onChange={(event) =>
                          setDetailForm((current) => ({
                            ...current,
                            cantidadUtilizada: event.target.value,
                          }))
                        }
                      />
                    </FormField>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-400"
                    >
                      <Save size={16} />
                      {detailForm.id ? "Actualizar detalle" : "Agregar detalle"}
                    </button>
                    <button
                      type="button"
                      onClick={resetDetailForm}
                      className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </SectionCard>
            )}

            <SectionCard title="Materias primas requeridas" subtitle="Stock disponible comparado con lo requerido/utilizado.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Materia prima</th>
                      <th className="px-5 py-3">Unidad</th>
                      <th className="px-5 py-3">Requerida</th>
                      <th className="px-5 py-3">Utilizada</th>
                      <th className="px-5 py-3">Stock disponible</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedDetail.detalles.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                          No hay materias primas asociadas a esta orden.
                        </td>
                      </tr>
                    )}
                    {selectedDetail.detalles.map((detalle) => (
                      <tr
                        key={detalle.DOP_DETALLE_ORDENPRODUCCION}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 font-medium">{detalle.MAP_NOMBRE ?? "—"}</td>
                        <td className="px-5 py-3 text-gray-500">{detalle.MAP_UNIDAD_MEDIDA ?? "—"}</td>
                        <td className="px-5 py-3">{detalle.DOP_CANTIDAD_REQUERIDA}</td>
                        <td className="px-5 py-3">{detalle.DOP_CANTIDAD_UTILIZADA ?? "—"}</td>
                        <td className="px-5 py-3">{detalle.STOCK_DISPONIBLE ?? 0}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => editDetalle(detalle)}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void deleteDetalle(detalle.DOP_DETALLE_ORDENPRODUCCION)
                              }
                              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
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
            </SectionCard>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
