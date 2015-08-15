"use strict";

module.exports = Bidding;

const MakeCounterOffer = require("./make-counter-offer");

function Bidding(gameData, choiceProvider, offer, afterSaleState) {
  function go() {
    return choiceProvider.doBidding(offer).then(decideFinalOffer);
  }
  this.go = go;

  function decideFinalOffer(finalBid) {
    return choiceProvider.decideFinalOffer(finalBid)
      .then(nextState.bind(null, finalBid));
  }

  function nextState(finalBid, offer) {
    if(offer) { // If the seller made a counter-offer
      return new MakeCounterOffer(gameData, choiceProvider,
        offer, afterSaleState);
    } else { // If the seller accepted the buyer's offer
      finalBid.accept();
      return afterSaleState;
    }
  }
}