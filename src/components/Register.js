import React, { useState } from 'react';
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'eu-west-1_4Ydo56vuO',
  ClientId: '2fh4vfib1ogm8ofn0s5hda5u9',
};

const userPool = new CognitoUserPool(poolData);

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const register = (event) => {
    event.preventDefault();
    userPool.signUp(email, password, [], null, (err, result) => {
      if (err) {
        console.error('Error during sign-up:', err);
        return;
      }
      console.log('Sign-up successful:', result);
      // Redirect to verification page or login
    });
  };

  return (
    <form onSubmit={register}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default Register;
