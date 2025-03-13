import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Card, CardContent, CardMedia } from '@mui/material';
import { getSession } from "../cognito";

function Boardgames() {
  const [boardgameId, setBoardgameId] = useState('');
  const [boardgame, setBoardgame] = useState(null);
  const [error, setError] = useState('');

  const handleFetchBoardgame = async () => {
    setError('');
    setBoardgame(null);

    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      console.log("TOKEN: " + token);
      console.log(`BOARDGAME ID: ${boardgameId} `);
      const response = await fetch(`http://localhost:9013/boardgames/external-object/${boardgameId}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.log("response: " + response)
        throw new Error(`Failed to fetch boardgame with ID=${boardgameId}`);
      }
      const data = await response.json();
      console.log("data:" + data)
      setBoardgame(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Boardgames</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Boardgame ID"
          value={boardgameId}
          onChange={(e) => setBoardgameId(e.target.value)}
        />
        <Button variant="contained" onClick={handleFetchBoardgame}>
          Fetch
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}

      {boardgame && (
        <Card sx={{ maxWidth: 600 }}>
          {boardgame.image && (
            <CardMedia
              component="img"
              height="250"
              image={boardgame.image}
              alt={boardgame.name || 'Boardgame Image'}
            />
          )}
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {boardgame.name}
            </Typography>

            <Typography variant="body1" color="textSecondary">
              Year: {boardgame.yearPublished}
            </Typography>

            <Typography variant="body1" color="textSecondary">
              Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
            </Typography>

            {(() => {
              const descText = (boardgame.description || '').replace(/<br\s*\/?>/gi, '\n');
              return (
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {descText}
                </Typography>
              );
            })()}
          </CardContent>

        </Card>
      )}

      {!boardgame && !error && (
        <Typography variant="body1">
          Enter a boardgame ID to load details.
        </Typography>
      )}
    </Box>
  );
}

export default Boardgames;
