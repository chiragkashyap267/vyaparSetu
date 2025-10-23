const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Trigger when a new user is created in Firebase Authentication
exports.addUserToDatabase = functions.auth.user().onCreate((user) => {
  const uid = user.uid;
  const email = user.email;

  // Write to Realtime Database under 'agents'
  return admin.database().ref(`agents/${uid}`).set({
    email: email
  });
});
