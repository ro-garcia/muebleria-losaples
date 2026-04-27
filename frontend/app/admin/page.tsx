"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Sofa,
  Users,
  BarChart3,
  Trash2,
} from "lucide-react";

export default function AdminPanel() {
  const [tab, setTab] = useState("dashboard");

  const muebles = [
    { id: 1, nombre: "Sillón moderno", precio: 1200 },
    { id: 2, nombre: "Mesa comedor", precio: 1800 },
  ];

  const clientes = [
    { id: 1, nombre: "Juan Pérez", correo: "juan@email.com" },
    { id: 2, nombre: "María López", correo: "maria@email.com" },
  ];

  return (
    <main className="flex min-h-screen bg-gray-100 text-black">

      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-white p-6 space-y-6">

        <h1 className="text-xl font-bold">ADMIN</h1>

        <nav className="space-y-4 text-sm">

          <button
            onClick={() => setTab("dashboard")}
            className="flex items-center gap-2 hover:opacity-70"
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button
            onClick={() => setTab("muebles")}
            className="flex items-center gap-2 hover:opacity-70"
          >
            <Sofa size={18} /> Muebles
          </button>

          <button
            onClick={() => setTab("clientes")}
            className="flex items-center gap-2 hover:opacity-70"
          >
            <Users size={18} /> Clientes
          </button>

          <button
            onClick={() => setTab("reportes")}
            className="flex items-center gap-2 hover:opacity-70"
          >
            <BarChart3 size={18} /> Reportes
          </button>

        </nav>

      </aside>

      {/* CONTENIDO */}
      <section className="flex-1 p-10">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Panel General
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-white p-6 shadow rounded-lg">
                <p className="text-sm text-gray-500">Ventas</p>
                <h3 className="text-xl font-bold">Q15,200</h3>
              </div>

              <div className="bg-white p-6 shadow rounded-lg">
                <p className="text-sm text-gray-500">Clientes</p>
                <h3 className="text-xl font-bold">120</h3>
              </div>

              <div className="bg-white p-6 shadow rounded-lg">
                <p className="text-sm text-gray-500">Pedidos</p>
                <h3 className="text-xl font-bold">45</h3>
              </div>

            </div>
          </div>
        )}

        {/* MUEBLES */}
        {tab === "muebles" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Administrar Muebles
            </h2>

            <table className="w-full bg-white shadow rounded-lg">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Precio</th>
                </tr>
              </thead>

              <tbody>
                {muebles.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-3">{m.nombre}</td>
                    <td className="p-3">Q{m.precio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CLIENTES */}
        {tab === "clientes" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Clientes
            </h2>

            <table className="w-full bg-white shadow rounded-lg">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Acción</th>
                </tr>
              </thead>

              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3">{c.correo}</td>
                    <td className="p-3">
                      <button className="text-red-600 flex items-center gap-2">
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORTES */}
        {tab === "reportes" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Reportes de Ventas
            </h2>

            <div className="bg-white p-6 shadow rounded-lg">
              <p className="text-gray-600">
                Aquí podrás visualizar reportes como:
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                <li>• Historial de compras por cliente</li>
                <li>• Ventas por mes</li>
                <li>• Productos más vendidos</li>
              </ul>
            </div>
          </div>
        )}

      </section>

    </main>
  );
}