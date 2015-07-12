"use strict";

let states = {};
states.AllowOpenLot = require("./lib/allow-open-lot");
states.AllowSecondDcCard = require("./lib/allow-second-dc-card");
states.BeginningState = require("./lib/beginning-state");
states.Bidding = require("./lib/bidding");
states.CheckReplenish = require("./lib/check-replenish");
states.FinalOffer = require("./lib/final-offer");
states.LotOpen = require("./lib/lot-open");
states.MakeCounterOffer = require("./lib/make-counter-offer");
states.PlayerTurnBeginState = require("./lib/player-turn-begin-state");
states.TurnOver = require("./lib/turn-over");

module.exports = states;