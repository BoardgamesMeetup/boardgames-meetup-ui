import React from 'react';

function Home({ user }) {
  return (
    <div>
      <h1>Welcome, {user?.profile?.name || 'User'}</h1>
      <p>Email: {user?.profile?.email}</p>
    </div>
  );
}

export default Home;
