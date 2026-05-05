"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import {
  carritoApi,
  facturasApi,
  formatCurrency,
  formatDate,
  getApiErrorMessage,
  type Carrito,
  type Factura,
} from "../../lib/api";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const ordenId = Number(searchParams.get("orden"));
  const facturaId = Number(searchParams.get("factura"));
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarCompra = useCallback(async () => {
    if (!Number.isFinite(ordenId) || ordenId <= 0) {
      setLoading(false);
      setError("No se encontro una orden para mostrar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [carritoActual, facturaActual] = await Promise.all([
        carritoApi.obtenerPorId(ordenId),
        Number.isFinite(facturaId) && facturaId > 0
          ? facturasApi.obtener(facturaId)
          : facturasApi
              .listarPorOrden(ordenId)
              .then((facturas) => facturas[0] ?? null),
      ]);

      setCarrito(carritoActual);
      setFactura(facturaActual);
    } catch (currentError) {
      setError(getApiErrorMessage(currentError));
    } finally {
      setLoading(false);
    }
  }, [facturaId, ordenId]);

  useEffect(() => {
    void cargarCompra();
  }, [cargarCompra]);

  const items = carrito?.items ?? [];
  const subtotal = Number(carrito?.orden.ODV_SUBTOTAL ?? factura?.FAC_SUBTOTAL ?? 0);
  const descuento = Number(
    carrito?.orden.ODV_DESCUENTO ?? factura?.FAC_DESCUENTO_TOTAL ?? 0,
  );
  const total = Number(carrito?.orden.ODV_TOTAL ?? factura?.FAC_TOTAL ?? 0);

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-12 max-w-5xl mx-auto space-y-10">

        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-28 rounded-lg bg-gray-200" />
            <div className="h-36 rounded-lg bg-gray-200" />
            <div className="h-52 rounded-lg bg-gray-200" />
          </div>
        )}

        {!loading && error && (
          <div className="border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void cargarCompra()}
              className="mt-4 border border-red-300 px-4 py-2 font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* MENSAJE */}
            <div className="text-center space-y-4">
              <CheckCircle className="w-14 h-14 mx-auto text-green-600" />

              <h1 className="text-3xl font-bold">
                Compra realizada con exito
              </h1>

              <p className="text-gray-500">
                Gracias por confiar en Los Alpes. Estamos preparando tu pedido.
              </p>

              <p className="text-lg font-semibold">
                Numero de orden:{" "}
                <span className="text-black">
                  {carrito?.orden.ODV_ORDEN_VENTA ?? ordenId}
                </span>
              </p>
            </div>

            {/* ENVIO */}
            <div className="border rounded-xl p-6 bg-gray-50">
              <h2 className="font-bold mb-2">Envio</h2>
              <p className="text-sm text-gray-600">
                Tu pedido sera enviado en un plazo de 2 a 5 dias habiles.
                Recibiras un correo con los detalles y seguimiento.
              </p>
            </div>

            {/* RESUMEN */}
            <div className="border rounded-xl p-6">
              <h2 className="font-bold mb-4">Resumen del pedido</h2>

              {items.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay detalle de productos para esta orden.
                </p>
              ) : (
                <div className="space-y-4">
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
              )}

              <div className="mt-6 text-right space-y-1">
                <p className="text-sm text-gray-600">
                  Subtotal: {formatCurrency(subtotal)}
                </p>

                {descuento > 0 && (
                  <p className="text-green-600 text-sm">
                    Descuento: -{formatCurrency(descuento)}
                  </p>
                )}

                <p className="text-xl font-bold">
                  Total: {formatCurrency(total)}
                </p>
              </div>
            </div>

            {/* FACTURACION */}
            <div className="border rounded-xl p-6">
              <h2 className="font-bold mb-4">Datos de facturacion</h2>

              {factura ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Factura:</strong> {factura.FAC_FACTURA}</p>
                  <p><strong>Fecha:</strong> {formatDate(factura.FAC_FECHA_EMISION)}</p>
                  <p><strong>Estado:</strong> {factura.FAC_ESTADO_FACTURA}</p>
                  <p><strong>Total pagado:</strong> {formatCurrency(factura.FAC_TOTAL_PAGADO)}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No hay factura asociada a esta orden.
                </p>
              )}
            </div>

            {/* ACCIONES */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">

              <Link
                href="/shop/tienda"
                className="border px-6 py-3 text-center font-semibold hover:bg-gray-100 transition"
              >
                SEGUIR COMPRANDO
              </Link>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 transition"
              >
                DESCARGAR FACTURA
              </button>

            </div>
          </>
        )}

      </section>

    </main>
  );
}

export default function Checkout() {
  return (
    <Suspense
      fallback={
        <main className="bg-white text-black">
          <section className="px-6 md:px-10 py-12 max-w-5xl mx-auto">
            <div className="h-40 rounded-lg bg-gray-200 animate-pulse" />
          </section>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
