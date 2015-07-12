"use strict";

module.exports = MakeCounterOffer;

function MakeCounterOffer(gameData, choiceProvider,
                           offer, AfterSaleState)
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
      if(offer.aboveBlueBook()) {

      }
    }
  }

  function lookUnderHood() {

  }
}