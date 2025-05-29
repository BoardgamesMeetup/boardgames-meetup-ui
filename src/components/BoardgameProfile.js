import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Tooltip,
  CircularProgress
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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [externalData, setExternalData] = useState(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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
  }, [id]);

  const handleAddFavorite = async () => {
    setFavoriteLoading(true);
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
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleRemoveFavorite = async () => {
    setFavoriteLoading(true);
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
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBack = () => {
    const queryParams = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    const queryString = new URLSearchParams(queryParams).toString();
    
    navigate(`/boardgames?${queryString}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" ml={2}>Loading boardgame details...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button 
          variant="contained" 
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Return to Search
        </Button>
      </Box>
    );
  }
  
  if (!externalData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">No boardgame data found</Typography>
        <Button 
          variant="contained" 
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Return to Search
        </Button>
      </Box>
    );
  }

  const cleanedDescription = externalData.description
    ? externalData.description.replace(/<br\s*\/?>/g, "\n")
    : "";

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml: -1 }}>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
          sx={{ 
            fontWeight: 500,
            color: 'primary.main',
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          BACK TO SEARCH
        </Button>
      </Box>

      <Card sx={{ maxWidth: 1200, mx: 'auto', mb: 4, boxShadow: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {externalData.image && (
            <Box sx={{ 
              width: { xs: '100%', md: '350px' },
              minHeight: { xs: '250px', md: '450px' },
              backgroundColor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2
            }}>
              <img
                src={externalData.image}
                alt="Boardgame Image"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
          <CardContent sx={{ flex: 1, p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h4" fontWeight="medium" sx={{ flexGrow: 1 }}>
                {externalData.name
                  ? externalData.name
                  : `Boardgame #${externalData.gameId}`}
              </Typography>
              <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <IconButton 
                  onClick={isFavorite ? handleRemoveFavorite : handleAddFavorite}
                  disabled={favoriteLoading}
                  sx={{ width: 40, height: 40 }}
                >
                  {favoriteLoading ? (
                    <CircularProgress size={24} />
                  ) : isFavorite ? (
                    <StarIcon sx={{ color: "gold", fontSize: 28 }} />
                  ) : (
                    <StarBorderIcon sx={{ fontSize: 28 }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 3 }}>
              <Typography variant="body1">
                <strong>Year Published:</strong> {externalData.yearPublished}
              </Typography>
              <Typography variant="body1">
                <strong>Players:</strong> {externalData.minPlayers} - {externalData.maxPlayers}
              </Typography>
              <Typography variant="body1">
                <strong>Playing Time:</strong> {externalData.playingtime} min
              </Typography>
            </Box>
            
            <Typography variant="h6" mb={1}>Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {cleanedDescription || "No description available."}
            </Typography>

            {externalData.expansions && externalData.expansions.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" mb={1}>Expansions</Typography>
                {externalData.expansions.map((exp) => (
                  <Typography key={exp.objectid} variant="body2" mb={0.5}>
                    • {exp.value} (ID: {exp.objectid})
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
}

export default BoardgameProfile;