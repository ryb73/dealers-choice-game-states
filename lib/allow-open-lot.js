"use strict";

module.exports = AllowOpenLot;

const q        = require("q"),
      _        = require("lodash"),
      LotOpen  = require("./lot-open"),
      TurnOver = require("./turn-over");

function AllowOpenLot(gameData, choiceProvider, player) {
  function go() {
    if(_.size(player.cars) === 0)
      return q(nextState(false));

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