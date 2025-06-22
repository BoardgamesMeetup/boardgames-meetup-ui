import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { AccessTime, Check, Close } from '@mui/icons-material';
import dayjs from 'dayjs';

// Clock with AM/PM selector
const InteractiveClockPicker = ({ value, onChange, onClose, minTime = null }) => {
  const [time, setTime] = useState(value || '12:00');
  const [mode, setMode] = useState('hours');
  const [ampm, setAmpm] = useState('AM');
  const [isDragging, setIsDragging] = useState(false);
  
  const clockRef = useRef(null);
  const centerX = 120;
  const centerY = 120;
  const radius = 90;

  // Initialize AM/PM based on current time
  useEffect(() => {
    if (time) {
      const [hours] = time.split(':').map(Number);
      setAmpm(hours >= 12 ? 'PM' : 'AM');
    }
  }, []);

  const parseTime = (timeStr) => {
    if (!timeStr) return { hours: 12, minutes: 0 };
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
  };

  const { hours, minutes } = parseTime(time);

  // Convert 24-hour to 12-hour display
  const getDisplayHour = (hour24) => {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
  };

  // Convert 12-hour + AM/PM to 24-hour
  const get24Hour = (hour12, isPM) => {
    if (hour12 === 12) {
      return isPM ? 12 : 0;
    }
    return isPM ? hour12 + 12 : hour12;
  };

  const formatTime = (h, m) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getAngle = (clientX, clientY) => {
    if (!clockRef.current) return 0;
    
    const rect = clockRef.current.getBoundingClientRect();
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    angle = (angle + 90 + 360) % 360;
    return angle;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleTimeSelect(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleTimeSelect(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTimeSelect = (e) => {
    const angle = getAngle(e.clientX, e.clientY);
    
    if (mode === 'hours') {
      // 12-hour clock (1-12)
      const hour12 = Math.round(angle / 30) || 12;
      const hour24 = get24Hour(hour12, ampm === 'PM');
      setTime(formatTime(hour24, minutes));
    } else {
      const minuteValue = Math.round(angle / 6) % 60;
      setTime(formatTime(hours, minuteValue));
    }
  };

  const handleAmPmChange = (event, newAmPm) => {
    if (newAmPm !== null) {
      setAmpm(newAmPm);
      const displayHour = getDisplayHour(hours);
      const newHour24 = get24Hour(displayHour, newAmPm === 'PM');
      setTime(formatTime(newHour24, minutes));
    }
  };

  const handleConfirm = () => {
    // Check if time is valid
    if (minTime) {
      const minDayjs = dayjs(`2000-01-01 ${minTime}`);
      const currentDayjs = dayjs(`2000-01-01 ${time}`);
      
      if (currentDayjs.isBefore(minDayjs) || currentDayjs.isSame(minDayjs)) {
        alert(`End time must be after start time (${minTime}). Please select a time after ${minTime}.`);
        return;
      }
    }
    
    // Convert to dayjs object for consistency
    const timeObj = dayjs(`2000-01-01 ${time}`);
    onChange(timeObj);
    onClose();
  };

  const renderNumbers = () => {
    const numbers = mode === 'hours' ? 
      Array.from({ length: 12 }, (_, i) => i + 1) :
      Array.from({ length: 12 }, (_, i) => i * 5);

    return numbers.map((num) => {
      const angle = mode === 'hours' ? (num * 30) : (num * 6);
      const radian = (angle - 90) * Math.PI / 180;
      const numberRadius = radius - 25;
      
      const x = centerX + numberRadius * Math.cos(radian);
      const y = centerY + numberRadius * Math.sin(radian);

      let isSelected = false;
      if (mode === 'hours') {
        const displayHour = getDisplayHour(hours);
        isSelected = num === displayHour;
      } else {
        isSelected = num === minutes;
      }
      
      return (
        <text
          key={num}
          x={x}
          y={y + 5}
          textAnchor="middle"
          style={{
            fontSize: '14px',
            fontWeight: isSelected ? 'bold' : 'normal',
            fill: isSelected ? 'white' : '#333',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => {
            if (mode === 'hours') {
              const hour24 = get24Hour(num, ampm === 'PM');
              setTime(formatTime(hour24, minutes));
            } else {
              setTime(formatTime(hours, num));
            }
          }}
        >
          {mode === 'hours' ? num : num.toString().padStart(2, '0')}
        </text>
      );
    });
  };

  const renderHand = () => {
    let value, angle;
    
    if (mode === 'hours') {
      const displayHour = getDisplayHour(hours);
      value = displayHour;
      angle = value * 30;
    } else {
      value = minutes;
      angle = value * 6;
    }
    
    const radian = (angle - 90) * Math.PI / 180;
    const handRadius = radius - 25;
    
    const x = centerX + handRadius * Math.cos(radian);
    const y = centerY + handRadius * Math.sin(radian);

    return (
      <g>
        <line
          x1={centerX}
          y1={centerY}
          x2={x}
          y2={y}
          stroke="#1976d2"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx={x}
          cy={y}
          r="12"
          fill="#1976d2"
          style={{ cursor: 'grab' }}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill="#1976d2"
        />
      </g>
    );
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <Card sx={{ maxWidth: 400, width: '90%', mx: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Time
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
              {time}
            </Typography>
          </Box>

          {/* AM/PM Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <ToggleButtonGroup
              value={ampm}
              exclusive
              onChange={handleAmPmChange}
              size="small"
            >
              <ToggleButton value="AM">AM</ToggleButton>
              <ToggleButton value="PM">PM</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Mode Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 1, p: 0.5, display: 'flex' }}>
              <Button
                onClick={() => setMode('hours')}
                variant={mode === 'hours' ? 'contained' : 'text'}
                size="small"
                sx={{ mr: 0.5 }}
              >
                Hours
              </Button>
              <Button
                onClick={() => setMode('minutes')}
                variant={mode === 'minutes' ? 'contained' : 'text'}
                size="small"
              >
                Minutes
              </Button>
            </Box>
          </Box>

          {/* Clock */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <svg
              ref={clockRef}
              width="240"
              height="240"
              style={{
                border: '2px solid #e0e0e0',
                borderRadius: '50%',
                backgroundColor: '#fafafa',
                cursor: 'crosshair'
              }}
              onMouseDown={handleMouseDown}
            >
              {/* Clock face circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              
              {/* Hour/minute markers */}
              {Array.from({ length: mode === 'hours' ? 12 : 60 }, (_, i) => {
                const angle = mode === 'hours' ? ((i + 1) * 30) : (i * 6);
                const radian = (angle - 90) * Math.PI / 180;
                const isMainMark = mode === 'hours' ? true : i % 5 === 0;
                const markLength = isMainMark ? 8 : 4;
                const startRadius = radius - (isMainMark ? 10 : 5);
                const endRadius = radius - (isMainMark ? 10 + markLength : 5 + markLength);
                
                return (
                  <line
                    key={i}
                    x1={centerX + startRadius * Math.cos(radian)}
                    y1={centerY + startRadius * Math.sin(radian)}
                    x2={centerX + endRadius * Math.cos(radian)}
                    y2={centerY + endRadius * Math.sin(radian)}
                    stroke={isMainMark ? "#666" : "#ccc"}
                    strokeWidth={isMainMark ? "2" : "1"}
                  />
                );
              })}

              {/* Numbers */}
              {renderNumbers()}

              {/* Hand */}
              {renderHand()}
            </svg>
          </Box>



          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={onClose}
              startIcon={<Close />}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              startIcon={<Check />}
            >
              Confirm
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// Main Clock Time Picker Component
const ClockTimePicker = ({ label, value, onChange, error, helperText, disabled, minTime, inputStyle }) => {
  const [showClock, setShowClock] = useState(false);

  const handleClockOpen = () => {
    if (!disabled) {
      setShowClock(true);
    }
  };

  const handleClockClose = () => {
    setShowClock(false);
  };

  const handleTimeChange = (newTime) => {
    onChange(newTime);
    setShowClock(false);
  };

  const displayValue = value ? value.format('HH:mm') : '';

  return (
    <Box>
      <Typography mb={1}>{label}</Typography>
      
      <TextField
        value={displayValue}
        onClick={handleClockOpen}
        readOnly
        disabled={disabled}
        error={!!error}
        helperText={error || helperText}
        placeholder="--:--"
        sx={{
          ...inputStyle,
          cursor: disabled ? 'not-allowed' : 'pointer',
          '& .MuiInputBase-input': {
            cursor: disabled ? 'not-allowed' : 'pointer'
          }
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClockOpen}
                disabled={disabled}
                size="small"
                sx={{ color: disabled ? 'text.disabled' : 'primary.main' }}
              >
                <AccessTime />
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      {/* Clock Modal */}
      {showClock && (
        <InteractiveClockPicker
          value={displayValue}
          onChange={handleTimeChange}
          onClose={handleClockClose}
          minTime={minTime ? minTime.format('HH:mm') : null}
        />
      )}
    </Box>
  );
};

export default ClockTimePicker;