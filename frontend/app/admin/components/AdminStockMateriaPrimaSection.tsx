"use client";

import { AlertTriangle, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  formatDate,
  getApiErrorMessage,
  materiasPrimasApi,
  stockMateriaPrimaApi,
  type MateriaPrima,
  type StockMateriaPrima,
  type StockMateriaPrimaPayload,
} from "../../lib/api";
import { FormField, inputCls, SectionCard } from "./primitives";

const emptyForm = {
  id: null as number | null,
  materiaPrimaId: "",
  cantidad: "",
  minimo: "",
  maximo: "",
};

export function AdminStockMateriaPrimaSection({
  active,
  refreshKey,
  onNotice,
  onError,
}: {
  active: boolean;
  refreshKey: number;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [rows, setRows] = useState<StockMateriaPrima[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [stockRows, materiasRows] = await Promise.all([
        stockMateriaPrimaApi.listar(),
        materiasPrimasApi.listar(),
      ]);
      setRows(stockRows);
      setMateriasPrimas(materiasRows);
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

    const materiaPrimaId = Number(form.materiaPrimaId);
    const cantidad = Number(form.cantidad);
    const minimo = form.minimo ? Number(form.minimo) : null;
    const maximo = form.maximo ? Number(form.maximo) : null;

    if (!Number.isFinite(materiaPrimaId) || materiaPrimaId <= 0) {
      onError("Selecciona una materia prima.");
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
      const payload: StockMateriaPrimaPayload = {
        MAP_Materia_Prima: materiaPrimaId,
        SMP_Cantidad: cantidad,
        SMP_Stock_Minimo: minimo,
        SMP_Stock_Maximo: maximo,
      };
      if (form.id) {
        await stockMateriaPrimaApi.actualizar(form.id, payload);
        onNotice("Stock de materia prima actualizado correctamente.");
      } else {
        await stockMateriaPrimaApi.crear(payload);
        onNotice("Stock de materia prima creado correctamente.");
      }
      resetForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row: StockMateriaPrima) => {
    setForm({
      id: row.SMP_STOCK_MAT_PRIMA,
      materiaPrimaId: String(row.MAP_MATERIA_PRIMA),
      cantidad: String(row.SMP_CANTIDAD),
      minimo:
        row.SMP_STOCK_MINIMO != null ? String(row.SMP_STOCK_MINIMO) : "",
      maximo:
        row.SMP_STOCK_MAXIMO != null ? String(row.SMP_STOCK_MAXIMO) : "",
    });
    setShowForm(true);
  };

  const deleteRow = async (row: StockMateriaPrima) => {
    setSaving(true);
    try {
      await stockMateriaPrimaApi.eliminar(row.SMP_STOCK_MAT_PRIMA);
      onNotice("Registro de stock de materia prima eliminado correctamente.");
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
          title={form.id ? `Editar stock #${form.id}` : "Nuevo stock de materia prima"}
          subtitle="Cantidades disponibles de insumos para produccion."
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Materia prima" required>
                <select
                  className={inputCls}
                  value={form.materiaPrimaId}
                  onChange={(event) =>
                    setForm((current) => ({
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

      <SectionCard title="Stock de materia prima" subtitle="Alertas visuales cuando un insumo cae bajo el minimo.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Materia prima</th>
                <th className="px-5 py-3">Cantidad</th>
                <th className="px-5 py-3">Min.</th>
                <th className="px-5 py-3">Max.</th>
                <th className="px-5 py-3">Actualizacion</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                    No hay stock de materia prima registrado.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.SMP_STOCK_MAT_PRIMA} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.SMP_STOCK_MAT_PRIMA}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{row.MAP_NOMBRE ?? `Materia #${row.MAP_MATERIA_PRIMA}`}</p>
                    <p className="text-xs text-gray-500">{row.MAP_UNIDAD_MEDIDA ?? "Sin unidad"}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.SMP_CANTIDAD}</span>
                      {row.STOCK_BAJO === 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle size={12} />
                          Bajo minimo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{row.SMP_STOCK_MINIMO ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{row.SMP_STOCK_MAXIMO ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {formatDate(row.SMP_ULTIMA_ACTUALIZACION ?? undefined)}
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
