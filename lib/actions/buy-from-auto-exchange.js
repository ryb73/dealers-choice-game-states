"use strict";

var BuyFromAutoExchangeOption = require("dc-constants").BuyFromAutoExchangeOption;

function buyFromAutoExchange(gameData, choiceProvider,
                              player, replenishing) {
  return choiceProvider
    .doBuyFromExchange(player, replenishing)
    .then(doBuy.bind(null, gameData, player));
}

function doBuy(gameData, player, option) {
  var car = gameData.carDeck.pop();
  var amount = getCost(option, car);
  if(amount > player.money) {
    throw new Error("Not enough money to buy!!!"); // TODO: implement
  }

  player.debit(amount);
  player.gainCar(car);
}

function getCost(option, car) {
  switch (option) {
    case BuyFromAutoExchangeOption.List:
      return car.listPrice;
    case BuyFromAutoExchangeOption.FourThou:
      return 4000;
  }

  throw new Error("Invalid buy option: " + option);
}

module.exports = buyFromAutoExchange;