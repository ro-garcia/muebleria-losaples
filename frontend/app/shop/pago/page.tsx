"use client";

import Link from "next/link";
import { useState } from "react";

export default function Pago() {
  const [metodo, setMetodo] = useState("tarjeta");

  const usuarioAutenticado = true;

  const carrito = [
    {
      id: 1,
      nombre: "Sillón moderno",
      precio: 1200,
      cantidad: 1,
    },
    {
      id: 2,
      nombre: "Mesa de comedor",
      precio: 1800,
      cantidad: 1,
    },
  ];

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  if (!usuarioAutenticado) {
    return (
      <main className="flex items-center justify-center h-screen">
        <p className="text-lg">
          Debes iniciar sesión para continuar con la compra
        </p>
      </main>
    );
  }

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-10 max-w-5xl mx-auto space-y-10">

        {/* RESUMEN */}
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Resumen de la compra</h2>

          <div className="space-y-3">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between border-b pb-2">
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

          <div className="text-right mt-4">
            <p className="text-lg font-bold">Total: Q{total}</p>
          </div>
        </div>

        {/* MÉTODO */}
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            Selecciona método de pago
          </h2>

          <div className="flex gap-4">
            <button
              onClick={() => setMetodo("tarjeta")}
              className={`border px-4 py-2 ${
                metodo === "tarjeta" ? "bg-black text-white" : ""
              }`}
            >
              Tarjeta
            </button>

            <button
              onClick={() => setMetodo("transferencia")}
              className={`border px-4 py-2 ${
                metodo === "transferencia" ? "bg-black text-white" : ""
              }`}
            >
              Transferencia
            </button>
          </div>
        </div>

        {/* TARJETA */}
        {metodo === "tarjeta" && (
          <div className="space-y-6">

            <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 rounded-xl">
              <p className="text-sm opacity-70">Número de tarjeta</p>
              <p className="text-xl tracking-widest mt-2">
                0000 0000 0000 0000
              </p>

              <div className="flex justify-between mt-6 text-sm">
                <div>
                  <p className="opacity-70">Nombre</p>
                  <p>FULL NAME</p>
                </div>
                <div>
                  <p className="opacity-70">Exp</p>
                  <p>MM/YY</p>
                </div>
              </div>
            </div>

            <div className="border p-6 rounded-lg space-y-4">
              <input placeholder="Nombre completo" className="w-full border p-3" />
              <input placeholder="Número de tarjeta" className="w-full border p-3" />

              <div className="grid grid-cols-2 gap-4">
                <input placeholder="MM/YY" className="border p-3" />
                <input placeholder="CVV" className="border p-3" />
              </div>
            </div>

          </div>
        )}

        {metodo === "transferencia" && (
          <div className="border p-6 rounded-lg">
            <p>
              Realiza la transferencia y envía comprobante.
            </p>
          </div>
        )}

        {/* BOTÓN */}
        <Link
          href="/shop/checkout"
          className="block w-full bg-black text-white text-center py-4 font-semibold hover:bg-gray-800 transition"
        >
          CONFIRMAR PAGO
        </Link>

      </section>

    </main>
  );
}