import React from 'react';
import userManager from '../authConfig';

function Logout() {
  const logout = () => {
    userManager.signoutRedirect();
  };

  return <button onClick={logout}>Logout</button>;
}

export default Logout;
