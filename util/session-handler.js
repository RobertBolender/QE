const { createUserCredentials } = require("./crypto");

const sendUserSecretCookie = (userSecret, res) => {
  const oneDayToMilliseconds = 24 * 60 * 60 * 1000;
  res.cookie("qeUserSecret", userSecret, {
    // HTTP Set-Cookie uses seconds, Express res.cookie uses milliseconds
    maxAge: oneDayToMilliseconds,
    // If true, deny access to cookie in the client's javascript
    httpOnly: false,
    // If true, deny access to insecure http:// connection
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "strict",
  });
};

const getAppCookies = (req) => {
  if (!req.headers || !req.headers.cookie) {
    return {};
  }

  const rawCookies = req.headers.cookie.split("; ");

  const parsedCookies = {};
  rawCookies.forEach((rawCookie) => {
    const parsedCookie = rawCookie.split("=");
    parsedCookies[parsedCookie[0]] = parsedCookie[1];
  });
  return parsedCookies;
};

const getUserSecretFromCookies = (req, res) =>
  getAppCookies(req, res)["qeUserSecret"];

const getUserId = (req) => req.session.userId;

const sessions = {};

const sessionHandler = (req, res, next) => {
  let userSecret = getUserSecretFromCookies(req, res);
  let userId = null;

  if (!userSecret || !sessions[userSecret]) {
    [userSecret, userId] = createUserCredentials();
    sessions[userSecret] = {
      userId,
    };
  }

  sendUserSecretCookie(userSecret, res);
  req.session = sessions[userSecret];
  next();
};

module.exports = {
  getUserId,
  sessionHandler,
};
