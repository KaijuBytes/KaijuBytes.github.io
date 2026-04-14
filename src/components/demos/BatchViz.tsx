// Copyright (c) Orlando G. Martinez (Lanz) / KaijuBytes
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// -- Types --

interface Stage {
  id: number;
  label: string;
  category: 'processing' | 'review' | 'approved' | 'error';
}

interface Document {
  id: number;
  label: string;
  confidence: number;
  currentStage: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  route: 'hitl' | 'auto' | null;
  stageHistory: number[];
}

interface Metrics {
  processed: number;
  total: number;
  throughput: number;
  errorRate: number;
  avgConfidence: number;
  confidenceDist: number[];
}

// -- Constants --

const STAGES: Stage[] = [
  { id: 1, label: 'Upload', category: 'processing' },
  { id: 2, label: 'Page Split', category: 'processing' },
  { id: 3, label: 'Enhancement', category: 'processing' },
  { id: 4, label: 'OCR/Vision', category: 'processing' },
  { id: 5, label: 'AI Extraction', category: 'processing' },
  { id: 6, label: 'Sub-doc Detect', category: 'processing' },
  { id: 7, label: 'Merge', category: 'processing' },
  { id: 8, label: 'Field Validation', category: 'processing' },
  { id: 9, label: 'Confidence Check', category: 'review' },
  { id: 10, label: 'HITL Review', category: 'review' },
  { id: 11, label: 'Auto-Approve', category: 'approved' },
  { id: 12, label: 'Human Review', category: 'review' },
  { id: 13, label: 'Final Approval', category: 'approved' },
  { id: 14, label: 'PDB Export', category: 'approved' },
];

const CATEGORY_COLORS: Record<Stage['category'], { bg: string; border: string; text: string }> = {
  processing: { bg: '#1e40af20', border: '#3b82f6', text: '#3b82f6' },
  review: { bg: '#a1620020', border: '#eab308', text: '#eab308' },
  approved: { bg: '#05965320', border: '#22c55e', text: '#22c55e' },
  error: { bg: '#dc262620', border: '#ef4444', text: '#ef4444' },
};

const CONFIDENCE_THRESHOLD = 75;
const TICK_MS = 600;
const DOC_NAMES = ['INV-2024-001', 'PO-2024-087', 'RCV-2024-043', 'REQ-2024-112', 'RPT-2024-005'];

// -- Helpers --

function randomConfidence(): number {
  return Math.floor(Math.random() * 40 + 55); // 55-94
}

function buildRoute(confidence: number): number[] {
  const shared = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  if (confidence >= CONFIDENCE_THRESHOLD) {
    return [...shared, 11, 13, 14];
  }
  return [...shared, 10, 12, 13, 14];
}

function getConfidenceBucket(c: number): number {
  if (c < 60) return 0;
  if (c < 70) return 1;
  if (c < 80) return 2;
  if (c < 90) return 3;
  return 4;
}

// -- Layout calculations --

// Pipeline layout: stages 1-9 in a row, then branch, then converge
// We use a grid: row 0 = stages 1-9, row 1 left = HITL (10), row 1 right = Auto (11),
// row 2 = Human Review (12), row 3 = Final Approval (13), row 4 = PDB Export (14)

interface StagePosition {
  x: number;
  y: number;
  col: number;
  row: number;
}

function computeStagePositions(): Map<number, StagePosition> {
  const map = new Map<number, StagePosition>();
  const colW = 110;
  const rowH = 80;

  // Row 0: stages 1-9 (linear)
  for (let i = 0; i < 9; i++) {
    map.set(i + 1, { x: i * colW, y: 0, col: i, row: 0 });
  }

  // Branch from stage 9
  // HITL Review (10) - below left
  map.set(10, { x: 2 * colW, y: rowH * 1.5, col: 2, row: 1 });
  // Auto-Approve (11) - below right
  map.set(11, { x: 6 * colW, y: rowH * 1.5, col: 6, row: 1 });
  // Human Review (12) - below HITL
  map.set(12, { x: 2 * colW, y: rowH * 3, col: 2, row: 2 });
  // Final Approval (13) - center bottom
  map.set(13, { x: 4 * colW, y: rowH * 4.5, col: 4, row: 3 });
  // PDB Export (14) - center bottom
  map.set(14, { x: 4 * colW, y: rowH * 6, col: 4, row: 4 });

  return map;
}

const STAGE_POSITIONS = computeStagePositions();

// Connections between stages
const CONNECTIONS: [number, number, string][] = [
  [1, 2, 'default'],
  [2, 3, 'default'],
  [3, 4, 'default'],
  [4, 5, 'default'],
  [5, 6, 'default'],
  [6, 7, 'default'],
  [7, 8, 'default'],
  [8, 9, 'default'],
  [9, 10, 'hitl'],
  [9, 11, 'auto'],
  [10, 12, 'hitl'],
  [11, 13, 'auto'],
  [12, 13, 'hitl'],
  [13, 14, 'default'],
];

const NODE_W = 96;
const NODE_H = 44;

// -- Components --

function StageNode({ stage, activeDocIds }: { stage: Stage; activeDocIds: number[] }) {
  const pos = STAGE_POSITIONS.get(stage.id)!;
  const colors = CATEGORY_COLORS[stage.category];
  const isActive = activeDocIds.length > 0;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: stage.id * 0.04, duration: 0.3 }}
    >
      <rect
        x={pos.x}
        y={pos.y}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={colors.bg}
        stroke={isActive ? colors.border : 'var(--color-border)'}
        strokeWidth={isActive ? 2 : 1}
        style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
      />
      <text
        x={pos.x + NODE_W / 2}
        y={pos.y + 16}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={isActive ? colors.text : 'var(--color-muted)'}
        style={{ transition: 'fill 0.3s' }}
      >
        {stage.label}
      </text>
      <text
        x={pos.x + NODE_W / 2}
        y={pos.y + 30}
        textAnchor="middle"
        fontSize={8}
        fill="var(--color-muted)"
      >
        Step {stage.id}
      </text>
      {isActive && (
        <motion.circle
          cx={pos.x + NODE_W - 8}
          cy={pos.y + 8}
          r={4}
          fill={colors.border}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        />
      )}
    </motion.g>
  );
}

function ConnectionLine({ from, to, type }: { from: number; to: number; type: string }) {
  const p1 = STAGE_POSITIONS.get(from)!;
  const p2 = STAGE_POSITIONS.get(to)!;

  const x1 = p1.x + NODE_W / 2;
  const y1 = p1.y + NODE_H;
  const x2 = p2.x + NODE_W / 2;
  const y2 = p2.y;

  // Straight line for horizontal neighbors, curved for branches
  const isSameRow = p1.row === p2.row && Math.abs(p1.col - p2.col) === 1;
  let d: string;

  if (isSameRow) {
    // Horizontal connection
    const hx1 = p1.x + NODE_W;
    const hy1 = p1.y + NODE_H / 2;
    const hx2 = p2.x;
    const hy2 = p2.y + NODE_H / 2;
    d = `M ${hx1} ${hy1} L ${hx2} ${hy2}`;
  } else {
    // Curved connection
    const midY = (y1 + y2) / 2;
    d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  let stroke = 'var(--color-border)';
  let dashArray = 'none';
  if (type === 'hitl') {
    stroke = '#eab308';
    dashArray = '4 3';
  } else if (type === 'auto') {
    stroke = '#22c55e';
    dashArray = '4 3';
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeDasharray={dashArray}
      opacity={0.5}
    />
  );
}

function DocumentDot({ doc }: { doc: Document }) {
  const stageId = doc.currentStage;
  const pos = STAGE_POSITIONS.get(stageId);
  if (!pos) return null;

  const dotColor = doc.confidence >= CONFIDENCE_THRESHOLD ? '#22c55e' : '#eab308';
  const errorColor = '#ef4444';
  const fill = doc.status === 'error' ? errorColor : dotColor;

  // Offset dots within a node so they don't overlap
  const offset = (doc.id % 3) * 12 - 12;

  return (
    <motion.g
      key={`doc-${doc.id}-${stageId}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: pos.x + NODE_W / 2 + offset,
        y: pos.y + NODE_H + 14,
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <circle r={6} fill={fill} opacity={0.9} />
      <text
        textAnchor="middle"
        y={4}
        fontSize={6}
        fontWeight={700}
        fill="#fff"
      >
        {doc.id}
      </text>
    </motion.g>
  );
}

function ConfidenceBar({ buckets }: { buckets: number[] }) {
  const labels = ['<60', '60-69', '70-79', '80-89', '90+'];
  const max = Math.max(...buckets, 1);

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
      {buckets.map((count, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: (count / max) * 40 || 2 }}
            style={{
              width: '100%',
              maxWidth: 24,
              background: i < 2 ? '#eab308' : i < 3 ? '#3b82f6' : '#22c55e',
              borderRadius: 2,
              minHeight: 2,
            }}
            transition={{ duration: 0.4 }}
          />
          <span style={{ fontSize: 9, color: 'var(--color-muted)', marginTop: 2 }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: Metrics }) {
  const items = [
    { label: 'Documents Processed', value: `${metrics.processed} / ${metrics.total}` },
    { label: 'Throughput', value: `${metrics.throughput.toFixed(1)} docs/min` },
    { label: 'Error Rate', value: `${metrics.errorRate.toFixed(1)}%` },
    { label: 'Avg Confidence', value: `${metrics.avgConfidence.toFixed(1)}%` },
  ];

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: 16,
        minWidth: 220,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Pipeline Metrics
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item) => (
          <div key={item.label}>
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 6 }}>
          Confidence Distribution
        </div>
        <ConfidenceBar buckets={metrics.confidenceDist} />
      </div>
    </div>
  );
}

function DocumentTable({ documents }: { documents: Document[] }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        padding: 16,
        minWidth: 220,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text)',
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Document Queue
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {documents.map((doc) => {
          const stage = STAGES.find((s) => s.id === doc.currentStage);
          const colors = stage ? CATEGORY_COLORS[stage.category] : CATEGORY_COLORS.processing;
          const statusLabel =
            doc.status === 'completed'
              ? 'Done'
              : doc.status === 'error'
                ? 'Error'
                : stage?.label || 'Queued';

          return (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: 4,
                background: doc.status === 'completed' ? '#22c55e10' : doc.status === 'error' ? '#ef444410' : 'transparent',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>
                  {doc.label}
                </div>
                <div style={{ fontSize: 9, color: 'var(--color-muted)' }}>
                  Confidence: {doc.confidence}%
                  {doc.route && ` | ${doc.route === 'hitl' ? 'HITL' : 'Auto'}`}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: doc.status === 'completed' ? '#22c55e' : doc.status === 'error' ? '#ef4444' : colors.text,
                  whiteSpace: 'nowrap',
                }}
              >
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  const items: { label: string; color: string; dash?: boolean }[] = [
    { label: 'Processing', color: '#3b82f6' },
    { label: 'Review', color: '#eab308' },
    { label: 'Approved', color: '#22c55e' },
    { label: 'HITL Path', color: '#eab308', dash: true },
    { label: 'Auto Path', color: '#22c55e', dash: true },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {item.dash ? (
            <svg width={20} height={4}>
              <line x1={0} y1={2} x2={20} y2={2} stroke={item.color} strokeWidth={2} strokeDasharray="4 3" />
            </svg>
          ) : (
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
          )}
          <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// -- Main Component --

export default function BatchViz() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({
    processed: 0,
    total: 5,
    throughput: 0,
    errorRate: 0,
    avgConfidence: 0,
    confidenceDist: [0, 0, 0, 0, 0],
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const updateMetrics = useCallback((docs: Document[]) => {
    const completed = docs.filter((d) => d.status === 'completed').length;
    const errors = docs.filter((d) => d.status === 'error').length;
    const elapsed = (Date.now() - startTimeRef.current) / 60000; // minutes
    const throughput = elapsed > 0 ? completed / elapsed : 0;
    const activeOrDone = docs.filter((d) => d.status !== 'queued');
    const avgConf = activeOrDone.length > 0
      ? activeOrDone.reduce((sum, d) => sum + d.confidence, 0) / activeOrDone.length
      : 0;
    const dist = [0, 0, 0, 0, 0];
    activeOrDone.forEach((d) => { dist[getConfidenceBucket(d.confidence)]++; });

    setMetrics({
      processed: completed,
      total: docs.length,
      throughput,
      errorRate: activeOrDone.length > 0 ? (errors / activeOrDone.length) * 100 : 0,
      avgConfidence: avgConf,
      confidenceDist: dist,
    });
  }, []);

  const startBatch = useCallback(() => {
    if (isRunning) return;

    // Create 5 documents with random confidence
    const newDocs: Document[] = DOC_NAMES.map((name, i) => {
      const conf = randomConfidence();
      return {
        id: i + 1,
        label: name,
        confidence: conf,
        currentStage: 0,
        status: 'queued' as const,
        route: null,
        stageHistory: [],
      };
    });

    setDocuments(newDocs);
    setIsRunning(true);
    setHasRun(true);
    startTimeRef.current = Date.now();

    // Introduce a small random error chance
    const errorDocIndex = Math.random() < 0.3 ? Math.floor(Math.random() * 5) : -1;

    let tickCount = 0;

    timerRef.current = setInterval(() => {
      tickCount++;

      setDocuments((prev) => {
        const updated = prev.map((doc) => {
          if (doc.status === 'completed' || doc.status === 'error') return doc;

          // Stagger start: doc N starts N ticks later
          if (tickCount <= doc.id) return doc;

          const route = buildRoute(doc.confidence);
          const routeIndex = route.indexOf(doc.currentStage);
          const nextRouteIndex = routeIndex + 1;

          // Check for simulated error
          if (doc.id === errorDocIndex + 1 && doc.currentStage === 5) {
            return { ...doc, status: 'error' as const };
          }

          if (nextRouteIndex >= route.length) {
            return { ...doc, status: 'completed' as const };
          }

          const nextStage = route[nextRouteIndex];
          return {
            ...doc,
            currentStage: nextStage,
            status: 'processing' as const,
            route: doc.confidence >= CONFIDENCE_THRESHOLD ? 'auto' : 'hitl',
            stageHistory: [...doc.stageHistory, nextStage],
          };
        });

        return updated;
      });
    }, TICK_MS);
  }, [isRunning]);

  // Update metrics whenever documents change
  useEffect(() => {
    if (documents.length > 0) {
      updateMetrics(documents);
    }

    // Check if all done
    const allDone = documents.length > 0 && documents.every((d) => d.status === 'completed' || d.status === 'error');
    if (allDone && isRunning) {
      setIsRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [documents, isRunning, updateMetrics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Build active doc map per stage
  const activeDocsPerStage = new Map<number, number[]>();
  documents.forEach((doc) => {
    if (doc.status === 'processing' && doc.currentStage > 0) {
      const existing = activeDocsPerStage.get(doc.currentStage) || [];
      existing.push(doc.id);
      activeDocsPerStage.set(doc.currentStage, existing);
    }
  });

  // SVG viewport
  const svgWidth = 9 * 110 + 20;
  const svgHeight = 6 * 80 + 60;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={startBatch}
            disabled={isRunning}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: isRunning ? 'var(--color-border)' : 'var(--color-accent)',
              color: isRunning ? 'var(--color-muted)' : '#fff',
              fontWeight: 600,
              fontSize: 13,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isRunning ? 'Processing...' : hasRun ? 'Restart Batch' : 'Start Batch'}
          </button>
          {isRunning && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600 }}
            >
              LIVE
            </motion.div>
          )}
        </div>
        <Legend />
      </div>

      {/* Main content area */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Pipeline visualization */}
        <div
          style={{
            flex: 1,
            minWidth: 600,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 16,
            overflow: 'auto',
          }}
        >
          <svg
            viewBox={`-10 -10 ${svgWidth} ${svgHeight}`}
            width="100%"
            style={{ maxHeight: 520 }}
          >
            {/* Connections */}
            {CONNECTIONS.map(([from, to, type]) => (
              <ConnectionLine key={`${from}-${to}`} from={from} to={to} type={type} />
            ))}

            {/* Branch labels */}
            <text
              x={STAGE_POSITIONS.get(9)!.x + NODE_W / 2 - 60}
              y={STAGE_POSITIONS.get(9)!.y + NODE_H + 30}
              fontSize={9}
              fontWeight={600}
              fill="#eab308"
              opacity={0.7}
            >
              Low Confidence
            </text>
            <text
              x={STAGE_POSITIONS.get(9)!.x + NODE_W / 2 + 20}
              y={STAGE_POSITIONS.get(9)!.y + NODE_H + 30}
              fontSize={9}
              fontWeight={600}
              fill="#22c55e"
              opacity={0.7}
            >
              High Confidence
            </text>

            {/* Stage nodes */}
            {STAGES.map((stage) => (
              <StageNode
                key={stage.id}
                stage={stage}
                activeDocIds={activeDocsPerStage.get(stage.id) || []}
              />
            ))}

            {/* Animated document dots */}
            <AnimatePresence>
              {documents
                .filter((d) => d.status === 'processing' && d.currentStage > 0)
                .map((doc) => (
                  <DocumentDot key={`dot-${doc.id}`} doc={doc} />
                ))}
            </AnimatePresence>
          </svg>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 240 }}>
          <MetricsPanel metrics={metrics} />
          {documents.length > 0 && <DocumentTable documents={documents} />}
        </div>
      </div>
    </div>
  );
}
