"use strict";

module.exports = LotOpen;

var Bidding  = require("./bidding"),
    TurnOver = require("./turn-over");

function LotOpen(gameData, choiceProvider, player) {
  let self = this;

  function go() {
    return choiceProvider.allowBids(player).then(nextState);
  }
  this.go = go;

  function nextState(car) {
    if(car) {
      var returnState = self;
      return new Bidding(gameData, choiceProvider, car,
                          returnState);
    } else {
      return new TurnOver(gameData, choiceProvider, player);
    }
  }
}