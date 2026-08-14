import { answersMatchLoose } from './gradeAnswer';

export { answersMatchLoose };

const CLOZE_RE = /\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g;

export function hasClozeMarkup(text) {
  return /\{\{c\d+::/.test(String(text || ''));
}

function resultFromSegments(segments) {
  const answers = [];
  const prompt = (segments || [])
    .map((segment) => {
      if (segment?.type === 'blank') {
        answers.push(String(segment.answer || '').trim());
        return '_____';
      }
      return segment?.value ?? '';
    })
    .join('');
  return { prompt, answers, segments: segments || [] };
}

function pushText(segments, value) {
  if (!value) return;
  const last = segments[segments.length - 1];
  if (last?.type === 'text') {
    last.value += value;
    return;
  }
  segments.push({ type: 'text', value });
}

export function renderCloze(text) {
  const source = String(text || '');
  const segments = [];
  const re = new RegExp(CLOZE_RE.source, 'g');
  let lastIndex = 0;
  let match = re.exec(source);
  while (match) {
    pushText(segments, source.slice(lastIndex, match.index));
    const answer = String(match[1] || '').trim();
    segments.push({ type: 'blank', answer });
    lastIndex = match.index + match[0].length;
    match = re.exec(source);
  }
  pushText(segments, source.slice(lastIndex));
  if (segments.length === 0) {
    return resultFromSegments([{ type: 'text', value: source }]);
  }
  return resultFromSegments(segments);
}

const LONG_WORD = /^[A-Za-z0-9][A-Za-z0-9'-]{2,}[.,!?;:]*$/;
const ANY_WORD = /^[A-Za-z0-9][A-Za-z0-9'-]*[.,!?;:]*$/;
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as', 'into', 'about', 'than',
  'that', 'this', 'these', 'those', 'it', 'its', 'what', 'which', 'who', 'whom', 'whose',
  'when', 'where', 'why', 'how', 'do', 'does', 'did', 'can', 'could', 'would', 'should',
  'will', 'not', 'no', 'if', 'then', 'so', 'such', 'there', 'here',
]);

function tokenCore(token) {
  return String(token || '').replace(/[.,!?;:]+$/g, '');
}

function collectWordIndexes(tokens) {
  const content = [];
  const long = [];
  const any = [];
  tokens.forEach((token, index) => {
    if (!ANY_WORD.test(token)) return;
    any.push(index);
    if (!LONG_WORD.test(token)) return;
    long.push(index);
    if (!STOP_WORDS.has(tokenCore(token).toLowerCase())) content.push(index);
  });
  return content.length ? content : long.length ? long : any;
}

function pickHiddenIndexes(tokens, wordIndexes, ratio) {
  const totalWords = wordIndexes.length;
  const wanted = Math.max(1, Math.round(totalWords * ratio));
  const maxHide = totalWords > 1 ? Math.max(1, totalWords - 1) : 1;
  const hideCount = Math.min(maxHide, Math.max(1, wanted));
  const ranked = [...wordIndexes].sort((a, b) => {
    const lengthDelta = tokenCore(tokens[b]).length - tokenCore(tokens[a]).length;
    if (lengthDelta !== 0) return lengthDelta;
    return Math.random() - 0.5;
  });
  return new Set(ranked.slice(0, hideCount));
}

export function autoCloze(text, ratio = 0.4) {
  let source = String(text || '').trim();
  if (hasClozeMarkup(source)) {
    const marked = renderCloze(source);
    if ((marked.answers || []).length) return marked;
    source = decodeCloze(source).trim();
  }
  if (!source) return resultFromSegments([]);

  const tokens = source.split(/(\s+)/);
  const wordIndexes = collectWordIndexes(tokens);

  if (wordIndexes.length === 0) {
    return resultFromSegments([{ type: 'blank', answer: source }]);
  }

  const hidden = pickHiddenIndexes(tokens, wordIndexes, ratio);
  const segments = [];
  tokens.forEach((token, index) => {
    if (!hidden.has(index)) {
      pushText(segments, token);
      return;
    }
    const answer = tokenCore(token);
    segments.push({ type: 'blank', answer });
    pushText(segments, token.slice(answer.length));
  });

  return resultFromSegments(segments);
}

export function decodeCloze(text) {
  return String(text || '').replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, '$1');
}

function emptySide() {
  return resultFromSegments([]);
}

function clozeSide(text, ratio) {
  const source = String(text || '').trim();
  if (!source) return emptySide();
  const result = autoCloze(source, ratio);
  if ((result.answers || []).length) return result;
  const decoded = decodeCloze(source).trim();
  if (!decoded) return emptySide();
  return resultFromSegments([{ type: 'blank', answer: decoded }]);
}

function blanksFromAnswers(answers) {
  const segments = [];
  (answers || []).forEach((answer) => {
    if (!answer) return;
    if (segments.length) pushText(segments, ' ');
    segments.push({ type: 'blank', answer: String(answer).trim() });
  });
  return resultFromSegments(segments);
}

export function cipherFromCard(card) {
  const question = String(card?.question || '').trim();
  const answer = String(card?.answer || '').trim();
  const decodedQ = decodeCloze(question).trim();
  const decodedA = decodeCloze(answer).trim();

  let front = clozeSide(question, 0.4);
  let back = clozeSide(answer, 0.5);

  if (!(back.answers || []).length) {
    if (decodedA) back = clozeSide(decodedA, 0.5);
    else if ((front.answers || []).length) back = blanksFromAnswers(front.answers);
    else if (decodedQ) back = clozeSide(decodedQ, 0.5);
  }

  if (!(front.answers || []).length) {
    if (decodedQ) front = clozeSide(decodedQ, 0.4);
    else if (decodedA) front = clozeSide(decodedA, 0.4);
  }

  return {
    front,
    back,
    answers: [...(front.answers || []), ...(back.answers || [])],
  };
}

export function gradeCloze(guess, answers) {
  const expected = (answers || []).map((item) => String(item || '').trim()).filter(Boolean);
  if (expected.length === 0) return false;
  const parts = Array.isArray(guess)
    ? guess.map((part) => String(part || '').trim())
    : String(guess || '')
        .split(/[,/;|]|\s{2,}/)
        .map((part) => part.trim())
        .filter(Boolean);
  if (parts.length === expected.length) {
    return expected.every((answer, index) => answersMatchLoose(parts[index], answer));
  }
  return answersMatchLoose(Array.isArray(guess) ? guess.filter(Boolean).join(' ') : guess, expected.join(' '));
}
