"use strict";

module.exports = LotOpen;

const q        = require("q"),
      Bidding  = require("./bidding"),
      TurnOver = require("./turn-over");

function LotOpen(gameData, choiceProvider, player) {
  let self = this;

  function go() {
    if(player.cars.length === 0)
      return q(doneState());

    return choiceProvider.allowBids(player).then(nextState);
  }
  this.go = go;

  function nextState(offer) {
    if(offer.car) {
      let returnState = self;
      return new Bidding(gameData, choiceProvider, offer,
                          returnState);
    } else {
      return doneState();
    }
  }

  function doneState() {
    return new TurnOver(gameData, choiceProvider, player);
  }
}