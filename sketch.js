/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

let grassKey = ':',
    dirtKey = '_'

// bit order:
// WESN
// 0001 ie refers to northern tile being same
// 
// lookup: describes the tile image offset for the given bit combination -> array index.
//   You can think of the lookup table as a mapping function
//
let lookupDict = {}

const gO = 0;
const grassTileSet = [
  [-4, gO], // same as ":" nowhere around this tile
  [-4, gO], // same just north
  [-4, gO], // same just south
  [1, gO], // N + S
  [-4, gO], // E
  [0, gO+2], // N + E
  [0, gO], // S + E
  [0, gO+1], // - W
  [-4, gO], // W
  [2, gO+2], // N + W
  [2, gO], // S + W
  [2, gO+1], // - E
  [1, gO+1], // W + E
  [1, gO+2], // - S
  [1, gO], // - N
  [1, gO+1], // all
];

const dO = 3;
const dirtTileSet = [
  [-4, dO], // same as ":" nowhere around this tile
  [-4, dO], // N
  [-4, dO], // S
  [1, dO], // N + S
  [-4, dO], // E
  [0, dO+2], // N + E
  [0, dO], // S + E
  [0, dO], // - W
  [-4, dO], // W
  [2, dO], // N + W
  [-4, dO], // S + W
  [2, dO], // - E
  [1, dO], // W + E
  [1, dO], // - S
  [1, dO], // - N
  [5, dO], // all
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
  reseed();
  generateLookupDict();
  generateGrid();
}

function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);
}

function generateLookupDict() {
  lookupDict[grassKey] = grassTileSet;
  lookupDict[dirtKey] = dirtTileSet;
}

function generateGrid(numCols, numRows) {
  let grid = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      if (i > 4 && j > 4 && i < 10 && j < 10) row.push(":");
      else row.push("_");
    }
    grid.push(row);
  }
  return grid;
}

function drawGrid(grid) {
  background(128);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      drawContext(grid, i, j, dirtKey, 4, 0);
      drawContext(grid, i, j, grassKey, 4, 0);
    }
  }
}


function drawContext(grid, i, j, target, ti, tj, key) {
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
