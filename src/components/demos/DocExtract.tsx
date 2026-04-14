import { useState, useRef, useCallback } from 'react';
import Tesseract from 'tesseract.js';

interface SchemaField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number';
  pattern: RegExp;
}

interface ExtractionResult {
  field: string;
  label: string;
  type: string;
  value: string;
  confidence: number;
}

type OcrMode = 'vision' | 'ocr_only' | 'hybrid';

const SCHEMA_FIELDS: SchemaField[] = [
  {
    name: 'vendor_name',
    label: 'Vendor Name',
    type: 'text',
    pattern: /(?:vendor|company|from|bill\s*from|supplier)[:\s]*([A-Z][A-Za-z\s&.,]+)/i,
  },
  {
    name: 'invoice_number',
    label: 'Invoice Number',
    type: 'text',
    pattern: /(?:invoice\s*(?:#|no\.?|number)[:\s]*)([\w-]+)/i,
  },
  {
    name: 'invoice_date',
    label: 'Invoice Date',
    type: 'date',
    pattern: /(?:date|invoice\s*date|issued)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i,
  },
  {
    name: 'total_amount',
    label: 'Total Amount',
    type: 'number',
    pattern: /(?:total|amount\s*due|grand\s*total|balance\s*due)[:\s]*\$?([\d,]+\.?\d*)/i,
  },
  {
    name: 'currency',
    label: 'Currency',
    type: 'text',
    pattern: /(?:currency)[:\s]*([A-Z]{3})|(\$|USD|EUR|GBP|PHP)/i,
  },
];

const MOCK_VISION_RESULTS: ExtractionResult[] = [
  { field: 'vendor_name', label: 'Vendor Name', type: 'text', value: 'Acme Solutions Inc.', confidence: 0.97 },
  { field: 'invoice_number', label: 'Invoice Number', type: 'text', value: 'INV-2026-0451', confidence: 0.99 },
  { field: 'invoice_date', label: 'Invoice Date', type: 'date', value: 'March 28, 2026', confidence: 0.95 },
  { field: 'total_amount', label: 'Total Amount', type: 'number', value: '4,250.00', confidence: 0.96 },
  { field: 'currency', label: 'Currency', type: 'text', value: 'USD', confidence: 0.98 },
];

const SAMPLE_OCR_TEXT = `INVOICE

From: Acme Solutions Inc.
123 Business Park Drive
San Francisco, CA 94105

Invoice Number: INV-2026-0451
Invoice Date: March 28, 2026

Bill To:
Widget Corp
456 Commerce Street
New York, NY 10001

Description                  Qty    Unit Price    Amount
---------------------------------------------------------
Consulting Services           40      $75.00    $3,000.00
Software License               1   $1,000.00    $1,000.00
Support Plan (Annual)          1     $250.00      $250.00

                              Subtotal:         $4,250.00
                              Tax (0%):             $0.00
                              Total:             $4,250.00

Currency: USD
Payment Terms: Net 30
Due Date: April 27, 2026`;

function extractFieldsFromText(text: string): ExtractionResult[] {
  return SCHEMA_FIELDS.map((field) => {
    const match = text.match(field.pattern);
    let value = '';
    let confidence = 0;

    if (match) {
      value = (match[1] || match[2] || '').trim();
      confidence = value.length > 0 ? 0.6 + Math.random() * 0.3 : 0;
    }

    return {
      field: field.name,
      label: field.label,
      type: field.type,
      value: value || '--',
      confidence,
    };
  });
}

function confidenceColor(c: number): string {
  if (c >= 0.9) return '#22c55e';
  if (c >= 0.7) return '#eab308';
  if (c > 0) return '#ef4444';
  return 'var(--color-muted)';
}

function confidenceLabel(c: number): string {
  if (c >= 0.9) return 'High';
  if (c >= 0.7) return 'Medium';
  if (c > 0) return 'Low';
  return 'N/A';
}

export default function DocExtract() {
  const [mode, setMode] = useState<OcrMode>('ocr_only');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showRawText, setShowRawText] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [usedSample, setUsedSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setImageUrl(null);
    setRawText('');
    setResults([]);
    setProgress(0);
    setShowRawText(false);
    setUsedSample(false);
  }, []);

  const runVisionExtraction = useCallback(async (): Promise<{ text: string; results: ExtractionResult[] }> => {
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    return { text: SAMPLE_OCR_TEXT, results: MOCK_VISION_RESULTS };
  }, []);

  const runOcrExtraction = useCallback(async (imageSource: string): Promise<{ text: string; results: ExtractionResult[] }> => {
    const { data } = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });
    const text = data.text;
    const extracted = extractFieldsFromText(text);
    return { text, results: extracted };
  }, []);

  const processImage = useCallback(async (imageSource: string, isSample: boolean) => {
    setProcessing(true);
    setProgress(0);
    setResults([]);
    setRawText('');

    try {
      if (mode === 'vision') {
        const vision = await runVisionExtraction();
        setRawText(vision.text);
        setResults(vision.results);
      } else if (mode === 'ocr_only') {
        if (isSample) {
          setProgress(100);
          setRawText(SAMPLE_OCR_TEXT);
          setResults(extractFieldsFromText(SAMPLE_OCR_TEXT));
        } else {
          const ocr = await runOcrExtraction(imageSource);
          setRawText(ocr.text);
          setResults(ocr.results);
        }
      } else {
        // Hybrid: run both, prefer vision results but show OCR text
        const [vision, ocrResult] = await Promise.all([
          runVisionExtraction(),
          isSample
            ? Promise.resolve({ text: SAMPLE_OCR_TEXT, results: extractFieldsFromText(SAMPLE_OCR_TEXT) })
            : runOcrExtraction(imageSource),
        ]);

        setRawText(ocrResult.text);

        // Merge: use vision value if confidence is higher, otherwise OCR
        const merged = vision.results.map((vr) => {
          const ocrMatch = ocrResult.results.find((o) => o.field === vr.field);
          if (!ocrMatch || vr.confidence >= ocrMatch.confidence) return vr;
          return ocrMatch;
        });
        setResults(merged);
      }
    } catch (err) {
      console.error('Extraction failed:', err);
      setRawText('Error during extraction. Please try a different image.');
    } finally {
      setProcessing(false);
    }
  }, [mode, runVisionExtraction, runOcrExtraction]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    resetState();
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setUsedSample(false);
    processImage(url, false);
  }, [resetState, processImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSample = useCallback(() => {
    resetState();
    setUsedSample(true);
    setImageUrl(null);
    processImage('', true);
  }, [resetState, processImage]);

  const modeOptions: { value: OcrMode; label: string; desc: string }[] = [
    { value: 'vision', label: 'Vision', desc: 'Simulated AI extraction' },
    { value: 'ocr_only', label: 'OCR Only', desc: 'Tesseract.js' },
    { value: 'hybrid', label: 'Hybrid', desc: 'Both combined' },
  ];

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>
          OCR MODE
        </h3>
        <div className="flex gap-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              disabled={processing}
              className="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: mode === opt.value ? 'var(--color-accent)' : 'transparent',
                color: mode === opt.value ? 'var(--color-bg)' : 'var(--color-text)',
                border: mode === opt.value ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                opacity: processing ? 0.5 : 1,
              }}
            >
              <span className="block">{opt.label}</span>
              <span
                className="block text-xs mt-0.5"
                style={{ color: mode === opt.value ? 'var(--color-bg)' : 'var(--color-muted)', opacity: 0.8 }}
              >
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Schema Fields */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>
          EXTRACTION SCHEMA
        </h3>
        <div className="flex flex-wrap gap-2">
          {SCHEMA_FIELDS.map((f) => (
            <span
              key={f.name}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono"
              style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {f.label}
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-sans font-medium"
                style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-muted)' }}
              >
                {f.type}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="rounded-lg p-8 text-center transition-colors cursor-pointer"
        style={{
          backgroundColor: dragOver ? 'var(--color-accent)' : 'var(--color-surface)',
          border: `2px dashed ${dragOver ? 'var(--color-accent)' : 'var(--color-border)'}`,
          opacity: processing ? 0.5 : 1,
          color: dragOver ? 'var(--color-bg)' : 'var(--color-muted)',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !processing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="text-4xl mb-2" style={{ color: 'var(--color-border)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p className="text-sm font-medium">Drop an image here, or click to browse</p>
        <p className="text-xs mt-1">Supports PNG, JPG, TIFF, BMP</p>
      </div>

      {/* Sample Button */}
      <div className="text-center">
        <button
          onClick={handleSample}
          disabled={processing}
          className="text-sm font-medium px-4 py-2 rounded-md transition-colors cursor-pointer"
          style={{
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
            backgroundColor: 'transparent',
            opacity: processing ? 0.5 : 1,
          }}
        >
          Use Sample Invoice
        </button>
      </div>

      {/* Preview */}
      {imageUrl && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>
            UPLOADED IMAGE
          </h3>
          <img
            src={imageUrl}
            alt="Uploaded document"
            className="max-h-64 mx-auto rounded"
            style={{ border: '1px solid var(--color-border)' }}
          />
        </div>
      )}

      {/* Progress */}
      {processing && (
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {mode === 'vision' ? 'Running vision extraction...' : `Running OCR... ${progress}%`}
            </span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: mode === 'vision' ? '100%' : `${progress}%`,
                backgroundColor: 'var(--color-accent)',
                animation: mode === 'vision' ? 'pulse 1.5s ease-in-out infinite' : undefined,
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !processing && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-muted)' }}>
              EXTRACTION RESULTS
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Mode: {modeOptions.find((o) => o.value === mode)?.label}
              {usedSample ? ' (sample data)' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg)' }}>
                  <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--color-muted)' }}>Field</th>
                  <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--color-muted)' }}>Type</th>
                  <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--color-muted)' }}>Extracted Value</th>
                  <th className="text-left px-4 py-2 font-semibold" style={{ color: 'var(--color-muted)' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={r.field}
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-bg)',
                    }}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text)' }}>
                      {r.label}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>
                      {r.value}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.round(r.confidence * 100)}%`,
                              backgroundColor: confidenceColor(r.confidence),
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: confidenceColor(r.confidence) }}>
                          {r.confidence > 0 ? `${Math.round(r.confidence * 100)}%` : '--'}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          {confidenceLabel(r.confidence)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw OCR Text */}
      {rawText && !processing && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
            style={{ color: 'var(--color-text)' }}
          >
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
              RAW OCR TEXT
            </h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: showRawText ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
                color: 'var(--color-muted)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showRawText && (
            <div className="px-4 pb-4">
              <pre
                className="text-xs font-mono whitespace-pre-wrap p-4 rounded-md overflow-auto max-h-80"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {rawText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
