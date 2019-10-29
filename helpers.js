const infoLookup = (key, value, registry) => {
  for (let user in registry) {
    if (registry[user][key] === value) return true;
  } 
  return false;
};

module.exports = { infoLookup };