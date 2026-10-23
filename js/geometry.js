// Solid rectangles measured from the painted backgrounds (assets/bgN.png on a 50px grid).
// [x, y, w, h] world pixels, world = 1536x1024 = the painting's own pixels.
window.GEOMETRY = {
  1: { solids: [
    [0, 0, 1536, 222],          // house fronts
    [0, 345, 125, 122],         // planter box
    [232, 325, 712, 142],       // kiosk row west
    [995, 325, 462, 142],       // kiosk row east
    [0, 875, 1536, 149],        // low brick wall
  ] },
  2: { solids: [
    [0, 0, 1536, 215],          // market back wall
    [0, 885, 1536, 139],        // low wall + crates
  ] },
  3: { solids: [
    [0, 0, 1536, 128],          // fence + trees
    [0, 128, 100, 896],         // west lawn
    [182, 222, 918, 522],       // centre lawn with pond
    [1185, 500, 351, 244],      // east lawn
    [0, 840, 1536, 184],        // south lawn
  ] },
  4: { solids: [
    [0, 0, 1536, 125],          // school building
    [488, 118, 76, 72], [1080, 118, 76, 72], // tree planters
    [0, 360, 672, 95],          // wall west of main gate
    [858, 360, 322, 95],        // wall between gates
    [1255, 360, 90, 95],        // pillars right of side entrance
    [1345, 360, 191, 95],       // wall east
    [1148, 125, 30, 235],       // iron railing (bike shed)
    [0, 872, 1536, 152],        // shop roofs
  ] },
  5: { solids: [
    [0, 0, 1536, 125],          // classroom wall
    [165, 238, 840, 332],       // classroom block west
    [1065, 238, 305, 332],      // classroom block east
    [178, 740, 205, 145], [1135, 740, 205, 145], // planters
    [0, 945, 1536, 79],         // low wall
  ] },
};
