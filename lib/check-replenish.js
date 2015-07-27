"use strict";

module.exports = CheckReplenish;

const q                    = require("q"),
      PlayerTurnBeginState = require("./player-turn-begin-state"),
      buyFromAutoExchange  = require("./actions/buy-from-auto-exchange");

function CheckReplenish(gameData, choiceProvider, player) {
  var self = this;

  function go() {
    if(player.cars.size < 2 && gameData.carDeck.remaining > 0) {
      return buyFromAutoExchange(gameData, choiceProvider, player)
        .thenResolve(self);
    }

    // No replenish
    return q(new PlayerTurnBeginState(gameData,
      choiceProvider, player));
  }
  this.go = go;

  Object.defineProperties(this, {
    player: {
      enumerable: true,
      get: function() {
        return player;
      }
    }
  });
}