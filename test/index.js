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
      cardTypes                 = require("dc-card-interfaces"),
      Car                       = cardTypes.Car,
      dcConstants               = require("dc-constants"),
      BuyFromAutoExchangeOption = dcConstants.BuyFromAutoExchangeOption,
      TurnChoice                = dcConstants.TurnChoice,
      gameStates                = require(".."),
      BeginningState            = gameStates.BeginningState,
      CheckReplenish            = gameStates.CheckReplenish,
      PlayerTurnBeginState      = gameStates.PlayerTurnBeginState,
      AllowOpenLot              = gameStates.AllowOpenLot,
      AllowSecondDcCard         = gameStates.AllowSecondDcCard;

chai.use(chaiAsPromised);
const assert = chai.assert;

describe("BeginningState", function() {
  describe("go", function() {
    it("goes to CheckReplenish for the first player", function () {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        rockPaperScissors: function() {
          return q(players[1].id);
        }
      };

      let state = new BeginningState(gameData, choiceProvider);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, CheckReplenish);
        assert.equal(gameData.currentPlayer, players[1].id);
        assert.equal(newState.player, players[1]);
      });
    });
  });
});

describe("CheckReplenish", function() {
  describe("go", function() {
    it("goes to the next state if no need to replenish", function() {
      // Player has two cars -- no need to replenish
      let players = initPlayers(3);
      players[0].gainCar(new Car(0, 0));
      players[0].gainCar(new Car(1, 0));

      let deckConfig = mockDeckConfig(0, 0, 2);
      let gameData = new GameData(players, deckConfig);

      let state = new CheckReplenish(gameData, {}, players[0]);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, PlayerTurnBeginState);

      });
    });

    it("goes to the next state if can't replenish", function() {
      let players = initPlayers(3);

      // No cars left in deck -- can't replenish
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let state = new CheckReplenish(gameData, {}, players[0]);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, PlayerTurnBeginState);

      });
    });

    it("replenishes if necessary", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 2);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        chooseBuyFromAutoExchangeOption: function(player) {
          assert.equal(player, players[0]);
          return q(BuyFromAutoExchangeOption.FourThou);
        }
      };

      let state = new CheckReplenish(gameData, choiceProvider,
                                      players[0]);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, CheckReplenish);
        assert.equal(players[0].cars.length, 1);
        assert.equal(players[0].money, 6000);
      });
    });
  });
});

describe("PlayerTurnBeginState", function() {
  describe("go", function() {
    it("requests a turn choice with the proper arguments", function(done) {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          assert.equal(gd, gameData);
          assert.equal(p, players[0]);
          done();
          return q({
            choice: TurnChoice.DoNothing
          });
        }
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      state.go()
        .catch(done);
    });

    it("plays a dealer's choice card", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);
      let choiceProvider;

      let deferrals = makeDeferrals(2);

      let card = {
        play: function(p, gd, cp) {
          assert.equal(p, players[0]);
          assert.equal(gd, gameData);
          assert.equal(cp, choiceProvider);
          deferrals[0].resolve();
          return q(1);
        }
      };

      choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.DcCard,
            card: card
          });
        }
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowSecondDcCard);
          deferrals[1].resolve();
        })
        .catch(deferrals[1].reject);

      return q.all(deferrals.map(function(deferred) {
        return deferred.promise;
      }));
    });

    it("buys a car from the auto exchange", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 1);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.BuyCar
          });
        },
        chooseBuyFromAutoExchangeOption:
          q.bind(null, BuyFromAutoExchangeOption.FourThou)
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].cars.length, 1);
        assert.equal(players[0].money, 6000);
        assert.instanceOf(newState, AllowOpenLot);
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

function makeDeferrals(n) {
  let result = new Array(n);
  for(let i = 0; i < n; ++i) {
    result[i] = q.defer();
  }
  return result;
}