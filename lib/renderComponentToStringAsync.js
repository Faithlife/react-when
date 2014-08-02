/**
 * The actual renderComponent replacement.
 */
var Fiber = require('fibers');
var React = require('react');
var when = require('when');

/**
 * Renders the provided `component` to a String of HTML, returning a Promise
 * to be fulfilled with said String or rejected with an appropriate Error.
 */
function renderComponentToStringAsync(component) {
  return when.promise(function (resolve, reject) {
    Fiber(function () {
      Fiber.current.statePayload = {};

      try {
        resolve(
          React.renderComponentToString(component) +
          '<script>window.statePayload = ' +
          JSON.stringify(Fiber.current.statePayload) +
          ';</script>'
        );
      } catch (e) {
        reject(e);
      }
    })
      .run();
  });
}

/*!
 * Export `renderComponentToStringAsync`.
 */
module.exports = renderComponentToStringAsync;
