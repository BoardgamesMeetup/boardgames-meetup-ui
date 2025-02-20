import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

function Events() {
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    setResults(null);

    try {
      // TODO: Logic in events service
      const response = await fetch(`http://localhost:8080/events?search=${encodeURIComponent(searchText)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Events</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search Events"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {error && <Typography color="error">Error: {error}</Typography>}

      {results && (
        <Box>
          <Typography variant="h6">Search Results:</Typography>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </Box>
      )}

      {!results && !error && (
        <Typography variant="body1">Enter a search term to find events.</Typography>
      )}
    </Box>
  );
}

export default Events;
