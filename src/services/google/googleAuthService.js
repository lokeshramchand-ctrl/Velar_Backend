const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

async function upsertGoogleUser(payload) {
  return User.upsertGoogleUser({
    googleId: payload.sub,
    displayName: payload.name,
    email: payload.email,
    photo: payload.picture,
  });
}

module.exports = { verifyGoogleToken, upsertGoogleUser };