import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.REACT_APP_USER_POOL_ID || '',
    ClientId: process.env.REACT_APP_CLIENT_ID || ''
};

const userPool = new CognitoUserPool(poolData);


export function registerUser(formData, attributeList) {
  console.log("FORM: " + formData.email);
  console.log("ATR: " + attributeList);

  return new Promise((resolve, reject) => {
    userPool.signUp(
      formData.email,
      formData.password,
      attributeList,
      null,
      (err, result) => {
        if (err) {
          console.error('Cognito register error: ', err)
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}


export function confirmRegistration(username, confirmationCode) {
  const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export function resendConfirmationCode(username) {
  const userData = {
    Username: username,
    Pool: userPool
  };
  
  const cognitoUser = new CognitoUser(userData);
  
  return new Promise((resolve, reject) => {
    cognitoUser.getUserAttributes((err, attributes) => {
      console.log("User attributes: ", attributes)
      if (err) {
        if (err.code === 'UserNotFoundException') {
          reject(new Error('User not found'));
          return;
        }
        
        resendCode(cognitoUser, resolve, reject);
      } else {
        reject(new Error('User account is already confirmed. Please try signing in.'));
      }
    });
  });
}

function resendCode(cognitoUser, resolve, reject) {
  cognitoUser.resendConfirmationCode((err, result) => {
    if (err) {
      console.error('Error resending confirmation code:', err);
      reject(err);
    } else {
      resolve(result);
    }
  });
}

export function loginUser(username, password) {
  const authDetails = new AuthenticationDetails({ Username: username, Password: password });
  const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: session => {
        resolve(session);
        
      },
      onFailure: err => {
        reject(err);
      }
    });
  });
}

export function getCurrentUser() {
  return userPool.getCurrentUser();
}

export function getSession() {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) {
    return Promise.reject(new Error('No current user'));
  }

  return new Promise((resolve, reject) => {
    currentUser.getSession((err, session) => {
      if (err) {
        reject(err);
      } else if (!session.isValid()) {
        reject(new Error('Session is invalid'));
      } else {
        resolve(session);
      }
    });
  });
}

export function getSessionIfExists() {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    currentUser.getSession((err, session) => {
      if (err || !session?.isValid()) {
        resolve(null);
      } else {
        resolve(session);
      }
    });
  });
}

export function logoutUser() {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}

export async function getIdToken() {
  try {
    const session = await getSession();
    return session.getIdToken().getJwtToken();
  } catch (error) {
    console.log('No valid session for token retrieval');
    return null;
  }
}

export function forgotPassword(username) {
  const user = new CognitoUser({ Username: username, Pool: userPool });
  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: data => resolve(data),
      onFailure: err => reject(err),
    });
  });
}

export function confirmNewPassword(username, code, newPassword) {
  const user = new CognitoUser({ Username: username, Pool: userPool });
  return new Promise((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve('Password reset successful'),
      onFailure: err => reject(err),
    });
  });
}

export function changePassword(oldPassword, newPassword) {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) {
    return Promise.reject(new Error('No current user to change password for.'));
  }
  return new Promise((resolve, reject) => {
    currentUser.getSession((err, session) => {
      if (err || !session?.isValid()) {
        return reject(err || new Error('Session is invalid'));
      }
      currentUser.changePassword(oldPassword, newPassword, (changeErr, result) => {
        if (changeErr) reject(changeErr);
        else resolve(result);
      });
    });
  });
}

export function updateEmail(newEmail) {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) {
    return Promise.reject(new Error('No current user to update email for.'));
  }

  return new Promise((resolve, reject) => {
    currentUser.getSession((err, session) => {
      if (err || !session?.isValid()) {
        return reject(err || new Error('Session is invalid'));
      }

      const attributes = [
        {
          Name: 'email',
          Value: newEmail
        }
      ];

      currentUser.updateAttributes(attributes, (updateErr, result) => {
        if (updateErr) {
          reject(updateErr);
        } else {
          resolve(result);
        }
      });
    });
  });
}


export function deleteUser() {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) {
    return Promise.reject(new Error('No current user to delete.'));
  }

  return new Promise((resolve, reject) => {
    currentUser.getSession((err, session) => {
      if (err || !session?.isValid()) {
        return reject(err || new Error('Session is invalid'));
      }

      currentUser.deleteUser((deleteErr, result) => {
        if (deleteErr) {
          reject(deleteErr);
        } else {
          resolve(result);
        }
      });
    });
  });
}