#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error('Uso: node repair-encoding.js <ruta-al-archivo>');
  process.exit(1);
}

const abs = path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
if (!fs.existsSync(abs)) {
  console.error('Archivo no encontrado:', abs);
  process.exit(1);
}

const backup = `${abs}.bak`;
fs.copyFileSync(abs, backup);
console.log('Backup creado en', backup);

const buf = fs.readFileSync(abs);
const text = buf.toString('utf8');
fs.writeFileSync(abs, text, { encoding: 'utf8' });
console.log('Archivo re-guardado en UTF-8 (bytes inválidos reemplazados).');
