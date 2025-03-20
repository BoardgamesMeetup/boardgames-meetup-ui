import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button
} from '@mui/material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getSession } from "../cognito";

function BoardgameProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [externalData, setExternalData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        const response = await fetch(
          `http://localhost:9013/boardgames/external-object/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch boardgame external data");
        }
        const data = await response.json();
        setExternalData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleBack = () => {

    const queryStr = searchParams.toString();
    navigate(`/?${queryStr}`);
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!externalData) {
    return <Typography>No boardgame data found</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Boardgame Profile - {externalData.objectId}
      </Typography>

      <Button variant="contained" onClick={handleBack}>
        Back to Search
      </Button>

      <Card sx={{ mt: 2 }}>
        {externalData.image && (
          <CardMedia
            component="img"
            height="250"
            image={externalData.image}
            alt="Boardgame Image"
          />
        )}
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {externalData.names && externalData.names.length
              ? externalData.names[0].value
              : `Object #${externalData.objectId}`}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Year Published: {externalData.yearpublished}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Players: {externalData.minplayers} - {externalData.maxplayers}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Playing Time: {externalData.playingtime}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line", mt: 2 }}>
            {externalData.description}
          </Typography>

          {externalData.expansions && externalData.expansions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Expansions:</Typography>
              {externalData.expansions.map((exp) => (
                <Typography key={exp.objectid} variant="body2">
                  {exp.value} (ID: {exp.objectid})
                </Typography>
              ))}
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}

export default BoardgameProfile;
