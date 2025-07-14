import { useState } from 'react';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from 'react-router-dom';
import EvaluationPage from './EvaluationPage';

const API_1 = 'https://rrctrl.legitthq.com/fastapi/editor-v2/ai-wordaddin-draft';
const API_2 = 'https://aiqa.legitthq.com/fastapi/editor-v2/ai-wordaddin-draft';

const SUBDOMAIN_1 = 'rrctrl.legitthq.com';
const SUBDOMAIN_2 = 'aiqa.legitthq.com';

const DEFAULT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InVzZXJJZCI6MTUxODMsImVtYWlsIjoidHdvQGVtYWlsLmNvbSIsImlzR29vZ2xlU2lnbkluIjowLCJjb21wYW55SWQiOjczMzV9LCJpYXQiOjE3NTIzMjI2MzksImV4cCI6MTc1MjM1MTQzOX0.f4hdNaGqoMELWErJr8M9NuB2HEteCG0P-n0yuEMsCDU';

const DEFAULT_QUERY = 'Write a vendor agreement between microsoft and legittai';

const BASE_PAYLOAD = {
  use_search: false,
  use_reasoning: false,
  include_document: true,
  selected_text_html: '',
  full_text_html: '',
  plain_text: '',
};

const HEADERS = (token) => ({
  'Accept': '*/*',
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Company-Id': '1312',
  'X-User-Email': 'harshdeep@legitthq.com',
  'X-User-Id': '3336',
});

// Add the 25 example queries
const EXAMPLE_QUERIES = [
  "Draft a Founders' Agreement that outlines equity split, roles and responsibilities, decision-making processes, and IP ownership between [number] co-founders of a startup in [industry].",
  "Draft an Operating Agreement for a [state] LLC detailing ownership percentages, voting rights, member roles, capital contributions, and governance structure.",
  "Draft a Shareholders' Agreement for a corporation specifying share classes, board structure, voting rights, and exit terms.",
  "Draft Articles of Incorporation and Bylaws for a [state] C Corporation including purpose, share structure, director responsibilities, and procedures for meetings.",
  "Draft an Employment Agreement for a full-time employee, including job title, compensation, benefits, termination clauses, and confidentiality provisions.",
  "Draft an Offer Letter for a new hire outlining job title, start date, salary, reporting manager, and conditions of employment.",
  "Draft an Independent Contractor Agreement for a [service] consultant, including scope of work, payment terms, duration, and IP ownership.",
  "Draft a Mutual Non-Disclosure Agreement to protect confidential business information shared between two parties during business discussions.",
  "Draft a Non-Compete Agreement preventing a former employee from working with competitors or soliciting clients within [geographic area] for [duration].",
  "Draft an Employee Handbook Acknowledgement Form for new hires to confirm receipt and understanding of company policies.",
  "Draft a Master Services Agreement to govern ongoing professional services provided by a consulting firm, covering scope, fees, IP, and liability.",
  "Draft a Statement of Work under an existing MSA for a web development project, including deliverables, timelines, milestones, and fees.",
  "Draft a Sales Agreement for the sale of [product/service] to a client, including pricing, delivery terms, warranties, and payment schedule.",
  "Draft a Service Level Agreement for a SaaS company defining uptime guarantees, support response times, and penalties for non-compliance.",
  "Draft a Proposal Agreement outlining project scope, pricing, deliverables, and expiration date of the offer for [service].",
  "Draft a Vendor Agreement for a [product/material] supplier detailing delivery schedules, payment terms, quality standards, and termination.",
  "Draft a Distribution Agreement for third-party resellers of our software product, covering licensing, pricing, territories, and support obligations.",
  "Draft a Referral Agreement outlining commission rates, lead tracking, branding guidelines, and payment terms for affiliates.",
  "Draft a Joint Venture Agreement between [Company A] and [Company B] to collaborate on [project], including roles, IP ownership, and revenue split.",
  "Draft a Loan Agreement between a private lender and our business for a loan amount of [$X], including interest rate, repayment terms, and security.",
  "Draft a non-binding Investor Term Sheet for a seed investment of [$X] in a [industry] startup, outlining valuation, equity offered, and key terms.",
  "Draft a Subscription Agreement for equity investment by multiple investors, including share class, purchase price, and representations.",
  "Draft a Convertible Note (or SAFE) agreement for an early-stage startup raising [$X], including discount, valuation cap, and maturity terms.",
  "Draft an IP Assignment Agreement transferring rights from an employee or contractor to the company for all work created during employment.",
  "Draft a Software License Agreement granting a customer a non-exclusive license to use a proprietary software, including usage limits and restrictions.",
  "Draft a GDPR-compliant Data Processing Agreement between a data controller and processor, covering data handling, breach notification, and subprocessors."
];

function HomePage() {
  const navigate = useNavigate();
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '2em' }}>
      <h2>Welcome to the AI Document App</h2>
      <button
        onClick={() => navigate('/evaluation')}
        style={{ width: 240, marginTop: 32, padding: '0.7em 2em', background: '#06526D', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1.2em' }}
      >
        Go to Evaluation
      </button>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [loading, setLoading] = useState(false);
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [time1, setTime1] = useState(null);
  const [time2, setTime2] = useState(null);
  const [error, setError] = useState('');
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchResults, setBatchResults] = useState([]); // [{query, api1, api2, time1, time2}]
  const [showReport, setShowReport] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult1(null);
    setResult2(null);
    setTime1(null);
    setTime2(null);
    const payload = { ...BASE_PAYLOAD, query };
    const logEntry = {
      timestamp: new Date().toISOString(),
      query,
      token: token.slice(0, 10) + '...', // only log first 10 chars for privacy
      requests: [],
    };
    try {
      const t1Start = performance.now();
      const fetch1 = fetch(API_1, {
        method: 'POST',
        headers: HEADERS(token),
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const data = await r.json();
        const t1End = performance.now();
        setTime1(t1End - t1Start);
        logEntry.requests.push({
          subdomain: SUBDOMAIN_1,
          response: data,
          responseTimeMs: t1End - t1Start,
        });
        return data;
      });
      const t2Start = performance.now();
      const fetch2 = fetch(API_2, {
        method: 'POST',
        headers: HEADERS(token),
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const data = await r.json();
        const t2End = performance.now();
        setTime2(t2End - t2Start);
        logEntry.requests.push({
          subdomain: SUBDOMAIN_2,
          response: data,
          responseTimeMs: t2End - t2Start,
        });
        return data;
      });
      const [data1, data2] = await Promise.all([fetch1, fetch2]);
      setResult1(data1);
      setResult2(data2);
      // POST log and documents to backend
      try {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...logEntry,
            documents: [
              { subdomain: SUBDOMAIN_1, document: data1 },
              { subdomain: SUBDOMAIN_2, document: data2 },
            ],
          }),
        });
      } catch (err) {
        // ignore backend errors for now
      }
    } catch (e) {
      setError('Error generating documents.');
    } finally {
      setLoading(false);
    }
  };

  const download = (data, label) => {
    let html = data?.updated_html || data?.generated_text || JSON.stringify(data, null, 2);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch all documents from backend
  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (data.documents) {
        // Group by query, then by subdomain
        const grouped = {};
        data.documents.forEach(doc => {
          if (!grouped[doc.query]) grouped[doc.query] = [];
          grouped[doc.query].push(doc);
        });
        // setDocuments(Object.entries(grouped).map(([query, docs]) => ({ query, docs })));
      } else {
        // setDocuments([]);
      }
      // setView('list');
    } catch (e) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  // Batch run all example queries, store results in local state only
  const runAllExampleQueries = async () => {
    setBatchRunning(true);
    setBatchProgress({ done: 0, total: EXAMPLE_QUERIES.length, errors: 0 });
    setBatchSummary(null);
    setBatchResults([]);
    setShowReport(false);
    let errors = 0;
    let results = [];
    for (let i = 0; i < EXAMPLE_QUERIES.length; i++) {
      const q = EXAMPLE_QUERIES[i];
      const payload = { ...BASE_PAYLOAD, query: q };
      let api1 = null, api2 = null, time1 = null, time2 = null;
      try {
        const t1Start = performance.now();
        api1 = await fetch(API_1, {
          method: 'POST',
          headers: HEADERS(token),
          body: JSON.stringify(payload),
        }).then(r => r.json());
        time1 = performance.now() - t1Start;
      } catch (e) {
        errors++;
      }
      try {
        const t2Start = performance.now();
        api2 = await fetch(API_2, {
          method: 'POST',
          headers: HEADERS(token),
          body: JSON.stringify(payload),
        }).then(r => r.json());
        time2 = performance.now() - t2Start;
      } catch (e) {
        errors++;
      }
      results.push({ query: q, api1, api2, time1, time2 });
      setBatchProgress({ done: i + 1, total: EXAMPLE_QUERIES.length, errors });
    }
    setBatchRunning(false);
    setBatchSummary({ total: EXAMPLE_QUERIES.length, errors });
    setBatchResults(results);
    setShowReport(true);
  };

  // Calculate report stats
  const getStats = (results) => {
    const times1 = results.map(r => r.time1).filter(Boolean);
    const times2 = results.map(r => r.time2).filter(Boolean);
    const allTimes = [...times1, ...times2];
    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      api1: {
        max: Math.max(...times1),
        min: Math.min(...times1),
        avg: avg(times1),
      },
      api2: {
        max: Math.max(...times2),
        min: Math.min(...times2),
        avg: avg(times2),
      },
      overall: {
        max: Math.max(...allTimes),
        min: Math.min(...allTimes),
        avg: avg(allTimes),
      }
    };
  };

  // Export as CSV
  const exportCSV = () => {
    if (!batchResults.length) return;
    const header = ['Query', `${SUBDOMAIN_1} (ms)`, `${SUBDOMAIN_2} (ms)`];
    const rows = batchResults.map(r => [
      '"' + r.query.replace(/"/g, '""') + '"',
      r.time1 ? r.time1.toFixed(0) : '',
      r.time2 ? r.time2.toFixed(0) : ''
    ]);
    const csv = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as JSON
  const exportJSON = () => {
    if (!batchResults.length) return;
    const blob = new Blob([JSON.stringify(batchResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // UI for listing all documents as a table with response time comparison
  if (false) { // view === 'list'
    // Find the worst (max) response time for each query
    const tableRows = documents.map(docGroup => {
      const times = docGroup.docs.map(d => d.response_time_ms || 0);
      const maxTime = Math.max(...times);
      return { ...docGroup, maxTime };
    });
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '2em' }}>
        <h2>All Generated Documents</h2>
        <button onClick={() => setView('generator')} style={{ marginBottom: 20 }}>Back to Generator</button>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {documents.length === 0 && !loading && <div style={{ color: '#888' }}>No documents found.</div>}
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f7fa' }}>
              <th style={{ padding: 10, borderBottom: '1px solid #e0e0e0', textAlign: 'left' }}>Query</th>
              <th style={{ padding: 10, borderBottom: '1px solid #e0e0e0' }}>{SUBDOMAIN_1} (ms)</th>
              <th style={{ padding: 10, borderBottom: '1px solid #e0e0e0' }}>{SUBDOMAIN_2} (ms)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((docGroup, idx) => {
              const doc1 = docGroup.docs.find(d => d.subdomain === SUBDOMAIN_1);
              const doc2 = docGroup.docs.find(d => d.subdomain === SUBDOMAIN_2);
              return (
                <tr
                  key={idx}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    // setSelectedDoc({ query: docGroup.query, docs: docGroup.docs });
                    // setView('detail');
                  }}
                >
                  <td style={{ padding: 10, borderBottom: '1px solid #e0e0e0', fontWeight: 'bold', color: '#06526D' }}>{docGroup.query}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #e0e0e0', color: (doc1 && doc1.response_time_ms === docGroup.maxTime) ? 'red' : '#222' }}>
                    {doc1 ? Math.round(doc1.response_time_ms) : '-'}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #e0e0e0', color: (doc2 && doc2.response_time_ms === docGroup.maxTime) ? 'red' : '#222' }}>
                    {doc2 ? Math.round(doc2.response_time_ms) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // UI for viewing a document pair (side by side)
  if (false) { // view === 'detail' && selectedDoc
    // Find both docs by subdomain
    // const doc1 = selectedDoc.docs.find(d => d.subdomain === SUBDOMAIN_1);
    // const doc2 = selectedDoc.docs.find(d => d.subdomain === SUBDOMAIN_2);
  return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '2em' }}>
        <h2>Documents for Query</h2>
        <div style={{ fontWeight: 'bold', marginBottom: 12 }}>{/*selectedDoc.query*/}</div>
        <button onClick={() => setView('list')} style={{ marginBottom: 20 }}>Back to List</button>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 24, minHeight: 300 }}>
            <h3 style={{ color: '#06526D', borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>API 1 Result ({SUBDOMAIN_1})</h3>
            {/*doc1 ? (
              <div dangerouslySetInnerHTML={{ __html: doc1.document.updated_html || doc1.document.generated_text || '<i>No document found.</i>' }} className="doc-content" />
            ) : <div style={{ color: '#888' }}>No document found for {SUBDOMAIN_1}.</div>*/}
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 24, minHeight: 300 }}>
            <h3 style={{ color: '#06526D', borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>API 2 Result ({SUBDOMAIN_2})</h3>
            {/*doc2 ? (
              <div dangerouslySetInnerHTML={{ __html: doc2.document.updated_html || doc2.document.generated_text || '<i>No document found.</i>' }} className="doc-content" />
            ) : <div style={{ color: '#888' }}>No document found for {SUBDOMAIN_2}.</div>*/}
          </div>
        </div>
      </div>
    );
  }

  // Main generator UI
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/evaluation"
          element={
            <EvaluationPage
              token={token}
              setToken={setToken}
              batchRunning={batchRunning}
              batchProgress={batchProgress}
              runAllExampleQueries={runAllExampleQueries}
              showReport={showReport}
              batchResults={batchResults}
              exportCSV={exportCSV}
              exportJSON={exportJSON}
              getStats={getStats}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
