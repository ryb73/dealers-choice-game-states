"use strict";

module.exports = DecideFinalOffer;

var MakeCounterOffer = require("./make-counter-offer"),
    acceptOffer      = require("./actions/accept-offer");

function DecideFinalOffer(gameData, choiceProvider, car, finalBid,
                     afterSaleState)
{
  function go() {
    return choiceProvider.decideFinalOffer(car, finalBid)
      .then(nextState);
  }
  this.go = go;

  function nextState(offer) {
    if(offer) { // If the seller made a counter-offer
      return new MakeCounterOffer(gameData, choiceProvider,
        offer, afterSaleState);
    } else { // If the seller accepted the buyer's offer
      acceptOffer(gameData, finalBid);
      return afterSaleState;
    }
  }
}