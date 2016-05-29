"use strict";
/* jshint mocha: true */

const chai           = require("chai"),
      chaiAsPromised = require("chai-as-promised"),
      q              = require("q"),
      _              = require("lodash"),
      dcTest         = require("dc-test"),
      mockDeckConfig = dcTest.mockDeckConfig,
      dcEngine       = require("dc-engine"),
      Player         = dcEngine.Player,
      GameData       = dcEngine.GameData,
      gameStates     = require(".."),
      BeginningState = gameStates.BeginningState,
      InitialDeal    = gameStates.InitialDeal;

chai.use(chaiAsPromised);
const assert = chai.assert;

describe("BeginningState", function() {
  describe("go", function() {
    it("goes to InitialDeal for the first player", function () {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        rockPaperScissors: function() {
          return q(1);
        }
      };

      let state = new BeginningState(gameData, choiceProvider);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, InitialDeal);
        assert.equal(newState.firstPlayerIdx, 1);
      });
    });
  });
});

function initPlayers(num) {
  let players = [];
  _.times(num, function() {
    players.push(new Player(10000));
  });
  return players;
}