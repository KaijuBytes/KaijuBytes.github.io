import { useState, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type FieldType = 'text' | 'integer' | 'number' | 'date' | 'boolean';

interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  validation?: string;
}

const FIELD_TYPES: FieldType[] = ['text', 'integer', 'number', 'date', 'boolean'];

const SAMPLE_DOCUMENT = `INVOICE #INV-2024-0847

Vendor: Acme Corp
Date: 2024-11-15
Due Date: 2025-01-15

Bill To:
  Metro City Municipal Office
  123 Government Ave, Metro City

Description                    Qty    Unit Price    Amount
-------------------------------------------------------
Cloud Infrastructure Setup      1     $45,000.00    $45,000.00
Annual Support License         12        $500.00     $6,000.00
Data Migration Service          1      $8,500.00     $8,500.00
Training (on-site, 3 days)      3      $2,500.00     $7,500.00
-------------------------------------------------------
                              Subtotal:             $67,000.00
                              Tax (10%):             $6,700.00
                              Discount:             -$5,465.44
                              Total:                $68,234.56

Payment Terms: Net 60
Status: Pending
Approved: Yes

Notes: This invoice covers the Q4 infrastructure deployment
project as per Contract #CT-2024-0312.`;

const MOCK_VALUES: Record<string, Record<FieldType, string>> = {
  vendor_name:    { text: 'Acme Corp',       integer: '--', number: '--',        date: '--',          boolean: '--' },
  invoice_date:   { text: '2024-11-15',      integer: '--', number: '--',        date: '2024-11-15',  boolean: '--' },
  due_date:       { text: '2025-01-15',      integer: '--', number: '--',        date: '2025-01-15',  boolean: '--' },
  total_amount:   { text: '$68,234.56',      integer: '68235', number: '68234.56', date: '--',        boolean: '--' },
  subtotal:       { text: '$67,000.00',      integer: '67000', number: '67000.00', date: '--',        boolean: '--' },
  tax:            { text: '$6,700.00',       integer: '6700',  number: '6700.00',  date: '--',        boolean: '--' },
  discount:       { text: '-$5,465.44',      integer: '-5465', number: '-5465.44', date: '--',        boolean: '--' },
  invoice_number: { text: 'INV-2024-0847',   integer: '847',   number: '847',     date: '--',        boolean: '--' },
  quantity:       { text: '1',               integer: '1',     number: '1',       date: '--',        boolean: '--' },
  status:         { text: 'Pending',         integer: '--',    number: '--',      date: '--',        boolean: 'false' },
  approved:       { text: 'Yes',             integer: '--',    number: '--',      date: '--',        boolean: 'true' },
  bill_to:        { text: 'Metro City Municipal Office', integer: '--', number: '--', date: '--',    boolean: '--' },
  payment_terms:  { text: 'Net 60',          integer: '60',    number: '60',      date: '--',        boolean: '--' },
  description:    { text: 'Cloud Infrastructure Setup', integer: '--', number: '--', date: '--',     boolean: '--' },
  contract:       { text: 'CT-2024-0312',    integer: '--',    number: '--',      date: '--',        boolean: '--' },
  notes:          { text: 'Q4 infrastructure deployment project', integer: '--', number: '--', date: '--', boolean: '--' },
};

function getMockValue(fieldName: string, fieldType: FieldType): string {
  const key = fieldName.toLowerCase().replace(/\s+/g, '_');
  if (MOCK_VALUES[key]) {
    return MOCK_VALUES[key][fieldType];
  }
  switch (fieldType) {
    case 'text':    return 'N/A (not found)';
    case 'integer': return '--';
    case 'number':  return '--';
    case 'date':    return '--';
    case 'boolean': return '--';
  }
}

function getConfidence(fieldName: string, fieldType: FieldType): number {
  const key = fieldName.toLowerCase().replace(/\s+/g, '_');
  if (MOCK_VALUES[key] && MOCK_VALUES[key][fieldType] !== '--') {
    return 0.85 + Math.random() * 0.14;
  }
  return 0.15 + Math.random() * 0.25;
}

const TYPE_BADGE_COLORS: Record<FieldType, string> = {
  text:    '#0891b2',
  integer: '#7c3aed',
  number:  '#059669',
  date:    '#d97706',
  boolean: '#dc2626',
};


// --- Sortable Field Item ---

function SortableFieldItem({
  field,
  onDelete,
}: {
  field: SchemaField;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span
        style={{
          color: 'var(--color-muted)',
          fontSize: '14px',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        &#x2630;
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--color-text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {field.name}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '1px 8px',
              borderRadius: '9999px',
              color: '#fff',
              backgroundColor: TYPE_BADGE_COLORS[field.type],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              flexShrink: 0,
            }}
          >
            {field.type}
          </span>
        </div>
        {field.validation && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-muted)',
              marginTop: '2px',
              fontFamily: 'monospace',
            }}
          >
            regex: {field.validation}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(field.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-muted)',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          padding: '4px',
          borderRadius: '4px',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
        title="Remove field"
      >
        x
      </button>
    </div>
  );
}


// --- Main Component ---

const INITIAL_FIELDS: SchemaField[] = [
  { id: 'f1', name: 'vendor_name', type: 'text' },
  { id: 'f2', name: 'invoice_date', type: 'date' },
  { id: 'f3', name: 'total_amount', type: 'number' },
];

export default function SchemaForge() {
  const [fields, setFields] = useState<SchemaField[]>(INITIAL_FIELDS);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<FieldType>('text');
  const [newValidation, setNewValidation] = useState('');
  const [nextId, setNextId] = useState(4);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');

  const handleAdd = useCallback(() => {
    const trimmed = newName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed) return;
    if (fields.some((f) => f.name === trimmed)) return;
    const field: SchemaField = {
      id: `f${nextId}`,
      name: trimmed,
      type: newType,
      ...(newValidation.trim() ? { validation: newValidation.trim() } : {}),
    };
    setFields((prev) => [...prev, field]);
    setNextId((n) => n + 1);
    setNewName('');
    setNewValidation('');
  }, [newName, newType, newValidation, nextId, fields]);

  const handleDelete = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const schemaJson = {
    schema_name: 'invoice_extraction',
    version: '1.0',
    fields: fields.map((f, i) => ({
      order: i + 1,
      name: f.name,
      type: f.type,
      ...(f.validation ? { validation: f.validation } : {}),
    })),
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--color-text)',
    outline: 'none',
    width: '100%',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        minHeight: '600px',
      }}
      className="schema-forge-grid"
    >
      {/* Left Panel: Schema Builder */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '4px',
          }}
        >
          Schema Fields
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
          Drag to reorder. Fields define the extraction schema.
        </p>

        {/* Field List */}
        <div style={{ flex: 1, minHeight: 0, marginBottom: '20px' }}>
          {fields.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--color-muted)',
                fontSize: '14px',
                border: '2px dashed var(--color-border)',
                borderRadius: '8px',
              }}
            >
              No fields defined. Add a field below.
            </div>
          )}
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field) => (
                <SortableFieldItem key={field.id} field={field} onDelete={handleDelete} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add Field Form */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            Add Field
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              placeholder="Field name (e.g. invoice_number)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as FieldType)}
                style={selectStyle}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Regex (optional)"
                value={newValidation}
                onChange={(e) => setNewValidation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                style={inputStyle}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{
                backgroundColor: newName.trim() ? 'var(--color-accent)' : 'var(--color-border)',
                color: newName.trim() ? '#fff' : 'var(--color-muted)',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: newName.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                width: '100%',
              }}
            >
              + Add Field
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Preview */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            marginBottom: '16px',
            backgroundColor: 'var(--color-bg)',
            borderRadius: '8px',
            padding: '3px',
          }}
        >
          {(['preview', 'json'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--color-text)' : 'var(--color-muted)',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab === 'preview' ? 'Extraction Preview' : 'Schema JSON'}
            </button>
          ))}
        </div>

        {activeTab === 'preview' ? (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sample Document */}
            <div>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                Source Document
              </h3>
              <pre
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: 'var(--color-text)',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  margin: 0,
                }}
              >
                {SAMPLE_DOCUMENT}
              </pre>
            </div>

            {/* Extracted Data Table */}
            <div>
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                Extracted Data ({fields.length} field{fields.length !== 1 ? 's' : ''})
              </h3>
              {fields.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--color-muted)',
                    fontSize: '13px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg)',
                  }}
                >
                  Add fields to the schema to see extraction results.
                </div>
              ) : (
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: 'var(--color-bg)',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '10px 14px',
                            fontWeight: 600,
                            color: 'var(--color-muted)',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Field
                        </th>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '10px 14px',
                            fontWeight: 600,
                            color: 'var(--color-muted)',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Value
                        </th>
                        <th
                          style={{
                            textAlign: 'right',
                            padding: '10px 14px',
                            fontWeight: 600,
                            color: 'var(--color-muted)',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Confidence
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, i) => {
                        const value = getMockValue(field.name, field.type);
                        const confidence = getConfidence(field.name, field.type);
                        const isLow = confidence < 0.5;
                        return (
                          <tr
                            key={field.id}
                            style={{
                              borderBottom:
                                i < fields.length - 1
                                  ? '1px solid var(--color-border)'
                                  : 'none',
                            }}
                          >
                            <td
                              style={{
                                padding: '10px 14px',
                                fontWeight: 500,
                                color: 'var(--color-text)',
                                fontFamily: 'monospace',
                              }}
                            >
                              {field.name}
                            </td>
                            <td
                              style={{
                                padding: '10px 14px',
                                color: isLow ? 'var(--color-muted)' : 'var(--color-text)',
                                fontStyle: isLow ? 'italic' : 'normal',
                              }}
                            >
                              {value}
                            </td>
                            <td
                              style={{
                                padding: '10px 14px',
                                textAlign: 'right',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  backgroundColor: isLow
                                    ? 'rgba(239,68,68,0.12)'
                                    : 'rgba(34,197,94,0.12)',
                                  color: isLow ? '#ef4444' : '#22c55e',
                                }}
                              >
                                {(confidence * 100).toFixed(0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <pre
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                lineHeight: 1.6,
                color: 'var(--color-text)',
                overflow: 'auto',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                margin: 0,
              }}
            >
              {JSON.stringify(schemaJson, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .schema-forge-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
