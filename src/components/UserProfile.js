import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getSession, changePassword, deleteUser, updateEmail } from "../cognito"; 

function UserProfile() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [favoriteGameIds, setFavoriteGameIds] = useState([]);

  const [favoriteGames, setFavoriteGames] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        const token = session.getAccessToken().getJwtToken();

        const profileResp = await fetch("http://localhost:9013/user-service/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileResp.ok) {
          throw new Error("Failed to fetch user profile");
        }
        const userProfile = await profileResp.json();

        setName(userProfile.name || "");
        setLocation(userProfile.location || "");
        setEmail(userProfile.email || "");
        setRole(userProfile.role || "");
        setFavoriteGameIds(userProfile.favoriteGames || []);

        const boardgameDetails = [];
        for (const gameId of userProfile.favoriteGames || []) {
          const res = await fetch(`http://localhost:9013/boardgames/external-object/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            boardgameDetails.push(data);
          } else {
            console.warn(`Failed to fetch details for favorite game ID: ${gameId}`);
          }
        }
        setFavoriteGames(boardgameDetails);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setError("");
      setLoading(true);

      const session = await getSession();
      const token = session.getAccessToken().getJwtToken();

      const updatedProfile = {
        name,
        location,
        email, 
        role
      };

      const response = await fetch("http://localhost:9013/user-service/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedProfile),
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      alert("Profile updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordDialog = () => setOpenPasswordDialog(true);
  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setOldPassword("");
    setNewPassword("");
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(oldPassword, newPassword);
      alert("Password changed successfully!");
      handleClosePasswordDialog();
    } catch (err) {
      setError(`Failed to change password: ${err.message}`);
    }
  };

  const handleOpenDeleteDialog = () => setOpenDeleteDialog(true);
  const handleCloseDeleteDialog = () => setOpenDeleteDialog(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteUser();
      alert("Account deleted. Redirecting...");
      navigate("/"); 
    } catch (err) {
      setError(`Failed to delete account: ${err.message}`);
    }
  };

  if (loading) {
    return <Typography sx={{ p: 2 }}>Loading...</Typography>;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>User Profile</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
        <TextField
          label="Name"
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Location"
          variant="outlined"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <TextField
          label="Email"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Role"
          variant="outlined"
          value={role}
          InputProps={{ readOnly: true }}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSaveProfile}>
          Save Profile
        </Button>
        <Button
          variant="outlined"
          onClick={handleOpenPasswordDialog}
          sx={{ ml: 2 }}
        >
          Change Password
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={handleOpenDeleteDialog}
          sx={{ ml: 2 }}
        >
          Delete Account
        </Button>
      </Box>

      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Old Password"
            type="password"
            fullWidth
            margin="normal"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Account?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete your account? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteAccount} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Your Favorite Games</Typography>
        {favoriteGames.length === 0 ? (
          <Typography sx={{ mt: 1 }}>No favorite games found.</Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 2,
              mt: 2,
              p: 1
            }}
          >
            {favoriteGames.map((game) => {
              const cleanedDesc = game.description
                ? game.description.replace(/<br\s*\/?>/g, "\n")
                : "";

              return (
                <Card
                  key={game.gameId}
                  sx={{ minWidth: 250, flex: "0 0 auto" }}
                >
                  {game.image && (
                    <CardMedia
                      component="img"
                      height="150"
                      image={game.image}
                      alt={game.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6">{game.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Players: {game.minPlayers} - {game.maxPlayers}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-line", mt: 1 }}>
                      {cleanedDesc.substring(0, 100)}...
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default UserProfile;
