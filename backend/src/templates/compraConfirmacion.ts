export const compraConfirmacionTemplate = (data: {
  clienteNombre: string;
  ordenId: number;
  facturaId: number;
  referencia: string;
  total: number;
  items: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}) => {
  const rows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border:1px solid #e5e7eb;">${item.nombre}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${item.cantidad}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Q${item.precio.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Q${item.subtotal.toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `
    <h2>Compra confirmada</h2>
    <p>Hola ${data.clienteNombre}, tu compra fue registrada exitosamente.</p>
    <p><strong>Orden:</strong> ${data.ordenId}</p>
    <p><strong>Factura:</strong> ${data.facturaId}</p>
    <p><strong>Referencia:</strong> ${data.referencia}</p>
    <table style="border-collapse:collapse;width:100%;margin-top:12px;">
      <thead>
        <tr>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;">Producto</th>
          <th style="padding:8px;border:1px solid #e5e7eb;">Cant.</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Precio</th>
          <th style="padding:8px;border:1px solid #e5e7eb;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:12px;"><strong>Total pagado:</strong> Q${data.total.toFixed(2)}</p>
  `;
};
