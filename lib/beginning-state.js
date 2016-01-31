"use strict";

module.exports = BeginningState;

const _              = require("lodash"),
      CheckReplenish = require("./check-replenish");

function BeginningState(gameData, choiceProvider) {
  function go() {
    return choiceProvider.rockPaperScissors()
      .then(doNext);
  }
  this.go = go;

  function doNext(firstPlayerId) {
    gameData.currentPlayer = firstPlayerId;
    let firstPlayer = _.find(gameData.players, { id: firstPlayerId });

    return new CheckReplenish(gameData, choiceProvider, firstPlayer);
  }
}