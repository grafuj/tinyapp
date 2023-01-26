const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");
const express = require("express");
const cookieParser = require('cookie-parser'); //delete
const bcrypt = require("bcryptjs");
const morgan = require("morgan");
const session = require("cookie-session");

const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(cookieParser()); //delete after implementing session
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
    userID: "b6789dasdfasdf",
  },
  "j75xgK": {
    longURL: "http://www.google.com/2",
    userID: "b6789d",
  },
};

const userDatabase = {
  "b6789d": { id: "b6789d", email: 'bob@shaw.ca', password: '$2a$10$2H4FMClqnElLNs6KVI35WeuW0rr6DNPVQt6Bn00hWTnM.9M/c8rau' }
};

//start server: ./node_modules/.bin/nodemon -L express_server.js
//curl -X POST -i -v --cookie "user_id=b6789d" localhost:8080/urls/9sm5xK/delete



app.use(express.urlencoded({ extended: true })); //converts from raw buffer into string

app.get("/", (req, res) => {
  res.redirect("/urls");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  console.log(req.session);
  const id = req.session.user_id;
  const user = userDatabase[id]; //this actually check the database for if that id exists
  if (!user) {
    res.redirect("/login");
    return;
    // return res.status(403).send("Only logged in users can view this page");
  }
  let myURLs = urlsForUser(id, urlDatabase);


  const templateVars = { myURLs, user };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];
  console.log('id:', id);

  if (!user) {

    return res.status(403).send("Only logged in users can shorten URLs");
  }
  console.log(req.body);

  let newId = generateRandomString();
  urlDatabase[newId] = { longURL: req.body.longURL, userID: id }; //add it to the database!
  // urlDatabase[newId].longURL = req.body.longURL;
  // urlDatabase[newId].userID = id;
  console.log('Cookies: ', req.cookies);
  res.redirect(`/urls/${newId}`);
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];

  if (!user) {
    // return res.status(403).send("Only logged in users can shorten URLs");
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
  console.log("email", email, "password:", password);
  if (!email || !password) {
    //blanks
    return res.status(400).send("Email or password are blank");
  }
  if (getUserByEmail(email, userDatabase)) {
    return res.status(400).send('That email is already in use');
  }


  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log('hashedPassword:', hashedPassword);

  const id = generateRandomString();
  userDatabase[id] = { id, email, password: hashedPassword };
  // userDatabase[id] = {...req.body, id}  //... is spread operator which means make a copy of that object
  console.log(userDatabase);
  req.session.user_id = id;
  // res.cookie("user_id", id); //res.cookie takes in a key and value
  res.redirect("/urls");  //second parameter for redirect is always a status code, we don't want to send a status code
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];
  console.log('id:', id);
  if (!user) {
    return res.status(403).send("Only logged in users can delete URLs");
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

app.post("/urls/:id", (req, res) => {
  const id = req.session.user_id;
  const user = userDatabase[id];
  console.log('id:', id);
  if (!user) {  //not logged in
    return res.status(403).send("Only logged in users can shorten URLs");
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

  urlDatabase[urlIDToUpdate].longURL = req.body.longURL;
  //don't need to use render as we don't need a new page, we just want to go back to our new updated homepage
  res.redirect("/urls"); //we don't pass any data back as the database gets redrawn on line 37 "const templateVars = { urls: urlDatabase };"
});

app.get("/login", (req, res) => {
  const id = req.session.user_id;
  console.log('id:', id);
  // console.log('user', user);

  if (id) {
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
  if (!user) { //returned undefined
    return res.status(403).send('user not found');
  }

  console.log('passwords are same:', bcrypt.compareSync(password, user.password));

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send('the passwords do not match');
  }
  console.log('req.session', req.session);
  req.session.user_id = user.id;
  // req.session.user = user;
  // res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const user = userDatabase[userId];

  if (!user) {
    return res.status(403).send("Only logged in users can shorten URLs");
  }

  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;

  const templateVars = { id, longURL, user };
  res.render("urls_show", templateVars);
});

app.get('*', (req, res) => { //if we try to go to another page, we'll get sent to urls or login
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// module.exports = {
//   urlDatabase,
//   userDatabase,
// }