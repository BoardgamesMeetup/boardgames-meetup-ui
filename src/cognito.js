import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'eu-west-1_4Ydo56vuO',
  ClientId: '2fh4vfib1ogm8ofn0s5hda5u9'
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

export function logoutUser() {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
}

export async function getIdToken() {
  const session = await getSession();
  return session.getIdToken().getJwtToken();
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