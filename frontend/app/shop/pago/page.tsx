"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  carritoApi,
  type ClienteProfile,
  formatCurrency,
  getApiErrorMessage,
  metodosPagoApi,
  shopAuthApi,
  shopCheckoutApi,
  type Carrito,
  type MetodoPago,
} from "../../lib/api";
import { dispatchCartUpdated } from "../hooks/useCart";
import { useSession } from "../hooks/useSession";

const formatPrimaryAddress = (profile: ClienteProfile | null) =>
  [
    profile?.DIR_ZONA_ALDEA ??
      profile?.CLI_ZONA_ALDEA ??
      profile?.PER_DOMICILIO ??
      profile?.PER_ZONA_ALDEA,
    profile?.DIR_MUNICIPIO ?? profile?.CLI_MUNICIPIO ?? profile?.PER_MUNICIPIO,
    profile?.DIR_DEPARTAMENTO ??
      profile?.CLI_DEPARTAMENTO ??
      profile?.PER_DEPARTAMENTO,
    profile?.DIR_PAIS ?? profile?.CLI_PAIS ?? profile?.PER_PAIS,
  ]
    .filter(Boolean)
    .join(", ");

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatCvv = (value: string) => value.replace(/\D/g, "").slice(0, 4);

export default function Pago() {
  const router = useRouter();
  const { isAuthenticated, user } = useSession();
  const [metodoId, setMetodoId] = useState<number | null>(null);
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);
  const [perfil, setPerfil] = useState<ClienteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!isAuthenticated || !user) {
        setError("Debes iniciar sesion para continuar con el pago.");
        return;
      }
      const [carritoActual, metodosActuales, me] = await Promise.all([
        carritoApi.obtenerPorCliente(user.clienteId),
        metodosPagoApi.listar(),
        shopAuthApi.me(),
      ]);
      const metodosActivos = metodosActuales.filter(
        (metodo) => metodo.MET_ESTADO !== "INACTIVO",
      );

      setCarrito(carritoActual);
      setMetodos(metodosActivos);
      setPerfil(me.profile);
      setMetodoId(metodosActivos[0]?.MET_METODO_PAGO ?? null);
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const metodoSeleccionado = useMemo(
    () => metodos.find((metodo) => metodo.MET_METODO_PAGO === metodoId) ?? null,
    [metodoId, metodos],
  );
  const mostrarFormularioPago = Boolean(metodoSeleccionado);
  const items = carrito?.items ?? [];
  const total = Number(carrito?.orden.ODV_TOTAL ?? 0);
  const direccionValida = Number(perfil?.DIRECCION_VALIDA ?? 0) === 1;
  const direccionResumen = formatPrimaryAddress(perfil);
  const telefonoEntrega =
    perfil?.DIR_TELEFONO ??
    perfil?.CLI_TELEFONO ??
    perfil?.PER_TELEFONO ??
    "Sin telefono";
  const nombreEntrega =
    [
      perfil?.CLI_PRIMER_NOMBRE,
      perfil?.CLI_SEGUNDO_NOMBRE,
      perfil?.CLI_PRIMER_APELLIDO,
      perfil?.CLI_SEGUNDO_APELLIDO,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || "Cliente";

  const confirmarPago = async () => {
    if (!carrito || items.length === 0) {
      setError("No hay productos en el carrito.");
      return;
    }

    if (!metodoId) {
      setError("Selecciona un metodo de pago.");
      return;
    }

    if (!direccionValida) {
      setError("Completa una direccion valida antes de continuar con el pago.");
      return;
    }

    if (
      !cardName.trim() ||
      !cardNumber.trim() ||
      !cardExp.trim() ||
      !cardCvv.trim()
    ) {
      setError("Completa los datos del formulario de pago.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const resultado = await shopCheckoutApi.checkout({
        metodoPagoId: metodoId,
        ordenId: carrito.orden.ODV_ORDEN_VENTA,
        tarjeta: {
          titular: cardName.trim(),
          numero: cardNumber.replace(/\s/g, "").slice(-4),
          vencimiento: cardExp.trim(),
          cvv: "***",
        },
      });
      dispatchCartUpdated();
      router.push(
        `/shop/checkout?orden=${resultado.ordenId}&factura=${resultado.facturaId}`,
      );
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-10 max-w-5xl mx-auto space-y-10">

        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 rounded-lg bg-gray-200" />
            <div className="h-28 rounded-lg bg-gray-200" />
            <div className="h-52 rounded-lg bg-gray-200" />
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void cargarDatos()}
              className="mt-4 border border-red-300 px-4 py-2 font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (!carrito || items.length === 0) && (
          <div className="border p-8 text-center">
            <p className="text-gray-500">No hay productos pendientes de pago.</p>
            {!isAuthenticated && (
              <p className="mt-2 text-sm text-gray-500">
                Inicia sesion para completar tu compra.
              </p>
            )}
            <Link
              href={isAuthenticated ? "/shop/tienda" : "/shop/login"}
              className="mt-6 inline-block bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              {isAuthenticated ? "IR A TIENDA" : "IR A LOGIN"}
            </Link>
          </div>
        )}

        {!loading && !error && carrito && items.length > 0 && (
          <>
            {!direccionValida && (
              <div className="border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                <p className="font-semibold">Necesitas una direccion valida para continuar.</p>
                <p className="mt-2">
                  Completa pais, departamento, municipio, zona o domicilio y telefono en tu cuenta.
                </p>
                <Link
                  href="/shop/cuenta"
                  className="mt-4 inline-block border border-amber-300 px-4 py-2 font-semibold hover:bg-amber-100"
                >
                  IR A DIRECCIONES
                </Link>
              </div>
            )}

            {/* RESUMEN */}
            <div className="border p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Resumen de la compra</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.DOV_DET_ORDEN_VENTA}
                    className="flex justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{item.PRO_NOMBRE}</p>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.DOV_CANTIDAD}
                      </p>
                    </div>

                    <p className="font-semibold">
                      {formatCurrency(item.DOV_SUBTOTAL)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-right mt-4">
                <p className="text-lg font-bold">
                  Total: {formatCurrency(total)}
                </p>
              </div>
            </div>

            {/* METODO */}
            <div className="border p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">
                Metodo de envio
              </h2>

              <div
                className={`rounded-xl border p-5 ${
                  direccionValida
                    ? "border-gray-200 bg-gray-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Direccion principal del usuario
                    </p>
                    <p className="text-sm text-gray-600">
                      {nombreEntrega}
                    </p>
                    <p className="text-sm text-gray-600">
                      {direccionResumen || "Sin direccion registrada"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Telefono: {telefonoEntrega}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        direccionValida
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {direccionValida ? "Lista para enviar" : "Direccion pendiente"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1.5 text-gray-700">
                    Envio a direccion principal
                  </span>
                  <Link
                    href="/shop/cuenta"
                    className="inline-flex rounded-full border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-white"
                  >
                    Cambiar en configuracion
                  </Link>
                </div>
              </div>
            </div>

            <div className="border p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">
                Selecciona metodo de pago
              </h2>

              {metodos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay metodos de pago activos disponibles.
                </p>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {metodos.map((metodo) => (
                    <button
                      key={metodo.MET_METODO_PAGO}
                      type="button"
                      onClick={() => setMetodoId(metodo.MET_METODO_PAGO)}
                      className={`border px-4 py-2 ${
                        metodoId === metodo.MET_METODO_PAGO
                          ? "bg-black text-white"
                          : ""
                      }`}
                    >
                      {metodo.MET_NOMBRE}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FORMULARIO DE PAGO */}
            {mostrarFormularioPago && (
              <div className="space-y-6">

                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,560px)] lg:items-start lg:justify-between">
                    <div className="max-w-[320px]">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Datos de pago
                      </p>
                      <h2 className="mt-2 text-xl font-bold">
                        Completa la tarjeta para continuar
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        Ingresa los datos del numero de tarjeta, fecha de vencimiento y el CVV.
                      </p>

                      <div className="mt-5 space-y-3.5">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Nombre del titular
                          </label>
                          <input
                            placeholder="Como aparece en la tarjeta"
                            value={cardName}
                            onChange={(event) => setCardName(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Numero de tarjeta
                          </label>
                          <input
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(event) =>
                              setCardNumber(formatCardNumber(event.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Vencimiento
                            </label>
                            <input
                              placeholder="MM/YY"
                              value={cardExp}
                              onChange={(event) =>
                                setCardExp(formatExpiry(event.target.value))
                              }
                              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              CVV
                            </label>
                            <input
                              placeholder="123"
                              value={cardCvv}
                              onChange={(event) =>
                                setCardCvv(formatCvv(event.target.value))
                              }
                              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-black"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full max-w-[560px] justify-self-end">
                      <div className="aspect-[1.58/1] rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#1f2937_100%)] p-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] sm:p-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-white/55">
                            Metodo seleccionado
                          </p>
                          <p className="mt-2 text-sm font-semibold">
                            {metodoSeleccionado?.MET_NOMBRE ?? "Sin metodo"}
                          </p>
                        </div>
                        <div className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/75">
                          Demo
                        </div>
                      </div>

                      <div className="mt-8 flex items-center gap-3">
                        <div className="h-10 w-14 rounded-md bg-white/80" />
                        <div className="h-8 w-8 rounded-full bg-white/20" />
                      </div>

                      <p className="mt-7 text-[11px] uppercase tracking-[0.25em] text-white/55">
                        Numero de tarjeta
                      </p>
                      <p className="mt-3 text-[clamp(1.35rem,2.3vw,2rem)] tracking-[0.18em]">
                        {cardNumber || "0000 0000 0000 0000"}
                      </p>

                      <div className="mt-8 grid grid-cols-[1fr_auto] gap-4 text-sm">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                            Titular
                          </p>
                          <p className="mt-2 truncate">
                            {cardName || "NOMBRE COMPLETO"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                            Exp
                          </p>
                          <p className="mt-2">{cardExp || "MM/YY"}</p>
                        </div>
                      </div>

                      <div className="mt-7 flex items-end justify-between text-xs text-white/55">
                        <span>Tarjeta visual de referencia</span>
                        <span>CVV {cardCvv ? cardCvv.replace(/\d/g, "*") : "***"}</span>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {error && (
              <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* BOTON */}
            <button
              type="button"
              onClick={() => void confirmarPago()}
              disabled={processing || !metodoId || !direccionValida}
              className="block w-full bg-black text-white text-center py-4 font-semibold hover:bg-gray-800 transition disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {processing ? "PROCESANDO..." : "CONFIRMAR PAGO"}
            </button>
          </>
        )}

      </section>

    </main>
  );
}
