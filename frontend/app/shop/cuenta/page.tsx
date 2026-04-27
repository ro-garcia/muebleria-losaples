"use client";

import { useState } from "react";
import { User, Package, MapPin, LogOut } from "lucide-react";

export default function Cuenta() {
  const [tab, setTab] = useState("perfil");

  // MOCK DATA
  const usuario = {
    nombre: "Juan Pérez",
    correo: "juan@email.com",
    telefono: "+502 1234-5678",
    direccion: "Ciudad de Guatemala",
  };

  const pedidos = [
    {
      id: "ORD-2026-123456",
      fecha: "12 Mar 2026",
      total: "Q2,500",
      estado: "Enviado",
    },
    {
      id: "ORD-2026-654321",
      fecha: "05 Mar 2026",
      total: "Q1,200",
      estado: "Entregado",
    },
  ];

  return (
    <main className="bg-white text-black">

      <section className="px-6 md:px-10 py-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* SIDEBAR */}
        <div className="space-y-2">

          <button
            onClick={() => setTab("perfil")}
            className={`w-full text-left p-3 border ${
              tab === "perfil" ? "bg-black text-white" : ""
            }`}
          >
            <User className="inline mr-2 w-4 h-4" />
            Mi perfil
          </button>

          <button
            onClick={() => setTab("pedidos")}
            className={`w-full text-left p-3 border ${
              tab === "pedidos" ? "bg-black text-white" : ""
            }`}
          >
            <Package className="inline mr-2 w-4 h-4" />
            Mis pedidos
          </button>

          <button
            onClick={() => setTab("direccion")}
            className={`w-full text-left p-3 border ${
              tab === "direccion" ? "bg-black text-white" : ""
            }`}
          >
            <MapPin className="inline mr-2 w-4 h-4" />
            Dirección
          </button>

          <button className="w-full text-left p-3 border text-red-500">
            <LogOut className="inline mr-2 w-4 h-4" />
            Cerrar sesión
          </button>

        </div>

        {/* CONTENIDO */}
        <div className="md:col-span-3">

          {/* PERFIL */}
          {tab === "perfil" && (
            <div className="border p-6 rounded-lg space-y-4">

              <h2 className="text-xl font-bold">
                Información personal
              </h2>

              <div className="space-y-2 text-sm">
                <p><strong>Nombre:</strong> {usuario.nombre}</p>
                <p><strong>Correo:</strong> {usuario.correo}</p>
                <p><strong>Teléfono:</strong> {usuario.telefono}</p>
              </div>

              <button className="mt-4 border px-4 py-2 hover:bg-gray-100">
                Editar información
              </button>

            </div>
          )}

          {/* PEDIDOS */}
          {tab === "pedidos" && (
            <div className="border p-6 rounded-lg">

              <h2 className="text-xl font-bold mb-6">
                Historial de pedidos
              </h2>

              <div className="space-y-4">

                {pedidos.map((p) => (
                  <div
                    key={p.id}
                    className="border p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">{p.id}</p>
                      <p className="text-sm text-gray-500">
                        {p.fecha}
                      </p>
                    </div>

                    <div className="text-right">
                      <p>{p.total}</p>
                      <p className="text-sm text-gray-500">
                        {p.estado}
                      </p>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          )}

          {/* DIRECCIÓN */}
          {tab === "direccion" && (
            <div className="border p-6 rounded-lg space-y-4">

              <h2 className="text-xl font-bold">
                Dirección de envío
              </h2>

              <p className="text-sm text-gray-600">
                {usuario.direccion}
              </p>

              <button className="border px-4 py-2 hover:bg-gray-100">
                Editar dirección
              </button>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}