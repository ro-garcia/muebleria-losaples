"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  formatCurrency,
  getApiErrorMessage,
  materiasPrimasApi,
  type MateriaPrima,
  type MateriaPrimaPayload,
} from "../../lib/api";
import { FormField, inputCls, SectionCard, StatusBadge } from "./primitives";

const emptyForm = {
  id: null as number | null,
  nombre: "",
  unidad: "",
  costo: "",
  estado: "ACTIVO",
};

const optionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed || null;
};

export function AdminMateriaPrimaSection({
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
  const [rows, setRows] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      setRows(await materiasPrimasApi.listar());
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

    if (!form.nombre.trim()) {
      onError("El nombre de la materia prima es obligatorio.");
      return;
    }

    const costo = form.costo ? Number(form.costo) : null;
    if (costo != null && (!Number.isFinite(costo) || costo < 0)) {
      onError("El costo referencial debe ser un numero valido.");
      return;
    }

    setSaving(true);
    try {
      const payload: MateriaPrimaPayload = {
        MAP_Nombre: form.nombre.trim(),
        MAP_Unidad_Medida: optionalText(form.unidad),
        MAP_Costo_Referencial: costo,
        MAP_Estado: form.estado,
      };

      if (form.id) {
        await materiasPrimasApi.actualizar(form.id, payload);
        onNotice("Materia prima actualizada correctamente.");
      } else {
        await materiasPrimasApi.crear(payload);
        onNotice("Materia prima creada correctamente.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row: MateriaPrima) => {
    setForm({
      id: row.MAP_MATERIA_PRIMA,
      nombre: row.MAP_NOMBRE,
      unidad: row.MAP_UNIDAD_MEDIDA ?? "",
      costo:
        row.MAP_COSTO_REFERENCIAL != null
          ? String(row.MAP_COSTO_REFERENCIAL)
          : "",
      estado: row.MAP_ESTADO ?? "ACTIVO",
    });
    setShowForm(true);
  };

  const toggleEstado = async (row: MateriaPrima) => {
    setSaving(true);
    try {
      const nextEstado = row.MAP_ESTADO === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await materiasPrimasApi.cambiarEstado(row.MAP_MATERIA_PRIMA, nextEstado);
      onNotice(
        `Materia prima ${nextEstado === "ACTIVO" ? "activada" : "inactivada"} correctamente.`,
      );
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
            Agregar materia prima
          </button>
        </div>
      )}

      {showForm && (
        <SectionCard
          title={form.id ? `Editar materia prima #${form.id}` : "Nueva materia prima"}
          subtitle="Insumos reales que se consumen durante la produccion."
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Nombre" required>
                <input
                  className={inputCls}
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Unidad de medida">
                <input
                  className={inputCls}
                  value={form.unidad}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unidad: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Costo referencial">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputCls}
                  value={form.costo}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, costo: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Estado">
                <select
                  className={inputCls}
                  value={form.estado}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, estado: event.target.value }))
                  }
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
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
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear materia prima"}
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

      <SectionCard title="Materias primas" subtitle="Catalogo de insumos para fabricar muebles.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Unidad</th>
                <th className="px-5 py-3">Costo ref.</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No hay materias primas registradas.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.MAP_MATERIA_PRIMA} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.MAP_MATERIA_PRIMA}
                  </td>
                  <td className="px-5 py-3 font-medium">{row.MAP_NOMBRE}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {row.MAP_UNIDAD_MEDIDA ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {row.MAP_COSTO_REFERENCIAL != null
                      ? formatCurrency(row.MAP_COSTO_REFERENCIAL)
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge estado={row.MAP_ESTADO} />
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
                        onClick={() => void toggleEstado(row)}
                        className="text-sm font-medium text-gray-500 hover:underline disabled:opacity-50"
                      >
                        {row.MAP_ESTADO === "ACTIVO" ? "Inactivar" : "Activar"}
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
