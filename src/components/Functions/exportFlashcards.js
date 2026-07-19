/**
 * Download helpers for flashcard export formats.
 */

function downloadBlob(filename, content, mimeType) {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function safeFilename(name) {
  return String(name || 'flashcards')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'flashcards';
}

export function exportCardsAsCSV(cards, subjectName) {
  const rows = [['Question', 'Answer']];
  cards.forEach((card) => {
    rows.push([
      escapeCsv(card.question),
      escapeCsv(card.answer),
    ]);
  });
  const csv = rows.map((row) => row.join(',')).join('\n');
  downloadBlob(`${safeFilename(subjectName)}.csv`, csv, 'text/csv;charset=utf-8;');
}

export function exportCardsAsJSON(cards, subjectName) {
  const data = cards.map((card) => ({
    question: card.question || '',
    answer: card.answer || '',
    frontMode: card.frontMode ?? 0,
    backMode: card.backMode ?? 0,
  }));
  downloadBlob(
    `${safeFilename(subjectName)}.json`,
    JSON.stringify(data, null, 2),
    'application/json'
  );
}

export function exportCardsAsTXT(cards, subjectName) {
  const text = cards
    .map((card) => `${card.question || ''}\n${card.answer || ''}`)
    .join('\n\n');
  downloadBlob(`${safeFilename(subjectName)}.txt`, text, 'text/plain;charset=utf-8;');
}
