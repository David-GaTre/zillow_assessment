import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

const TopInventorySummary = ({ dateRange }) => {
  const [topRegions, setTopRegions] = useState([]);
  const [topStates, setTopStates] = useState([]);
  const [lastDate, setLastDate] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Top 5 regions from original file
        const origResp = await fetch('/Metro_invt_fs_uc_sfrcondo_sm_week.csv');
        const origText = await origResp.text();
        Papa.parse(origText, {
          header: true,
          skipEmptyLines: true,
          complete: (origResults) => {
            const origData = origResults.data;
            // Find all date column
            const dateCols = Object.keys(origData[0]).filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/));
            // Use dateRange.end if available, else last date
            const lastDateCol = (dateRange && dateRange.end && dateCols.includes(dateRange.end)) ? dateRange.end : dateCols[dateCols.length - 1];
            setLastDate(lastDateCol);
            // Get top 5 regions (exclude United States row)
            const regionRows = origData.filter(r => r.RegionName && r.RegionName !== 'United States');
            const top5Regions = regionRows
              .map(r => ({
                region: r.RegionName,
                state: r.StateName,
                value: Number((r[lastDateCol] || '0').replace(/,/g, ''))
              }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            setTopRegions(top5Regions);
          },
          error: (err) => setError('Error parsing original CSV: ' + err.message)
        });

        // 2. Top 5 states from aggregated file
        const aggResp = await fetch('/aggregated_states.csv');
        const aggText = await aggResp.text();
        Papa.parse(aggText, {
          header: true,
          skipEmptyLines: true,
          complete: (aggResults) => {
            const aggData = aggResults.data;
            // Use dateRange.end if available, else last row
            let lastRow = aggData[aggData.length - 1];
            if (dateRange && dateRange.end) {
              const found = aggData.find(row => row.date === dateRange.end);
              if (found) lastRow = found;
            }
            // Exclude 'date' and 'United States'
            const stateEntries = Object.entries(lastRow)
              .filter(([k]) => k !== 'date' && k !== 'United States')
              .map(([state, value]) => ({
                state,
                value: Number((value || '0').toString().replace(/,/g, ''))
              }))
              .sort((a, b) => b.value - a.value)
              .slice(0, 5);
            setTopStates(stateEntries);
          },
          error: (err) => setError('Error parsing aggregated CSV: ' + err.message)
        });
      } catch (err) {
        setError('Error loading files: ' + err.message);
      }
    };
    fetchData();
  }, [dateRange]);

  if (error) return <div className="error"><h3>{error}</h3></div>;

  return (
    <div className="top-inventory-summary">
      <div className="summary-card">
        <h3>Top 5 Regions by Inventory ({lastDate})</h3>
        <ol>
          {topRegions.map((r, i) => (
            <li key={r.region}>
              <strong>{r.region}</strong> — {r.value.toLocaleString()}
            </li>
          ))}
        </ol>
      </div>
      <div className="summary-card">
        <h3>Top 5 States by Inventory ({lastDate})</h3>
        <ol>
          {topStates.map((s, i) => (
            <li key={s.state}>
              <strong>{s.state}</strong> — {s.value.toLocaleString()}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default TopInventorySummary; 