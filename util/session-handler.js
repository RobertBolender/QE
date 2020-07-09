const { createUserId } = require("./crypto");

const sendUserIdCookie = (userId, res) => {
  const oneDayToSeconds = 24 * 60 * 60;
  res.cookie("qeUserId", userId, {
    maxAge: oneDayToSeconds,
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

const getUserId = (req, res) => getAppCookies(req, res)["qeUserId"];

const sessions = {};

const sessionHandler = (req, res, next) => {
  let userId = getUserId(req, res);

  if (!userId || !sessions[userId]) {
    userId = createUserId();
    sessions[userId] = {
      cart: {},
    };
    res.clearCookie("userId");
    sendUserIdCookie(userId, res);
  }

  req.session = sessions[userId];
  next();
};

module.exports = {
  getUserId,
  sessionHandler,
};
