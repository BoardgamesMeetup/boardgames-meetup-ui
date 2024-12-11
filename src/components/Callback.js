import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userManager from '../authConfig';

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    userManager
      .signinRedirectCallback()
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch((error) => {
        console.error('Error during sign-in callback:', error);
      });
  }, [navigate]);

  return <div>Loading...</div>;
}

export default Callback;
