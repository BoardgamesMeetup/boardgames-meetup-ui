import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getSession } from "../cognito";

function BoardgameProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [referrer, setReferrer] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [externalData, setExternalData] = useState(null);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fromParam = searchParams.get('from');
    if (fromParam) {
      setReferrer(fromParam);
    } else {
      setReferrer(document.referrer);
    }

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

        const favCheckResponse = await fetch(
          `http://localhost:9013/user-service/favorite/boardgames/check/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!favCheckResponse.ok) {
          throw new Error("Failed to check favorites");
        }
        const favCheckData = await favCheckResponse.json();
        setIsFavorite(favCheckData.favorite === true);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, searchParams]);

  const handleAddFavorite = async () => {
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const response = await fetch(
        `http://localhost:9013/user-service/favorite/boardgames/add/${id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add to favorites");
      }
      setIsFavorite(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFavorite = async () => {
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const response = await fetch(
        `http://localhost:9013/user-service/favorite/boardgames/remove/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to remove from favorites");
      }
      setIsFavorite(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = () => {
    if (referrer.includes('events')) {
      navigate(-1);
    } else {
      const queryStr = searchParams.toString();
      navigate(`/?${queryStr}`);
    }
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

  const cleanedDescription = externalData.description
    ? externalData.description.replace(/<br\s*\/?>/g, "\n")
    : "";

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          variant="outlined" 
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Go Back
        </Button>
        <Typography variant="h4">
          {externalData.name || `Boardgame #${externalData.gameId}`}
        </Typography>
      </Box>

      <Card sx={{ mt: 2 }}>
        {externalData.image && (
          <CardMedia
            component="img"
            height="250"
            image={externalData.image}
            alt="Boardgame Image"
            sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
          />
        )}
        <CardContent>
          <Box display="flex" alignItems="center">
            <Typography variant="h5" gutterBottom sx={{ flexGrow: 1 }}>
              {externalData.name
                ? externalData.name
                : `Object #${externalData.gameId}`}
            </Typography>
            <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
              <IconButton onClick={isFavorite ? handleRemoveFavorite : handleAddFavorite}>
                {isFavorite ? (
                  <StarIcon sx={{ color: "gold" }} />
                ) : (
                  <StarBorderIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="body1" color="text.secondary">
            Year Published: {externalData.yearPublished}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Players: {externalData.minPlayers} - {externalData.maxPlayers}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Playing Time: {externalData.playingtime}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: "pre-line", mt: 2 }}>
            {cleanedDescription}
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