const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");
const express = require("express");
const bcrypt = require("bcryptjs");
const morgan = require("morgan");
const session = require("cookie-session");

const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(session({
  name: 'session',
  keys: ["2304f09f90garbagefdg90dgf", "extragoodgarbage34tr34tr345t", "g34590df34f43f2312e23"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(morgan('dev'));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b6789d",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "b67asd",
  },
  "j75xgK": {
    longURL: "http://www.google.com/2",
    userID: "b6789d",
  },
};

const userDatabase = {
  "b6789d": { id: "b6789d", email: 'bob@shaw.ca', password: '$2a$10$2H4FMClqnElLNs6KVI35WeuW0rr6DNPVQt6Bn00hWTnM.9M/c8rau' }
};

app.use(express.urlencoded({ extended: true })); //converts from raw buffer into string

//send to urls, which will send to login if not logged in
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id]; //this actually check the database for if that id exists
  if (!user) {
    res.redirect("/login");
    return;
  }
  let myURLs = urlsForUser(id, urlDatabase);


  const templateVars = { myURLs, user };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];

  if (!user) {
    return res.status(401).send("Only logged in users can shorten URLs");
  }

  let newId = generateRandomString();
  urlDatabase[newId] = { longURL: req.body.longURL, userID: id }; //add it to the database!
  res.redirect(`/urls/${newId}`);
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];

  if (!user) {
    res.redirect("/login");
    return;
  }
  // we've cut out templateVars = {user} as convenience variable
  res.render("urls_new", { user });
});

app.get("/register", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];

  if (user) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: null,
  };
  res.render("register", templateVars);
});
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //blanks
  if (!email || !password) {
    return res.status(400).send("Email or password are blank");
  }
  if (getUserByEmail(email, userDatabase)) {
    return res.status(400).send('That email is already in use');
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const id = generateRandomString();
  userDatabase[id] = { id, email, password: hashedPassword };

  req.session.user_id = id;
  res.redirect("/urls");  //second parameter for redirect is always a status code, we don't want to send a status code so we only have one parameter
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];

  if (!user) {
    return res.status(401).send("Only logged in users can delete URLs");
  }

  //get url ID
  const urlToDelete = req.params.id;

  if (!urlDatabase[urlToDelete]) { //id does not exist
    return res.status(403).send("That's not a valid short URL by my database");
  }

  let urlOwner = urlDatabase[urlToDelete].userID;
  if (id !== urlOwner) {
    return res.status(403).send("You don't own that URL! You can't Delete it!");
  }
  delete urlDatabase[urlToDelete];
  res.redirect("/urls");
});


app.get("/login", (req, res) => {
  const id = req.session.user_id;

  if (id) {
    console.log(id, 'circular');
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: null,
  };
  res.render("login", templateVars);
});
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email, userDatabase);
  if (!user) { //returned undefined or otherwise
    return res.status(401).send('user not found');
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('the passwords do not match');
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get('/u/:id', (req, res) => {
  const userId = req.session.user_id;
  const user = userDatabase[userId];

  if (!user) {
    return res.status(401).send("Only logged in users can shorten URLs");
  }

  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("That URL does not exist!");
  }
  const longURL = urlDatabase[id].longURL;

  res.redirect(longURL);
});

app.get('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const user = userDatabase[userId];

  if (!user) {
    return res.status(401).send("Only logged in users can shorten URLs");
  }

  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.status(404).send("That URL does not exist!");
  }
  let urlOwner = urlDatabase[id].userID;
  if (userId !== urlOwner) { //not URL Owner
    return res.status(403).send("You don't own that URL! You can't Edit it!");
  }
  const longURL = urlDatabase[id].longURL;

  const templateVars = { id, longURL, user };
  res.render("urls_show", templateVars);
});
app.post("/urls/:id", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];

  if (!user) {  //not logged in
    return res.status(401).send("Only logged in users can shorten URLs");
  }

  //get url ID
  let urlIDToUpdate = req.params.id;

  if (!urlDatabase[urlIDToUpdate]) { //id does not exist
    return res.status(403).send("That's not a valid short URL by my database");
  }

  let urlOwner = urlDatabase[urlIDToUpdate].userID;
  if (id !== urlOwner) { //not URL Owner
    return res.status(403).send("You don't own that URL! You can't Edit it!");
  }

  if (!req.body.longURL) {
    return res.status(422).send("You need to enter a URL to update this URL");
  }

  urlDatabase[urlIDToUpdate].longURL = req.body.longURL;
  //don't need to use render as we don't need a new page, we just want to go back to our new updated homepage
  res.redirect("/urls"); //we don't pass any data back as the database gets redrawn on return to /urls
});

app.get('*', (req, res) => { //if we try to go to another page, we'll get sent to urls or login
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});