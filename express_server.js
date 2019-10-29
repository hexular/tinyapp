const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { infoLookup } = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

const generateRandomString = () => {
  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[(Math.floor(Math.random() * chars.length))];
  }
  return result;
};

const urlsForUser = (id) => {
  let urlList = [];
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urlList.push(url);
    }
  }
  let result = {};
  urlList.forEach((url) => {
    result[url] = urlDatabase[url];
  });
  return result;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  } else {
    res.render("urls_new", {username: req.session.user_id});
  }
});

app.get('/urls', (req, res) => {
  let result = urlsForUser(req.session.user_id);
  let templateVars = { result: urlsForUser(req.session.user_id), urls: result,  username: req.session.user_id };
  res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  if (!infoLookup('email', req.body.email, users)) {
    res.status(403);
    res.send("Email not found");
  } else {
    for (let user in users) {
      if (users[user].email === req.body.email) {
        if (bcrypt.compareSync(req.body.password, users[user].password)) {
          req.session.user_id = users[user].id;
          res.redirect('/urls');
        } else {
          res.status(403);
          res.send("Wrong password");
        }
      }
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  const website = urlDatabase[req.params.shortURL].longURL;
  res.redirect(website);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.session.user_id };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let newURL = generateRandomString();
  if (urlDatabase[newURL]) newURL = generateRandomString();
  urlDatabase[newURL] = {};
  urlDatabase[newURL].longURL = 'http://' + req.body.longURL;
  urlDatabase[newURL].userID = req.session.user_id;
  res.redirect(`/urls/${newURL}`);
});

app.get('/register', (req, res) => {
  res.render('register', { username: users[req.session.user_id] });
});

app.post('/register', (req, res) => {
  let newID = generateRandomString();

  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.status(400);
    res.send("Fields cannot be empty");
  }
  if (infoLookup("email", req.body.email, users)) {
    res.status(400);
    res.send("That email is already in use. Please use another email address.");
  } else {

    users[newID] = {
      id: newID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };

    newUser = users[newID] ;
    req.session.user_id = newUser.id;
    res.redirect('/urls');
 }
});

app.get('/urls/:shortURL/delete', (req, res) => {
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let templateVars = { username: req.session.user_id, urls: urlDatabase, result: urlsForUser(req.session.user_id) };
  if (templateVars.username === undefined) {
    res.status(403);
    res.send("I'm afraid I can't let you do that");
  } else {
    delete urlDatabase[req.params.shortURL];
    Object.keys(urlDatabase).length === 0 ? res.redirect('/urls') : res.render('urls_index', templateVars);
  }
});

app.get('/login', (req, res) => {
  res.render('login', { username: users[req.session.user_id] });
});

app.post('/:id', (req, res) => {
  let username = req.session.user_id
  if (username === undefined) {
    res.status(400);
    res.send("Nice try hackermans")
  } else {
    urlDatabase[req.params.id].longURL = req.body.name;
    res.redirect(`/urls`);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});