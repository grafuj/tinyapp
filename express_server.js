const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "975xgK": "http://www.google.com/2",
  "y6890s": "http://www.google.com/3",
};

const userDatabase = {
  "b6789d": { id: "b6789d", email: 'bob@shaw.ca', password: '123' }
};

//start server: ./node_modules/.bin/nodemon -L express_server.js

function generateRandomString() {
  let fullhex = 'abcdefghijklmnoqrstuvwxyz0123456789';

  //we want a hex string of 6 chars
  let randStr = "";
  for (let i = 0; i < 6; i++) {
    randStr += fullhex[Math.floor(fullhex.length * Math.random())];
  }
  return randStr;
}

const getUserByEmail = (email) => {
  for (let userId in userDatabase) {
    const user = userDatabase[userId];
    console.log('------user: ', userId, "userDatabase@string:", userDatabase[userId].email);
    if (user.email === email) {
      return user;
    }
  }
  return;
};

app.use(express.urlencoded({ extended: true })); //converts from raw buffer into string

app.get("/", (req, res) => {
  res.redirect("/urls");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  const id = req.cookies.user_id;
  const user = userDatabase[id];
  const templateVars = { urls: urlDatabase, user };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log("on urls", req.body);
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  // console.log('Cookies: ', req.cookies)
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id;
  const user = userDatabase[id];
  // we've cut out templateVars = {user} as convenience variable
  res.render("urls_new", { user });
});

app.get("/register", (req, res) => {
  const id = req.cookies.user_id;
  const user = userDatabase[id];
  const templateVars = {
    user: null,
  };
  res.render("register", templateVars);
});
app.get("/login", (req, res) => {
  const id = req.cookies.user_id;
  const user = userDatabase[id];
  const templateVars = {
    user: null,
  };
  res.render("login", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // userAlreadyExists("bob@shaw.ca");
  if (!email || !password) {
    //blanks
    return res.status(400).send("Email or password are blank");
  }
  if (getUserByEmail(email)) {
    return res.status(400).send('That email is already in use');
  }

  const id = generateRandomString();
  userDatabase[id] = { id, email, password};
  // userDatabase[id] = {...req.body, id}  //... is spread operator which means make a copy of that object
  // console.log(userDatabase);
  res.cookie("user_id", id); //res.cookie takes in a key and value
  res.redirect("/urls");  //second parameter for redirect is always a status code, we don't want to send a status code
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  let id = req.params.id;
  urlDatabase[id] = req.body.longURL;
  //don't need to use render as we don't need a new page, we just want to go back to our new updated homepage
  res.redirect("/urls"); //we don't pass any data back as the database gets redrawn on line 37 "const templateVars = { urls: urlDatabase };"
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email);
  if (!user) { //returned undefined
    return res.status(403).send('user not found');
  }

  if (user.password !== password) {
    return res.status(403).send('the passwords do not match');
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get('/urls/:id', (req, res) => {
  const userId = req.cookies.user_id;
  const user = userDatabase[userId];

  const id = req.params.id;
  const longURL = urlDatabase[id];

  const templateVars = {id, longURL, user};
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
