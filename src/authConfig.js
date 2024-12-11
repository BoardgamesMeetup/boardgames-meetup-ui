import { UserManager } from 'oidc-client-ts';

const cognitoDomain = 'https://boardgames-meetup.auth.eu-west-1.amazoncognito.com'; 
const clientId = '2fh4vfib1ogm8ofn0s5hda5u9';
const redirectUri = 'http://localhost:3000/';
const logoutRedirectUri = 'http://localhost:3000/';

const userManagerConfig = {
  authority: `https://${cognitoDomain}`,
  client_id: clientId,
  redirect_uri: redirectUri,
  post_logout_redirect_uri: logoutRedirectUri,
  response_type: 'code',
  scope: 'openid profile email',
  useCodeVerifier: true,
};

const userManager = new UserManager(userManagerConfig);

export default userManager;
