"use strict";
/* jshint mocha: true */

const chai                      = require("chai"),
      chaiAsPromised            = require("chai-as-promised"),
      sinon                     = require("sinon"),
      q                         = require("q"),
      _                         = require("lodash"),
      dcTest                    = require("dc-test"),
      mockDeckConfig            = dcTest.mockDeckConfig,
      dcEngine                  = require("dc-engine"),
      Player                    = dcEngine.Player,
      GameData                  = dcEngine.GameData,
      Offer                     = dcEngine.Offer,
      cardTypes                 = require("dc-card-interfaces"),
      Car                       = cardTypes.Car,
      dcConstants               = require("dc-constants"),
      BuyFromAutoExchangeOption = dcConstants.BuyFromAutoExchangeOption,
      TurnChoice                = dcConstants.TurnChoice,
      gameStates                = require(".."),
      BeginningState            = gameStates.BeginningState,
      CheckReplenish            = gameStates.CheckReplenish,
      PlayerTurnBeginState      = gameStates.PlayerTurnBeginState,
      AllowOpenLot              = gameStates.AllowOpenLot,
      AllowSecondDcCard         = gameStates.AllowSecondDcCard,
      LotOpen                   = gameStates.LotOpen,
      TurnOver                  = gameStates.TurnOver,
      Bidding                   = gameStates.Bidding;

chai.use(chaiAsPromised);
const assert = chai.assert;



function initPlayers(num) {
  let players = [];
  _.times(num, function() {
    players.push(new Player(10000));
  });
  return players;
}