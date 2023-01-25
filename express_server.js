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

function generateRandomString() {
  let fullhex = 'abcdefghijklmnoqrstuvwxyz0123456789';

  //we want a hex string of 6 chars
  let randStr = "";
  for (let i = 0; i < 6; i++) {
    randStr += fullhex[Math.floor(fullhex.length * Math.random())];
  }
  return randStr;
}

app.use(express.urlencoded({ extended: true })); //converts from raw buffer into string

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: req.cookies["user"] };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  // console.log('Cookies: ', req.cookies)
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
  let user = req.body.username;
  console.log("user:", user);
  res.cookie("user", user);
  res.redirect("/urls");
});

app.get('/urls/:id', (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
