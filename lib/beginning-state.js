"use strict";

module.exports = BeginningState;

const InitialDeal = require("./initial-deal");

function BeginningState(gameData, choiceProvider) {
  function go() {
    return choiceProvider.rockPaperScissors()
      .then(doNext);
  }
  this.go = go;

  function doNext(firstPlayerIdx) {
    return new InitialDeal(gameData, choiceProvider, firstPlayerIdx);
  }
}