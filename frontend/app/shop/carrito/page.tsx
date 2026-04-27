"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Carrito() {
  const [checkout, setCheckout] = useState(false);

  // MOCK (luego backend)
  const carrito = [
    {
      id: 1,
      nombre: "Sillón moderno",
      precio: 1200,
      cantidad: 1,
      img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
    },
    {
      id: 2,
      nombre: "Mesa de comedor",
      precio: 1800,
      cantidad: 1,
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    },
  ];

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  return (
    <main className="bg-white text-black">

      {/* CONTENIDO */}
      <section className="px-6 md:px-10 py-10 max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Carrito de compras
        </h1>

        {/* LISTADO */}
        <div className="space-y-6">

          {carrito.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row items-center gap-6 border p-4 rounded-lg"
            >
              <div className="relative w-full md:w-[150px] h-[120px]">
                <Image
                  unoptimized
                  src={item.img}
                  alt={item.nombre}
                  fill
                  className="object-cover rounded"
                />
              </div>

              <div className="flex-1">
                <p className="font-semibold">{item.nombre}</p>
                <p className="text-sm text-gray-500">
                  Cantidad: {item.cantidad}
                </p>
              </div>

              <div className="font-semibold">
                Q{item.precio}
              </div>
            </div>
          ))}

        </div>

        {/* TOTAL */}
        <div className="mt-10 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-6">

          <p className="text-xl font-bold">
            Total: Q{total}
          </p>

          <div className="flex gap-4">

            <Link
              href="/shop/tienda"
              className="border px-6 py-3 text-sm font-semibold hover:bg-gray-100 transition"
            >
              CONTINUAR COMPRA
            </Link>

            <button
              onClick={() => setCheckout(true)}
              className="bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              EFECTUAR COMPRA
            </button>

          </div>

        </div>

      </section>

      {/* CHECKOUT */}
      {checkout && (
        <section className="px-6 md:px-10 pb-10 max-w-7xl mx-auto">

          <h2 className="text-2xl font-bold mb-6">
            Resumen de compra
          </h2>

          <div className="space-y-4">

            {carrito.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b pb-2"
              >
                <p>
                  {item.nombre} x{item.cantidad}
                </p>
                <p>
                  Q{item.precio * item.cantidad}
                </p>
              </div>
            ))}

          </div>

          <div className="mt-6 text-right">
            <p className="text-xl font-bold mb-4">
              Total: Q{total}
            </p>

            <Link
              href="/shop/pago"
              className="bg-black text-white px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition"
            >
              PAGAR
            </Link>
          </div>

        </section>
      )}

    </main>
  );
}