"use client";

import { AlertTriangle, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  almacenesApi,
  formatDate,
  getApiErrorMessage,
  stockProductoApi,
  type Almacen,
  type Producto,
  type StockProducto,
  type StockProductoPayload,
} from "../../lib/api";
import { FormField, inputCls, SectionCard, selectCls, StatusBadge } from "./primitives";

const emptyForm = {
  id: null as number | null,
  almacenId: "",
  productoId: "",
  cantidad: "",
  minimo: "",
  maximo: "",
};

export function AdminStockProductoSection({
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
  const [rows, setRows] = useState<StockProducto[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const almacenesActivos = useMemo(
    () => almacenes.filter((item) => (item.ALM_ESTADO ?? "ACTIVO") === "ACTIVO"),
    [almacenes],
  );

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [stockRows, almacenesRows] = await Promise.all([
        stockProductoApi.listar(),
        almacenesApi.listar(),
      ]);
      setRows(stockRows);
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

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const almacenId = Number(form.almacenId);
    const productoId = Number(form.productoId);
    const cantidad = Number(form.cantidad);
    const minimo = form.minimo ? Number(form.minimo) : null;
    const maximo = form.maximo ? Number(form.maximo) : null;

    if (!Number.isFinite(almacenId) || almacenId <= 0) {
      onError("Selecciona un almacen.");
      return;
    }
    if (!Number.isFinite(productoId) || productoId <= 0) {
      onError("Selecciona un producto.");
      return;
    }
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      onError("La cantidad debe ser numerica y no negativa.");
      return;
    }
    if (minimo != null && maximo != null && minimo > maximo) {
      onError("El stock minimo no puede ser mayor que el maximo.");
      return;
    }

    setSaving(true);
    try {
      const payload: StockProductoPayload = {
        ALM_almacen: almacenId,
        PRO_Producto: productoId,
        STP_Cantidad: cantidad,
        STP_Stock_Minimo: minimo,
        STP_Stock_Maximo: maximo,
      };
      if (form.id) {
        await stockProductoApi.actualizar(form.id, payload);
        onNotice("Stock de producto actualizado correctamente.");
      } else {
        await stockProductoApi.crear(payload);
        onNotice("Stock de producto creado correctamente.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row: StockProducto) => {
    setForm({
      id: row.STP_STOCK_PRODUCTO,
      almacenId: String(row.ALM_ALMACEN),
      productoId: String(row.PRO_PRODUCTO),
      cantidad: String(row.STP_CANTIDAD),
      minimo:
        row.STP_STOCK_MINIMO != null ? String(row.STP_STOCK_MINIMO) : "",
      maximo:
        row.STP_STOCK_MAXIMO != null ? String(row.STP_STOCK_MAXIMO) : "",
    });
    setShowForm(true);
  };

  const deleteRow = async (row: StockProducto) => {
    setSaving(true);
    try {
      await stockProductoApi.eliminar(row.STP_STOCK_PRODUCTO);
      onNotice("Registro de stock eliminado correctamente.");
      await loadData();
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
            <Plus size={16} />
            Registrar stock
          </button>
        </div>
      )}

      {showForm && (
        <SectionCard
          title={form.id ? `Editar stock #${form.id}` : "Nuevo stock de producto"}
          subtitle="Control de cantidad disponible por almacen."
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <FormField label="Almacen" required>
                <select
                  className={selectCls}
                  value={form.almacenId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, almacenId: event.target.value }))
                  }
                >
                  <option value="">Selecciona</option>
                  {almacenesActivos.map((almacen) => (
                    <option key={almacen.ALM_ALMACEN} value={almacen.ALM_ALMACEN}>
                      {almacen.ALM_NOMBRE}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Producto" required>
                <select
                  className={selectCls}
                  value={form.productoId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, productoId: event.target.value }))
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
              <FormField label="Cantidad" required>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.cantidad}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cantidad: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Stock minimo">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.minimo}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, minimo: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Stock maximo">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.maximo}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, maximo: event.target.value }))
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
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Guardar stock"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Stock por almacen" subtitle="Cantidad real disponible del producto terminado.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Almacen</th>
                <th className="px-5 py-3">Disponible</th>
                <th className="px-5 py-3">Min.</th>
                <th className="px-5 py-3">Max.</th>
                <th className="px-5 py-3">Actualizacion</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-gray-400">
                    No hay stock de producto registrado.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.STP_STOCK_PRODUCTO} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.STP_STOCK_PRODUCTO}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{row.PRO_NOMBRE ?? `Producto #${row.PRO_PRODUCTO}`}</p>
                    <p className="text-xs text-gray-500">{row.PRO_CODIGO ?? "Sin codigo"}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{row.ALM_NOMBRE ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.STP_CANTIDAD}</span>
                      {row.STOCK_BAJO === 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle size={12} />
                          Bajo minimo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{row.STP_STOCK_MINIMO ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{row.STP_STOCK_MAXIMO ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDate(row.STP_ULTIMA_ACTUALIZACION ?? undefined)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge estado={row.PRO_ESTADO ?? row.ALM_ESTADO} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => editRow(row)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void deleteRow(row)}
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
  );
}
