const generateRandomString = () => {
  let fullhex = 'abcdefghijklmnoqrstuvwxyz0123456789';

  //we want a hex string of 6 chars
  let randStr = "";
  for (let i = 0; i < 6; i++) {
    randStr += fullhex[Math.floor(fullhex.length * Math.random())];
  }
  return randStr;
};

const getUserByEmail = (email, userDatabase) => {
  for (let userId in userDatabase) {
    const user = userDatabase[userId];
    console.log('------user: ', userId, "userDatabase@string:", userDatabase[userId].email);
    if (user.email === email) {
      return user;
    }
  }
  return;
};

const urlsForUser = (id, urlDatabase) => {
  let myURLs = {};
  for (let urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === id) {
      myURLs[urlId] = urlDatabase[urlId];
    }
  }
  return myURLs;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
};