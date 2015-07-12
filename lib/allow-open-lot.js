"use strict";

module.exports = AllowOpenLot;

var LotOpen  = require("./lot-open"),
    TurnOver = require("./turn-over");

function AllowOpenLot(gameData, choiceProvider, player) {
  function go() {
    return choiceProvider.allowOpenLot(player)
      .then(nextState);
  }
  this.go = go;

  function nextState(openLot) {
    if(openLot)
      return new LotOpen(gameData, choiceProvider, player);
    else
      return new TurnOver(gameData, choiceProvider, player);
  }
}