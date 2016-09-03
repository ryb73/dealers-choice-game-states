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
      gameStates                = require(".."),
      AllowOpenLot              = gameStates.AllowOpenLot,
      AllowSecondDcCard         = gameStates.AllowSecondDcCard;

chai.use(chaiAsPromised);
const assert = chai.assert;

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

      let state = new AllowSecondDcCard(gameData, choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowOpenLot);
          assert.equal(_.size(players[0].dcCards), 0);
          assert.ok(cardSpy.calledOnce, "play called once");
          assert.ok(
            cardSpy.calledWith(gameData, choiceProvider, players[0]),
            "calledWith"
          );
        });
    });

    it("allows the player to not play a second card", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        pickSecondDcCard: sinon.stub().returns(q(null))
      };

      let state = new AllowSecondDcCard(gameData, choiceProvider, players[0]);
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