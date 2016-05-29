"use strict";

module.exports = InitialDeal;

const _              = require("lodash"),
      q              = require("q"),
      CheckReplenish = require("./check-replenish");

function InitialDeal(gameData, choiceProvider, firstPlayerIdx) {
  function go() {
    _.times(5,
      dealToPlayers.bind(null, gameData.players, firstPlayerIdx, gameData.dealDcCard)
    );

    _.times(numCarsToDeal(gameData.players.length),
      dealToPlayers.bind(null, gameData.players, firstPlayerIdx, gameData.dealCar)
    );

    _.times(1,
      dealToPlayers.bind(null, gameData.players, firstPlayerIdx, gameData.dealInsurance)
    );

    return q(new CheckReplenish(gameData, choiceProvider, firstPlayerIdx));
  }
  this.go = go;

  function dealToPlayers(players, startIndex, dealFunction) {
    let i = startIndex;
    do {
      dealFunction(players[i]);
      i = (i + 1) % players.length;
    } while(i !== startIndex);
  }

  Object.defineProperties(this, {
    firstPlayerIdx: {
      enumerable: true,
      get: function() {
        return firstPlayerIdx;
      }
    }
  });
}

function numCarsToDeal(numPlayers) {
  if(numPlayers < 4)
    return 4;
  if(numPlayers === 4)
    return 3;
  else
    return 2;
}