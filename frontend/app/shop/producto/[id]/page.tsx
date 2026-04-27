"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProductoDetalle() {
  const router = useRouter(); // ✅ CORRECTO: dentro del componente

  // MOCK (luego backend)
  const producto = {
    id: 1,
    nombre: "Sillón moderno",
    referencia: "ALP-001",
    material: "Madera y tela premium",
    precio: "Q1,200",
    descripcion:
      "Sillón elegante diseñado para brindar confort y estilo en cualquier espacio.",
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
  };

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* IMAGEN */}
        <div className="relative h-[400px] w-full">
          <Image
            unoptimized
            src={producto.img}
            alt={producto.nombre}
            fill
            className="object-cover rounded-xl"
          />
        </div>

        {/* INFO */}
        <div className="space-y-6">

          <h1 className="text-3xl font-bold">
            {producto.nombre}
          </h1>

          <p className="text-gray-500">
            {producto.descripcion}
          </p>

          <div className="space-y-2 text-sm">
            <p><strong>Referencia:</strong> {producto.referencia}</p>
            <p><strong>Material:</strong> {producto.material}</p>
          </div>

          <p className="text-2xl font-bold">
            {producto.precio}
          </p>

          {/* BOTONES */}
          <div className="flex flex-col gap-3">

            <button
              onClick={() => router.push("/shop/carrito")}
              className="bg-black text-white py-3 font-semibold hover:bg-gray-800 transition"
            >
              AGREGAR AL CARRITO
            </button>

            <button className="border py-3 font-semibold hover:bg-gray-100 transition">
              INICIAR SESIÓN PARA COMPRAR
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}