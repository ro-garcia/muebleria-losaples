"use client";

import React from "react";

export const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400";

export const selectCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

export function StatusBadge({ estado }: { estado?: string | null }) {
  const map: Record<string, string> = {
    ACTIVO: "bg-green-100 text-green-800",
    ACTIVA: "bg-green-100 text-green-800",
    INACTIVO: "bg-gray-100 text-gray-600",
    FINALIZADO: "bg-blue-100 text-blue-800",
    ANULADO: "bg-red-100 text-red-800",
    ANULADA: "bg-red-100 text-red-800",
    PAGADA: "bg-green-100 text-green-800",
    PENDIENTE: "bg-yellow-100 text-yellow-800",
  };
  const cls = map[estado ?? ""] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {estado ?? "—"}
    </span>
  );
}

export function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
