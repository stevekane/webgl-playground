var collision = {}

//simple AABB in 3d space
function overlapAABB3d (p1x, p1y, p1z, s1x, s1y, s1z, p2x, p2y, p2z, s2x, s2y, s2z) {
  var lb1x = p1x - s1x
  var lb1y = p1y - s1y
  var lb1z = p1z - s1z
  var lb2x = p2x - s2x
  var lb2y = p2y - s2y
  var lb2z = p2z - s2z

  var ub1x = p1x + s1x
  var ub1y = p1y + s1y
  var ub1z = p1z + s1z
  var ub2x = p2x + s2x
  var ub2y = p2y + s2y
  var ub2z = p2z + s2z

  return ((lb2x <= ub1x && ub1x <= ub2x) || (lb1x <= ub2x && ub2x <= ub1x)) &&
         ((lb2y <= ub1y && ub1y <= ub2y) || (lb1y <= ub2y && ub2y <= ub1y)) &&
         ((lb2z <= ub1z && ub1z <= ub2z) || (lb1z <= ub2z && ub2z <= ub1z))
}

collision.overlapAABB3d = overlapAABB3d
module.exports          = collision
