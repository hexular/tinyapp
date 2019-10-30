const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { infoLookup, generateRandomString } = require('./helpers');

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
    let userEmail;
    req.session.user_id === undefined ? userEmail = undefined : userEmail = users[req.session.user_id].email;
    res.render("urls_new", {username: req.session.user_id, email: userEmail});
  }
});

app.get('/urls', (req, res) => {
  let userEmail;
  if (users[req.session.user_id] !== undefined) {
    userEmail = users[req.session.user_id].email;
  } else {
    userEmail = undefined;
  }

  // console.log(users[req.session.user_id], req.session.user_id)
  
  let result = urlsForUser(req.session.user_id);
  let templateVars = { result: urlsForUser(req.session.user_id), urls: result,  username: req.session.user_id, email: userEmail };
  res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  if (!infoLookup('email', req.body.email, users)) {
    res.status(403);
    res.send("Email not found\n");
  } else {
    for (let user in users) {
      if (users[user].email === req.body.email) {
        if (bcrypt.compareSync(req.body.password, users[user].password)) {
          req.session.user_id = users[user].id;
          res.redirect('/urls');
        } else {
          res.status(403);
          res.send("Wrong password\n");
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
  let userEmail;
  if (users[req.session.user_id] !== undefined) {
    userEmail = users[req.session.user_id].email;
  } else {
    userEmail = undefined;
  }
  if (urlDatabase[req.params.shortURL] === undefined) res.send('This URL Does not exist\n');
  else {
    let username = req.session.user_id
    if (username === undefined) res.send('Please log in to view and edit your URLs\n');
    if (username !== urlDatabase[req.params.shortURL].userID) {
      res.send('This URL belongs to another user\n');
    } else {
      let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.session.user_id, email: userEmail };
      res.render("urls_show", templateVars);
    }
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) res.send('Please log in to create URLs\n');
  let newURL = generateRandomString();
  if (urlDatabase[newURL]) newURL = generateRandomString();
  urlDatabase[newURL] = {};
  urlDatabase[newURL].longURL = 'http://' + req.body.longURL;
  urlDatabase[newURL].userID = req.session.user_id;
  res.redirect(`/urls/${newURL}`);
});

app.get('/register', (req, res) => {
  if (req.session.user_id !== undefined) res.redirect('/urls');
  res.render('register', { username: users[req.session.user_id] });
});

app.post('/register', (req, res) => {
  let newID = generateRandomString();
  if (req.body.email.length === 0 || req.body.password.length === 0) {
    res.status(400);
    res.send("Fields cannot be empty\n");
  }
  if (infoLookup("email", req.body.email, users)) {
    res.status(400);
    res.send("That email is already in use. Please use another email address.\n");
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
  let userEmail;
  if (users[req.session.user_id] !== undefined) {
    userEmail = users[req.session.user_id].email;
  } else {
    userEmail = undefined;
  }
  let templateVars = { username: req.session.user_id, urls: urlDatabase, result: urlsForUser(req.session.user_id), email: userEmail };
  if (templateVars.username === undefined) {
    res.status(403);
    res.send("I'm afraid I can't let you do that");
  } else {
    delete urlDatabase[req.params.shortURL];
    Object.keys(urlDatabase).length === 0 ? res.redirect('/urls') : res.render('urls_index', templateVars);
    // TODO: FIX DELETION BUG SHOWING OTHER USER URLS CHECK FOR USER ID, NOT LENGTH
  }
});

app.get('/login', (req, res) => {
  if (req.session.user_id !== undefined) res.redirect('/urls');
  res.render('login', { username: users[req.session.user_id] });
});

app.post('/urls/:id', (req, res) => {
  let username = req.session.user_id
  if (username === undefined) res.send('Please log in to view and edit your URLs\n')
  if (username !== urlDatabase[req.params.id].userID) {
    res.status(400);
    res.send("Nice try hackermans\n")
  } else {
    urlDatabase[req.params.id].longURL = req.body.name;
    res.redirect(`/urls`);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});