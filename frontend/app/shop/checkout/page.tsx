"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

export default function Checkout() {
  const [orden, setOrden] = useState("");

  // MOCK carrito
  const carrito = [
    { id: 1, nombre: "Sillón moderno", precio: 1200, cantidad: 1 },
    { id: 2, nombre: "Mesa de comedor", precio: 1800, cantidad: 1 },
  ];

  const subtotal = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  const descuento = 0;
  const total = subtotal - descuento;

  // 🔥 FIX HYDRATION
  useEffect(() => {
    const rand = Math.floor(100000 + Math.random() * 900000);
    setOrden(`ORD-${new Date().getFullYear()}-${rand}`);
  }, []);

  const facturacion = {
    nombre: "Juan Pérez",
    correo: "juan@email.com",
    telefono: "+502 1234-5678",
    direccion: "Ciudad de Guatemala",
  };

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-12 max-w-5xl mx-auto space-y-10">

        {/* MENSAJE */}
        <div className="text-center space-y-4">
          <CheckCircle className="w-14 h-14 mx-auto text-green-600" />

          <h1 className="text-3xl font-bold">
            Compra realizada con éxito
          </h1>

          <p className="text-gray-500">
            Gracias por confiar en Los Alpes. Estamos preparando tu pedido.
          </p>

          <p className="text-lg font-semibold">
            Número de orden:{" "}
            <span className="text-black">
              {orden || "Generando..."}
            </span>
          </p>
        </div>

        {/* ENVÍO */}
        <div className="border rounded-xl p-6 bg-gray-50">
          <h2 className="font-bold mb-2">Envío</h2>
          <p className="text-sm text-gray-600">
            Tu pedido será enviado en un plazo de 2 a 5 días hábiles.
            Recibirás un correo con los detalles y seguimiento.
          </p>
        </div>

        {/* RESUMEN */}
        <div className="border rounded-xl p-6">
          <h2 className="font-bold mb-4">Resumen del pedido</h2>

          <div className="space-y-4">

            {carrito.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b pb-2"
              >
                <div>
                  <p className="font-medium">{item.nombre}</p>
                  <p className="text-sm text-gray-500">
                    Cantidad: {item.cantidad}
                  </p>
                </div>

                <p className="font-semibold">
                  Q{item.precio * item.cantidad}
                </p>
              </div>
            ))}

          </div>

          <div className="mt-6 text-right space-y-1">
            <p className="text-sm text-gray-600">
              Subtotal: Q{subtotal}
            </p>

            {descuento > 0 && (
              <p className="text-green-600 text-sm">
                Descuento: -Q{descuento}
              </p>
            )}

            <p className="text-xl font-bold">
              Total: Q{total}
            </p>
          </div>
        </div>

        {/* FACTURACIÓN */}
        <div className="border rounded-xl p-6">
          <h2 className="font-bold mb-4">Datos de facturación</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

            <p><strong>Nombre:</strong> {facturacion.nombre}</p>
            <p><strong>Correo:</strong> {facturacion.correo}</p>
            <p><strong>Teléfono:</strong> {facturacion.telefono}</p>
            <p><strong>Dirección:</strong> {facturacion.direccion}</p>

          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">

          <Link
            href="/shop/tienda"
            className="border px-6 py-3 text-center font-semibold hover:bg-gray-100 transition"
          >
            SEGUIR COMPRANDO
          </Link>

          <button className="bg-black text-white px-6 py-3 font-semibold hover:bg-gray-800 transition">
            DESCARGAR FACTURA
          </button>

        </div>

      </section>

    </main>
  );
}