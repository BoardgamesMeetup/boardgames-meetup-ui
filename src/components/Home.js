import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import dayjs from 'dayjs';

function Home({ userName }) {
  const [selectedDate, setSelectedDate] = useState(dayjs('2025-03-24'));

  const [suggestedEvents] = useState([
    {
      id: 1,
      title: 'Test Event',
      date: 'Tue, 24 Mar 2025 - 7:00 PM EET',
      location: 'Pub X - Bucharest, RO',
      attendees: 50,
    },
    {
      id: 2,
      title: 'Test Event 2',
      date: 'Tue, 24 Mar 2025 - 7:30 PM EET',
      location: 'Restaurant X - Bucharest, RO',
      attendees: 20,
    },
  ]);

  const [userNextEvents] = useState([]);

  const isMatchForSelectedDate = selectedDate.date() === 24;

  const handleThisWeek = () => {
    alert('Loading events for this week...');
  };
  const handleThisWeekend = () => {
    alert('Loading events for this weekend...');
  };
  const handleNextWeek = () => {
    alert('Loading events for next week...');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Welcome, {userName} <span role="img" aria-label="wave">👋</span>
        </Typography>
        <Typography variant="h5" gutterBottom>
          Events from your boardgaming feed
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
              <DatePicker
                label="Pick a date"
                value={selectedDate}
                onChange={(newValue) => {
                  if (newValue) {
                    setSelectedDate(newValue);
                  }
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button variant="outlined" size="small" onClick={handleThisWeek}>
                  This week
                </Button>
                <Button variant="outlined" size="small" onClick={handleThisWeekend}>
                  This weekend
                </Button>
                <Button variant="outlined" size="small" onClick={handleNextWeek}>
                  Next week
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Today
            </Typography>
            {!isMatchForSelectedDate ? (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                No matches found for {selectedDate.format('ddd, MMM D YYYY')}
              </Typography>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Tuesday, March 25</Typography>
                {suggestedEvents.map((ev) => (
                  <Paper key={ev.id} sx={{ p: 2, mt: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {ev.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ev.date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ev.location} | {ev.attendees} attendees
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }} elevation={1}>
              <Typography variant="h6" gutterBottom>
                Your next events
              </Typography>
              {userNextEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  You have not registered for any events
                </Typography>
              ) : (
                <List>
                  {userNextEvents.map((ev) => (
                    <ListItem key={ev.id} button>
                      <ListItemText
                        primary={ev.title}
                        secondary={ev.date}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}

export default Home;
