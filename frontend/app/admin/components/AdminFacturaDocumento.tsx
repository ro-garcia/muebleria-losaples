"use client";

import { ReceiptText } from "lucide-react";

import {
  formatCurrency,
  formatDate,
  type FacturaDetail,
} from "../../lib/api";

const FACTURA_EMISOR_NOMBRE = "LOS ALPES S.A.";
const FACTURA_RAZON_SOCIAL = "Mueblería Los Alpes S.A.";

const joinValues = (...values: Array<string | null | undefined>) =>
  values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" ");

const joinAddress = (...values: Array<string | null | undefined>) =>
  values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(", ");

export function AdminFacturaDocumento({
  facturaDetalle,
}: {
  facturaDetalle: FacturaDetail;
}) {
  const facturaActual = facturaDetalle.factura ?? {};
  const facturaClienteNombre =
    joinValues(
      String(facturaActual.CLI_PRIMER_NOMBRE ?? ""),
      String(facturaActual.CLI_SEGUNDO_NOMBRE ?? ""),
      String(facturaActual.CLI_PRIMER_APELLIDO ?? ""),
      String(facturaActual.CLI_SEGUNDO_APELLIDO ?? ""),
    ) || "Consumidor final";
  const facturaClienteDocumento =
    joinValues(
      String(facturaActual.CLI_TIPO_DOCUMENTO ?? ""),
      String(facturaActual.CLI_NUMERO_DOCUMENTO ?? ""),
    ) || "CF";
  const facturaClienteCorreo = String(
    facturaActual.CLI_CORREO_ELECTRONICO ?? "Sin correo",
  );
  const facturaClienteTelefono = String(
    facturaActual.CLI_TELEFONO ?? "Sin telefono",
  );
  const facturaClienteDireccion =
    joinAddress(
      String(facturaActual.CLI_ZONA_ALDEA ?? ""),
      String(facturaActual.CLI_MUNICIPIO ?? ""),
      String(facturaActual.CLI_DEPARTAMENTO ?? ""),
      String(facturaActual.CLI_PAIS ?? ""),
    ) || "Sin direccion registrada";
  const facturaTiendaDireccion =
    joinAddress(
      String(facturaActual.TIE_DOMICILIO ?? ""),
      String(facturaActual.TIE_ZONA_ALDEA ?? ""),
      String(facturaActual.TIE_MUNICIPIO ?? ""),
      String(facturaActual.TIE_DEPARTAMENTO ?? ""),
    ) || "Sin direccion de tienda";
  const facturaTiendaTelefono = String(
    facturaActual.TIE_TELEFONO ?? "Sin telefono",
  );
  const facturaLugarEmision =
    joinAddress(
      String(facturaActual.TIE_MUNICIPIO ?? ""),
      String(facturaActual.TIE_DEPARTAMENTO ?? ""),
    ) || "Guatemala";
  const facturaSerieActual = String(facturaActual.FAC_SERIE ?? "-");
  const facturaNumeroActual = String(facturaActual.FAC_NUMERO ?? "-");
  const facturaUuidActual = String(facturaActual.FAC_UUID ?? "-");
  const facturaEstadoActual = String(facturaActual.FAC_ESTADO_FACTURA ?? "-");
  const facturaMetodoActual = String(
    facturaActual.MET_NOMBRE ?? "Sin registro",
  );
  const facturaOrdenActual = `#${String(facturaActual.ORD_ORDEN_VENTA ?? "-")}`;
  const facturaFechaActual = formatDate(
    String(facturaActual.FAC_FECHA_EMISION ?? ""),
  );
  const facturaCodigoCliente = String(facturaActual.CLI_CLIENTE ?? "-");
  const facturaSubtotalActual = Number(facturaActual.FAC_SUBTOTAL ?? 0);
  const facturaDescuentoActual = Number(
    facturaActual.FAC_DESCUENTO_TOTAL ?? 0,
  );
  const facturaImpuestoActual = Number(facturaActual.FAC_IMPUESTO_TOTAL ?? 0);
  const facturaTotalActual = Number(facturaActual.FAC_TOTAL ?? 0);
  const facturaPagadoActual = Number(facturaActual.FAC_TOTAL_PAGADO ?? 0);
  const facturaPendienteActual = Number(
    facturaActual.FAC_PENDIENTE_PAGO ?? 0,
  );
  const facturaImpuestosAplicados = Array.from(
    new Set(
      (facturaDetalle.items ?? [])
        .map((item) =>
          joinValues(
            String(item.IMP_NOMBRE ?? ""),
            item.IMP_PORCENTAJE != null ? `${String(item.IMP_PORCENTAJE)}%` : "",
          ),
        )
        .filter(Boolean),
    ),
  );

  return (
    <div className="overflow-x-auto">
      <div className="mx-auto min-w-[980px] max-w-[1080px] rounded-[28px] bg-[#f6f2ea] p-4 shadow-inner md:p-6">
        <div className="border-2 border-black bg-white text-[11px] leading-relaxed text-black shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[180px_minmax(0,1fr)_280px]">
            <div className="flex flex-col items-center justify-center gap-3 border-b-2 border-black px-4 py-6 lg:border-b-0 lg:border-r-2">
              <div className="rounded-full border-2 border-black p-3">
                <ReceiptText size={28} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
                  Emisor
                </p>
                <p className="mt-2 text-xl font-black uppercase leading-tight">
                  {FACTURA_EMISOR_NOMBRE}
                </p>
              </div>
            </div>

            <div className="border-b-2 border-black px-5 py-4 lg:border-b-0 lg:border-r-2">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.24em]">
                Documento Tributario Electronico
              </p>
              <p className="mt-2 text-center text-lg font-black leading-tight">
                {FACTURA_RAZON_SOCIAL}
              </p>
              <div className="mt-3 space-y-1 text-center text-[11px] text-gray-700">
                <p>{facturaTiendaDireccion}</p>
                <p>Telefono: {facturaTiendaTelefono}</p>
                <p>Emision: {facturaLugarEmision}</p>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="rounded-[20px] border-2 border-black p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                  Documento fiscal
                </p>
                <p className="mt-1 text-[28px] font-black uppercase leading-none">
                  Factura
                </p>
                <div className="mt-4 space-y-1 text-sm">
                  <p>
                    <strong>Serie:</strong> {facturaSerieActual}
                  </p>
                  <p>
                    <strong>Numero:</strong> {facturaNumeroActual}
                  </p>
                  <p>
                    <strong>DTE:</strong> {facturaNumeroActual}
                  </p>
                  <p className="break-all">
                    <strong>UUID:</strong> {facturaUuidActual}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t-2 border-black md:grid-cols-[1.3fr_0.7fr]">
            <div className="border-b border-black p-3 md:border-b-0 md:border-r">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Lugar y fecha de emision
                  </p>
                  <p className="mt-1">{facturaLugarEmision}, {facturaFechaActual}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Referencia interna
                  </p>
                  <p className="mt-1">{facturaOrdenActual}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Nombre
                  </p>
                  <p className="mt-1 font-semibold uppercase">{facturaClienteNombre}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Direccion
                  </p>
                  <p className="mt-1">{facturaClienteDireccion}</p>
                </div>
              </div>
            </div>

            <div className="p-3">
              <div className="grid gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    NIT / CUI / Pasaporte
                  </p>
                  <p className="mt-1">{facturaClienteDocumento}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Correo y telefono
                  </p>
                  <p className="mt-1">{facturaClienteCorreo}</p>
                  <p>{facturaClienteTelefono}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Moneda
                    </p>
                    <p className="mt-1">Quetzales</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      Codigo cliente
                    </p>
                    <p className="mt-1">{facturaCodigoCliente}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-black">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-black bg-[#f8f8f8] uppercase">
                  <th className="border-r border-black px-3 py-2 text-left">Codigo</th>
                  <th className="border-r border-black px-3 py-2 text-left">Descripcion</th>
                  <th className="border-r border-black px-3 py-2 text-center">Cantidad</th>
                  <th className="border-r border-black px-3 py-2 text-right">Precio unitario</th>
                  <th className="border-r border-black px-3 py-2 text-right">Descuento</th>
                  <th className="border-r border-black px-3 py-2 text-right">Impuesto</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {facturaDetalle.items.map((item, index) => (
                  <tr key={`${item.DFA_DETALLE_FACTURA ?? index}-${item.PRO_PRODUCTO ?? index}`}>
                    <td className="border-r border-black px-3 py-2 align-top">
                      {String(item.PRO_CODIGO ?? "—")}
                    </td>
                    <td className="border-r border-black px-3 py-2 align-top">
                      <p className="font-medium">{String(item.PRO_NOMBRE ?? "Producto")}</p>
                    </td>
                    <td className="border-r border-black px-3 py-2 text-center align-top">
                      {String(item.DFA_CANTIDAD ?? 0)}
                    </td>
                    <td className="border-r border-black px-3 py-2 text-right align-top">
                      {formatCurrency(Number(item.DFA_PRECIO ?? 0))}
                    </td>
                    <td className="border-r border-black px-3 py-2 text-right align-top">
                      {formatCurrency(Number(item.DFA_DESCUENTO ?? 0))}
                    </td>
                    <td className="border-r border-black px-3 py-2 text-right align-top">
                      {formatCurrency(Number(item.DFA_IMPUESTO ?? 0))}
                    </td>
                    <td className="px-3 py-2 text-right align-top font-semibold">
                      {formatCurrency(Number(item.DFA_SUBTOTAL ?? 0))}
                    </td>
                  </tr>
                ))}
                {facturaDetalle.items.length < 4 &&
                  Array.from({ length: 4 - facturaDetalle.items.length }).map((_, index) => (
                    <tr key={`blank-${index}`} className="h-16">
                      <td className="border-r border-black" />
                      <td className="border-r border-black" />
                      <td className="border-r border-black" />
                      <td className="border-r border-black" />
                      <td className="border-r border-black" />
                      <td className="border-r border-black" />
                      <td />
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="grid border-t border-black md:grid-cols-[1.3fr_0.7fr]">
            <div className="border-b border-black px-3 py-2 text-[10px] md:border-b-0 md:border-r">
              <p className="font-semibold uppercase">Impuestos aplicados</p>
              <p className="mt-1 text-[11px]">
                {facturaImpuestosAplicados.length > 0
                  ? facturaImpuestosAplicados.join(", ")
                  : "Sin impuestos detallados"}
              </p>
            </div>
            <div className="px-3 py-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase">Subtotal</span>
                <span className="font-semibold">{formatCurrency(facturaSubtotalActual)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="uppercase text-gray-600">Descuento</span>
                <span>{formatCurrency(facturaDescuentoActual)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="uppercase text-gray-600">Impuesto</span>
                <span>{formatCurrency(facturaImpuestoActual)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-black pt-2 text-sm">
                <span className="font-bold uppercase">Total</span>
                <span className="text-lg font-black">
                  {formatCurrency(facturaTotalActual)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="uppercase text-gray-600">Pagado</span>
                <span>{formatCurrency(facturaPagadoActual)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="uppercase text-gray-600">Pendiente</span>
                <span>{formatCurrency(facturaPendienteActual)}</span>
              </div>
            </div>
          </div>

          <div className="grid border-t border-black md:grid-cols-[1.3fr_0.7fr]">
            <div className="border-b border-black px-3 py-3 md:border-b-0 md:border-r">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Observaciones
              </p>
              <div className="mt-2 space-y-1 text-[11px] text-gray-700">
                <p>Orden relacionada: {facturaOrdenActual}</p>
                <p>Metodo de pago registrado: {facturaMetodoActual}</p>
                <p>Estado fiscal actual: {facturaEstadoActual}</p>
                <p>Vista administrativa armada con los datos reales de la factura.</p>
              </div>
            </div>
            <div className="px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Resumen
              </p>
              <div className="mt-2 space-y-1 text-[11px]">
                <p>Serie: {facturaSerieActual}</p>
                <p>Numero: {facturaNumeroActual}</p>
                <p>Cliente: {facturaClienteNombre}</p>
                <p>Documento: {facturaClienteDocumento}</p>
              </div>
            </div>
          </div>

          <div className="grid border-t border-black text-center text-[10px] uppercase md:grid-cols-3">
            <div className="px-4 py-5">
              <div className="mx-auto h-px w-36 bg-black" />
              <p className="mt-2 font-semibold">Emisor</p>
              <p className="mt-1 text-[10px] font-semibold normal-case">
                {FACTURA_EMISOR_NOMBRE}
              </p>
            </div>
            <div className="border-t border-black px-4 py-5 md:border-l md:border-r md:border-t-0">
              <div className="mx-auto h-px w-36 bg-black" />
              <p className="mt-2 font-semibold">Cliente</p>
            </div>
            <div className="border-t border-black px-4 py-5 md:border-t-0">
              <div className="mx-auto h-px w-36 bg-black" />
              <p className="mt-2 font-semibold">Aceptacion</p>
            </div>
          </div>

          <div className="border-t border-black px-4 py-3 text-[10px] text-gray-600">
            Vista de referencia administrativa. Conserva los mismos datos reales
            de la factura actual y mejora solo la presentacion.
          </div>
        </div>
      </div>
    </div>
  );
}
