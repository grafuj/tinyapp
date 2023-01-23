const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let fullhex = 'abcdefghijklmnoqrstuvwxyz0123456789';

  //we want a hex string of 6 chars
  let randStr = "";
  for (let i = 0; i < 6; i++) {
    randStr += fullhex[Math.floor(36 * Math.random())];
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let id = generateRandomString();
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get(`/urls/${generateRandomString}`, (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase.b2xVn2/* What goes here? */ };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});