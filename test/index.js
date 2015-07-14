"use strict";
/* jshint mocha: true */

const chai                      = require("chai"),
      chaiAsPromised            = require("chai-as-promised"),
      sinon                     = require("sinon"),
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
  let players, deckConfig, gameData;

  beforeEach(function() {
    players = initPlayers(3);
    deckConfig = mockDeckConfig(6, 1, 1);
    gameData = new GameData(players, deckConfig);
  });

  afterEach(function() {
    players = deckConfig = gameData = null;
  });

  describe("go", function() {
    it("requests a turn choice with the proper arguments", function(done) {
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
      let card = gameData.dcDeck.pop();
      let cardSpy = sinon.spy(card, "play");

      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.DcCard,
            card: card
          });
        }
      };

      players[0].gainDcCard(card);

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowSecondDcCard);
          assert.equal(players[0].dcCards.length, 0);
          assert.ok(cardSpy.calledOnce);
          assert.ok(cardSpy.calledWith(gameData, choiceProvider,
                                        players[0]));
        });
    });

    it("buys a car from the auto exchange", function() {
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

    it("buys an insurance", function() {
      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.BuyInsurance
          });
        }
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].insurances.length, 1);
        assert.equal(players[0].money, 6000);
        assert.instanceOf(newState, AllowOpenLot);
      });
    });

    it("refreshes the hand", function() {
      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.RefreshHand
          });
        }
      };

      // Give the player three cards. Later we'll compare these
      // three to the ones the player has after the refresh
      let originalCards = [];
      _.times(3, function() {
        let card = gameData.dcDeck.pop();
        originalCards.push(card);
        players[0].gainDcCard(card);
      });

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].dcCards.length, 3);

        assert.notOk(_.any(
          players[0].dcCards,
          _.contains.bind(_, originalCards)
        ));

        assert.instanceOf(newState, AllowOpenLot);
      });
    });
  });
});

describe("AllowSecondDcCard", function() {
  describe("go", function() {
    it("allows the player to play a second card", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(1, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let card = gameData.dcDeck.pop();
      let cardSpy = sinon.spy(card, "play");
      players[0].gainDcCard(card);

      let choiceProvider = {
        pickSecondDcCard: sinon.stub().returns(q(card))
      };

      let state = new AllowSecondDcCard(gameData,
                   choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowOpenLot);
          assert.equal(players[0].dcCards.length, 0);
          assert.ok(cardSpy.calledOnce, "play called once");
          assert.ok(cardSpy.calledWith(gameData, choiceProvider,
                                        players[0]), "calledWith");
        });
    });

    it("allows the player to not play a second card", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        pickSecondDcCard: sinon.stub().returns(q(null))
      };

      let state = new AllowSecondDcCard(gameData,
                   choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
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