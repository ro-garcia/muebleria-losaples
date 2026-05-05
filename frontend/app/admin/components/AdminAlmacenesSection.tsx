"use client";

import { Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  almacenesApi,
  getApiErrorMessage,
  type Almacen,
  type AlmacenPayload,
} from "../../lib/api";
import { FormField, inputCls, SectionCard, StatusBadge } from "./primitives";

const emptyForm = {
  id: null as number | null,
  nombre: "",
  departamento: "",
  municipio: "",
  zona: "",
  domicilio: "",
  telefono: "",
  estado: "ACTIVO",
};

const optionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed || null;
};

export function AdminAlmacenesSection({
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
  const [rows, setRows] = useState<Almacen[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      setRows(await almacenesApi.listar());
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
      onError("El nombre del almacen es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload: AlmacenPayload = {
        ALM_Nombre: form.nombre.trim(),
        ALM_Departamento: optionalText(form.departamento),
        ALM_Municipio: optionalText(form.municipio),
        ALM_Zona_Aldea: optionalText(form.zona),
        ALM_Domicilio: optionalText(form.domicilio),
        ALM_Telefono: optionalText(form.telefono),
        ALM_Estado: form.estado,
      };

      if (form.id) {
        await almacenesApi.actualizar(form.id, payload);
        onNotice("Almacen actualizado correctamente.");
      } else {
        await almacenesApi.crear(payload);
        onNotice("Almacen creado correctamente.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const editRow = (row: Almacen) => {
    setForm({
      id: row.ALM_ALMACEN,
      nombre: row.ALM_NOMBRE,
      departamento: row.ALM_DEPARTAMENTO ?? "",
      municipio: row.ALM_MUNICIPIO ?? "",
      zona: row.ALM_ZONA_ALDEA ?? "",
      domicilio: row.ALM_DOMICILIO ?? "",
      telefono: row.ALM_TELEFONO ?? "",
      estado: row.ALM_ESTADO ?? "ACTIVO",
    });
    setShowForm(true);
  };

  const toggleEstado = async (row: Almacen) => {
    setSaving(true);
    try {
      const nextEstado = row.ALM_ESTADO === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await almacenesApi.cambiarEstado(row.ALM_ALMACEN, nextEstado);
      onNotice(`Almacen ${nextEstado === "ACTIVO" ? "activado" : "inactivado"} correctamente.`);
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
            Agregar almacen
          </button>
        </div>
      )}

      {showForm && (
        <SectionCard
          title={form.id ? `Editar almacen #${form.id}` : "Nuevo almacen"}
          subtitle="Ubicaciones fisicas donde se guarda el producto terminado."
        >
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FormField label="Nombre" required>
                <input
                  className={inputCls}
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Departamento">
                <input
                  className={inputCls}
                  value={form.departamento}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      departamento: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Municipio">
                <input
                  className={inputCls}
                  value={form.municipio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, municipio: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Zona / Aldea">
                <input
                  className={inputCls}
                  value={form.zona}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, zona: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Domicilio">
                <input
                  className={inputCls}
                  value={form.domicilio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, domicilio: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Telefono">
                <input
                  className={inputCls}
                  value={form.telefono}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, telefono: event.target.value }))
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
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear almacen"}
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

      <SectionCard title="Almacenes registrados" subtitle="Estado y ubicacion de cada almacen.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Ubicacion</th>
                <th className="px-5 py-3">Telefono</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                    No hay almacenes registrados.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.ALM_ALMACEN} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">
                    {row.ALM_ALMACEN}
                  </td>
                  <td className="px-5 py-3 font-medium">{row.ALM_NOMBRE}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {[row.ALM_ZONA_ALDEA, row.ALM_MUNICIPIO, row.ALM_DEPARTAMENTO]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicacion"}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {row.ALM_TELEFONO ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge estado={row.ALM_ESTADO} />
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
                        {row.ALM_ESTADO === "ACTIVO" ? "Inactivar" : "Activar"}
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
