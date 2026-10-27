import http from 'node:http';
import fs from 'node:fs';
import { URL } from 'node:url';
import { program } from 'commander';

program.helpOption('--help', 'відобразити довідку');

program
  .requiredOption('-i, --input <path>', 'шлях до файлу даних')
  .requiredOption('-h, --host <address>', 'адреса сервера')
  .requiredOption('-p, --port <number>', 'порт сервера')
  .option('-o, --output <path>', 'файл, у який записується остання надіслана відповідь');

program.parse(process.argv);
const options = program.opts();