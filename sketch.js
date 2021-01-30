/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

let gKey = ':',
    dKey = '_'
    len = 2;

// bit order:
// WESN
// 0001 ie refers to northern tile being same
// 
// lookup: describes the tile image offset for the given bit combination -> array index.
//   You can think of the lookup table as a mapping function
//
let lookupDict = {}

const gO = 0;
const dO = 3;

const g = [
  [-3, -3], // same as ":" nowhere around this tile
  [0, gO], // same just north
  [0, gO], // same just south
  [0, gO], // N + S
  [0, gO], // E
  [0, gO], // N + E
  [0, gO], // S + E
  [0, gO], // - W
  [0, gO], // W
  [0, gO], // N + W
  [0, gO], // S + W
  [0, gO], // - E
  [0, gO], // W + E
  [0, gO], // - S
  [0, gO], // - N
  [0, gO], // all
];

const d2g = [
  [4, gO+2], // same as ":" nowhere around this tile
  [4, gO+2], // N
  [6, gO], // S
  [4, gO+1], // N + S *
  [4, gO+2], // E *
  [4, gO+2], // N + E
  [4, gO], // S + E
  [4, gO+1], // - W
  [6, gO+2], // W *
  [6, gO+2], // N + W
  [6, gO], // S + W
  [6, gO+1], // - E
  [5, gO+1], // W + E
  [5, gO+2], // - S
  [5, gO], // - N
  [0, dO], // all
];

function preload() {
  tilesetImage = loadImage("./tileset.png");
}

function setup() {
  numCols = select("#asciiBox").attribute("rows") | 0; // iot grab html element named asciiBox.
  // 'float | 0' converts into int
  numRows = select("#asciiBox").attribute("cols") | 0; // 'select()' grabs an html element
  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer"); // iot set canvas parent to html container
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
  select("#reseedButton").mousePressed(reseed);
  select("#asciiBox").input(reparseGrid); // iot run reparseGrid as a callback to asciiBox's input being changed
  generateLookupDict();
  reseed();
  // generateGrid();
}

function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);
}

function generateLookupDict() {
  lookupDict[gKey] = g;
  lookupDict[dKey] = d2g; 
}

function generateGrid(numCols, numRows) {
  let xOff = -0.01;
  let rate = 0.05;
  let grid = [];
  // let keys = Object.keys(lookupDict);
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      // if (i > 4 && j > 4 && i < 10 && j < 10) row.push("_");
      // else if (i > 2 && j > 9 && i < 5 && j < 12) row.push("_");
      // else row.push(":");
      // 
      let index = (noise(xOff) * len) | 0;
      xOff += rate;
      // print(Object.keys(lookupDict)[index]);
      row.push(Object.keys(lookupDict)[index]);
    }
    grid.push(row);
  }
  return grid;
}

function drawGrid(grid) {
  background(128);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      // so lets place normal square tiles by key, then do drawcontext for corners
      // drawContext(grid, i, j, grid[i][j], 0, 0);
      // place full tiles
      let target = grid[i][j];
      drawWithoutCorners(grid, i, j, target);
      drawContext(grid, i, j, target, 0, 0);
    }
  }
}

function drawWithoutCorners(grid, i, j, target) {
    const [tiOffset, tjOffset] = lookupDict[target][15];
    placeTile(i, j, tiOffset, tjOffset); // temp sub 1 so grass is at 0 0
} 


function drawContext(grid, i, j, target, ti, tj) {
  let code = gridCode(grid, i, j, target);
  const [tiOffset, tjOffset] = lookupDict[target][code];
  placeTile(i, j, ti + tiOffset, tj + tjOffset); // temp sub 1 so grass is at 0 0
}

function gridCode(grid, i, j, target) {
  // i believe target is the tile image to be endoced
  let northBit = gridCheck(grid, i - 1, j, target);
  let southBit = gridCheck(grid, i + 1, j, target);
  let eastBit = gridCheck(grid, i, j + 1, target);
  let westBit = gridCheck(grid, i, j - 1, target);
  // iot create a bit-array, use LSR
  let code =
    (northBit << 0) + (southBit << 1) + (eastBit << 2) + (westBit << 3);
  return code;
}

function gridCheck(grid, i, j, target) {
  if (i < 0 || j < 0 || i > numRows - 1 || j > numCols - 1) return false;
  return grid[i][j] == target ? true : false;
}

function placeTile(i, j, ti, tj) {
  // ti, tj determine selected tile to draw
  // create a grid code to determine tile image
  // the grid code cehcks gridCheck for each neighbour, which also handles when array null
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8); // take offset from lookup(code)
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReport").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
  select("#asciiBox").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(select("#asciiBox").value());
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}
