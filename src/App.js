// App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Callback from './components/Callback';
import Home from './components/Home';
import userManager from './authConfig';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {

    userManager.getUser().then((user) => {
      setUser(user);
    });
  }, []);
  const isAuthenticated = !!user;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        {/* Protected routes */}
        <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/" element={<Home user={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
