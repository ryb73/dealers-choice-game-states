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
      Offer                     = dcEngine.Offer,
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
      AllowSecondDcCard         = gameStates.AllowSecondDcCard,
      LotOpen                   = gameStates.LotOpen,
      TurnOver                  = gameStates.TurnOver,
      Bidding                   = gameStates.Bidding;

chai.use(chaiAsPromised);
const assert = chai.assert;

describe("AllowOpenLot", function() {
  describe("go", function() {
    let player, choiceProvider, gameData, cpMock, state;
    beforeEach(function() {
      player = new Player(1000);
      choiceProvider = { allowOpenLot: function() {} };
      gameData = {};
      cpMock = sinon.mock(choiceProvider);

      state = new AllowOpenLot(gameData, choiceProvider,
                                    player);
    });

    afterEach(function() {
      player = choiceProvider = gameData = cpMock = state = null;
    });

    it("doesn't give the option if player has no cars", function() {
      cpMock.expects("allowOpenLot").never();

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, TurnOver);
          cpMock.verify();
        });
    });

    it("opens the lot if requested", function() {
      player.gainCar({});

      cpMock.expects("allowOpenLot")
        .once()
        .withArgs(player)
        .returns(q(true));

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, LotOpen);
          cpMock.verify();
        });
    });

    it("doesn't open the lot if that's what you really want", function() {
      player.gainCar({});

      cpMock.expects("allowOpenLot")
        .once()
        .withArgs(player)
        .returns(q(false));

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, TurnOver);
          cpMock.verify();
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