import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getSession } from '../cognito';

const mechanicsOptions = [
  "Deck Building",
  "Worker Placement",
  "Drafting",
  "Tile Placement",
  "Cooperative",
  "Hidden Role",
];

const domainOptions = [
  "Fantasy",
  "Sci-Fi",
  "Historical",
  "Horror",
  "Wargames",
  "Family",
];

export default function EventBoardgames() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  
  const [selectedBoardgames, setSelectedBoardgames] = useState([]);
  const [loadingSelected, setLoadingSelected] = useState(true);
  
  const [boardgameName, setBoardgameName] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxPlaytime, setMaxPlaytime] = useState("");
  const [minComplexity, setMinComplexity] = useState("");
  const [maxComplexity, setMaxComplexity] = useState("");
  const [selectedMechanics, setSelectedMechanics] = useState([]);
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [yearPublished, setYearPublished] = useState("");
  
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedError, setSelectedError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        
        const response = await fetch(`http://localhost:9013/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch event details: ${response.status}`);
        }
        
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoadingEvent(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  useEffect(() => {
    const fetchSelectedBoardgames = async () => {
      setLoadingSelected(true);
      setSelectedError('');
      
      try {
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();
        
        const response = await fetch(`http://localhost:9013/boardgames/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            setSelectedBoardgames([]);
            return;
          }
          throw new Error(`Failed to fetch selected boardgames: ${response.status}`);
        }
        
        const data = await response.json();
        setSelectedBoardgames(data);
      } catch (error) {
        console.error("Error fetching selected boardgames:", error);
        setSelectedError('Failed to load selected boardgames. Please try again.');
      } finally {
        setLoadingSelected(false);
      }
    };
    
    fetchSelectedBoardgames();
  }, [eventId]);
  
  const handleSearch = async (page = 1, size = pageSize) => {
    setSearchError('');
    setLoadingSearch(true);
    setPageNumber(page);
    
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const filters = {
        name: boardgameName || null,
        minPlayers: minPlayers ? Number(minPlayers) : null,
        maxPlayers: maxPlayers ? Number(maxPlayers) : null,
        minAge: minAge ? Number(minAge) : null,
        maxPlaytime: maxPlaytime ? Number(maxPlaytime) : null,
        minComplexity: minComplexity ? parseFloat(minComplexity) : null,
        maxComplexity: maxComplexity ? parseFloat(maxComplexity) : null,
        mechanics: selectedMechanics.length ? selectedMechanics : null,
        domains: selectedDomains.length ? selectedDomains : null,
        yearPublished: yearPublished ? Number(yearPublished) : null,
      };
      
      const url = `http://localhost:9013/boardgames/search?page=${page}&size=${size}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch boardgames");
      }
      
      const data = await response.json();
      setSearchResults(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error searching boardgames:", error);
      setSearchError('Failed to search boardgames. Please try again.');
    } finally {
      setLoadingSearch(false);
    }
  };
  
  const handleAddBoardgame = (boardgame) => {
    if (selectedBoardgames.some(bg => bg.gameId === boardgame.gameId)) {
      return; 
    }
    setSelectedBoardgames(prev => [...prev, boardgame]);
  };
  
  const handleRemoveBoardgame = (gameId) => {
    setSelectedBoardgames(prev => prev.filter(bg => bg.gameId !== gameId));
  };
  
  const handleSave = async () => {
    setSaveError('');
    setSaving(true);
    
    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();
      
      const gameIds = selectedBoardgames.map(bg => bg.gameId);
      
      const response = await fetch(`http://localhost:9013/events/${eventId}/boardgames-list`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gameIds)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save boardgames: ${response.status}`);
      }
      
      navigate('/events/search');
    } catch (error) {
      console.error("Error saving boardgames:", error);
      setSaveError('Failed to save boardgames. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddLater = () => {
    navigate('/events/search');
  };
  
  const handleClearSearch = () => {
    setBoardgameName("");
    setMinPlayers("");
    setMaxPlayers("");
    setMinAge("");
    setMaxPlaytime("");
    setMinComplexity("");
    setMaxComplexity("");
    setSelectedMechanics([]);
    setSelectedDomains([]);
    setYearPublished("");
    setPageNumber(1);
    setSearchResults([]);
  };
  
  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      handleSearch(pageNumber + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (pageNumber > 1) {
      handleSearch(pageNumber - 1);
    }
  };
  
  const handlePageSizeChange = (e) => {
    const newSize = e.target.value;
    setPageSize(newSize);
    setPageNumber(1);
    handleSearch(1, newSize);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" mb={3}>Select Boardgames for Event</Typography>
      
      {saveError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {saveError}
        </Alert>
      )}
      
      {loadingEvent ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <CircularProgress />
        </Box>
      ) : event && (
        <Card sx={{ mb: 4, maxWidth: 1000, mx: 'auto', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>{event.title}</Typography>
            <Typography variant="body1" color="text.secondary">
              {event.day} • {event.startHour} - {event.endHour}
            </Typography>
            <Typography variant="body2" mt={1}>
              {event.description}
            </Typography>
            {(event.placeName || event.address) && (
              <Box mt={2}>
                <Typography variant="body2">
                  <strong>Venue:</strong> {event.placeName || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong>{" "}
                  {event.address ? (
                    <a 
                      href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'underline' }}
                    >
                      {event.address}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Card sx={{ mb: 4, maxWidth: 1000, mx: 'auto', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" mb={3} fontWeight="medium">Selected Boardgames</Typography>
          
          {selectedError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {selectedError}
            </Alert>
          )}
          
          {loadingSelected ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            selectedBoardgames.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center', py: 4 }}>
                No boardgames selected for event
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedBoardgames.map((boardgame) => (
                  <Card key={boardgame.gameId} sx={{ 
                    width: '100%',
                    display: 'flex',
                    height: 60,
                    alignItems: 'center'
                  }}>
                    <CardContent sx={{ 
                      py: 1, 
                      px: 2,
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      maxWidth: '100%',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        width: '60%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {boardgame.name}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        gap: 2, 
                        width: '40%',
                        minWidth: 'fit-content'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          Year: {boardgame.yearPublished}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
                        </Typography>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveBoardgame(boardgame.gameId)}
                          aria-label="remove boardgame"
                          size="small"
                          sx={{ flexShrink: 0 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, maxWidth: 1000, mx: 'auto', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" mb={3} fontWeight="medium">Search Boardgames</Typography>
          
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Boardgame Name"
                fullWidth
                size="small"
                value={boardgameName}
                onChange={(e) => setBoardgameName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Min Players"
                fullWidth
                size="small"
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max Players"
                fullWidth
                size="small"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Min Age"
                fullWidth
                size="small"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max Playtime"
                fullWidth
                size="small"
                value={maxPlaytime}
                onChange={(e) => setMaxPlaytime(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Min Complexity"
                fullWidth
                size="small"
                inputProps={{ step: "0.1" }}
                value={minComplexity}
                onChange={(e) => setMinComplexity(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max Complexity"
                fullWidth
                size="small"
                inputProps={{ step: "0.1" }}
                value={maxComplexity}
                onChange={(e) => setMaxComplexity(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mechanics-label">Mechanics</InputLabel>
                  <Select
                    labelId="mechanics-label"
                    label="Mechanics"
                    multiple
                    value={selectedMechanics}
                    onChange={(e) => setSelectedMechanics(e.target.value)}
                    input={<OutlinedInput label="Mechanics" />}
                    renderValue={(selected) => selected.join(", ")}
                    sx={{ minWidth: 210 }}
                  >
                    {mechanicsOptions.map((mechanic) => (
                      <MenuItem key={mechanic} value={mechanic}>
                        <Checkbox checked={selectedMechanics.indexOf(mechanic) > -1} />
                        <ListItemText primary={mechanic} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="domains-label">Domains</InputLabel>
                  <Select
                    labelId="domains-label"
                    label="Domains"
                    multiple
                    value={selectedDomains}
                    onChange={(e) => setSelectedDomains(e.target.value)}
                    input={<OutlinedInput label="Domains" />}
                    renderValue={(selected) => selected.join(", ")}
                    sx={{ minWidth: 210 }}
                  >
                    {domainOptions.map((domain) => (
                      <MenuItem key={domain} value={domain}>
                        <Checkbox checked={selectedDomains.indexOf(domain) > -1} />
                        <ListItemText primary={domain} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Year Published"
                fullWidth
                size="small"
                value={yearPublished}
                onChange={(e) => setYearPublished(e.target.value)}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="contained" onClick={() => handleSearch(1)} disabled={loadingSearch}>
              {loadingSearch ? <CircularProgress size={24} color="inherit" /> : "Search"}
            </Button>
            <Button variant="outlined" onClick={handleClearSearch} disabled={loadingSearch}>
              Clear
            </Button>
            <Box sx={{ flexGrow: 1 }}></Box>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="page-size-label">Page Size</InputLabel>
              <Select
                labelId="page-size-label"
                label="Page Size"
                value={pageSize}
                onChange={handlePageSizeChange}
                disabled={loadingSearch}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {searchError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {searchError}
            </Alert>
          )}
          
          {loadingSearch ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : searchResults.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {searchResults.map((boardgame) => (
                  <Card key={boardgame.gameId} sx={{ 
                    width: '100%',
                    display: 'flex',
                    height: 60,
                    alignItems: 'center',
                    position: 'relative',
                    boxShadow: 1,
                    '&:hover': { boxShadow: 3 }
                  }}>
                    <CardContent sx={{ 
                      py: 1, 
                      px: 2,
                      display: 'flex', 
                      alignItems: 'center', 
                      width: '100%',
                      maxWidth: '100%',
                      justifyContent: 'space-between'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        width: '60%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {boardgame.name}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        gap: 2, 
                        width: '40%',
                        minWidth: 'fit-content'
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          Year: {boardgame.yearPublished}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                          Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
                        </Typography>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleAddBoardgame(boardgame)}
                          disabled={selectedBoardgames.some(bg => bg.gameId === boardgame.gameId)}
                          aria-label="add boardgame"
                          size="small"
                          sx={{ flexShrink: 0 }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                    {selectedBoardgames.some(bg => bg.gameId === boardgame.gameId) && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        right: 0, 
                        backgroundColor: 'success.main', 
                        color: 'white',
                        px: 1,
                        borderBottomLeftRadius: 4
                      }}>
                        <Typography variant="body2">Added</Typography>
                      </Box>
                    )}
                  </Card>
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handlePrevPage} 
                  disabled={pageNumber <= 1 || loadingSearch}
                >
                  Previous
                </Button>
                <Typography>
                  Page {pageNumber} of {totalPages}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleNextPage} 
                  disabled={pageNumber >= totalPages || loadingSearch}
                >
                  Next
                </Button>
              </Box>
            </>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              {searchResults.length === 0 && pageNumber > 1 
                ? "No more boardgames found. Try a different search." 
                : "Use the filters above to search for boardgames."}
            </Typography>
          )}
        </CardContent>
      </Card>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 1000, mx: 'auto' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleAddLater}
            disabled={saving}
          >
            Add Later
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                Saving...
              </>
            ) : (
              "Finish"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}