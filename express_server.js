const express = require("express");
const methodOverride = require('method-override')
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { infoLookup, generateRandomString } = require('./helpers');

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.set("view engine", "ejs");

// sample entires in the url database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }
};

// sample users in the user database
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

// to be used for templates in multiple get and post requests
let userEmail;

// finds a user's created URLs out of the URL database given a user's id and returns an object with those URLs
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

// simple redirect from root to /urls
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// the first piece of logic makes sure that if the user somehow reached a logged out state or the 'database' has been refreshed, the user is redirected to avoid errors
// the second half re-renders the page with the added URL and all the requirements for the template
app.get("/urls/new", (req, res) => {
  if (req.session.user_id === undefined || users[req.session.user_id] === undefined) {
    req.session = null;
    res.redirect('/login');
  } else {
    req.session.user_id === undefined ? userEmail = undefined : userEmail = users[req.session.user_id].email;
    res.render("urls_new", {username: req.session.user_id, email: userEmail});
  }
});

// the first half of the function prevents errors due to server restarts while user is in a logged in state
// the second half utilized the urlsForUser function to find which URLs belong to the user
// it then only renders those URLs on the index page
app.get('/urls', (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    userEmail = users[req.session.user_id].email;
  } else {
    userEmail = undefined;
  }

  let result = urlsForUser(req.session.user_id);
  let templateVars = { result: urlsForUser(req.session.user_id), urls: result,  username: req.session.user_id, email: userEmail };
  res.render('urls_index', templateVars);
});

// this function checks for log in credentials, first email, then password
// if there's a credential match, the cookie is set for the user's id
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

// this get listener is responsible for redirecting to a shortURL's associated longURL
app.get("/u/:shortURL", (req, res) => {
  const website = urlDatabase[req.params.shortURL].longURL;
  res.redirect(website);
});

// first half of the logic is to avoid errors due to server restarts while user is in a logged in state
// the rest of the function checks if the user is logged in and shows them the appropriate response
// this also check for users trying to access other users' URLs and ensures they are restricted
app.get("/urls/:shortURL", (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    userEmail = users[req.session.user_id].email;
  } else {
    userEmail = undefined;
  }
  if (urlDatabase[req.params.shortURL] === undefined) res.send('This URL Does not exist\n');
  else {
    let username = req.session.user_id;
    if (username === undefined) res.send('Please log in to view and edit your URLs\n');
    if (username !== urlDatabase[req.params.shortURL].userID) {
      res.send('This URL belongs to another user\n');
    } else {
      let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.session.user_id, email: userEmail };
      res.render("urls_show", templateVars);
    }
  }
});

// a get listener for the json of the URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// logout listener, simply resets the cookie state and redirects to /urls which will show a prompt
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// this function checks if the user is logged in, and if they are, generates a new short URL using the generateRandomString helper function
// it then adds the URL to the database and redirects back to the index page
app.post("/urls", (req, res) => {
  if (req.session.user_id === undefined) res.send('Please log in to create URLs\n');
  let newURL = generateRandomString();
  if (urlDatabase[newURL]) newURL = generateRandomString();
  urlDatabase[newURL] = {};
  urlDatabase[newURL].longURL = 'http://' + req.body.longURL;
  urlDatabase[newURL].userID = req.session.user_id;
  res.redirect(`/urls/${newURL}`);
});

// checks if the user is logged in, if they are, sends them back to the index page
// if not the user is shown the reisgration page
app.get('/register', (req, res) => {
  if (req.session.user_id !== undefined) res.redirect('/urls');
  res.render('register', { username: users[req.session.user_id] });
});

// this function generates a new user in the users object given an email and password
// it checks for empty fields and then for email duplicates, giving appropriate messages in each situation
// if a user is successfuly created, the password is hashed using bcrypt, a cookie is set for the user and the user is redirected to the index page
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
    let newUser = users[newID];
    req.session.user_id = newUser.id;
    res.redirect('/urls');
  }
});

// this redirect ensures someone cannot delete an item with a simple get request
app.get('/urls/:shortURL/delete', (req, res) => {
  res.redirect('/urls');
});

// the first half of the function ensures against server restart login state errors
// the rest of the function ensures that only the owner of the URL can delete that URL
// once a URL is deleted, the user is redirected to the index page
app.delete('/urls/:shortURL/delete', (req, res) => {
  if (users[req.session.user_id] !== undefined) {
    userEmail = users[req.session.user_id].email;
  } else {
    userEmail = undefined;
  }
  let templateVars = { username: req.session.user_id, urls: urlDatabase, result: urlsForUser(req.session.user_id), email: userEmail };
  if (!urlDatabase[req.params.shortURL]) res.redirect('/login');
  if (templateVars.username !== urlDatabase[req.params.shortURL].userID) {
    res.status(403);
    res.send("I'm afraid I can't let you do that");
  } else {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }
});

// this function checks if the user is logged in, in which case they are reirected to the index page
// if not, the login page is rendered
app.get('/login', (req, res) => {
  if (req.session.user_id !== undefined) res.redirect('/urls');
  res.render('login', { username: users[req.session.user_id] });
});

// this function checks that only the owner of the URL can view and edit their short URL details
// if the owner access the URL and updates it, the database is updated and they are redirected to the index page
app.put('/urls/:id', (req, res) => {
  let username = req.session.user_id;
  if (username === undefined) res.send('Please log in to view and edit your URLs\n');
  if (username !== urlDatabase[req.params.id].userID) {
    res.status(400);
    res.send("Nice try hackermans\n");
  } else {
    urlDatabase[req.params.id].longURL = req.body.name;
    res.redirect(`/urls`);
  }
});

app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});