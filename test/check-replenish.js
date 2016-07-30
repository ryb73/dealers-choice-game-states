"use strict";
/* jshint mocha: true */

const chai                      = require("chai"),
      chaiAsPromised            = require("chai-as-promised"),
      q                         = require("q"),
      _                         = require("lodash"),
      dcTest                    = require("dc-test"),
      mockDeckConfig            = dcTest.mockDeckConfig,
      dcEngine                  = require("dc-engine"),
      Player                    = dcEngine.Player,
      GameData                  = dcEngine.GameData,
      Car                       = dcEngine.Car,
      dcConstants               = require("dc-constants"),
      BuyFromAutoExchangeOption = dcConstants.BuyFromAutoExchangeOption,
      gameStates                = require(".."),
      CheckReplenish            = gameStates.CheckReplenish,
      PlayerTurnBeginState      = gameStates.PlayerTurnBeginState;

chai.use(chaiAsPromised);
const assert = chai.assert;

describe("CheckReplenish", function() {
  describe("go", function() {
    it("goes to the next state if no need to replenish", function() {
      // Player has two cars -- no need to replenish
      let players = initPlayers(3);
      players[0].buyCar(new Car(0, 0), 0);
      players[0].buyCar(new Car(1, 0), 0);

      let deckConfig = mockDeckConfig(0, 0, 2);
      let gameData = new GameData(players, deckConfig);

      let state = new CheckReplenish(gameData, {}, 0);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, PlayerTurnBeginState);

      });
    });

    it("goes to the next state if can't replenish", function() {
      let players = initPlayers(3);

      // No cars left in deck -- can't replenish
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let state = new CheckReplenish(gameData, {}, 0);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, PlayerTurnBeginState);

      });
    });

    it("replenishes if necessary", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 2);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        doBuyFromExchange: function(player) {
          assert.equal(player, players[0]);
          return q(BuyFromAutoExchangeOption.FourThou);
        }
      };

      let state = new CheckReplenish(gameData, choiceProvider, 0);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, CheckReplenish);
        assert.equal(_.size(players[0].cars), 1);
        assert.equal(players[0].money, 6000);
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