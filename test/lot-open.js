"use strict";
/* jshint mocha: true */

const chai                      = require("chai"),
      chaiAsPromised            = require("chai-as-promised"),
      sinon                     = require("sinon"),
      q                         = require("q"),
      dcEngine                  = require("dc-engine"),
      Player                    = dcEngine.Player,
      Offer                     = dcEngine.Offer,
      Car                       = dcEngine.Car,
      gameStates                = require(".."),
      LotOpen                   = gameStates.LotOpen,
      TurnOver                  = gameStates.TurnOver,
      Bidding                   = gameStates.Bidding;

chai.use(chaiAsPromised);
const assert = chai.assert;

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
      seller.buyCar(car, 0);

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