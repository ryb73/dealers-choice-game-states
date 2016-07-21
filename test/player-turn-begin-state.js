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
      dcConstants               = require("dc-constants"),
      BuyFromAutoExchangeOption = dcConstants.BuyFromAutoExchangeOption,
      TurnChoice                = dcConstants.TurnChoice,
      gameStates                = require(".."),
      PlayerTurnBeginState      = gameStates.PlayerTurnBeginState,
      AllowOpenLot              = gameStates.AllowOpenLot,
      AllowSecondDcCard         = gameStates.AllowSecondDcCard;

chai.use(chaiAsPromised);
const assert = chai.assert;

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
        getTurnChoice: function(p) {
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
        doBuyFromExchange:
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

      let state = new PlayerTurnBeginState(gameData, choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].dcCards.length, 3);

        // Make sure none of the cards the player
        // originally had are still in the player's
        // hand
        assert.notOk(_.some(
          players[0].dcCards,
          _.includes.bind(_, originalCards)
        ));

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