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
import { MECHANIC_CATEGORIES, DOMAIN_OPTIONS } from '../utils/boardgameConstants';

function Boardgames() {
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
  const [showingSuggestions, setShowingSuggestions] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [suggestionPageNumber, setSuggestionPageNumber] = useState(1);
  const [suggestionTotalPages, setSuggestionTotalPages] = useState(1);

  const [boardgame, setBoardgame] = useState(null);
  const [boardgames, setBoardgames] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  const defaultFilters = {
    boardgameId: '',
    boardgameName: '',
    minPlayers: '',
    maxPlayers: '',
    minAge: '',
    maxPlaytime: '',
    minComplexity: '',
    maxComplexity: '',
    mechanics:[],
    domains: [],
    yearPublished: ''
  };

  const [filters, setFilters] = useState(defaultFilters);

  // const mechanicCategoryOptions = Object.keys(MECHANIC_CATEGORIES);
  // const domainOptions = DOMAIN_OPTIONS;

  // const getIndividualMechanicsFromCategories = (categories) => {
  //   const mechanics = [];
  //   categories.forEach(category => {
  //     if (MECHANIC_CATEGORIES[category]) {
  //       mechanics.push(...MECHANIC_CATEGORIES[category]);
  //     }
  //   });
  //   return mechanics;
  // };


  useEffect(() => {
    const restoreStateFromLocalStorage = () => {
      try {
        const savedFilters = JSON.parse(localStorage.getItem('boardgameSearchFilters'));
        if (savedFilters) {
          // Merge saved filters with default filters to ensure all properties exist
          setFilters(prevFilters => ({
            ...prevFilters,
            ...savedFilters
          }));
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
      
      const hasFilters = Object.values(filters).some(value => 
        Array.isArray(value) ? value.length > 0 : value !== ''
      );
      
      if (hasFilters) {
        handleFetchBoardgame(pageNumber);
      }
    };
    
    performInitialSearch();
  }, [stateRestored]); 


  useEffect(() => {
    // Only save if filters have actual values (not just the initial empty state)
    const hasFilters = Object.values(filters).some(value => 
      Array.isArray(value) ? value.length > 0 : value !== ''
    );
    
    if (hasFilters) {
      localStorage.setItem('boardgameSearchFilters', JSON.stringify(filters));
    }
  }, [filters]);

  const handleToggleFilters = () => {
    setExpandedFilters(!expandedFilters);
  };


  const [stringErrors, setStringErrors] = useState({
    boardgameName: '',
  });

  const [gameIDErrors, setGameIDErrors] = useState({
    boardgameId: ''
  });

  const [numberErrors, setNumberErrors] = useState({
    minAge: '',
    maxPlaytime: '',
    yearPublished: ''
  });

  const [playersError, setPlayersError] = useState({
    minPlayers: '',
    maxPlayers: ''
  })
  const [complexityError, setComplexityError] = useState({
    minComplexity: '',
    maxComplexity: ''
  });

  const mechanicCategoryOptions = Object.keys(MECHANIC_CATEGORIES);
  const domainOptions = DOMAIN_OPTIONS;

  const getIndividualMechanicsFromCategories = (categories) => {
    const mechanics = [];
    categories.forEach(category => {
      if (MECHANIC_CATEGORIES[category]) {
        mechanics.push(...MECHANIC_CATEGORIES[category]);
      }
    });
    return mechanics;
  };
  
  useEffect(() => {
    validatePlayers(filters.minPlayers, filters.maxPlayers);
  }, [filters.minPlayers, filters.maxPlayers]);

  useEffect(() => {
    validateName(filters.boardgameName);
  }, [filters.boardgameName]);

  useEffect(() => {
    validateID(filters.boardgameId);
  }, [filters.boardgameId]);

  useEffect(() => {
    validateComplexity(filters.minComplexity, filters.maxComplexity);
  }, [filters.minComplexity, filters.maxComplexity]);

  useEffect(() => {
    validateNumbers(filters.minAge, filters.maxPlaytime, filters.yearPublished);
  }, [filters.minAge, filters.maxPlaytime, filters.yearPublished]);

  const validateName = (boardgameName) => {
    const newErrors = {
      boardgameName: '',
    };
    
      const value = boardgameName.toString().trim() || '';
      if (value.length > 0 && value.length < 3) {
        newErrors.boardgameName = `Name must be at least 3 characters`;
      }

    setStringErrors(newErrors);
  };

  const validateID = (boardgameId) => {
    const newErrors = {
      boardgameId: '',
    };
    
      const value = boardgameId.toString().trim() || '';
      if (value.length > 0 && value.length < 3) {
        newErrors.boardgameId = `BGG ID must be at least 3 to 20 digits`;
      }

      setGameIDErrors(newErrors);
  };


  const validatePlayers = (minPlayers, maxPlayers) => {
    const newErrors = {
      minPlayers: '',
      maxPlayers: ''
    };

    if (minPlayers && (isNaN(minPlayers) || minPlayers < 0)) {
      newErrors.minPlayers = 'Min number of players must be a positive number';
    }

    if (maxPlayers && (isNaN(maxPlayers) || maxPlayers < 0)) {
      newErrors.maxPlayers = 'Max number of players must be a positive number';
    }

    if (minPlayers && maxPlayers && !isNaN(minPlayers) && !isNaN(maxPlayers) && minPlayers > maxPlayers) {
      newErrors.maxPlayers = 'Max number of players must be greater than min number of players';
    }

    setPlayersError(newErrors);
  };

  const validateComplexity = (minComplexity, maxComplexity) => {
    const newErrors = {
      minComplexity: '',
      maxComplexity: ''
    };

    if (minComplexity && (isNaN(minComplexity) || minComplexity < 0 || minComplexity > 5)) {
      newErrors.minComplexity = 'Min complexity must be a positive number between 0 and 5';
    }

    if (maxComplexity && (isNaN(maxComplexity) || maxComplexity < 0 || maxComplexity > 5)) {
      newErrors.maxComplexity = 'Max complexity must be a positive number between 0 and 5';
    }

    if (minComplexity && maxComplexity && !isNaN(minComplexity) && !isNaN(maxComplexity) && minComplexity > maxComplexity) {
      newErrors.maxComplexity = 'Max complexity must be greater than min complexity';
    }

    setComplexityError(newErrors);
  };


  const validateNumbers = (minAge, maxPlaytime, yearPublished) => {
    const newErrors = {
      minAge: '',
      maxPlaytime: '',
      yearPublished: ''
    };

  
    if (minAge && (isNaN(minAge) || minAge < 0)) {
      newErrors.minAge = 'Minimum age must be a positive number';
    }

    if (maxPlaytime && (isNaN(maxPlaytime) || maxPlaytime < 0)) {
      newErrors.maxPlaytime = 'Max playtime must be a positive number';
    }

    if (yearPublished && (isNaN(yearPublished) || yearPublished < 0)) {
      newErrors.yearPublished = 'Year published must be a positive number';
    }

    setNumberErrors(newErrors);
  };


  const hasErrors = () => {
    return playersError.minPlayers !== '' || playersError.maxPlayers !== '' ||
      complexityError.minComplexity !== '' || complexityError.maxComplexity !== '' ||
      stringErrors.boardgameName !== '' || numberErrors.yearPublished !== ''
      || numberErrors.minAge !== '' || numberErrors.maxPlaytime !== ''
      || gameIDErrors.boardgameId !== '';
  };

  // const buildSearchCriteria = () => {
  //   const individualMechanics = getIndividualMechanicsFromCategories(selectedMechanicCategories);

  //   return {
  //     name: boardgameName || null,
  //     minPlayers: minPlayers ? Number(minPlayers) : null,
  //     maxPlayers: maxPlayers ? Number(maxPlayers) : null,
  //     minAge: minAge ? Number(minAge) : null,
  //     maxPlaytime: maxPlaytime ? Number(maxPlaytime) : null,
  //     minComplexity: minComplexity ? parseFloat(minComplexity) : null,
  //     maxComplexity: maxComplexity ? parseFloat(maxComplexity) : null,
  //     mechanics: individualMechanics.length ? individualMechanics : null,
  //     domains: selectedDomains.length ? selectedDomains : null,
  //     yearPublished: yearPublished ? Number(yearPublished) : null,
  //   };
  // };

  const buildSearchCriteria = (searchFilters) => {
    const params = {};
    
    if (searchFilters.boardgameName && searchFilters.boardgameName.trim()) {
      params.name = searchFilters.boardgameName.trim();
    }

    if (searchFilters.minPlayers && searchFilters.minPlayers.toString().trim()) {
      const minPlayers = Number(searchFilters.minPlayers);
      if (!isNaN(minPlayers) && minPlayers >= 0) {
        params.minPlayers = minPlayers;
      }
    }
    if (searchFilters.maxPlayers && searchFilters.maxPlayers.toString().trim()) {
      const maxPlayers = Number(searchFilters.maxPlayers);
      if (!isNaN(maxPlayers) && maxPlayers >= 0) {
        params.maxPlayers = maxPlayers;
      }
    }
    if (searchFilters.minAge && searchFilters.minAge.toString().trim()) {
      const minAge = Number(searchFilters.minAge);
      if (!isNaN(minAge) && minAge >= 0) {
        params.minAge = minAge;
      }
    }
    if (searchFilters.maxPlaytime && searchFilters.maxPlaytime.toString().trim()) {
      const maxPlaytime = Number(searchFilters.maxPlaytime);
      if (!isNaN(maxPlaytime) && maxPlaytime >= 0) {
        params.maxPlaytime = maxPlaytime;
      }
    }
    if (searchFilters.minComplexity && searchFilters.minComplexity.toString().trim()) {
      const minComplexity = parseFloat(searchFilters.minComplexity);
      if (!isNaN(minComplexity) && minComplexity >= 0) {
        params.minComplexity = minComplexity;
      }
    }
    if (searchFilters.maxComplexity && searchFilters.maxComplexity.toString().trim()) {
      const maxComplexity = parseFloat(searchFilters.maxComplexity);
      if (!isNaN(maxComplexity) && maxComplexity >= 0) {
        params.maxComplexity = maxComplexity;
      }
    }
    if (searchFilters.yearPublished && searchFilters.yearPublished.toString().trim()) {
      const yearPublished = Number(searchFilters.yearPublished);
      if (!isNaN(yearPublished) && yearPublished >= 0) {
        params.yearPublished = yearPublished;
      }
    }
    
    if (searchFilters.mechanics && searchFilters.mechanics.length > 0) {
      const individualMechanics = getIndividualMechanicsFromCategories(searchFilters.mechanics);
      if (individualMechanics.length > 0) {
        params.mechanics = individualMechanics;
      }
    }
    
    if (searchFilters.domains && searchFilters.domains.length > 0) {
      params.domains = searchFilters.domains;
    }
    
    return params;
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

      const searchCriteria = buildSearchCriteria(filters);
      
      console.log("Getting suggestions for city :", searchCriteria);
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
      
      // Save current filters and pagination to localStorage
      localStorage.setItem('boardgameSearchFilters', JSON.stringify(filters));
      localStorage.setItem('boardgamePageNumber', overridePage.toString());
      localStorage.setItem('boardgamePageSize', pageSize.toString());
      
      if (filters.boardgameId?.trim()) {
        console.log("BGG ID: ", filters.boardgameId);
        const response = await fetch(
          `http://localhost:9013/boardgames/external-object/${filters.boardgameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch boardgame with ID=${filters.boardgameId}`);
        }
        
        const data = await response.json();
        setBoardgame(data);
      } else {
        const searchCriteria = buildSearchCriteria(filters);
        console.log("Searching with filters:", searchCriteria);
        console.log("Page:", overridePage, "Size:", pageSize);
        
        const url = `http://localhost:9013/boardgames/search?page=${overridePage}&size=${pageSize}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(searchCriteria),
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
    
  setNumberErrors({
    yearPublished: '',
    minAge: '',
    maxPlaytime: ''
  });
  setStringErrors({
    boardgameName: ''
  });
  setGameIDErrors({
     boardgameId: ''
  });
  setPlayersError({
    minPlayers: '',
    maxPlayers: ''
  });
  setComplexityError({
    minComplexity: '',
    maxComplexity:''
  })
    setFilters(defaultFilters);
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
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setPageNumber(1);
    setSuggestionPageNumber(1);
    
    setBoardgame(null);
    setBoardgames([]);
    setSuggestions([]);
    setTotalPages(1);
    setSuggestionTotalPages(1);
    setHasSearched(false);
    setShowingSuggestions(false);

    localStorage.removeItem('boardgameSearchResults');
    localStorage.removeItem('boardgameTotalPages');
    localStorage.setItem('boardgamePageSize', newSize.toString());
    localStorage.setItem('boardgamePageNumber', '1');
    handleClear();
  };

  const getQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", pageNumber.toString());
    params.append("size", pageSize.toString());
    
    if (filters.boardgameId) params.append("boardgameId", filters.boardgameId);
    if (filters.boardgameName) params.append("boardgameName", filters.boardgameName);
    if (filters.minPlayers) params.append("minPlayers", filters.minPlayers);
    if (filters.maxPlayers) params.append("maxPlayers", filters.maxPlayers);
    if (filters.minAge) params.append("minAge", filters.minAge);
    if (filters.maxPlaytime) params.append("maxPlaytime", filters.maxPlaytime);
    if (filters.minComplexity) params.append("minComplexity", filters.minComplexity);
    if (filters.maxComplexity) params.append("maxComplexity", filters.maxComplexity);
    if (filters.mechanics.length) params.append("mechanicCategories", filters.mechanics.join(","));
    if (filters.domains.length) params.append("domains", filters.domains.join(","));
    if (filters.yearPublished) params.append("yearPublished", filters.yearPublished);
    
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
              error={!!stringErrors.boardgameName}
                helperText={stringErrors.boardgameName || ""}
                value={filters.boardgameName}
                onChange={(e) => setFilters({ ...filters, boardgameName: e.target.value })}
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
              error={!!gameIDErrors.boardgameId}
              helperText={gameIDErrors.boardgameId || ""}
              value={filters.boardgameId}
              onChange={(e) => setFilters({ ...filters, boardgameId: e.target.value })}
              />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Min Players"
              fullWidth
              size="small"
              error={!!playersError.minPlayers}
                helperText={playersError.minPlayers || ""}
                value={filters.minPlayers}
                onChange={(e) => setFilters({ ...filters, minPlayers: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Max Players"
              fullWidth
              size="small"
              error={!!playersError.maxPlayers}
                helperText={playersError.maxPlayers || ""}
                value={filters.maxPlayers}
                onChange={(e) => setFilters({ ...filters, maxPlayers: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Year Published"
              fullWidth
              size="small"
              error={!!numberErrors.yearPublished}
                helperText={stringErrors.yearPublished || ""}
                value={filters.yearPublished}
                onChange={(e) => setFilters({ ...filters, yearPublished: e.target.value })}
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
                  error={!!numberErrors.minAge}
                helperText={numberErrors.minAge || ""}
                value={filters.minAge}
                onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Max Playtime"
                  fullWidth
                  size="small"
                  error={!!numberErrors.maxPlaytime}
                helperText={numberErrors.maxPlaytime || ""}
                value={filters.maxPlaytime}
                onChange={(e) => setFilters({ ...filters, maxPlaytime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Min Complexity"
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.1" }}
                  error={!!complexityError.minComplexity}
                helperText={complexityError.minComplexity || ""}
                value={filters.minComplexity}
                onChange={(e) => setFilters({ ...filters, minComplexity: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Max Complexity"
                  fullWidth
                  size="small"
                  inputProps={{ step: "0.1" }}
                  error={!!complexityError.maxComplexity}
                  helperText={complexityError.maxComplexity || ""}
                  value={filters.maxComplexity}
                  onChange={(e) => setFilters({...filters, maxComplexity: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mechanics-label">Mechanics</InputLabel>
                  <Select
                    labelId="mechanics-label"
                    label="Mechanics"
                    multiple
                    value={filters.mechanics}
                    onChange={(e) => setFilters({ ...filters, mechanics: e.target.value })}
                    input={<OutlinedInput label="Mechanics" />}
                    renderValue={(selected) => selected.join(", ")}
                    sx={{ minWidth: 205 }}
                  >
                    {mechanicCategoryOptions.map((category) => (
                      <MenuItem key={category} value={category}>
                        <Checkbox checked={filters.mechanics.indexOf(category) > -1} />
                        <ListItemText primary={category} />
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
                    value={filters.domains}            
                    onChange={(e) => setFilters({ ...filters, domains: e.target.value })}
                    input={<OutlinedInput label="Domains" />}
                    renderValue={(selected) => selected.join(", ")}
                    sx={{ minWidth: 205 }}
                  >
                    {domainOptions.map((domain) => (
                      <MenuItem key={domain} value={domain}>
                        <Checkbox checked={filters.domains.indexOf(domain) > -1} />
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
            onClick={() => {
              setPageNumber(1);
              handleFetchBoardgame(1);
            }} 
            disabled={hasErrors() || isLoading || isLoadingSuggestions}
            startIcon={<SearchIcon />}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Search"}
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => {
              setPageNumber(1);
              handleFetchSuggestions(1);
            }} 
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
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          </Box>
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
              onClick={() => {
                setPageNumber(1);
                handleFetchSuggestions(1);
              }}
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
              onClick={() => {
                setPageNumber(1);
                handleFetchBoardgame(1);
              }}
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