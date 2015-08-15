"use strict";

module.exports = PlayerTurnBeginState;

const _                   = require("lodash"),
      TurnChoice          = require("dc-constants").TurnChoice,
      AllowSecondDcCard   = require("./allow-second-dc-card"),
      AllowOpenLot        = require("./allow-open-lot"),
      buyFromAutoExchange = require("./actions/buy-from-auto-exchange");

function PlayerTurnBeginState($gameData, $choiceProvider, $player) {
  let gameData = $gameData;
  let choiceProvider = $choiceProvider;
  let player = $player;
  $gameData = $choiceProvider = $player = null;

  function go() {
    return choiceProvider
      .getTurnChoice(player)
      .then(handleChoice);
  }
  this.go = go;

  function handleChoice(choiceData) {
    /* jshint maxcomplexity: false */
    switch (choiceData.choice) {
      case TurnChoice.DcCard:
        return handleDcCard(choiceData.card);
      case TurnChoice.BuyCar:
        return handleBuyCar();
      case TurnChoice.BuyInsurance:
        return handleBuyInsurance();
      case TurnChoice.RefreshHand:
        return handleRefresh();
      case TurnChoice.DoNothing:
        return turnDoneState();
    }

    throw new Error("Invalid turn choice: " + choiceData.choice);
  }

  function handleDcCard(card) {
    let qPlayed = card.play(gameData, choiceProvider, player);
    return qPlayed.thenResolve(new AllowSecondDcCard(gameData,
                                choiceProvider, player));
  }

  function handleBuyCar() {
    return buyFromAutoExchange(gameData, choiceProvider, player)
      .thenResolve(turnDoneState());
  }

  function handleBuyInsurance() {
    player.buyInsurance(gameData.insuranceDeck.pop(), 4000);
    return turnDoneState();
  }

  function handleRefresh() {
    let numCards = player.dcCards.size;

    // We're going to discard all of the cards and THEN
    // draw new ones because that's how it'd happen in
    // real life
    player.dcCards.forEach(function(card) {
      gameData.dcDeck.discard(card);
      player.loseDcCard(card);
    });

    _.times(numCards, function() {
      player.gainDcCard(gameData.dcDeck.pop());
    });

    return turnDoneState();
  }

  // Essentially a helper function to return the state that we go to
  // when the player's action turn is done.
  function turnDoneState() {
    // ...which is the "allow open lot" state.
    return new AllowOpenLot(gameData, choiceProvider, player);
  }
}