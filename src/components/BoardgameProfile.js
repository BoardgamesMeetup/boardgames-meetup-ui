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
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Alert
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import TimerIcon from '@mui/icons-material/Timer';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getSession } from "../cognito";

function BoardgameProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [combinedData, setCombinedData] = useState(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();

        // Fetching combined boardgame data
        const response = await fetch(
          `http://localhost:9013/boardgames/combined-profile/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch boardgame data");
        }
        const data = await response.json();
        setCombinedData(data);

        const favCheckResponse = await fetch(
          `http://localhost:9013/boardgames/${id}/favorites/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!favCheckResponse.ok) {
          console.warn("Failed to check favorite status - assuming not favorite");
          setIsFavorite(false);
        } else {
          const favCheckData = await favCheckResponse.json();
          setIsFavorite(favCheckData.isFavorite === true);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFavoriteClick = async () => {
    if (isFavorite) {
      await handleRemoveFavorite();
    } else {
      await handleAddFavorite();
    }
  };

  const handleAddFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const response = await fetch(
        `http://localhost:9013/boardgames/${id}/favorites`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add to favorites");
      }

      const result = await response.json();
      if (result.status === 'success') {
        setIsFavorite(true);
        console.log("Boardgame added to favorites successfully");
      } else {
        throw new Error(result.message || "Failed to add to favorites");
      }

    } catch (err) {
      console.error("Error adding to favorites:", err);
      setError("Failed to add to favorites. Please try again.");
      setTimeout(() => setError(""), 3000);
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
        `http://localhost:9013/boardgames/${id}/favorites`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove from favorites");
      }

      const result = await response.json();
      if (result.status === 'success') {
        setIsFavorite(false);
        console.log("Boardgame removed from favorites successfully");
      } else {
        throw new Error(result.message || "Failed to remove from favorites");
      }

    } catch (err) {
      console.error("Error removing from favorites:", err);
      setError("Failed to remove from favorites. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBack = () => {

    const fromPage = searchParams.get('from');
    const eventId = searchParams.get('eventId');

    if (fromPage === 'events' && eventId) {
      navigate(`/events/${eventId}`);
    } else {
      const queryParams = {};
      searchParams.forEach((value, key) => {
        if (key !== 'from' && key !== 'eventId') {
         queryParams[key] = value;
        }
    });
      const queryString = new URLSearchParams(queryParams).toString();

      navigate(`/boardgames?${queryString}`);
    }
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

  if (!combinedData) {
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

  const cleanedDescription = combinedData.description
    ? combinedData.description.replace(/<br\s*\/?>/g, "\n")
    : "";

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
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
          BACK
        </Button>
      </Box>

      {/* Show error message if there's a temporary error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ maxWidth: 1400, mx: 'auto', mb: 4, boxShadow: 3 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {combinedData.image && (
            <Box sx={{
              width: { xs: '100%', md: '350px' },
              minHeight: { xs: '250px', md: '450px' },
              backgroundColor: '#f5f5f5',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              p: 2
            }}>
              <img
                src={combinedData.image}
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
                {combinedData.name || `Boardgame #${combinedData.gameId}`}
              </Typography>
              <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <IconButton
                  onClick={handleFavoriteClick}
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

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4} md={2.4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Players</Typography>
                    <Typography variant="h6">{combinedData.minPlayers} - {combinedData.maxPlayers}</Typography>
                  </Box>
                </Box>
              </Grid>

              {(combinedData.playingtime || combinedData.playTime) && (
                <Grid item xs={6} sm={4} md={2.4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Time</Typography>
                      <Typography variant="h6">{combinedData.playingtime || combinedData.playTime} min</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {combinedData.yearPublished && (
                <Grid item xs={6} sm={4} md={2.4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Year</Typography>
                    <Typography variant="h6">{combinedData.yearPublished}</Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={6} sm={4} md={2.4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Age limit</Typography>
                  <Typography variant="h6">
                    {combinedData.minAge && combinedData.minAge > 0
                      ? `${combinedData.minAge}+`
                      : "N/A"
                    }
                  </Typography>
                </Box>
              </Grid>

              {combinedData.complexityAverage && (
                <Grid item xs={6} sm={4} md={2.4}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Complexity</Typography>
                    <Typography variant="h6">{combinedData.complexityAverage.toFixed(1)}/5</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" mb={1}>Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 3 }}>
              {cleanedDescription || "No description available."}
            </Typography>

            {combinedData.expansions && combinedData.expansions.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" mb={1}>Expansions</Typography>
                {combinedData.expansions.map((exp) => (
                  <Typography key={exp.objectid} variant="body2" mb={0.5}>
                    • {exp.value} (ID: {exp.objectid})
                  </Typography>
                ))}
              </Box>
            )}
          </CardContent>
        </Box>
      </Card>

      {/* Mechanics and Domains */}
      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {combinedData.mechanics && combinedData.mechanics.length > 0 && (
          <Grid item xs={12} sm={6} md={5} lg={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>Detailed Mechanics</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {combinedData.mechanics.map((mechanic, index) => (
                  <Chip
                    key={index}
                    label={mechanic}
                    variant="outlined"
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
            </Card>
          </Grid>
        )}

        {combinedData.domains && combinedData.domains.length > 0 && (
          <Grid item xs={12} sm={6} md={5} lg={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>Game Domain</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {combinedData.domains.map((domain, index) => (
                  <Chip
                    key={index}
                    label={domain}
                    variant="outlined"
                    color="secondary"
                    size="small"
                  />
                ))}
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default BoardgameProfile;