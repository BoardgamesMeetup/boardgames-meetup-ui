import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  IconButton
} from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { getSession } from "../cognito";

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

  const [boardgameId, setBoardgameId] = useState(searchParams.get("boardgameId") || "");

  const [minPlayers, setMinPlayers] = useState(searchParams.get("minPlayers") || "");
  const [maxPlayers, setMaxPlayers] = useState(searchParams.get("maxPlayers") || "");
  const [minAge, setMinAge] = useState(searchParams.get("minAge") || "");
  const [maxPlaytime, setMaxPlaytime] = useState(searchParams.get("maxPlaytime") || "");
  const [minComplexity, setMinComplexity] = useState(searchParams.get("minComplexity") || "");
  const [maxComplexity, setMaxComplexity] = useState(searchParams.get("maxComplexity") || "");
  const [selectedMechanics, setSelectedMechanics] = useState(
    searchParams.get("mechanics") ? searchParams.get("mechanics").split(",") : []
  );
  const [selectedDomains, setSelectedDomains] = useState(
    searchParams.get("domains") ? searchParams.get("domains").split(",") : []
  );
  const [yearPublished, setYearPublished] = useState(searchParams.get("yearPublished") || "");

  const defaultPageNumber = parseInt(searchParams.get("page") || "1", 10);
  const [pageNumber, setPageNumber] = useState(defaultPageNumber);

  const defaultPageSize = parseInt(searchParams.get("size") || "5", 10);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [totalPages, setTotalPages] = useState(1);

  const [boardgame, setBoardgame] = useState(null);

  const [boardgames, setBoardgames] = useState([]);

  const [error, setError] = useState("");

  const handleFetchBoardgame = async (overridePage = 1) => {
    setError("");
    setBoardgame(null);
    setBoardgames([]);

    try {
      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const newParams = {
        boardgameId,
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
        const filters = {
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
        setBoardgames(data.content || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError(err.message);
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

  const handleClear = () => {
    setBoardgameId("");
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
    setBoardgame(null);
    setBoardgames([]);
    setTotalPages(1);

    setSearchParams({});
  };

  const handlePageSizeChange = (e) => {
    setPageSize(e.target.value);
    setPageNumber(1);
  };

  useEffect(() => {
    handleFetchBoardgame(pageNumber);
        // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Boardgames
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Boardgame ID"
            value={boardgameId}
            onChange={(e) => setBoardgameId(e.target.value)}
            size="small"
          />
          <Button variant="contained" onClick={() => handleFetchBoardgame(1)}>
            Search
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClear}>
            Clear
          </Button>
        </Box>

        {(
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Min Players"
              type="number"
              size="small"
              value={minPlayers}
              onChange={(e) => setMinPlayers(e.target.value)}
            />
            <TextField
              label="Max Players"
              type="number"
              size="small"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
            <TextField
              label="Min Age"
              type="number"
              size="small"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
            />
            <TextField
              label="Max Playtime"
              type="number"
              size="small"
              value={maxPlaytime}
              onChange={(e) => setMaxPlaytime(e.target.value)}
            />
            <TextField
              label="Min Complexity"
              type="number"
              size="small"
              inputProps={{ step: "0.1" }}
              value={minComplexity}
              onChange={(e) => setMinComplexity(e.target.value)}
            />
            <TextField
              label="Max Complexity"
              type="number"
              size="small"
              inputProps={{ step: "0.1" }}
              value={maxComplexity}
              onChange={(e) => setMaxComplexity(e.target.value)}
            />
            <FormControl size="small">
              <InputLabel id="mechanics-label">Mechanics</InputLabel>
              <Select
                labelId="mechanics-label"
                label="Mechanics"
                multiple
                value={selectedMechanics}
                onChange={(e) => setSelectedMechanics(e.target.value)}
                input={<OutlinedInput label="Mechanics" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {mechanicsOptions.map((mechanic) => (
                  <MenuItem key={mechanic} value={mechanic}>
                    <Checkbox checked={selectedMechanics.indexOf(mechanic) > -1} />
                    <ListItemText primary={mechanic} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel id="domains-label">Domains</InputLabel>
              <Select
                labelId="domains-label"
                label="Domains"
                multiple
                value={selectedDomains}
                onChange={(e) => setSelectedDomains(e.target.value)}
                input={<OutlinedInput label="Domains" />}
                renderValue={(selected) => selected.join(", ")}
              >
                {domainOptions.map((domain) => (
                  <MenuItem key={domain} value={domain}>
                    <Checkbox checked={selectedDomains.indexOf(domain) > -1} />
                    <ListItemText primary={domain} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Year Published"
              type="number"
              size="small"
              value={yearPublished}
              onChange={(e) => setYearPublished(e.target.value)}
            />

            <FormControl size="small">
              <InputLabel id="page-size-label">Page Size</InputLabel>
              <Select
                labelId="page-size-label"
                label="Page Size"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={15}>15</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {boardgame && (
        <Card sx={{ maxWidth: 600, mb: 3 }}>
          {boardgame.image && (
            <CardMedia
              component="img"
              height="250"
              image={boardgame.image}
              alt={boardgame.name || "Boardgame Image"}
            />
          )}
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {boardgame.names && boardgame.names.length
                ? boardgame.names[0].value
                : boardgame.name || "Unnamed"}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Year: {boardgame.yearpublished}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Players: {boardgame.minplayers} - {boardgame.maxplayers}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-line" }}>
              {boardgame.description || ""}
            </Typography>
          </CardContent>
        </Card>
      )}

      {boardgames.length > 0 && (
        <>
          <Grid container spacing={2}>
            {boardgames.map((bg) => (
              <Grid item xs={12} sm={6} md={4} key={bg.gameId}>
                <Card>
                  {bg.image && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={bg.image}
                      alt={bg.name || "Boardgame Image"}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {bg.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Year: {bg.yearPublished}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Players: {bg.minPlayers} - {bg.maxPlayers}
                    </Typography>
                    <Box sx={{ textAlign: "right" }}>
                      <IconButton
                        component={Link}
                        to={`/boardgame/${bg.gameId}?page=${pageNumber}&size=${pageSize}&minPlayers=${minPlayers}&maxPlayers=${maxPlayers}&minAge=${minAge}&maxPlaytime=${maxPlaytime}&minComplexity=${minComplexity}&maxComplexity=${maxComplexity}&mechanics=${selectedMechanics.join(",")}&domains=${selectedDomains.join(",")}&yearPublished=${yearPublished}`}
                      >
                        <span role="img" aria-label="info">ℹ️</span>
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button variant="outlined" onClick={handlePrevPage} disabled={pageNumber <= 1}>
              Previous
            </Button>
            <Typography variant="body1">
              Page {pageNumber} / {totalPages}
            </Typography>
            <Button variant="outlined" onClick={handleNextPage} disabled={pageNumber >= totalPages}>
              Next
            </Button>
          </Box>
        </>
      )}

      {!boardgame && boardgames.length === 0 && !error && (
        <Typography variant="body1">
          Enter a Boardgame ID or use filters and click &quot;Search&quot;.
        </Typography>
      )}
    </Box>
  );
}

export default Boardgames;
