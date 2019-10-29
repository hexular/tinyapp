const infoLookup = (key, value, registry) => {
  for (let user in registry) {
    if (registry[user][key] === value) return true;
  } 
  return false;
};

// the function I originally wrote returned a boolean value, which I worked off of to develop the logic for the post to /register listener
// I found a boolean value much simpler to work with than the entire user object, as we were only checking for the existence of a value within an object
// at no point did I have to manipulate the entire user object, so I chose not to refactor this fucntion to return the user object

module.exports = { infoLookup };