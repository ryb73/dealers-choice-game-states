"use strict";

module.exports = MakeCounterOffer;

const HoodResult = require("dc-engine").Offer.HoodResult;

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
      offer.lookUnderHood();
    }
  }
}