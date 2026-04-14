import { useState } from 'react';

interface ExtractionResult {
  [key: string]: string | number | null;
}

interface ScoreSet {
  accuracy: number;
  completeness: number;
  formatCompliance: number;
  overall: number;
}

interface ComparisonResult {
  output: ExtractionResult;
  scores: ScoreSet;
  raw: string;
}

const DEFAULT_PROMPT_A =
  'Extract the vendor name, date, and total from this document.';

const DEFAULT_PROMPT_B =
  'Extract structured data from this invoice. For numeric fields, return only digits and decimal points. For dates, use ISO format (YYYY-MM-DD). Return null for fields not found. Output as JSON.';

const SAMPLE_DOCUMENT = `INVOICE

From: ACME Corp.
123 Industrial Blvd
Springfield, IL 62704

Invoice Number: INV-2026-0312
Invoice Date: March 15, 2026

Bill To:
Globex Corporation
742 Evergreen Terrace
Shelbyville, IL 62565

Description                  Qty    Unit Price    Amount
---------------------------------------------------------
Widget Assembly               50      $12.50      $625.00
Gadget Calibration            10      $45.00      $450.00
Maintenance Contract           1     $159.56      $159.56

                              Subtotal:         $1,234.56
                              Tax (0%):             $0.00
                              Total:            $1,234.56

Payment Terms: Net 30
Due Date: April 14, 2026`;

const MOCK_RESULT_A: ExtractionResult = {
  vendor: 'ACME Corp.',
  date: 'March 15, 2026',
  total: '$1,234.56',
};

const MOCK_RESULT_B: ExtractionResult = {
  vendor_name: 'ACME Corp',
  invoice_number: 'INV-2026-0312',
  invoice_date: '2026-03-15',
  total_amount: 1234.56,
  tax: 0.0,
  payment_terms: 'Net 30',
  due_date: '2026-04-14',
};

const SCORES_A: ScoreSet = {
  accuracy: 0.72,
  completeness: 0.43,
  formatCompliance: 0.35,
  overall: 0.50,
};

const SCORES_B: ScoreSet = {
  accuracy: 0.96,
  completeness: 0.92,
  formatCompliance: 0.98,
  overall: 0.95,
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const barColor =
    pct >= 80
      ? 'var(--color-accent)'
      : pct >= 60
        ? '#f59e0b'
        : '#ef4444';

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--color-muted)' }}>{label}</span>
        <span style={{ color: 'var(--color-text)' }} className="font-mono font-semibold">
          {pct}%
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

function ResultPanel({
  label,
  result,
  isWinner,
}: {
  label: string;
  result: ComparisonResult | null;
  isWinner: boolean;
}) {
  if (!result) return null;

  return (
    <div
      className="rounded-lg p-4 relative"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: isWinner
          ? '2px solid var(--color-accent)'
          : '1px solid var(--color-border)',
      }}
    >
      {isWinner && (
        <div
          className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
          }}
        >
          Winner
        </div>
      )}
      <h4
        className="text-sm font-semibold mb-3 mt-1"
        style={{ color: 'var(--color-text)' }}
      >
        {label} Output
      </h4>

      <pre
        className="text-xs font-mono p-3 rounded overflow-x-auto mb-4 leading-relaxed"
        style={{
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
        }}
      >
        {result.raw}
      </pre>

      <h4
        className="text-sm font-semibold mb-2"
        style={{ color: 'var(--color-text)' }}
      >
        Scores
      </h4>
      <ScoreBar label="Accuracy" value={result.scores.accuracy} />
      <ScoreBar label="Completeness" value={result.scores.completeness} />
      <ScoreBar label="Format Compliance" value={result.scores.formatCompliance} />

      <div
        className="mt-3 pt-3 flex justify-between items-center"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-muted)' }}
        >
          Overall
        </span>
        <span
          className="text-lg font-bold font-mono"
          style={{ color: 'var(--color-accent)' }}
        >
          {Math.round(result.scores.overall * 100)}%
        </span>
      </div>
    </div>
  );
}

export default function PromptLab() {
  const [promptA, setPromptA] = useState(DEFAULT_PROMPT_A);
  const [promptB, setPromptB] = useState(DEFAULT_PROMPT_B);
  const [document, setDocument] = useState(SAMPLE_DOCUMENT);
  const [resultA, setResultA] = useState<ComparisonResult | null>(null);
  const [resultB, setResultB] = useState<ComparisonResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleRun = () => {
    setRunning(true);
    setResultA(null);
    setResultB(null);

    setTimeout(() => {
      setResultA({
        output: MOCK_RESULT_A,
        scores: SCORES_A,
        raw: JSON.stringify(MOCK_RESULT_A, null, 2),
      });

      setTimeout(() => {
        setResultB({
          output: MOCK_RESULT_B,
          scores: SCORES_B,
          raw: JSON.stringify(MOCK_RESULT_B, null, 2),
        });
        setRunning(false);
      }, 600);
    }, 1200);
  };

  const winnerA =
    resultA && resultB ? resultA.scores.overall > resultB.scores.overall : false;
  const winnerB =
    resultA && resultB ? resultB.scores.overall > resultA.scores.overall : false;

  return (
    <div className="space-y-6">
      {/* Prompt inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--color-text)' }}
          >
            Prompt A
          </label>
          <textarea
            className="w-full h-32 p-3 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              focusRingColor: 'var(--color-accent)',
            }}
            value={promptA}
            onChange={(e) => setPromptA(e.target.value)}
            placeholder="Enter extraction prompt..."
          />
        </div>
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: 'var(--color-text)' }}
          >
            Prompt B
          </label>
          <textarea
            className="w-full h-32 p-3 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
            placeholder="Enter extraction prompt..."
          />
        </div>
      </div>

      {/* Sample document */}
      <div>
        <label
          className="block text-sm font-semibold mb-2"
          style={{ color: 'var(--color-text)' }}
        >
          Sample Document
        </label>
        <textarea
          className="w-full h-48 p-3 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-2"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          }}
          value={document}
          onChange={(e) => setDocument(e.target.value)}
        />
      </div>

      {/* Run button */}
      <div className="flex justify-center">
        <button
          onClick={handleRun}
          disabled={running || !promptA.trim() || !promptB.trim()}
          className="px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-bg)',
          }}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Running Comparison...
            </span>
          ) : (
            'Run Comparison'
          )}
        </button>
      </div>

      {/* Results */}
      {(resultA || running) && (
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Results
          </h3>

          {/* Pipeline indicator */}
          <div
            className="flex items-center justify-center gap-2 mb-6 p-3 rounded-lg text-xs font-mono"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
            }}
          >
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              Document
            </span>
            <span style={{ color: 'var(--color-accent)' }}>&#8594;</span>
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              Prompt + Context
            </span>
            <span style={{ color: 'var(--color-accent)' }}>&#8594;</span>
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              LLM Extraction
            </span>
            <span style={{ color: 'var(--color-accent)' }}>&#8594;</span>
            <span
              className="px-2 py-1 rounded"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              Scoring
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultA ? (
              <ResultPanel label="Prompt A" result={resultA} isWinner={winnerA} />
            ) : (
              <div
                className="rounded-lg p-8 flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="text-sm animate-pulse"
                  style={{ color: 'var(--color-muted)' }}
                >
                  Processing Prompt A...
                </span>
              </div>
            )}
            {resultB ? (
              <ResultPanel label="Prompt B" result={resultB} isWinner={winnerB} />
            ) : running ? (
              <div
                className="rounded-lg p-8 flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  className="text-sm animate-pulse"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {resultA ? 'Processing Prompt B...' : 'Waiting...'}
                </span>
              </div>
            ) : null}
          </div>

          {/* Summary */}
          {resultA && resultB && (
            <div
              className="mt-6 p-4 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-muted)',
              }}
            >
              <p className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Analysis
              </p>
              <p>
                <strong>Prompt B</strong> scored{' '}
                {Math.round(SCORES_B.overall * 100 - SCORES_A.overall * 100)} points
                higher overall. Key improvements: ISO date formatting eliminates ambiguity,
                numeric types enable downstream calculations without parsing, and explicit
                null handling prevents missing-field errors. The structured prompt also
                extracted {Object.keys(MOCK_RESULT_B).length - Object.keys(MOCK_RESULT_A).length}{' '}
                additional fields (invoice number, tax, payment terms, due date).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
