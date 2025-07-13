import React from 'react';
import { Range } from 'react-range';

function formatDateLocal(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const DateRangeSlider = ({ 
  availableDates, 
  dateRange, 
  onDateRangeChange, 
  min, 
  max 
}) => {
  // Convert dates to indices for the slider
  const getIndexFromDate = (date) => {
    return availableDates.findIndex(d => d === date);
  };

  const getDateFromIndex = (index) => {
    return availableDates[index];
  };

  const currentValues = [
    getIndexFromDate(dateRange.start),
    getIndexFromDate(dateRange.end)
  ];

  const handleChange = (values) => {
    const newStart = getDateFromIndex(values[0]);
    const newEnd = getDateFromIndex(values[1]);
    onDateRangeChange({ start: newStart, end: newEnd });
  };

  return (
    <div className="date-range-slider">
      <div className="slider-header">
        <span className="date-label">Start: {formatDateLocal(dateRange.start)}</span>
        <span className="date-label">End: {formatDateLocal(dateRange.end)}</span>
      </div>
      
      <div className="slider-container">
        <Range
          step={1}
          min={0}
          max={availableDates.length - 1}
          values={currentValues}
          onChange={handleChange}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              className="slider-track"
              style={{
                ...props.style,
                height: '6px',
                width: '100%',
                backgroundColor: '#ddd',
                borderRadius: '3px'
              }}
            >
              <div
                className="slider-selected"
                style={{
                  position: 'absolute',
                  height: '6px',
                  width: `${((currentValues[1] - currentValues[0]) / (availableDates.length - 1)) * 100}%`,
                  left: `${(currentValues[0] / (availableDates.length - 1)) * 100}%`,
                  backgroundColor: '#667eea',
                  borderRadius: '3px'
                }}
              />
              {children}
            </div>
          )}
          renderThumb={({ props, index }) => (
            <div
              {...props}
              className="slider-thumb"
              style={{
                ...props.style,
                height: '20px',
                width: '20px',
                backgroundColor: '#667eea',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                cursor: 'grab'
              }}
            >
              <div className="thumb-label">
                {formatDateLocal(getDateFromIndex(currentValues[index]))}
              </div>
            </div>
          )}
        />
      </div>
      
    </div>
  );
};

export default DateRangeSlider; 