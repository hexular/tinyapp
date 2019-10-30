const { assert } = require('chai');

const { infoLookup } = require('../helpers.js');

const testUsers = {
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

describe('infoLookup', () => {
  it('should return true for an email that exists in the registry', () => {
    const result = infoLookup('email', "user@example.com", testUsers);
    const expected = true;
    assert.equal(result, expected);
  });
  it('should return false for an email that is not in the registry', () => {
    const result = infoLookup('email', 'lol@ahaha.ha', testUsers);
    const expected = false;
    assert.equal(result, expected);
  });
});