/**
 * The ReactWhen Mixin is used to provide React components with the ability
 * to both:
 * - Have their initial state loaded on the server during initial render.
 * - Have the same initial state rehydrated on the client.
 *
 * This is accomplished by adding the mixin and implementing
 * `getInitialStateAsync`.
 *
 * NOTE: If both `getInitialState` and `getInitialStateAsync` are implemented,
 * their results will be merged with the same idiosyncracies as `setState`.
 */
var when = require('when');

var Fiber;
var Future;
try {
  Fiber = require('fibers');
  Future = require('fibers/future');
} catch (e) {
  // Unfortunately, `fibers` doesn't play with Browserify well. Instead, we
  // have to assume here that we're on the client, and recover appropriately.
  Fiber = null;
  Future = null;
}

var Mixin = {
  /**
   * Loads the initial state, 'blocking' the current thread of execution
   * until loading is complete. The state should be loaded by
   * `getInitialStateAsync`, which should, in turn, return a promise to be
   * fulfilled with the desired state.
   */
  getInitialState: function getInitialState() {
    var state;

    if (!Fiber) {
      // Remember: if there is no Fiber, we assume we're client-side. That
      // means we need to retrieve our state from the initial payload.
      state = window.statePayload && window.statePayload[this._getPayloadId()];
      if (!state) {
        return {};
      }
    } else {
      // Otherwise, we need to retrieve said state and add it to said initial
      // payload.
      var promise = when(this.getInitialStateAsync());
      var future = new Future();

      promise
        .then(function (val) {
          future.return(val);
        }, function (err) {
          console.error('Failed to getInitialStateAsync with:', err);
          future.return({});
        })
        .done();

      state = future.wait();
      Fiber.current.statePayload[this._getPayloadId()] = state;
    }

    return state;
  },
  /**
   * If no initial state is available, this kicks off loading said state
   * later in the mounting process.
   */
  componentDidMount: function componentDidMount() {
    var self = this;

    var state = window.statePayload && window.statePayload[self._getPayloadId()];
    if (state) {
      return;
    }

    when(self.getInitialStateAsync())
      .then(function (state) {
        self.setState(state);
      }, function (err) {
        console.error(err);
      })
      .done();
  },
  /**
   * Internal method for uniquely identifying a React component for
   * proper rehydration on the client.
   */
  _getPayloadId: function _getPayloadId() {
    return this._rootNodeID;
  }
};

/*!
 * Export `Mixin`.
 */
module.exports = Mixin;
