import React from 'react';
import userManager from '../authConfig';

function Login() {
  const login = () => {
    userManager.signinRedirect();
  };

  const signup = () => {
    const signupUrl = `${userManager.settings.authority}/signup?client_id=${userManager.settings.client_id}&response_type=${userManager.settings.response_type}&scope=${userManager.settings.scope}&redirect_uri=${userManager.settings.redirect_uri}`;
    window.location.href = signupUrl;
  };

  return (
    <div>
      <button onClick={login}>Login</button>
      <button onClick={signup}>Sign Up</button>
    </div>
  );
}

export default Login;
