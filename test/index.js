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

describe("BeginningState", function() {
  describe("go", function() {
    it("goes to CheckReplenish for the first player", function () {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        rockPaperScissors: function() {
          return q(players[1].id);
        }
      };

      let state = new BeginningState(gameData, choiceProvider);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, CheckReplenish);
        assert.equal(gameData.currentPlayer, players[1].id);
        assert.equal(newState.player, players[1]);
      });
    });
  });
});

describe("CheckReplenish", function() {
  describe("go", function() {
    it("goes to the next state if no need to replenish", function() {
      // Player has two cars -- no need to replenish
      let players = initPlayers(3);
      players[0].gainCar(new Car(0, 0));
      players[0].gainCar(new Car(1, 0));

      let deckConfig = mockDeckConfig(0, 0, 2);
      let gameData = new GameData(players, deckConfig);

      let state = new CheckReplenish(gameData, {}, players[0]);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, PlayerTurnBeginState);

      });
    });

    it("goes to the next state if can't replenish", function() {
      let players = initPlayers(3);

      // No cars left in deck -- can't replenish
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let state = new CheckReplenish(gameData, {}, players[0]);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, PlayerTurnBeginState);

      });
    });

    it("replenishes if necessary", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 2);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        doBuyFromExchange: function(player) {
          assert.equal(player, players[0]);
          return q(BuyFromAutoExchangeOption.FourThou);
        }
      };

      let state = new CheckReplenish(gameData, choiceProvider,
                                      players[0]);
      return state.go().then(function(newState) {
        assert.instanceOf(newState, CheckReplenish);
        assert.equal(players[0].cars.size, 1);
        assert.equal(players[0].money, 6000);
      });
    });
  });
});

describe("PlayerTurnBeginState", function() {
  let players, deckConfig, gameData;

  beforeEach(function() {
    players = initPlayers(3);
    deckConfig = mockDeckConfig(6, 1, 1);
    gameData = new GameData(players, deckConfig);
  });

  afterEach(function() {
    players = deckConfig = gameData = null;
  });

  describe("go", function() {
    it("requests a turn choice with the proper arguments", function(done) {
      let choiceProvider = {
        getTurnChoice: function(p) {
          assert.equal(p, players[0]);
          done();
          return q({
            choice: TurnChoice.DoNothing
          });
        }
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      state.go()
        .catch(done);
    });

    it("plays a dealer's choice card", function() {
      let card = gameData.dcDeck.pop();
      let cardSpy = sinon.spy(card, "play");

      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.DcCard,
            card: card
          });
        }
      };

      players[0].gainDcCard(card);

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowSecondDcCard);
          assert.equal(players[0].dcCards.size, 0);
          assert.ok(cardSpy.calledOnce);
          assert.ok(cardSpy.calledWith(gameData, choiceProvider,
                                        players[0]));
        });
    });

    it("buys a car from the auto exchange", function() {
      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.BuyCar
          });
        },
        doBuyFromExchange:
          q.bind(null, BuyFromAutoExchangeOption.FourThou)
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].cars.size, 1);
        assert.equal(players[0].money, 6000);
        assert.instanceOf(newState, AllowOpenLot);
      });
    });

    it("buys an insurance", function() {
      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.BuyInsurance
          });
        }
      };

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].insurances.size, 1);
        assert.equal(players[0].money, 6000);
        assert.instanceOf(newState, AllowOpenLot);
      });
    });

    it("refreshes the hand", function() {
      let choiceProvider = {
        getTurnChoice: function(gd, p) {
          return q({
            choice: TurnChoice.RefreshHand
          });
        }
      };

      // Give the player three cards. Later we'll compare these
      // three to the ones the player has after the refresh
      let originalCards = [];
      _.times(3, function() {
        let card = gameData.dcDeck.pop();
        originalCards.push(card);
        players[0].gainDcCard(card);
      });

      let state = new PlayerTurnBeginState(gameData,
                   choiceProvider, players[0]);
      return state.go().then(function(newState) {
        assert.equal(players[0].dcCards.size, 3);

        // Make sure none of the cards the player
        // originally had are still in the player's
        // hand
        assert.notOk(_.any(
          players[0].dcCards,
          _.contains.bind(_, originalCards)
        ));

        assert.instanceOf(newState, AllowOpenLot);
      });
    });
  });
});

describe("AllowSecondDcCard", function() {
  describe("go", function() {
    it("allows the player to play a second card", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(1, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let card = gameData.dcDeck.pop();
      let cardSpy = sinon.spy(card, "play");
      players[0].gainDcCard(card);

      let choiceProvider = {
        pickSecondDcCard: sinon.stub().returns(q(card))
      };

      let state = new AllowSecondDcCard(gameData,
                   choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowOpenLot);
          assert.equal(players[0].dcCards.size, 0);
          assert.ok(cardSpy.calledOnce, "play called once");
          assert.ok(cardSpy.calledWith(gameData, choiceProvider,
                                        players[0]), "calledWith");
        });
    });

    it("allows the player to not play a second card", function() {
      let players = initPlayers(3);
      let deckConfig = mockDeckConfig(0, 0, 0);
      let gameData = new GameData(players, deckConfig);

      let choiceProvider = {
        pickSecondDcCard: sinon.stub().returns(q(null))
      };

      let state = new AllowSecondDcCard(gameData,
                   choiceProvider, players[0]);
      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, AllowOpenLot);
        });
    });
  });
});

describe("AllowOpenLot", function() {
  describe("go", function() {
    let player, choiceProvider, gameData, cpMock, state;
    beforeEach(function() {
      player = new Player(1000);
      choiceProvider = { allowOpenLot: function() {} };
      gameData = {};
      cpMock = sinon.mock(choiceProvider);

      state = new AllowOpenLot(gameData, choiceProvider,
                                    player);
    });

    afterEach(function() {
      player = choiceProvider = gameData = cpMock = state = null;
    });

    it("doesn't give the option if player has no cars", function() {
      cpMock.expects("allowOpenLot").never();

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, TurnOver);
          cpMock.verify();
        });
    });

    it("opens the lot if requested", function() {
      player.gainCar({});

      cpMock.expects("allowOpenLot")
        .once()
        .withArgs(player)
        .returns(q(true));

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, LotOpen);
          cpMock.verify();
        });
    });

    it("doesn't open the lot if that's what you really want", function() {
      player.gainCar({});

      cpMock.expects("allowOpenLot")
        .once()
        .withArgs(player)
        .returns(q(false));

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, TurnOver);
          cpMock.verify();
        });
    });
  });
});

describe("LotOpen", function() {
  describe("go", function() {
    let seller, buyer, choiceProvider, cpMock, state;

    beforeEach(function() {
      seller = new Player(1000);
      buyer = new Player(1000);

      choiceProvider = { allowBids: function() {} };
      cpMock = sinon.mock(choiceProvider);

      state = new LotOpen({}, choiceProvider, seller);
    });

    afterEach(function() {
      seller = buyer = choiceProvider = cpMock = state = null;
    });

    it("finishes turn if player has no car", function() {
      cpMock.expects("allowBids").never();

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, TurnOver);
          cpMock.verify();
        });
    });

    it("enters bidding for the specified car", function() {
      let car = new Car(0, 0);
      seller.gainCar(car);

      let offer = new Offer(buyer, seller, car, 100);

      cpMock.expects("allowBids")
        .once()
        .withArgs(seller)
        .returns(q(offer));

      return state.go()
        .then(function(newState) {
          assert.instanceOf(newState, Bidding);
          cpMock.verify();
        });
    });
  });
});

describe("Bidding", function() {

});

function initPlayers(num) {
  let players = [];
  _.times(num, function() {
    players.push(new Player(10000));
  });
  return players;
}