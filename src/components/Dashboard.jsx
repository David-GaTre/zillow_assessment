import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DateRangeSlider from './DateRangeSlider';
import TopInventorySummary from './TopInventorySummary';

function formatDateLocal(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const Dashboard = () => {
  const [data, setData] = useState([]); // Array of {date, United States, CA, ...}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [availableDates, setAvailableDates] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch(import.meta.env.BASE_URL + 'aggregated_states.csv');
        const csvText = await response.text();
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            let rows = results.data.filter(row => row.date && Object.keys(row).length > 1);
            // Trim state names and parse numbers
            if (rows.length > 0) {
              const stateCols = Object.keys(rows[0]).filter(k => k !== 'date' && k !== '').map(s => s.trim());
              rows = rows.map(row => {
                const newRow = { date: row.date };
                stateCols.forEach(state => {
                  let val = row[state];
                  if (typeof val === 'string') val = val.replace(/,/g, '');
                  newRow[state] = val === '' || val == null ? null : Number(val);
                });
                return newRow;
              });
              setData(rows);
              setAvailableDates(rows.map(row => row.date));
              setDateRange({ start: rows[0].date, end: rows[rows.length - 1].date });
              setAllStates(stateCols);
              console.log('Parsed states:', stateCols);
              console.log('Sample row:', rows[0]);
            }
            setLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV: ' + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error loading CSV file: ' + err.message);
        setLoading(false);
      }
    };
    loadCSV();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get top 5 states by inventory at the latest date in the range (excluding United States)
  const getTopStates = () => {
    if (!data.length) return [];
    const filteredDates = availableDates.filter(date => date >= dateRange.start && date <= dateRange.end);
    const latestDate = filteredDates[filteredDates.length - 1];
    if (!latestDate) return [];
    const latestRow = data.find(row => row.date === latestDate);
    if (!latestRow) return [];
    // Exclude United States
    const stateTotals = allStates.filter(s => s !== 'United States').map(state => ({
      state,
      sum: latestRow[state] || 0
    }));
    return stateTotals
      .sort((a, b) => b.sum - a.sum)
      .slice(0, 5)
      .map(s => s.state);
  };

  // On load or when date range changes, default to top 5 states only (not United States)
  useEffect(() => {
    if (data.length && availableDates.length && allStates.length) {
      setSelectedStates(getTopStates());
    }
    // eslint-disable-next-line
  }, [data, dateRange.start, dateRange.end, allStates]);

  // Handle state checkbox toggle
  const handleStateToggle = (state) => {
    if (selectedStates.includes(state)) {
      setSelectedStates(selectedStates.filter(s => s !== state));
    } else {
      setSelectedStates([...selectedStates, state]);
    }
  };

  // Filter data by date range
  const chartData = data.filter(row => row.date >= dateRange.start && row.date <= dateRange.end);

  // Custom Tooltip for LineChart (moved inside Dashboard to access chartData)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const currentIndex = chartData.findIndex(row => row.date === label);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : null;
      const prevRow = prevIndex !== null ? chartData[prevIndex] : null;
      return (
        <div className="custom-tooltip" style={{ background: 'white', border: '1px solid #ccc', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#2c3e50' }}>{formatDateLocal(label)}</div>
          {payload.map((entry, i) => {
            let pct = null;
            if (prevRow && prevRow[entry.dataKey] != null && entry.value != null) {
              const prevVal = prevRow[entry.dataKey];
              if (prevVal !== 0) {
                pct = ((entry.value - prevVal) / Math.abs(prevVal)) * 100;
              } else if (entry.value !== 0) {
                pct = 100;
              } else {
                pct = 0;
              }
            }
            let pctColor = '#888';
            if (pct > 0) pctColor = 'green';
            else if (pct < 0) pctColor = 'red';
            return (
              <div key={entry.dataKey} style={{ color: entry.color, marginBottom: 2 }}>
                <span style={{ fontWeight: 500 }}>{entry.name}:</span> {entry.value?.toLocaleString()}
                {pct !== null && (
                  <span style={{ color: pctColor, fontWeight: 500, marginLeft: 8, fontSize: '0.95em' }}>
                    {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Needed all this in case all states are selected
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
    '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#800080', '#008000', '#000080', '#800000', '#808000',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ];

  // Sort states: United States first, then the 5 selected (top) states, then the rest alphabetically
  const sortedStates = [
    'United States',
    ...selectedStates,
    ...allStates.filter(s => s !== 'United States' && !selectedStates.includes(s)).sort((a, b) => a.localeCompare(b))
  ];

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading data...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error: {error}</h2>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Zillow Housing Inventory Dashboard</h1>
        <div className="controls">
          <DateRangeSlider
            availableDates={availableDates}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </header>

      <div className="dashboard-main-row">
        <TopInventorySummary dateRange={dateRange} />
        <div className="filters-container">
          <div className="filter-section">
            <h3>Select States</h3>
            <div className="checkbox-grid">
              {sortedStates.map(state => (
                <label key={state} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedStates.includes(state)}
                    onChange={() => handleStateToggle(state)}
                  />
                  {state}
                </label>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <h2>Housing Inventory Over Time</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 0, right: 20, top: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={
                    windowWidth < 600
                      ? Math.ceil(chartData.length / 6)
                      : windowWidth < 900
                        ? Math.ceil(chartData.length / 12)
                        : Math.ceil(chartData.length / 20)
                  }
                />
                <YAxis width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {selectedStates.map((state, index) => (
                  <Line 
                    key={state}
                    type="monotone" 
                    dataKey={state} 
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    name={state}
                    connectNulls={false}
                    dot={false}
                    animationDuration={300}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 