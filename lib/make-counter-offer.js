"use strict";

module.exports = MakeCounterOffer;

function MakeCounterOffer(gameData, choiceProvider,
                           offer, afterSaleState)
{
  function go() {
    return choiceProvider.proposeCounterOffer(offer)
      .then(nextState);
  }
  module.exports = go;

  function nextState(accepted) {
    if(accepted) {
      offer.accept();
    } else { // Looking under the hood
      offer.lookUnderHood();
    }

    return afterSaleState;
  }
}