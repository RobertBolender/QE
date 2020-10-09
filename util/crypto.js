function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function thisIsGettingOutOfHand() {
  return [uuidv4(), uuidv4()];
}

module.exports = {
  createGameId: uuidv4,
  createUserId: uuidv4,
  createUserCredentials: thisIsGettingOutOfHand,
};
