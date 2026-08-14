import JSZip from 'jszip';
import initSqlJs from 'sql.js';

const FIELD_SEP = String.fromCharCode(31);

function decodeHtml(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

function modelsById(colRow) {
  try {
    const parsed = JSON.parse(colRow.models || '{}');
    return parsed;
  } catch {
    return {};
  }
}

function isClozeModel(model) {
  const type = model?.type;
  if (type === 1) return true;
  const names = JSON.stringify(model || {}).toLowerCase();
  return names.includes('cloze');
}

export async function parseApkgFile(file) {
  const zip = await JSZip.loadAsync(file);
  const dbFile =
    zip.file('collection.anki21') ||
    zip.file('collection.anki2') ||
    zip.file('collection.anki21b');
  if (!dbFile) {
    throw new Error('This APKG file does not contain an Anki collection');
  }

  const SQL = await initSqlJs({
    locateFile: (wasmFile) => `https://sql.js.org/dist/${wasmFile}`,
  });
  const bytes = await dbFile.async('uint8array');
  const db = new SQL.Database(bytes);

  const col = db.exec('SELECT models FROM col');
  const models = modelsById(col?.[0]?.values?.[0] ? { models: col[0].values[0][0] } : {});

  const notes = db.exec('SELECT mid, flds FROM notes');
  const rows = notes?.[0]?.values || [];
  const cards = [];

  rows.forEach((row) => {
    const mid = String(row[0]);
    const fields = String(row[1] || '').split(FIELD_SEP).map(decodeHtml);
    if (!fields[0]) return;
    const model = models[mid];
    if (isClozeModel(model) || /\{\{c\d+::/.test(fields[0])) {
      const clozeText = fields[0];
      const first = clozeText.replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, '$1');
      cards.push({
        question: clozeText,
        answer: fields[1] || first,
        frontMode: 0,
        backMode: 0,
      });
      return;
    }
    cards.push({
      question: fields[0],
      answer: fields[1] || fields[0],
      frontMode: 0,
      backMode: 0,
    });
  });

  db.close();
  const usable = cards.filter((card) => card.question && card.answer);
  if (usable.length === 0) {
    throw new Error('No notes found in this APKG file');
  }
  return usable;
}
