import { useState, useRef, useEffect } from 'react';

// --- Document corpus ---

interface Document {
  id: string;
  title: string;
  paragraphs: string[];
}

const DOCUMENTS: Document[] = [
  {
    id: 'remote-work',
    title: 'Company Policy: Remote Work',
    paragraphs: [
      'All regular full-time employees who have completed at least 90 days of employment are eligible to apply for remote work arrangements. Eligibility is subject to manager approval and depends on the nature of the role and demonstrated performance.',
      'Remote employees are expected to be available during core business hours of 9:00 AM to 3:00 PM in their local time zone. Outside of core hours, employees may set flexible schedules with their manager\'s agreement, provided they complete at least 40 hours per week.',
      'The company provides a one-time home office stipend of $500 for equipment purchases including monitors, keyboards, ergonomic chairs, and related accessories. Recurring internet reimbursement of up to $75 per month is available upon submission of receipts.',
      'Remote employees must use the company VPN when accessing internal systems. All work must be performed on company-issued devices or approved personal devices enrolled in the mobile device management (MDM) system. Accessing company data from public Wi-Fi without VPN is strictly prohibited.',
      'Performance reviews for remote employees follow the same quarterly cycle as on-site staff. Managers are encouraged to schedule weekly one-on-one video calls and monthly team check-ins to maintain team cohesion and address any concerns promptly.',
    ],
  },
  {
    id: 'leave-benefits',
    title: 'Employee Handbook: Leave Benefits',
    paragraphs: [
      'Full-time employees accrue 15 days of paid vacation leave per year, increasing to 20 days after 5 years of service and 25 days after 10 years. Vacation days may be carried over up to a maximum of 5 unused days per calendar year.',
      'Sick leave is provided at a rate of 10 days per year for all regular employees. Sick leave may be used for personal illness, medical appointments, or caring for an immediate family member. A medical certificate is required for absences exceeding 3 consecutive days.',
      'Parental leave provides 12 weeks of fully paid leave for the primary caregiver and 4 weeks for the secondary caregiver following the birth or adoption of a child. Leave must begin within 6 months of the qualifying event.',
      'Bereavement leave of up to 5 days is available for the death of an immediate family member (spouse, parent, child, sibling). An additional 3 days may be granted for travel requirements at the manager\'s discretion.',
      'Employees may request up to 30 days of unpaid personal leave per year for reasons not covered by other leave categories. Requests must be submitted at least 30 days in advance and are subject to approval based on business needs and staffing levels.',
    ],
  },
  {
    id: 'password-policy',
    title: 'IT Security: Password Policy',
    paragraphs: [
      'All passwords must be at least 14 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character. Passphrases of 20 or more characters consisting of at least 4 dictionary words are also accepted.',
      'Passwords must be changed every 90 days. The system maintains a history of the last 12 passwords, and reuse of any previously used password is not permitted. Accounts are locked after 5 consecutive failed login attempts for a duration of 30 minutes.',
      'Multi-factor authentication (MFA) is mandatory for all employees. Supported methods include hardware security keys (preferred), authenticator apps (TOTP), and SMS verification (least preferred). MFA must be configured within 24 hours of account creation.',
      'Password managers are strongly recommended. The company provides enterprise licenses for the approved password manager. Storing passwords in plain text files, spreadsheets, browser auto-fill without a master password, or sticky notes is strictly prohibited.',
      'Service accounts and API keys must follow the same complexity requirements. API keys must be rotated every 60 days and stored exclusively in the approved secrets management vault. Embedding credentials in source code or configuration files is a policy violation subject to disciplinary action.',
    ],
  },
];

// --- Pre-built answers for common questions ---

interface PreparedAnswer {
  keywords: string[];
  answer: string;
  docId: string;
}

const PREPARED_ANSWERS: PreparedAnswer[] = [
  {
    keywords: ['remote', 'work', 'policy', 'wfh', 'home'],
    answer:
      'Based on the retrieved documents, the remote work policy allows eligible full-time employees (90+ days employed) to work remotely with manager approval. Core hours are 9 AM to 3 PM local time, with flexible scheduling otherwise. The company provides a $500 home office stipend and $75/month internet reimbursement. VPN usage is mandatory, and work must be done on company-issued or MDM-enrolled devices.',
    docId: 'remote-work',
  },
  {
    keywords: ['sick', 'leave', 'days', 'illness'],
    answer:
      'According to the Employee Handbook, regular employees receive 10 sick leave days per year. Sick leave can be used for personal illness, medical appointments, or caring for immediate family members. A medical certificate is required if the absence exceeds 3 consecutive days.',
    docId: 'leave-benefits',
  },
  {
    keywords: ['vacation', 'paid', 'time', 'off', 'pto', 'annual'],
    answer:
      'Full-time employees accrue 15 days of paid vacation per year, increasing to 20 days after 5 years and 25 days after 10 years of service. Up to 5 unused days may be carried over to the next calendar year.',
    docId: 'leave-benefits',
  },
  {
    keywords: ['password', 'requirements', 'length', 'characters', 'complexity'],
    answer:
      'The password policy requires all passwords to be at least 14 characters long, including uppercase, lowercase, digits, and special characters. Alternatively, passphrases of 20+ characters with at least 4 dictionary words are accepted. Passwords must be changed every 90 days, and the system prevents reuse of the last 12 passwords. Accounts lock after 5 failed attempts for 30 minutes.',
    docId: 'password-policy',
  },
  {
    keywords: ['mfa', 'multi-factor', 'authentication', '2fa', 'two-factor'],
    answer:
      'Multi-factor authentication (MFA) is mandatory for all employees and must be configured within 24 hours of account creation. Supported methods are: hardware security keys (preferred), authenticator apps using TOTP, and SMS verification (least preferred).',
    docId: 'password-policy',
  },
  {
    keywords: ['parental', 'maternity', 'paternity', 'birth', 'adoption'],
    answer:
      'Parental leave provides 12 weeks of fully paid leave for the primary caregiver and 4 weeks for the secondary caregiver. This applies to both birth and adoption. Leave must begin within 6 months of the qualifying event.',
    docId: 'leave-benefits',
  },
  {
    keywords: ['stipend', 'equipment', 'office', 'reimbursement', 'internet'],
    answer:
      'The company provides a one-time $500 home office stipend for equipment (monitors, keyboards, ergonomic chairs, etc.) and a recurring internet reimbursement of up to $75 per month upon submission of receipts.',
    docId: 'remote-work',
  },
  {
    keywords: ['vpn', 'security', 'device', 'mdm'],
    answer:
      'Remote employees must use the company VPN when accessing internal systems. All work must be performed on company-issued devices or approved personal devices enrolled in the MDM system. Accessing company data from public Wi-Fi without VPN is strictly prohibited.',
    docId: 'remote-work',
  },
  {
    keywords: ['api', 'key', 'service', 'account', 'secret', 'credential'],
    answer:
      'Service accounts and API keys must meet the same complexity requirements as user passwords. API keys must be rotated every 60 days and stored exclusively in the approved secrets management vault. Embedding credentials in source code or configuration files is a policy violation subject to disciplinary action.',
    docId: 'password-policy',
  },
];

// --- Chunk scoring ---

interface ScoredChunk {
  docId: string;
  docTitle: string;
  chunkIndex: number;
  text: string;
  score: number;
}

function scoreChunks(query: string): ScoredChunk[] {
  const queryWords = query
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored: ScoredChunk[] = [];

  for (const doc of DOCUMENTS) {
    for (let i = 0; i < doc.paragraphs.length; i++) {
      const chunk = doc.paragraphs[i].toLowerCase();
      let matchCount = 0;
      for (const word of queryWords) {
        if (chunk.includes(word)) matchCount++;
      }
      if (matchCount > 0) {
        // Simulate cosine similarity: normalize to 0-1 range
        const raw = matchCount / queryWords.length;
        const score = Math.min(0.98, raw * 0.7 + 0.2 + Math.random() * 0.1);
        scored.push({
          docId: doc.id,
          docTitle: doc.title,
          chunkIndex: i,
          text: doc.paragraphs[i],
          score: parseFloat(score.toFixed(3)),
        });
      }
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

function generateAnswer(query: string, chunks: ScoredChunk[]): string {
  const queryLower = query.toLowerCase();

  // Check prepared answers
  let bestMatch: PreparedAnswer | null = null;
  let bestScore = 0;
  for (const pa of PREPARED_ANSWERS) {
    let score = 0;
    for (const kw of pa.keywords) {
      if (queryLower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = pa;
    }
  }

  if (bestMatch && bestScore >= 2) {
    return bestMatch.answer;
  }

  // Fallback: summarize top chunks
  if (chunks.length === 0) {
    return 'I could not find relevant information in the loaded documents to answer this question. Try asking about remote work policy, leave benefits, or password requirements.';
  }

  return `Based on the most relevant document sections, here is what I found: ${chunks[0].text.substring(0, 200)}... This information comes from "${chunks[0].docTitle}".`;
}

// --- Pipeline steps ---

const PIPELINE_STEPS = ['Query', 'Embed', 'Search', 'Retrieve', 'Generate'];

// --- Suggested questions ---

const SUGGESTED_QUESTIONS = [
  'What is the remote work policy?',
  'How many sick leave days do employees get?',
  'What are the password requirements?',
];

// --- Message types ---

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  chunks?: ScoredChunk[];
  activeStep?: number;
}

export default function RagMini() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, processing]);

  const handleSubmit = (query: string) => {
    if (!query.trim() || processing) return;

    const userMsg: ChatMessage = { role: 'user', content: query.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setProcessing(true);
    setActiveStep(0);

    // Simulate RAG pipeline stages
    const delays = [400, 600, 500, 400, 800];
    let step = 0;

    const advanceStep = () => {
      step++;
      if (step < PIPELINE_STEPS.length) {
        setActiveStep(step);
        setTimeout(advanceStep, delays[step]);
      } else {
        // Pipeline complete -- produce result
        const chunks = scoreChunks(query);
        const answer = generateAnswer(query, chunks);

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: answer, chunks },
        ]);
        setProcessing(false);
        setActiveStep(-1);
      }
    };

    setTimeout(advanceStep, delays[0]);
  };

  const selectedDocument = DOCUMENTS.find((d) => d.id === selectedDoc);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: Documents */}
      <div className="lg:col-span-1 space-y-3">
        <h3
          className="text-sm font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--color-muted)' }}
        >
          Document Corpus
        </h3>
        {DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
            className="w-full text-left p-3 rounded-lg transition-all duration-150"
            style={{
              backgroundColor:
                selectedDoc === doc.id
                  ? 'var(--color-accent)'
                  : 'var(--color-surface)',
              color:
                selectedDoc === doc.id ? 'var(--color-bg)' : 'var(--color-text)',
              border:
                selectedDoc === doc.id
                  ? '1px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
            }}
          >
            <div className="text-sm font-semibold">{doc.title}</div>
            <div
              className="text-xs mt-1"
              style={{
                color:
                  selectedDoc === doc.id
                    ? 'var(--color-bg)'
                    : 'var(--color-muted)',
                opacity: selectedDoc === doc.id ? 0.85 : 1,
              }}
            >
              {doc.paragraphs.length} chunks
            </div>
          </button>
        ))}

        {/* Document preview */}
        {selectedDocument && (
          <div
            className="mt-4 p-3 rounded-lg text-xs max-h-64 overflow-y-auto space-y-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="font-semibold text-sm mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              {selectedDocument.title}
            </div>
            {selectedDocument.paragraphs.map((p, i) => (
              <div
                key={i}
                className="p-2 rounded"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-muted)',
                }}
              >
                <span
                  className="font-mono text-xs mr-2"
                  style={{ color: 'var(--color-accent)' }}
                >
                  [{i}]
                </span>
                {p}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: Chat interface */}
      <div className="lg:col-span-2 flex flex-col">
        {/* Pipeline indicator */}
        <div
          className="flex items-center justify-center gap-1 sm:gap-2 mb-4 p-3 rounded-lg text-xs font-mono flex-wrap"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {PIPELINE_STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-1 sm:gap-2">
              <span
                className="px-2 py-1 rounded transition-all duration-300"
                style={{
                  backgroundColor:
                    activeStep === i
                      ? 'var(--color-accent)'
                      : activeStep > i
                        ? 'var(--color-accent)'
                        : 'var(--color-bg)',
                  color:
                    activeStep >= i && activeStep !== -1
                      ? 'var(--color-bg)'
                      : 'var(--color-muted)',
                  opacity: activeStep >= i && activeStep !== -1 ? 1 : 0.6,
                }}
              >
                {step}
              </span>
              {i < PIPELINE_STEPS.length - 1 && (
                <span style={{ color: 'var(--color-accent)' }}>&#8594;</span>
              )}
            </span>
          ))}
        </div>

        {/* Chat area */}
        <div
          className="flex-1 min-h-[400px] max-h-[500px] overflow-y-auto rounded-lg p-4 space-y-4 mb-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {messages.length === 0 && !processing && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--color-muted)' }}
              >
                Ask a question about the loaded documents.
              </p>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-150"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.borderColor =
                        'var(--color-accent)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.borderColor =
                        'var(--color-border)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {/* User message */}
              {msg.role === 'user' && (
                <div className="flex justify-end">
                  <div
                    className="max-w-[80%] px-4 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--color-accent)',
                      color: 'var(--color-bg)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )}

              {/* Assistant message */}
              {msg.role === 'assistant' && (
                <div className="space-y-3">
                  {/* Retrieved chunks */}
                  {msg.chunks && msg.chunks.length > 0 && (
                    <div
                      className="p-3 rounded-lg text-xs"
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div
                        className="font-semibold mb-2 uppercase tracking-wider"
                        style={{ color: 'var(--color-muted)', fontSize: '0.65rem' }}
                      >
                        Retrieved Chunks
                      </div>
                      {msg.chunks.map((chunk, ci) => (
                        <div
                          key={ci}
                          className="mb-2 p-2 rounded flex gap-2"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div className="flex-shrink-0 flex flex-col items-center gap-1">
                            <span
                              className="font-mono font-bold text-xs"
                              style={{ color: 'var(--color-accent)' }}
                            >
                              {chunk.score.toFixed(3)}
                            </span>
                            <div
                              className="w-8 h-1 rounded-full overflow-hidden"
                              style={{ backgroundColor: 'var(--color-border)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${chunk.score * 100}%`,
                                  backgroundColor: 'var(--color-accent)',
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-semibold mb-0.5"
                              style={{
                                color: 'var(--color-text)',
                                fontSize: '0.65rem',
                              }}
                            >
                              {chunk.docTitle} [chunk {chunk.chunkIndex}]
                            </div>
                            <div
                              className="line-clamp-2"
                              style={{ color: 'var(--color-muted)' }}
                            >
                              {chunk.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer */}
                  <div className="flex justify-start">
                    <div
                      className="max-w-[90%] px-4 py-3 rounded-lg text-sm leading-relaxed"
                      style={{
                        backgroundColor: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {processing && (
            <div className="flex justify-start">
              <div
                className="px-4 py-2 rounded-lg text-sm animate-pulse"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  color: 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {activeStep >= 0
                  ? `${PIPELINE_STEPS[activeStep]}...`
                  : 'Processing...'}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
            placeholder="Ask a question about the documents..."
            disabled={processing}
            className="flex-1 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
            }}
          />
          <button
            onClick={() => handleSubmit(input)}
            disabled={processing || !input.trim()}
            className="px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-bg)',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
