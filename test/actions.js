"use strict";
/* jshint mocha: true */

const chai                      = require("chai"),
      chaiAsPromised            = require("chai-as-promised"),
      q                         = require("q"),
      _                         = require("lodash"),
      dcEngine                  = require("dc-engine"),
      Player                    = dcEngine.Player,
      GameData                  = dcEngine.GameData,
      Car                       = dcEngine.Car,
      buyFromAutoExchange       = require("../lib/actions/buy-from-auto-exchange"),
      BuyFromAutoExchangeOption = require("dc-constants").BuyFromAutoExchangeOption;

chai.use(chaiAsPromised);
const assert = chai.assert;

describe("buyFromAutoExchange", function() {
  it("buys a car for list", function() {
    let setup = doSetup(BuyFromAutoExchangeOption.List);

    return buyFromAutoExchange(setup.gameData,
      setup.choiceProvider, setup.player)
        .then(function() {
          assert.equal(setup.player.money, 2000);
          assert.equal(_.size(setup.player.cars), 1);
          assert.equal(setup.gameData.carDeck.remaining, 0);
        });
  });

  it("buys a car for blue book", function() {
    let setup = doSetup(BuyFromAutoExchangeOption.FourThou);

    return buyFromAutoExchange(setup.gameData,
      setup.choiceProvider, setup.player)
        .then(function() {
          assert.equal(setup.player.money, 1000);
          assert.equal(_.size(setup.player.cars), 1);
          assert.equal(setup.gameData.carDeck.remaining, 0);
        });
  });
});

function doSetup(option) {
  let deckConfig = {
    dcDeck: [],
    insuranceDeck: [],
    carDeck: [{
      constructor: Car,
      args: [ 1, 3000 ],
      count: 1
    }]
  };

  let player = new Player(5000);
  let gameData = new GameData([ player ], deckConfig);

  let choiceProvider = {
    doBuyFromExchange: function(p) {
      assert.equal(p, player);
      return q(option);
    }
  };

  return {
    player: player,
    gameData: gameData,
    choiceProvider: choiceProvider
  };
}