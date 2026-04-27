"use client";

import { useRouter } from "next/navigation";
import { Shield, ShoppingBag } from "lucide-react";
import Image from "next/image";

export default function EntryPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">

      <div className="max-w-6xl w-full">

        {/* TITLE */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold">
            LOS ALPES
          </h1>
          <p className="text-gray-500 mt-2">
            Selecciona cómo deseas ingresar
          </p>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* TIENDA */}
          <div
            onClick={() => router.push("/shop")}
            className="relative h-[320px] rounded-2xl overflow-hidden cursor-pointer group"
          >
            <Image
              unoptimized
              src="https://images.unsplash.com/photo-1567016432779-094069958ea5"
              alt="tienda"
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
            />

            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition" />

            {/* contenido */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-6">
              <div className="w-16 h-16 flex items-center justify-center border border-white rounded-full mb-6">
                <ShoppingBag className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-semibold">
                Portal de Compras
              </h2>

              <p className="text-sm text-gray-200 mt-2 max-w-xs">
                Explora productos, compra muebles y descubre nuestras colecciones
              </p>
            </div>
          </div>

          {/* ADMIN */}
          <div
            onClick={() => router.push("/admin")}
            className="relative h-[320px] rounded-2xl overflow-hidden cursor-pointer group"
          >
            <Image
              unoptimized
              src="https://images.unsplash.com/photo-1554774853-aae0a22c8aa4"
              alt="admin"
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
            />

            {/* overlay */}
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition" />

            {/* contenido */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-6">
              <div className="w-16 h-16 flex items-center justify-center border border-white rounded-full mb-6">
                <Shield className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-semibold">
                Portal Administrativo
              </h2>

              <p className="text-sm text-gray-200 mt-2 max-w-xs">
                Gestiona productos, pedidos y controla tu tienda
              </p>
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}