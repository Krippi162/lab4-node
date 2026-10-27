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
fs.access(options.input, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('Cannot find input file');
    process.exit(1);
  }
  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${options.host}:${options.port}`);

    // Обробка неіснуючих маршрутів (код 404)
    if (reqUrl.pathname !== '/') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Шлях не знайдено (404)');
      return;
    }
    fs.readFile(options.input, 'utf-8', (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Помилка сервера: не вдалося прочитати файл даних');
        return;
      }
      try {
        // Парсимо NDJSON (кожен рядок - окремий JSON об'єкт)
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const records = lines.map(line => JSON.parse(line));

        // Зчитуємо параметри запиту
        const survivedParam = reqUrl.searchParams.get('survived') === 'true';
        const ageParam = reqUrl.searchParams.get('age') === 'true';

        let result = [];

        for (const item of records) {
          // Якщо стоїть прапорець survived=true, залишаємо лише тих, хто вижив
          if (survivedParam) {
            const s = item.Survived;
            // У даних Survived зазвичай 1 (число) або "1" або true
            if (s != 1 && s !== '1' && s !== true && String(s).toLowerCase() !== 'true') {
              continue; // Пропускаємо, якщо не вижив
            }
          }

          // Формуємо об'єкт (порядок полів важливий)
          const formatted = {
            name: item.Name
          };

          if (ageParam) {
            // Рішення студента: Якщо вік не вказано або порожній, віддаємо null
            if (item.Age !== undefined && item.Age !== null && item.Age !== '') {
              formatted.age = Number(item.Age);
            } else {
              formatted.age = null;
            }
          }

          formatted.ticket = item.Ticket;
          
          result.push(formatted);
        }

        const jsonResult = JSON.stringify(result, null, 2);
        