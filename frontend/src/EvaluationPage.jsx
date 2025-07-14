import React, { useEffect, useState } from 'react';

const SUBDOMAIN_1 = 'rrctrl.legitthq.com';
const SUBDOMAIN_2 = 'aiqa.legitthq.com';

export default function EvaluationPage() {
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [poll, setPoll] = useState([]); // [{choice: 'api1'|'api2'|'tie'}]
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function fetchBatch() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/batch_report.json');
        if (!res.ok) throw new Error('Could not load batch_report.json');
        const data = await res.json();
        setBatchResults(data);
        setPoll(Array(data.length).fill(null));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBatch();
  }, []);

  const handleVote = (choice) => {
    const updated = [...poll];
    updated[currentIdx] = choice;
    setPoll(updated);
    if (currentIdx < batchResults.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setDone(true);
    }
  };

  const exportPollJSON = () => {
    const pollResults = batchResults.map((r, idx) => ({
      query: r.query,
      api1_time: r.time1,
      api2_time: r.time2,
      choice: poll[idx],
    }));
    const blob = new Blob([JSON.stringify(pollResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poll_results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 32 }}>Loading batch_report.json...</div>;
  if (error) return <div style={{ color: 'red', padding: 32 }}>{error}</div>;
  if (!batchResults.length) return <div style={{ padding: 32 }}>No batch results found.</div>;

  if (!done) {
    const r = batchResults[currentIdx];
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '2em' }}>
        <h2>Document Evaluation ({currentIdx + 1} / {batchResults.length})</h2>
        <div style={{ fontWeight: 'bold', marginBottom: 12 }}>{r.query}</div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 24, minHeight: 300 }}>
            <h3 style={{ color: '#06526D', borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>API 1 Result ({SUBDOMAIN_1})</h3>
            <div dangerouslySetInnerHTML={{ __html: r.api1?.updated_html || r.api1?.generated_text || '<i>No document found.</i>' }} className="doc-content" />
          </div>
          <div style={{ flex: 1, background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: 24, minHeight: 300 }}>
            <h3 style={{ color: '#06526D', borderBottom: '1px solid #e0e0e0', paddingBottom: 8 }}>API 2 Result ({SUBDOMAIN_2})</h3>
            <div dangerouslySetInnerHTML={{ __html: r.api2?.updated_html || r.api2?.generated_text || '<i>No document found.</i>' }} className="doc-content" />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => handleVote('api1')} style={{ marginRight: 12, padding: '0.6em 2em', background: '#06526D', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1em' }}>API 1 is better</button>
          <button onClick={() => handleVote('api2')} style={{ marginRight: 12, padding: '0.6em 2em', background: '#06526D', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1em' }}>API 2 is better</button>
          <button onClick={() => handleVote('tie')} style={{ padding: '0.6em 2em', background: '#888', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1em' }}>Tie / Unsure</button>
        </div>
        <div style={{ color: '#888' }}>Progress: {currentIdx + 1} / {batchResults.length}</div>
      </div>
    );
  }

  // After polling all
  const pollResults = batchResults.map((r, idx) => ({
    query: r.query,
    api1_time: r.time1,
    api2_time: r.time2,
    choice: poll[idx],
  }));

  // Calculate win/tie counts
  const api1Wins = pollResults.filter(r => r.choice === 'api1').length;
  const api2Wins = pollResults.filter(r => r.choice === 'api2').length;
  const ties = pollResults.filter(r => r.choice === 'tie').length;
  let winner = '';
  if (api1Wins > api2Wins) winner = `API 1 (${SUBDOMAIN_1}) wins!`;
  else if (api2Wins > api1Wins) winner = `API 2 (${SUBDOMAIN_2}) wins!`;
  else winner = 'It is a tie!';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f7fa', minHeight: '100vh', padding: '2em' }}>
      <h2>Evaluation Complete</h2>
      <button onClick={exportPollJSON} style={{ marginBottom: 24, padding: '0.6em 2em', background: '#06526D', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1em' }}>Download Poll Results (JSON)</button>
      <table style={{ width: '100%', background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f5f7fa' }}>
            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0', textAlign: 'left' }}>Query</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>{SUBDOMAIN_1} (ms)</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>{SUBDOMAIN_2} (ms)</th>
            <th style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>Your Choice</th>
          </tr>
        </thead>
        <tbody>
          {pollResults.map((r, idx) => (
            <tr key={idx}>
              <td style={{ padding: 8, borderBottom: '1px solid #e0e0e0', color: '#06526D' }}>{r.query}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>{r.api1_time ? r.api1_time.toFixed(0) : '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>{r.api2_time ? r.api2_time.toFixed(0) : '-'}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>{r.choice === 'api1' ? 'API 1' : r.choice === 'api2' ? 'API 2' : 'Tie/Unsure'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 32, fontSize: 18, fontWeight: 'bold', color: '#06526D' }}>
        <div>API 1 ({SUBDOMAIN_1}) wins: {api1Wins}</div>
        <div>API 2 ({SUBDOMAIN_2}) wins: {api2Wins}</div>
        <div>Tie/Unsure: {ties}</div>
        <div style={{ marginTop: 12, fontSize: 20 }}>{winner}</div>
      </div>
    </div>
  );
} 