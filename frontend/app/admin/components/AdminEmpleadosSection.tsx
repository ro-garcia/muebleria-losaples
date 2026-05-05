"use client";

import { Eye, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  empleadosApi,
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  type CargoPayload,
  type DepartamentoLaboralPayload,
  type Empleado,
  type EmpleadoCatalogoItem,
  type EmpleadoDetalleResponse,
  type EmpleadoPayload,
  type PuestoPayload,
} from "../../lib/api";
import { FormField, inputCls, SectionCard, selectCls, StatusBadge } from "./primitives";

type Submodule = "empleados" | "cargos" | "puestos" | "departamentos";

interface EmpleadoFormState {
  id: number | null;
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
  EMP_Tipo_Contrato: string;
  EMP_Estado: "ACTIVO" | "INACTIVO";
  CAR_Cargo: string;
  PUE_Puesto: string;
  DEP_Departamento: string;
  DEM_Fecha_Inicio: string;
  DEM_Fecha_Fin: string;
  DEM_Salario: string;
  DEM_Estado: "ACTIVO" | "INACTIVO";
}

interface CargoFormState {
  id: number | null;
  nombre: string;
}

interface CatalogFormState {
  id: number | null;
  nombre: string;
  estado: "ACTIVO" | "INACTIVO";
}

const emptyEmpleadoForm: EmpleadoFormState = {
  id: null,
  PER_Tipo_Documento: "",
  PER_Nombre: "",
  PER_Primer_Apellido: "",
  PER_Segundo_Apellido: "",
  PER_Correo: "",
  PER_Telefono: "",
  PER_Pais: "Guatemala",
  PER_Departamento: "",
  PER_Municipio: "",
  PER_Zona_Aldea: "",
  PER_Domicilio: "",
  EMP_Tipo_Contrato: "INDEFINIDO",
  EMP_Estado: "ACTIVO",
  CAR_Cargo: "",
  PUE_Puesto: "",
  DEP_Departamento: "",
  DEM_Fecha_Inicio: "",
  DEM_Fecha_Fin: "",
  DEM_Salario: "",
  DEM_Estado: "ACTIVO",
};

const emptyCargoForm: CargoFormState = {
  id: null,
  nombre: "",
};

const emptyCatalogForm: CatalogFormState = {
  id: null,
  nombre: "",
  estado: "ACTIVO",
};

const optionalText = (value: string) => {
  const text = value.trim();
  return text.length > 0 ? text : null;
};

const joinValues = (...values: Array<string | null | undefined>) =>
  values.map((value) => String(value ?? "").trim()).filter(Boolean).join(" ");

const toEmpleadoFormState = (data: EmpleadoDetalleResponse): EmpleadoFormState => {
  const empleado = data.empleado;
  const detalle = data.detalles[0];

  return {
    id: empleado.EMP_EMPLEADO,
    PER_Tipo_Documento: String(empleado.PER_TIPO_DOCUMENTO ?? ""),
    PER_Nombre: String(empleado.PER_NOMBRE ?? ""),
    PER_Primer_Apellido: String(empleado.PER_PRIMER_APELLIDO ?? ""),
    PER_Segundo_Apellido: String(empleado.PER_SEGUNDO_APELLIDO ?? ""),
    PER_Correo: String(empleado.PER_CORREO ?? ""),
    PER_Telefono: String(empleado.PER_TELEFONO ?? ""),
    PER_Pais: String(empleado.PER_PAIS ?? "Guatemala"),
    PER_Departamento: String(empleado.PER_DEPARTAMENTO ?? ""),
    PER_Municipio: String(empleado.PER_MUNICIPIO ?? ""),
    PER_Zona_Aldea: String(empleado.PER_ZONA_ALDEA ?? ""),
    PER_Domicilio: String(empleado.PER_DOMICILIO ?? ""),
    EMP_Tipo_Contrato: String(empleado.EMP_TIPO_CONTRATO ?? "INDEFINIDO"),
    EMP_Estado: empleado.EMP_ESTADO === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    CAR_Cargo: detalle?.CAR_CARGO ? String(detalle.CAR_CARGO) : "",
    PUE_Puesto: detalle?.PUE_PUESTO ? String(detalle.PUE_PUESTO) : "",
    DEP_Departamento: detalle?.DEP_DEPARTAMENTO
      ? String(detalle.DEP_DEPARTAMENTO)
      : "",
    DEM_Fecha_Inicio: detalle?.DEM_FECHA_INICIO
      ? String(detalle.DEM_FECHA_INICIO).slice(0, 10)
      : "",
    DEM_Fecha_Fin: detalle?.DEM_FECHA_FIN
      ? String(detalle.DEM_FECHA_FIN).slice(0, 10)
      : "",
    DEM_Salario:
      detalle?.DEM_SALARIO != null ? String(detalle.DEM_SALARIO) : "",
    DEM_Estado: detalle?.DEM_ESTADO === "INACTIVO" ? "INACTIVO" : "ACTIVO",
  };
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
        className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
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
        <div className="max-h-[82vh] overflow-y-auto p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

function SubmoduleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-black text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function AdminEmpleadosSection({
  active,
  onNotice,
  onError,
}: {
  active: boolean;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [submodule, setSubmodule] = useState<Submodule>("empleados");
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargos, setCargos] = useState<EmpleadoCatalogoItem[]>([]);
  const [puestos, setPuestos] = useState<EmpleadoCatalogoItem[]>([]);
  const [puestosActivos, setPuestosActivos] = useState<EmpleadoCatalogoItem[]>([]);
  const [departamentos, setDepartamentos] = useState<EmpleadoCatalogoItem[]>([]);
  const [departamentosActivos, setDepartamentosActivos] = useState<
    EmpleadoCatalogoItem[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false);

  const [showEmpleadoForm, setShowEmpleadoForm] = useState(false);
  const [empleadoFormMode, setEmpleadoFormMode] = useState<"create" | "edit">(
    "create",
  );
  const [empleadoForm, setEmpleadoForm] =
    useState<EmpleadoFormState>(emptyEmpleadoForm);

  const [showCargoForm, setShowCargoForm] = useState(false);
  const [cargoForm, setCargoForm] = useState<CargoFormState>(emptyCargoForm);

  const [showPuestoForm, setShowPuestoForm] = useState(false);
  const [puestoForm, setPuestoForm] = useState<CatalogFormState>(emptyCatalogForm);

  const [showDepartamentoForm, setShowDepartamentoForm] = useState(false);
  const [departamentoForm, setDepartamentoForm] =
    useState<CatalogFormState>(emptyCatalogForm);

  const [selectedEmpleado, setSelectedEmpleado] =
    useState<EmpleadoDetalleResponse | null>(null);
  const [showEmpleadoDetalleModal, setShowEmpleadoDetalleModal] = useState(false);

  const catalogosDisponibles =
    cargos.length > 0 &&
    puestosActivos.length > 0 &&
    departamentosActivos.length > 0;

  const empleadosActivos = useMemo(
    () =>
      empleados.filter((row) => (row.EMP_ESTADO ?? "ACTIVO") === "ACTIVO").length,
    [empleados],
  );

  const loadData = useCallback(async () => {
    if (!active) return;

    setLoading(true);
    try {
      const [
        empleadosRows,
        cargosRows,
        puestosRows,
        puestosActivosRows,
        departamentosRows,
        departamentosActivosRows,
      ] = await Promise.all([
        empleadosApi.listar(!showInactiveEmployees),
        empleadosApi.listarCargos(),
        empleadosApi.listarPuestos(false),
        empleadosApi.listarPuestos(true),
        empleadosApi.listarDepartamentos(false),
        empleadosApi.listarDepartamentos(true),
      ]);

      setEmpleados(empleadosRows);
      setCargos(cargosRows);
      setPuestos(puestosRows);
      setPuestosActivos(puestosActivosRows);
      setDepartamentos(departamentosRows);
      setDepartamentosActivos(departamentosActivosRows);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [active, onError, showInactiveEmployees]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetEmpleadoForm = () => {
    setEmpleadoForm(emptyEmpleadoForm);
    setEmpleadoFormMode("create");
    setShowEmpleadoForm(false);
  };

  const resetCargoForm = () => {
    setCargoForm(emptyCargoForm);
    setShowCargoForm(false);
  };

  const resetPuestoForm = () => {
    setPuestoForm(emptyCatalogForm);
    setShowPuestoForm(false);
  };

  const resetDepartamentoForm = () => {
    setDepartamentoForm(emptyCatalogForm);
    setShowDepartamentoForm(false);
  };

  const openCreateEmpleado = () => {
    setSubmodule("empleados");
    setSelectedEmpleado(null);
    setEmpleadoForm(emptyEmpleadoForm);
    setEmpleadoFormMode("create");
    setShowEmpleadoForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEmpleadoDetail = async (empleadoId: number) => {
    setSaving(true);
    try {
      const detail = await empleadosApi.obtener(empleadoId);
      setSelectedEmpleado(detail);
      setShowEmpleadoDetalleModal(true);
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openEditEmpleado = async (empleadoId: number) => {
    setSaving(true);
    try {
      const detail = await empleadosApi.obtener(empleadoId);
      setSelectedEmpleado(detail);
      setEmpleadoForm(toEmpleadoFormState(detail));
      setEmpleadoFormMode("edit");
      setShowEmpleadoDetalleModal(false);
      setShowEmpleadoForm(true);
      setSubmodule("empleados");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveEmpleado = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cargoId = Number(empleadoForm.CAR_Cargo);
    const puestoId = Number(empleadoForm.PUE_Puesto);
    const departamentoId = Number(empleadoForm.DEP_Departamento);
    const salario = Number(empleadoForm.DEM_Salario);

    if (!catalogosDisponibles) {
      onError(
        "No hay cargos, puestos o departamentos activos para registrar empleados.",
      );
      return;
    }

    if (!empleadoForm.PER_Tipo_Documento.trim()) {
      onError("El tipo de documento es obligatorio.");
      return;
    }
    if (!empleadoForm.PER_Nombre.trim()) {
      onError("El nombre es obligatorio.");
      return;
    }
    if (!empleadoForm.PER_Primer_Apellido.trim()) {
      onError("El primer apellido es obligatorio.");
      return;
    }
    if (!empleadoForm.EMP_Tipo_Contrato.trim()) {
      onError("El tipo de contrato es obligatorio.");
      return;
    }
    if (!Number.isFinite(cargoId) || cargoId <= 0) {
      onError("Selecciona un cargo valido.");
      return;
    }
    if (!Number.isFinite(puestoId) || puestoId <= 0) {
      onError("Selecciona un puesto valido.");
      return;
    }
    if (!Number.isFinite(departamentoId) || departamentoId <= 0) {
      onError("Selecciona un departamento laboral valido.");
      return;
    }
    if (!empleadoForm.DEM_Fecha_Inicio) {
      onError("La fecha de inicio es obligatoria.");
      return;
    }
    if (!Number.isFinite(salario) || salario < 0) {
      onError("El salario debe ser un numero valido mayor o igual a 0.");
      return;
    }

    const payload: EmpleadoPayload = {
      PER_Tipo_Documento: empleadoForm.PER_Tipo_Documento.trim(),
      PER_Nombre: empleadoForm.PER_Nombre.trim(),
      PER_Primer_Apellido: empleadoForm.PER_Primer_Apellido.trim(),
      PER_Segundo_Apellido: optionalText(empleadoForm.PER_Segundo_Apellido),
      PER_Correo: optionalText(empleadoForm.PER_Correo),
      PER_Telefono: optionalText(empleadoForm.PER_Telefono),
      PER_Pais: optionalText(empleadoForm.PER_Pais),
      PER_Departamento: optionalText(empleadoForm.PER_Departamento),
      PER_Municipio: optionalText(empleadoForm.PER_Municipio),
      PER_Zona_Aldea: optionalText(empleadoForm.PER_Zona_Aldea),
      PER_Domicilio: optionalText(empleadoForm.PER_Domicilio),
      EMP_Tipo_Contrato: empleadoForm.EMP_Tipo_Contrato.trim(),
      EMP_Estado: empleadoForm.EMP_Estado,
      CAR_Cargo: cargoId,
      PUE_Puesto: puestoId,
      DEP_Departamento: departamentoId,
      DEM_Fecha_Inicio: empleadoForm.DEM_Fecha_Inicio,
      DEM_Fecha_Fin: optionalText(empleadoForm.DEM_Fecha_Fin),
      DEM_Salario: salario,
      DEM_Estado: empleadoForm.DEM_Estado,
    };

    setSaving(true);
    try {
      const saved = empleadoForm.id
        ? await empleadosApi.actualizar(empleadoForm.id, payload)
        : await empleadosApi.crear(payload);

      onNotice(
        empleadoForm.id
          ? "Empleado actualizado correctamente."
          : "Empleado creado correctamente.",
      );
      setSelectedEmpleado(saved);
      resetEmpleadoForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const inactivarEmpleado = async (row: Empleado) => {
    if (!window.confirm(`Deseas inactivar al empleado #${row.EMP_EMPLEADO}?`)) {
      return;
    }

    setSaving(true);
    try {
      await empleadosApi.eliminar(row.EMP_EMPLEADO);
      if (selectedEmpleado?.empleado.EMP_EMPLEADO === row.EMP_EMPLEADO) {
        setSelectedEmpleado(null);
        setShowEmpleadoDetalleModal(false);
      }
      onNotice("Empleado inactivado correctamente.");
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveCargo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cargoForm.nombre.trim()) {
      onError("El nombre del cargo es obligatorio.");
      return;
    }

    const payload: CargoPayload = {
      CAR_Nombre: cargoForm.nombre.trim(),
    };

    setSaving(true);
    try {
      if (cargoForm.id) {
        await empleadosApi.actualizarCargo(cargoForm.id, payload);
        onNotice("Cargo actualizado correctamente.");
      } else {
        await empleadosApi.crearCargo(payload);
        onNotice("Cargo creado correctamente.");
      }

      resetCargoForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteCargo = async (row: EmpleadoCatalogoItem) => {
    if (!window.confirm(`Deseas eliminar el cargo "${row.nombre}"?`)) {
      return;
    }

    setSaving(true);
    try {
      await empleadosApi.eliminarCargo(row.id);
      onNotice("Cargo eliminado correctamente.");
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const savePuesto = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!puestoForm.nombre.trim()) {
      onError("El nombre del puesto es obligatorio.");
      return;
    }

    const payload: PuestoPayload = {
      PUE_Nombre: puestoForm.nombre.trim(),
      PUE_Estado: puestoForm.estado,
    };

    setSaving(true);
    try {
      if (puestoForm.id) {
        await empleadosApi.actualizarPuesto(puestoForm.id, payload);
        onNotice("Puesto actualizado correctamente.");
      } else {
        await empleadosApi.crearPuesto(payload);
        onNotice("Puesto creado correctamente.");
      }

      resetPuestoForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const togglePuesto = async (row: EmpleadoCatalogoItem) => {
    const nextEstado = row.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    setSaving(true);
    try {
      await empleadosApi.cambiarEstadoPuesto(row.id, nextEstado);
      onNotice(
        `Puesto ${nextEstado === "ACTIVO" ? "activado" : "inactivado"} correctamente.`,
      );
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveDepartamento = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!departamentoForm.nombre.trim()) {
      onError("El nombre del departamento es obligatorio.");
      return;
    }

    const payload: DepartamentoLaboralPayload = {
      DEP_Nombre: departamentoForm.nombre.trim(),
      DEP_Estado: departamentoForm.estado,
    };

    setSaving(true);
    try {
      if (departamentoForm.id) {
        await empleadosApi.actualizarDepartamento(departamentoForm.id, payload);
        onNotice("Departamento actualizado correctamente.");
      } else {
        await empleadosApi.crearDepartamento(payload);
        onNotice("Departamento creado correctamente.");
      }

      resetDepartamentoForm();
      await loadData();
    } catch (error) {
      onError(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleDepartamento = async (row: EmpleadoCatalogoItem) => {
    const nextEstado = row.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    setSaving(true);
    try {
      await empleadosApi.cambiarEstadoDepartamento(row.id, nextEstado);
      onNotice(
        `Departamento ${nextEstado === "ACTIVO" ? "activado" : "inactivado"} correctamente.`,
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
      <div className="flex flex-wrap gap-2">
        <SubmoduleButton
          active={submodule === "empleados"}
          label="Empleados"
          onClick={() => setSubmodule("empleados")}
        />
        <SubmoduleButton
          active={submodule === "cargos"}
          label="Cargos"
          onClick={() => setSubmodule("cargos")}
        />
        <SubmoduleButton
          active={submodule === "puestos"}
          label="Puestos"
          onClick={() => setSubmodule("puestos")}
        />
        <SubmoduleButton
          active={submodule === "departamentos"}
          label="Departamentos"
          onClick={() => setSubmodule("departamentos")}
        />
      </div>

      {submodule === "empleados" && (
        <>
          {!showEmpleadoForm && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={openCreateEmpleado}
                disabled={!catalogosDisponibles}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Nuevo empleado
              </button>
            </div>
          )}

          {showEmpleadoForm && (
            <SectionCard
              title={
                empleadoFormMode === "edit" ? "Editar empleado" : "Nuevo empleado"
              }
              subtitle="Completa los datos personales y laborales usando catalogos vigentes."
            >
              <form
                onSubmit={(event) => void saveEmpleado(event)}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormField label="Tipo de documento" required>
                    <input
                      value={empleadoForm.PER_Tipo_Documento}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Tipo_Documento: event.target.value,
                        }))
                      }
                      className={inputCls}
                      placeholder="DPI"
                    />
                  </FormField>
                  <FormField label="Nombre" required>
                    <input
                      value={empleadoForm.PER_Nombre}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Nombre: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Primer apellido" required>
                    <input
                      value={empleadoForm.PER_Primer_Apellido}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Primer_Apellido: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Segundo apellido">
                    <input
                      value={empleadoForm.PER_Segundo_Apellido}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
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
                      value={empleadoForm.PER_Correo}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Correo: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Telefono">
                    <input
                      value={empleadoForm.PER_Telefono}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Telefono: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Pais">
                    <input
                      value={empleadoForm.PER_Pais}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Pais: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Departamento personal">
                    <input
                      value={empleadoForm.PER_Departamento}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Departamento: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Municipio">
                    <input
                      value={empleadoForm.PER_Municipio}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Municipio: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Zona / Aldea">
                    <input
                      value={empleadoForm.PER_Zona_Aldea}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Zona_Aldea: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Domicilio">
                    <input
                      value={empleadoForm.PER_Domicilio}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PER_Domicilio: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Tipo de contrato" required>
                    <input
                      value={empleadoForm.EMP_Tipo_Contrato}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          EMP_Tipo_Contrato: event.target.value,
                        }))
                      }
                      className={inputCls}
                      placeholder="INDEFINIDO"
                    />
                  </FormField>
                  <FormField label="Cargo" required>
                    <select
                      value={empleadoForm.CAR_Cargo}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          CAR_Cargo: event.target.value,
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="">Selecciona un cargo</option>
                      {cargos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Puesto" required>
                    <select
                      value={empleadoForm.PUE_Puesto}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          PUE_Puesto: event.target.value,
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="">Selecciona un puesto</option>
                      {puestosActivos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Departamento laboral" required>
                    <select
                      value={empleadoForm.DEP_Departamento}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          DEP_Departamento: event.target.value,
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="">Selecciona un departamento</option>
                      {departamentosActivos.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Fecha de inicio" required>
                    <input
                      type="date"
                      value={empleadoForm.DEM_Fecha_Inicio}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          DEM_Fecha_Inicio: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Fecha fin">
                    <input
                      type="date"
                      value={empleadoForm.DEM_Fecha_Fin}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          DEM_Fecha_Fin: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Salario" required>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={empleadoForm.DEM_Salario}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          DEM_Salario: event.target.value,
                        }))
                      }
                      className={inputCls}
                    />
                  </FormField>
                  <FormField label="Estado empleado" required>
                    <select
                      value={empleadoForm.EMP_Estado}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          EMP_Estado: event.target.value as "ACTIVO" | "INACTIVO",
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>
                  <FormField label="Estado detalle" required>
                    <select
                      value={empleadoForm.DEM_Estado}
                      onChange={(event) =>
                        setEmpleadoForm((current) => ({
                          ...current,
                          DEM_Estado: event.target.value as "ACTIVO" | "INACTIVO",
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetEmpleadoForm}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !catalogosDisponibles}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} />
                    {empleadoFormMode === "edit"
                      ? "Guardar cambios"
                      : "Crear empleado"}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard
            title="Empleados registrados"
            subtitle="Administra la ficha personal y laboral del equipo."
            actions={
              <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={showInactiveEmployees}
                  onChange={(event) =>
                    setShowInactiveEmployees(event.target.checked)
                  }
                />
                Mostrar inactivos
              </label>
            }
          >
            <div className="space-y-4">
              {!catalogosDisponibles && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Aun no hay cargos, puestos o departamentos activos. Puedes
                  crearlos desde los submodulos de este mismo apartado.
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Total visible
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {empleados.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Activos
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {empleadosActivos}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Catalogos listos
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {catalogosDisponibles ? "Si" : "Pendiente"}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[1120px] text-sm">
                  <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3">ID</th>
                      <th className="px-5 py-3">Empleado</th>
                      <th className="px-5 py-3">Documento</th>
                      <th className="px-5 py-3">Contacto</th>
                      <th className="px-5 py-3">Cargo / Puesto</th>
                      <th className="px-5 py-3">Contrato</th>
                      <th className="px-5 py-3">Salario</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!loading && empleados.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-5 py-8 text-center text-gray-400"
                        >
                          No hay empleados registrados para el filtro actual.
                        </td>
                      </tr>
                    )}
                    {empleados.map((row) => (
                      <tr key={row.EMP_EMPLEADO} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">
                          #{row.EMP_EMPLEADO}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">
                            {joinValues(
                              row.PER_NOMBRE,
                              row.PER_PRIMER_APELLIDO,
                              row.PER_SEGUNDO_APELLIDO,
                            ) || "Sin nombre"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Persona #{row.PER_PERSONA ?? "-"}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {row.PER_TIPO_DOCUMENTO ?? "-"}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          <p>{row.PER_CORREO ?? "Sin correo"}</p>
                          <p className="text-xs text-gray-500">
                            {row.PER_TELEFONO ?? "-"}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          <p>{row.CAR_NOMBRE ?? "Sin cargo"}</p>
                          <p className="text-xs text-gray-500">
                            {joinValues(row.PUE_NOMBRE, row.DEP_NOMBRE) ||
                              "Sin detalle laboral"}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {row.EMP_TIPO_CONTRATO ?? "-"}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {formatCurrency(row.DEM_SALARIO)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-2">
                            <StatusBadge estado={row.EMP_ESTADO} />
                            {row.DEM_ESTADO && (
                              <StatusBadge estado={row.DEM_ESTADO} />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void openEmpleadoDetail(row.EMP_EMPLEADO)}
                              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                            >
                              <Eye size={14} />
                              Ver detalle
                            </button>
                            <button
                              type="button"
                              onClick={() => void openEditEmpleado(row.EMP_EMPLEADO)}
                              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={(row.EMP_ESTADO ?? "ACTIVO") !== "ACTIVO"}
                              onClick={() => void inactivarEmpleado(row)}
                              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Inactivar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </>
      )}

      {submodule === "cargos" && (
        <>
          {!showCargoForm && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCargoForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <Plus size={16} />
                Nuevo cargo
              </button>
            </div>
          )}

          {showCargoForm && (
            <SectionCard
              title={cargoForm.id ? "Editar cargo" : "Nuevo cargo"}
              subtitle="Catalogo laboral para clasificar el rol del empleado."
            >
              <form onSubmit={(event) => void saveCargo(event)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Nombre del cargo" required>
                    <input
                      className={inputCls}
                      value={cargoForm.nombre}
                      onChange={(event) =>
                        setCargoForm((current) => ({
                          ...current,
                          nombre: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetCargoForm}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {cargoForm.id ? "Guardar cambios" : "Crear cargo"}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard
            title="Cargos registrados"
            subtitle="Estos registros alimentan el formulario principal de empleados."
          >
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!loading && cargos.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                        No hay cargos registrados.
                      </td>
                    </tr>
                  )}
                  {cargos.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">
                        #{row.id}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{row.nombre}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCargoForm({ id: row.id, nombre: row.nombre });
                              setShowCargoForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCargo(row)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
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
        </>
      )}

      {submodule === "puestos" && (
        <>
          {!showPuestoForm && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPuestoForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <Plus size={16} />
                Nuevo puesto
              </button>
            </div>
          )}

          {showPuestoForm && (
            <SectionCard
              title={puestoForm.id ? "Editar puesto" : "Nuevo puesto"}
              subtitle="Catalogo de puestos con control de estado."
            >
              <form onSubmit={(event) => void savePuesto(event)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField label="Nombre del puesto" required>
                    <input
                      className={inputCls}
                      value={puestoForm.nombre}
                      onChange={(event) =>
                        setPuestoForm((current) => ({
                          ...current,
                          nombre: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Estado" required>
                    <select
                      value={puestoForm.estado}
                      onChange={(event) =>
                        setPuestoForm((current) => ({
                          ...current,
                          estado: event.target.value as "ACTIVO" | "INACTIVO",
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetPuestoForm}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {puestoForm.id ? "Guardar cambios" : "Crear puesto"}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard
            title="Puestos registrados"
            subtitle="Puedes activar o inactivar puestos sin salir del modulo."
          >
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[840px] text-sm">
                <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!loading && puestos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                        No hay puestos registrados.
                      </td>
                    </tr>
                  )}
                  {puestos.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">
                        #{row.id}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{row.nombre}</td>
                      <td className="px-5 py-3">
                        <StatusBadge estado={row.estado ?? "ACTIVO"} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPuestoForm({
                                id: row.id,
                                nombre: row.nombre,
                                estado: row.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
                              });
                              setShowPuestoForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void togglePuesto(row)}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                          >
                            {row.estado === "ACTIVO" ? "Inactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {submodule === "departamentos" && (
        <>
          {!showDepartamentoForm && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDepartamentoForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <Plus size={16} />
                Nuevo departamento
              </button>
            </div>
          )}

          {showDepartamentoForm && (
            <SectionCard
              title={
                departamentoForm.id
                  ? "Editar departamento"
                  : "Nuevo departamento"
              }
              subtitle="Catalogo de departamentos laborales con control de estado."
            >
              <form
                onSubmit={(event) => void saveDepartamento(event)}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FormField label="Nombre del departamento" required>
                    <input
                      className={inputCls}
                      value={departamentoForm.nombre}
                      onChange={(event) =>
                        setDepartamentoForm((current) => ({
                          ...current,
                          nombre: event.target.value,
                        }))
                      }
                    />
                  </FormField>
                  <FormField label="Estado" required>
                    <select
                      value={departamentoForm.estado}
                      onChange={(event) =>
                        setDepartamentoForm((current) => ({
                          ...current,
                          estado: event.target.value as "ACTIVO" | "INACTIVO",
                        }))
                      }
                      className={selectCls}
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </FormField>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetDepartamentoForm}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {departamentoForm.id
                      ? "Guardar cambios"
                      : "Crear departamento"}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard
            title="Departamentos registrados"
            subtitle="Estos registros definen el area laboral del empleado."
          >
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[840px] text-sm">
                <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!loading && departamentos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                        No hay departamentos registrados.
                      </td>
                    </tr>
                  )}
                  {departamentos.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">
                        #{row.id}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{row.nombre}</td>
                      <td className="px-5 py-3">
                        <StatusBadge estado={row.estado ?? "ACTIVO"} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDepartamentoForm({
                                id: row.id,
                                nombre: row.nombre,
                                estado: row.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
                              });
                              setShowDepartamentoForm(true);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleDepartamento(row)}
                            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                          >
                            {row.estado === "ACTIVO" ? "Inactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      <DetailModal
        open={showEmpleadoDetalleModal}
        onClose={() => {
          setShowEmpleadoDetalleModal(false);
          setSelectedEmpleado(null);
        }}
      >
        {selectedEmpleado && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <SectionCard
                title={
                  joinValues(
                    selectedEmpleado.empleado.PER_NOMBRE,
                    selectedEmpleado.empleado.PER_PRIMER_APELLIDO,
                    selectedEmpleado.empleado.PER_SEGUNDO_APELLIDO,
                  ) || `Empleado #${selectedEmpleado.empleado.EMP_EMPLEADO}`
                }
                subtitle={`Registro #${selectedEmpleado.empleado.EMP_EMPLEADO}`}
                actions={<StatusBadge estado={selectedEmpleado.empleado.EMP_ESTADO} />}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Documento
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEmpleado.empleado.PER_TIPO_DOCUMENTO ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Correo
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEmpleado.empleado.PER_CORREO ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Telefono
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEmpleado.empleado.PER_TELEFONO ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Contrato
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedEmpleado.empleado.EMP_TIPO_CONTRATO ?? "-"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Direccion
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {joinValues(
                        selectedEmpleado.empleado.PER_DOMICILIO,
                        selectedEmpleado.empleado.PER_ZONA_ALDEA,
                        selectedEmpleado.empleado.PER_MUNICIPIO,
                        selectedEmpleado.empleado.PER_DEPARTAMENTO,
                        selectedEmpleado.empleado.PER_PAIS,
                      ) || "Sin direccion registrada"}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Situacion laboral actual"
                subtitle="Resumen del detalle laboral mas reciente"
              >
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Cargo</span>
                    <span className="font-medium text-gray-900">
                      {selectedEmpleado.empleado.CAR_NOMBRE ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Puesto</span>
                    <span className="font-medium text-gray-900">
                      {selectedEmpleado.empleado.PUE_NOMBRE ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Departamento</span>
                    <span className="font-medium text-gray-900">
                      {selectedEmpleado.empleado.DEP_NOMBRE ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Inicio</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(selectedEmpleado.empleado.DEM_FECHA_INICIO ?? undefined)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Fin</span>
                    <span className="font-medium text-gray-900">
                      {selectedEmpleado.empleado.DEM_FECHA_FIN
                        ? formatDate(selectedEmpleado.empleado.DEM_FECHA_FIN)
                        : "Sin fecha fin"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Salario</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(selectedEmpleado.empleado.DEM_SALARIO)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Estado detalle</span>
                    <StatusBadge estado={selectedEmpleado.empleado.DEM_ESTADO} />
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Historial laboral"
              subtitle="Detalles laborales asociados al empleado"
              actions={
                <button
                  type="button"
                  onClick={() =>
                    void openEditEmpleado(selectedEmpleado.empleado.EMP_EMPLEADO)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-100"
                >
                  <Pencil size={14} />
                  Editar empleado
                </button>
              }
            >
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-gray-50 text-left uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Cargo</th>
                      <th className="px-4 py-3">Puesto</th>
                      <th className="px-4 py-3">Departamento</th>
                      <th className="px-4 py-3">Inicio</th>
                      <th className="px-4 py-3">Fin</th>
                      <th className="px-4 py-3">Salario</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedEmpleado.detalles.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                          No hay historial laboral disponible.
                        </td>
                      </tr>
                    )}
                    {selectedEmpleado.detalles.map((detalle) => (
                      <tr key={detalle.DEM_DETALLE_EMPLEADO}>
                        <td className="px-4 py-3 text-gray-700">
                          {detalle.CAR_NOMBRE ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {detalle.PUE_NOMBRE ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {detalle.DEP_NOMBRE ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(detalle.DEM_FECHA_INICIO ?? undefined)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {detalle.DEM_FECHA_FIN
                            ? formatDate(detalle.DEM_FECHA_FIN)
                            : "Sin fecha fin"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatCurrency(detalle.DEM_SALARIO)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge estado={detalle.DEM_ESTADO} />
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
