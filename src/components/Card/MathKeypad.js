import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'algebra', label: 'Algebra' },
  { id: 'trig', label: 'Trig' },
  { id: 'calc', label: 'Calc' },
  { id: 'greek', label: 'Greek' },
];

/**
 * Each key:
 * - label: button display
 * - type: 'cmd' | 'write' | 'typed' | 'keystroke'
 * - value: payload for MathQuill
 */
const KEYS = {
  basic: [
    { label: '+', type: 'typed', value: '+' },
    { label: '−', type: 'typed', value: '-' },
    { label: '×', type: 'cmd', value: '\\times' },
    { label: '÷', type: 'cmd', value: '\\div' },
    { label: '=', type: 'typed', value: '=' },
    { label: '≠', type: 'cmd', value: '\\neq' },
    { label: '<', type: 'typed', value: '<' },
    { label: '>', type: 'typed', value: '>' },
    { label: '≤', type: 'cmd', value: '\\le' },
    { label: '≥', type: 'cmd', value: '\\ge' },
    { label: '(', type: 'typed', value: '(' },
    { label: ')', type: 'typed', value: ')' },
    { label: '[', type: 'typed', value: '[' },
    { label: ']', type: 'typed', value: ']' },
    { label: '|□|', type: 'cmd', value: '|' },
    { label: '±', type: 'cmd', value: '\\pm' },
    { label: '·', type: 'cmd', value: '\\cdot' },
    { label: ',', type: 'typed', value: ',' },
    { label: '.', type: 'typed', value: '.' },
    { label: '⌫', type: 'keystroke', value: 'Backspace', wide: true },
  ],
  algebra: [
    { label: 'x²', type: 'write', value: '^{2}' },
    { label: 'xⁿ', type: 'cmd', value: '^' },
    { label: 'xₙ', type: 'cmd', value: '_' },
    { label: '√', type: 'cmd', value: '\\sqrt' },
    { label: 'ⁿ√', type: 'cmd', value: '\\nthroot' },
    { label: 'a/b', type: 'cmd', value: '\\frac' },
    { label: 'x/y', type: 'cmd', value: '/' },
    { label: 'log', type: 'cmd', value: '\\log' },
    { label: 'ln', type: 'cmd', value: '\\ln' },
    { label: 'logₙ', type: 'write', value: '\\log_{}' },
    { label: 'e', type: 'typed', value: 'e' },
    { label: 'eˣ', type: 'write', value: 'e^{}' },
    { label: '10ˣ', type: 'write', value: '10^{}' },
    { label: '∞', type: 'cmd', value: '\\infty' },
    { label: '%', type: 'typed', value: '%' },
    { label: '°', type: 'write', value: '^{\\circ}' },
  ],
  trig: [
    { label: 'sin', type: 'cmd', value: '\\sin' },
    { label: 'cos', type: 'cmd', value: '\\cos' },
    { label: 'tan', type: 'cmd', value: '\\tan' },
    { label: 'csc', type: 'cmd', value: '\\csc' },
    { label: 'sec', type: 'cmd', value: '\\sec' },
    { label: 'cot', type: 'cmd', value: '\\cot' },
    { label: 'sin⁻¹', type: 'cmd', value: '\\arcsin' },
    { label: 'cos⁻¹', type: 'cmd', value: '\\arccos' },
    { label: 'tan⁻¹', type: 'cmd', value: '\\arctan' },
    { label: 'sinh', type: 'cmd', value: '\\sinh' },
    { label: 'cosh', type: 'cmd', value: '\\cosh' },
    { label: 'tanh', type: 'cmd', value: '\\tanh' },
  ],
  calc: [
    { label: '∫', type: 'cmd', value: '\\int' },
    { label: '∫ₐᵇ', type: 'write', value: '\\int_{}^{}' },
    { label: '∑', type: 'cmd', value: '\\sum' },
    { label: '∑ᵢⁿ', type: 'write', value: '\\sum_{}^{}' },
    { label: '∏', type: 'cmd', value: '\\prod' },
    { label: 'lim', type: 'cmd', value: '\\lim' },
    { label: 'limₓ→', type: 'write', value: '\\lim_{x\\to}' },
    { label: 'd/dx', type: 'write', value: '\\frac{d}{dx}' },
    { label: '∂/∂x', type: 'write', value: '\\frac{\\partial}{\\partial x}' },
    { label: '∂', type: 'cmd', value: '\\partial' },
    { label: '∇', type: 'cmd', value: '\\nabla' },
    { label: '→', type: 'cmd', value: '\\to' },
  ],
  greek: [
    { label: 'π', type: 'cmd', value: '\\pi' },
    { label: 'θ', type: 'cmd', value: '\\theta' },
    { label: 'α', type: 'cmd', value: '\\alpha' },
    { label: 'β', type: 'cmd', value: '\\beta' },
    { label: 'γ', type: 'cmd', value: '\\gamma' },
    { label: 'δ', type: 'cmd', value: '\\delta' },
    { label: 'Δ', type: 'cmd', value: '\\Delta' },
    { label: 'λ', type: 'cmd', value: '\\lambda' },
    { label: 'μ', type: 'cmd', value: '\\mu' },
    { label: 'σ', type: 'cmd', value: '\\sigma' },
    { label: 'Σ', type: 'cmd', value: '\\Sigma' },
    { label: 'φ', type: 'cmd', value: '\\phi' },
    { label: 'ω', type: 'cmd', value: '\\omega' },
    { label: 'Ω', type: 'cmd', value: '\\Omega' },
    { label: 'ε', type: 'cmd', value: '\\epsilon' },
    { label: 'ρ', type: 'cmd', value: '\\rho' },
  ],
};

function applyKey(mathField, key) {
  if (!mathField) return;
  try {
    if (key.type === 'cmd') mathField.cmd(key.value);
    else if (key.type === 'write') mathField.write(key.value);
    else if (key.type === 'typed') mathField.typedText(key.value);
    else if (key.type === 'keystroke') mathField.keystroke(key.value);
    mathField.focus();
  } catch (err) {
    console.error('Math keypad insert failed:', err);
  }
}

/**
 * Desmos-style keypad for MathQuill EditableMathField.
 * Collapsible so users can hide it when typing from a keyboard.
 */
function MathKeypad({ mathField, onChange, defaultExpanded = true }) {
  const [tab, setTab] = useState('basic');
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handlePress = (key) => {
    if (!mathField) return;
    applyKey(mathField, key);
    if (onChange) onChange(mathField.latex());
  };

  return (
    <div className="mt-3 rounded-2xl bg-black/20 border border-white/15 overflow-hidden">
      <div className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 text-left"
          aria-expanded={expanded}
        >
          <p className="text-sm font-bold text-white">Math keypad</p>
          <p className="text-xs text-white/50">
            {expanded ? 'Tap keys to insert symbols' : 'Expand for powers, trig, integrals, and more'}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse math keypad' : 'Expand math keypad'}
          aria-expanded={expanded}
          className="shrink-0 w-9 h-9 rounded-full bg-purple-500 hover:bg-purple-400 text-white
            flex items-center justify-center background-shadow-new background-hover"
        >
          {expanded ? <ChevronUp size={18} strokeWidth={3} /> : <ChevronDown size={18} strokeWidth={3} />}
        </button>
      </div>

      {expanded && (
        <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 border-t border-white/10 pt-2.5">
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold background-shadow-new background-hover
                  ${tab === t.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {KEYS[tab].map((key) => (
              <button
                key={`${tab}-${key.label}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePress(key)}
                className={`h-10 rounded-xl text-sm font-bold
                  bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                  background-shadow-new background-hover
                  ${key.wide ? 'col-span-2' : ''}`}
              >
                {key.label}
              </button>
            ))}
          </div>

          {!mathField && (
            <p className="text-xs text-white/50 mt-2 text-center">
              Tap the math field first, then use the keys
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default MathKeypad;
