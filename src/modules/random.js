var random = {}

random.randBound = function (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = random
