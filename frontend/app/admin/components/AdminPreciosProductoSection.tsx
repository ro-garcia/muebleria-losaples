"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  preciosProductoApi,
  type PrecioProducto,
  type PrecioProductoPayload,
  type Producto,
} from "../../lib/api";
import { FormField, inputCls, SectionCard, selectCls, StatusBadge } from "./primitives";

const emptyForm = {
  id: null as number | null,
  productoId: "",
  precio: "",
  fechaInicio: "",
  fechaFin: "",
};

export function AdminPreciosProductoSection({
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
  const [rows, setRows] = useState<PrecioProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      setRows(await preciosProductoApi.listar());
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
    const productoId = Number(form.productoId);
    const precio = Number(form.precio);

    if (!Number.isFinite(productoId) || productoId <= 0) {
      onError("Selecciona un producto.");
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      onError("El precio debe ser un numero valido.");
      return;
    }
    if (!form.fechaInicio) {
      onError("La fecha de inicio es obligatoria.");
      return;
    }
    if (form.fechaFin && form.fechaFin < form.fechaInicio) {
      onError("La fecha fin no puede ser anterior a la fecha de inicio.");
      return;
    }

    setSaving(true);
    try {
      const payload: PrecioProductoPayload = {
        PRO_Producto: productoId,
        PRE_Precio: precio,
        PRE_Fecha_Inicio: form.fechaInicio,
        PRE_Fecha_Fin: form.fechaFin || null,
      };
      if (form.id) {
        await preciosProductoApi.actualizar(form.id, payload);
        onNotice("Precio actualizado correctamente.");
      } else {
        await preciosProductoApi.crear(payload);
        onNotice("Precio registrado correctamente.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row: PrecioProducto) => {
    setForm({
      id: row.PRE_PRECIO_PRODUCTO,
      productoId: String(row.PRO_PRODUCTO),
      precio: String(row.PRE_PRECIO),
      fechaInicio: String(row.PRE_FECHA_INICIO).slice(0, 10),
      fechaFin: row.PRE_FECHA_FIN ? String(row.PRE_FECHA_FIN).slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const deleteRow = async (row: PrecioProducto) => {
    setSaving(true);
    try {
      await preciosProductoApi.eliminar(row.PRE_PRECIO_PRODUCTO);
      onNotice("Precio eliminado correctamente.");
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
            Registrar precio
          </button>
        </div>
      )}

      {showForm && (
        <SectionCard
          title={form.id ? `Editar precio #${form.id}` : "Nuevo precio de producto"}
          subtitle="Historial de vigencias y precio actual del mueble."
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <FormField label="Precio" required>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputCls}
                  value={form.precio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, precio: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Fecha inicio" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.fechaInicio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fechaInicio: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Fecha fin">
                <input
                  type="date"
                  className={inputCls}
                  value={form.fechaFin}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, fechaFin: event.target.value }))
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
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Registrar precio"}
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

      <SectionCard title="Historial de precios" subtitle="Marca visual para la vigencia actual del producto.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Producto</th>
                <th className="px-5 py-3">Precio</th>
                <th className="px-5 py-3">Inicio</th>
                <th className="px-5 py-3">Fin</th>
                <th className="px-5 py-3">Vigencia</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No hay precios registrados.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.PRE_PRECIO_PRODUCTO} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.PRE_PRECIO_PRODUCTO}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{row.PRO_NOMBRE ?? `Producto #${row.PRO_PRODUCTO}`}</p>
                    <p className="text-xs text-gray-500">{row.PRO_CODIGO ?? "Sin codigo"}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {formatCurrency(row.PRE_PRECIO)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDate(row.PRE_FECHA_INICIO)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {row.PRE_FECHA_FIN ? formatDate(row.PRE_FECHA_FIN) : "Abierto"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge estado={row.ES_VIGENTE === 1 ? "ACTIVO" : "INACTIVO"} />
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
