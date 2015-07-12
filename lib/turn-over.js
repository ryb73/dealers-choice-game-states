"use strict";

module.exports = TurnOver;

var PlayerTurnBeginState = require("./player-turn-begin-state");

function TurnOver(gameData, choiceProvider, player) {
  function go() {
    player.gain(gameData.dcCards.pop());
    var nextPlayer = gameData.nextPlayer(player);
    return new PlayerTurnBeginState(gameData,
      choiceProvider, nextPlayer);
  }
  this.go = go;
}