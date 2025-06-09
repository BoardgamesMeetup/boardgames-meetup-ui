import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert
} from '@mui/material';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { getSession } from "../cognito";
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import RecommendIcon from '@mui/icons-material/Recommend';

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

function Boardgames() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [boardgameId, setBoardgameId] = useState(searchParams.get("boardgameId") || "");
  const [boardgameName, setBoardgameName] = useState(searchParams.get("boardgameName") || "");
  const [minPlayers, setMinPlayers] = useState(searchParams.get("minPlayers") || "");
  const [maxPlayers, setMaxPlayers] = useState(searchParams.get("maxPlayers") || "");
  const [yearPublished, setYearPublished] = useState(searchParams.get("yearPublished") || "");
  
  const [minAge, setMinAge] = useState(searchParams.get("minAge") || "");
  const [maxPlaytime, setMaxPlaytime] = useState(searchParams.get("maxPlaytime") || "");
  const [minComplexity, setMinComplexity] = useState(searchParams.get("minComplexity") || "");
  const [maxComplexity, setMaxComplexity] = useState(searchParams.get("maxComplexity") || "");
  const [selectedMechanics, setSelectedMechanics] = useState(
    searchParams.get("mechanics") ? searchParams.get("mechanics").split(",").filter(m => m !== "") : []
  );
  const [selectedDomains, setSelectedDomains] = useState(
    searchParams.get("domains") ? searchParams.get("domains").split(",").filter(d => d !== "") : []
  );

  const [expandedFilters, setExpandedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  const defaultPageNumber = parseInt(searchParams.get("page") || "1", 10);
  const [pageNumber, setPageNumber] = useState(defaultPageNumber);
  const defaultPageSize = parseInt(searchParams.get("size") || "5", 10);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalPages, setTotalPages] = useState(1);

  const [suggestionPageNumber, setSuggestionPageNumber] = useState(1);
  const [suggestionTotalPages, setSuggestionTotalPages] = useState(1);

  const [boardgame, setBoardgame] = useState(null);
  const [boardgames, setBoardgames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const restoreStateFromLocalStorage = () => {
      try {
        const savedFilters = JSON.parse(localStorage.getItem('boardgameSearchFilters'));
        if (savedFilters) {
          if (savedFilters.boardgameId) setBoardgameId(savedFilters.boardgameId);
          if (savedFilters.boardgameName) setBoardgameName(savedFilters.boardgameName);
          if (savedFilters.minPlayers) setMinPlayers(savedFilters.minPlayers);
          if (savedFilters.maxPlayers) setMaxPlayers(savedFilters.maxPlayers);
          if (savedFilters.yearPublished) setYearPublished(savedFilters.yearPublished);
          
          if (savedFilters.minAge) setMinAge(savedFilters.minAge);
          if (savedFilters.maxPlaytime) setMaxPlaytime(savedFilters.maxPlaytime);
          if (savedFilters.minComplexity) setMinComplexity(savedFilters.minComplexity);
          if (savedFilters.maxComplexity) setMaxComplexity(savedFilters.maxComplexity);
          
          if (savedFilters.mechanics && Array.isArray(savedFilters.mechanics)) {
            setSelectedMechanics(savedFilters.mechanics);
          }
          if (savedFilters.domains && Array.isArray(savedFilters.domains)) {
            setSelectedDomains(savedFilters.domains);
          }
        }
        
        const savedPageNumber = localStorage.getItem('boardgamePageNumber');
        const savedPageSize = localStorage.getItem('boardgamePageSize');
        
        if (savedPageNumber) setPageNumber(parseInt(savedPageNumber, 10));
        if (savedPageSize) setPageSize(parseInt(savedPageSize, 10));
        
        const savedResults = JSON.parse(localStorage.getItem('boardgameSearchResults'));
        const savedTotalPages = localStorage.getItem('boardgameTotalPages');
        
        if (savedResults && savedResults.length > 0) {
          setBoardgames(savedResults);
          setHasSearched(true);
          
          if (savedTotalPages) {
            setTotalPages(parseInt(savedTotalPages, 10));
          }
          
          setStateRestored(true);
          console.log('Restored search state from localStorage');
        }
      } catch (error) {
        console.error('Error restoring state from localStorage:', error);
      }
    };
    
    restoreStateFromLocalStorage();
  }, []);

  useEffect(() => {
    const performInitialSearch = async () => {
      if (stateRestored) return;
      
      if (Object.keys(searchParams).length > 0) {
        handleFetchBoardgame(pageNumber);
      }
    };
    
    performInitialSearch();
  }, [stateRestored]);

  const handleToggleFilters = () => {
    setExpandedFilters(!expandedFilters);
  };

  const buildSearchCriteria = () => {
    return {
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
  };

  const handleFetchSuggestions = async (overridePage = 1) => {
    setError("");
    setIsLoadingSuggestions(true);
    setBoardgame(null);
    setBoardgames([]);
    setSuggestions([]);
    setShowingSuggestions(true);

    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const searchCriteria = buildSearchCriteria();
      
      console.log("Getting suggestions with criteria:", searchCriteria);
      console.log("Suggestion Page:", overridePage, "Size:", pageSize);

      const response = await fetch(
        `http://localhost:9013/boardgames/recommend?page=${overridePage}&size=${pageSize}`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(searchCriteria),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      
      const suggestionContent = data.content || [];
      setSuggestions(suggestionContent);
      setSuggestionTotalPages(data.totalPages || 1);
      setSuggestionPageNumber(overridePage);
      setHasSearched(true);
      
      console.log("Received paged suggestions:", data);
      
    } catch (err) {
      console.error("Suggestions error:", err);
      setError(err.message);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleFetchBoardgame = async (overridePage = 1) => {
    setError("");
    setIsLoading(true);
    setBoardgame(null);
    setBoardgames([]);
    setSuggestions([]);
    setShowingSuggestions(false);

    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const newParams = {
        boardgameId,
        boardgameName,
        minPlayers,
        maxPlayers,
        minAge,
        maxPlaytime,
        minComplexity,
        maxComplexity,
        mechanics: selectedMechanics.join(","),
        domains: selectedDomains.join(","),
        yearPublished,
        page: overridePage.toString(),
        size: pageSize.toString(),
      };
      
      Object.keys(newParams).forEach((key) => {
        if (!newParams[key]) delete newParams[key];
      });
      
      setSearchParams(newParams);

      const filtersToSave = {
        boardgameId,
        boardgameName,
        minPlayers,
        maxPlayers,
        minAge,
        maxPlaytime,
        minComplexity,
        maxComplexity,
        mechanics: selectedMechanics,
        domains: selectedDomains,
        yearPublished
      };
      
      localStorage.setItem('boardgameSearchFilters', JSON.stringify(filtersToSave));
      localStorage.setItem('boardgamePageNumber', overridePage.toString());
      localStorage.setItem('boardgamePageSize', pageSize.toString());

      if (boardgameId.trim()) {
        const response = await fetch(
          `http://localhost:9013/boardgames/external-object/${boardgameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch boardgame with ID=${boardgameId}`);
        }
        const data = await response.json();
        setBoardgame(data);
      } else {
        const filters = buildSearchCriteria();

        console.log("Searching with filters:", filters);
        console.log("Page:", overridePage, "Size:", pageSize);

        const url = `http://localhost:9013/boardgames/search?page=${overridePage}&size=${pageSize}`;
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
        const resultContent = data.content || [];
        
        setBoardgames(resultContent);
        setTotalPages(data.totalPages || 1);
        setHasSearched(true);
        
        localStorage.setItem('boardgameSearchResults', JSON.stringify(resultContent));
        localStorage.setItem('boardgameTotalPages', (data.totalPages || 1).toString());
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      handleFetchBoardgame(newPage);
    }
  };
  
  const handlePrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      handleFetchBoardgame(newPage);
    }
  };

  const handleNextSuggestionPage = () => {
    if (suggestionPageNumber < suggestionTotalPages) {
      const newPage = suggestionPageNumber + 1;
      handleFetchSuggestions(newPage);
    }
  };
  
  const handlePrevSuggestionPage = () => {
    if (suggestionPageNumber > 1) {
      const newPage = suggestionPageNumber - 1;
      handleFetchSuggestions(newPage);
    }
  };

  const handleClear = () => {
    setBoardgameId("");
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
    setPageSize(5);
    setSuggestionPageNumber(1);
    setSuggestionTotalPages(1);
    setBoardgame(null);
    setBoardgames([]);
    setSuggestions([]);
    setTotalPages(1);
    setHasSearched(false);
    setShowingSuggestions(false);

    localStorage.removeItem('boardgameSearchFilters');
    localStorage.removeItem('boardgameSearchResults');
    localStorage.removeItem('boardgamePageNumber');
    localStorage.removeItem('boardgamePageSize');
    localStorage.removeItem('boardgameTotalPages');

    setSearchParams({});
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setPageNumber(1);
    setSuggestionPageNumber(1);
    
    if (showingSuggestions) {
      handleFetchSuggestions(1);
    } else {
      handleFetchBoardgame(1);
    }
  };

  const getQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", pageNumber.toString());
    params.append("size", pageSize.toString());
    if (boardgameName) params.append("boardgameName", boardgameName);
    if (minPlayers) params.append("minPlayers", minPlayers);
    if (maxPlayers) params.append("maxPlayers", maxPlayers);
    if (minAge) params.append("minAge", minAge);
    if (maxPlaytime) params.append("maxPlaytime", maxPlaytime);
    if (minComplexity) params.append("minComplexity", minComplexity);
    if (maxComplexity) params.append("maxComplexity", maxComplexity);
    if (selectedMechanics.length) params.append("mechanics", selectedMechanics.join(","));
    if (selectedDomains.length) params.append("domains", selectedDomains.join(","));
    if (yearPublished) params.append("yearPublished", yearPublished);
    return params.toString();
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Boardgames
      </Typography>

      <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 3, boxShadow: 3 }}>
        <Typography variant="h5" mb={3} fontWeight="medium">Search Boardgames</Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Boardgame Name"
              fullWidth
              size="small"
              value={boardgameName}
              onChange={(e) => setBoardgameName(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Boardgame ID"
              fullWidth
              size="small"
              value={boardgameId}
              onChange={(e) => setBoardgameId(e.target.value)}
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
              label="Year Published"
              fullWidth
              size="small"
              value={yearPublished}
              onChange={(e) => setYearPublished(e.target.value)}
            />
          </Grid>
        </Grid>

        <Accordion 
          expanded={expandedFilters} 
          onChange={handleToggleFilters}
          sx={{ 
            mb: 3, 
            boxShadow: 'none', 
            '&:before': { display: 'none' },
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: 1
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: expandedFilters ? '4px 4px 0 0' : 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography>Advanced Filters</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Min Age"
                  fullWidth
                  size="small"
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Max Playtime"
                  fullWidth
                  size="small"
                  value={maxPlaytime}
                  onChange={(e) => setMaxPlaytime(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Min Complexity"
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.1" }}
                  value={minComplexity}
                  onChange={(e) => setMinComplexity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Max Complexity"
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.1" }}
                  value={maxComplexity}
                  onChange={(e) => setMaxComplexity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                    sx={{ minWidth: 205 }}
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
              <Grid item xs={12} md={6}>
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
                    sx={{ minWidth: 205 }}
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
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Search Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <Button 
            variant="contained" 
            onClick={() => handleFetchBoardgame(1)} 
            disabled={isLoading || isLoadingSuggestions}
            startIcon={<SearchIcon />}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Search"}
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => handleFetchSuggestions(1)} 
            disabled={isLoading || isLoadingSuggestions}
            startIcon={<RecommendIcon />}
          >
            {isLoadingSuggestions ? <CircularProgress size={24} color="inherit" /> : "Suggestions"}
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleClear} 
            disabled={isLoading || isLoadingSuggestions}
          >
            Clear All
          </Button>
          <Box sx={{ flexGrow: 1 }}></Box>
          <Typography mr={1}>Page Size:</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              disabled={isLoading || isLoadingSuggestions}
              sx={{ height: 36 }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {boardgame && (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 3, boxShadow: 3 }}>
          <Typography variant="h5" mb={3} fontWeight="medium">Boardgame Details</Typography>
          
          <Card sx={{ display: 'flex', mb: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              width: '100%' 
            }}>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                width: '100%'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  width: { xs: '100%', md: '70%' } 
                }}>
                  <Typography variant="h6" component="div">
                    {boardgame.names && boardgame.names.length
                      ? boardgame.names[0].value
                      : boardgame.name || "Unnamed"}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  gap: 3,
                  width: { xs: '100%', md: '30%' } 
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Year: {boardgame.yearpublished}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Players: {boardgame.minplayers} - {boardgame.maxplayers}
                  </Typography>
                </Box>
              </CardContent>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {boardgame.description ? boardgame.description.substring(0, 300) + (boardgame.description.length > 300 ? '...' : '') : "No description available."}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Paper>
      )}

      {suggestions.length > 0 && showingSuggestions && (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 3, boxShadow: 3 }}>
          <Typography variant="h5" mb={3} fontWeight="medium">
            Personalized Recommendations
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {suggestions.map((boardgame) => (
              <Card key={boardgame.gameId} sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <CardContent sx={{ 
                    py: 2, 
                    px: 3,
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="subtitle1" sx={{ 
                      width: '50%',
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
                      gap: 3, 
                      width: '50%',
                      minWidth: 'fit-content'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                        Year: {boardgame.yearPublished}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                        Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
                      </Typography>
                      <Button
                        component={Link}
                        to={`/boardgame/${boardgame.gameId}?${getQueryParams()}`}
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<InfoIcon />}
                        sx={{ flexShrink: 0 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            ))}
          </Box>
          
          {/* Pagination for suggestions */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handlePrevSuggestionPage} 
              disabled={suggestionPageNumber <= 1 || isLoadingSuggestions}
            >
              Previous
            </Button>
            <Typography>
              Page {suggestionPageNumber} of {suggestionTotalPages}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleNextSuggestionPage} 
              disabled={suggestionPageNumber >= suggestionTotalPages || isLoadingSuggestions}
            >
              Next
            </Button>
          </Box>
        </Paper>
      )}

      {boardgames.length > 0 && !showingSuggestions && (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 3, boxShadow: 3 }}>
          <Typography variant="h5" mb={3} fontWeight="medium">Search Results</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {boardgames.map((boardgame) => (
              <Card key={boardgame.gameId} sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <CardContent sx={{ 
                    py: 2, 
                    px: 3,
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="subtitle1" sx={{ 
                      width: '50%',
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
                      gap: 3, 
                      width: '50%',
                      minWidth: 'fit-content'
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                        Year: {boardgame.yearPublished}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                        Players: {boardgame.minPlayers} - {boardgame.maxPlayers}
                      </Typography>
                      <Button
                        component={Link}
                        to={`/boardgame/${boardgame.gameId}?${getQueryParams()}`}
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<InfoIcon />}
                        sx={{ flexShrink: 0 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Box>
              </Card>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={handlePrevPage} 
              disabled={pageNumber <= 1 || isLoading}
            >
              Previous
            </Button>
            <Typography>
              Page {pageNumber} of {totalPages}
            </Typography>
            <Button 
              variant="outlined" 
              onClick={handleNextPage} 
              disabled={pageNumber >= totalPages || isLoading}
            >
              Next
            </Button>
          </Box>
        </Paper>
      )}

      {/* No results message for search */}
      {boardgames.length === 0 && !showingSuggestions && !boardgame && hasSearched && !isLoading && !error && (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            No boardgames found
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Your search didn't return any results. Try adjusting your search criteria or removing some filters.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={handleClear}
              startIcon={<SearchIcon />}
            >
              Clear All Filters
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => handleFetchSuggestions(1)}
              startIcon={<RecommendIcon />}
            >
              Get Suggestions Instead
            </Button>
          </Box>
        </Paper>
      )}

      {/* No results message for suggestions */}
      {suggestions.length === 0 && showingSuggestions && hasSearched && !isLoadingSuggestions && !error && (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', mb: 4, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            No suggestions available
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            We couldn't generate personalized recommendations based on your current criteria. Try adjusting your filters or searching with different criteria.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              onClick={handleClear}
              startIcon={<SearchIcon />}
            >
              Clear All Filters
            </Button>
            <Button 
              variant="contained" 
              onClick={() => handleFetchBoardgame(1)}
              startIcon={<SearchIcon />}
            >
              Try Regular Search
            </Button>
          </Box>
        </Paper>
      )}

      {!boardgame && boardgames.length === 0 && suggestions.length === 0 && !error && !isLoading && !isLoadingSuggestions && !hasSearched && (
        <Paper sx={{ maxWidth: 1200, mx: 'auto', p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Enter search criteria and click "Search" to find boardgames or "Suggestions" to get personalized recommendations.
          </Typography>
        </Paper>
      )}

      {(isLoading || isLoadingSuggestions) && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="h6" ml={2}>
            {isLoading ? 'Searching boardgames...' : 'Getting personalized suggestions...'}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default Boardgames;