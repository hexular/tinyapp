const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const generateRandomString = () => {
  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[(Math.floor(Math.random() * chars.length))];
  }
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies["username"]});
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase,  username: req.cookies["username"] };
  res.render('urls_index', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</body></html>\n");
});

app.get('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let newURL = generateRandomString();
  if (urlDatabase[newURL]) newURL = generateRandomString();
  urlDatabase[newURL] = 'http://' + req.body.longURL;
  res.redirect(`/urls/${newURL}`);
});

app.get('/register', (req, res) => {
  res.render('register', { username: req.cookies["username"] });
});

app.post('/register', (req, res) => {
  const newUser = generateRandomString();
  // console.log(req.body.email, newUser)
  users[newUser] = {
    id: newUser,
    email: req.body.email,
    password: req.body.password
  };
  console.log(users);
  const cookie = res.cookie('username', newUser);
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let templateVars = { username: req.cookies["username"], urls: urlDatabase };
  delete urlDatabase[req.params.shortURL];
  // console.log(urlDatabase);
  res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  const cookie = res.cookie('username', req.body.username);
  // console.log(cookie.body);
  // console.log(req.body.username);
  res.redirect('/urls');
});

app.post('/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.name;
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});