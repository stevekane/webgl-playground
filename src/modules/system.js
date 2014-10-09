var system = {}

/* At a theoretical level, a system is just a mutative function
 * that takes a clock as input, and a list of entities to operate on.
 * It does not really "return" anything as its intended function is 
 * mutation/transformation.
 *
 * A wrinkle is introduced by the fact that it's very valuable to
 * cache a list of objects that this system specifically operates on.
 *
 * For the time being, we are allowing a mingling of state and behavior
 * inside a system to allow the cached values to be optionally computed
 * when the system is run.
 *
 * This blurring of behavior and data may be changed in the future by
 * simply passing the reduced list into the system function
 */

var System = function () {
  if (!(this instanceof System)) return new System()
}

system.System  = System
module.exports = system
