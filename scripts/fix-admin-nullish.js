const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/app/admin/page.tsx');

// Read file as buffer to handle special characters
let content = fs.readFileSync(filePath, 'utf8');

// Fix line 2875: Add parentheses to nullish + logical operator mix
// Look for the pattern and wrap it properly
content = content.replace(
  /\{cliente\.DIRECCION_RESUMEN \?\? \[cliente\.CLI_ZONA_ALDEA, cliente\.CLI_MUNICIPIO, cliente\.CLI_DEPARTAMENTO, cliente\.CLI_PAIS\]\.filter\(Boolean\)\.join\(", "\) \|\| "[^"]*"\}/g,
  '{cliente.DIRECCION_RESUMEN ?? (([cliente.CLI_ZONA_ALDEA, cliente.CLI_MUNICIPIO, cliente.CLI_DEPARTAMENTO, cliente.CLI_PAIS].filter(Boolean).join(", ")) || "—")}'
);

// Also fix other broken characters (replacing ? with —)
content = content.replace(/"\?"/g, '"—"');
content = content.replace(/"\?"/g, '"—"');

// Write file back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed nullish coalescing operator and broken characters in admin/page.tsx');
