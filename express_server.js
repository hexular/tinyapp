const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");


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

const generateRandomString = () => {
  let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[(Math.floor(Math.random() * chars.length))];
  }
  return result;
};

const infoLookup = (key, value, registry) => {
  for (let user in registry) {
    if (registry[user][key] === value) return true;
  } 
  return false;
};

// console.log(emailLookup("email", 'user2@example.com', users));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies["user_id"]});
});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase,  username: req.cookies["user_id"] };
  res.render('urls_index', templateVars);
});

app.post('/login', (req, res) => {
  // console.log(req.body.email, req.body.password)
  if (!infoLookup('email', req.body.email, users)) {
    res.status(400);
    res.send("Email not found");
  } else {
    for (let user in users) {
      // console.log(users[user].password)
      if (users[user].password === req.body.password && users[user].email === req.body.email) {
        console.log(user);
        res.cookie('user_id', users[user].id);
        res.redirect('/urls');
      }
      if (users[user].email === req.body.email && users[user].password !== req.body.password) {
        res.status(400);
        res.send("Wrong password");
      }
    }
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["user_id"] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World</body></html>\n");
});

app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  let newURL = generateRandomString();
  if (urlDatabase[newURL]) newURL = generateRandomString();
  urlDatabase[newURL] = 'http://' + req.body.longURL;
  res.redirect(`/urls/${newURL}`);
});

app.get('/register', (req, res) => {
  res.render('register', { username: users[req.cookies["user_id"]] });
});

app.post('/register', (req, res) => {
  let newID = generateRandomString();
  // console.log(req.body.email, newUser)
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
    password: req.body.password
  };

  newUser = users[newID] ;
  console.log(users);
  console.log(newUser.id);
  // let cookieID = ;
  
  res.cookie('user_id', newUser.id);
  // console.log(users[newUser].id)
  // console.log(users);
  // console.log(req.cookies['user_id'])
  res.redirect('/urls');
 }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let templateVars = { username: req.cookies["user_id"], urls: urlDatabase };
  delete urlDatabase[req.params.shortURL];
  // console.log(urlDatabase);
  res.render('urls_index', templateVars);
});

app.get('/login', (req, res) => {
  res.render('login', { username: users[req.cookies["user_id"]] });
});

app.post('/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.name;
  res.redirect(`/urls`);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});