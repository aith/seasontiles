/* exported preload, setup, draw, placeTile */

/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;

// bit order:
// 0000 ie 0 refers to no tiles being same
// WESN
// 1000 ie 8 refers to northern tile being same
const lookup = [
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [2,2],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [1,1],
    [0,0]
];

function preload() {
    tilesetImage = loadImage(
        "./tileset.png"
    );
}

function setup() {
    numCols = select("#asciiBox").attribute("rows") | 0;  // iot grab html element named asciiBox. 
    // 'float | 0' converts into int
    numRows = select("#asciiBox").attribute("cols") | 0;  // 'select()' grabs an html element
    createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer");  // iot set canvas parent to html container
    select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;
    select("#reseedButton").mousePressed(reseed);
    select("#asciiBox").input(reparseGrid);  // iot run reparseGrid as a callback to asciiBox's input being changed
    reseed();
    generateGrid();
}


function draw() {
    randomSeed(seed);
    drawGrid(currentGrid);
}

function generateGrid(numCols, numRows) {
    let grid = [];
    for (let i = 0; i < numRows; i++) {
        let row = [];
        for (let j = 0; j < numCols; j++) {

            if (i == 0 && j == 0) row.push(":"); // temp
            else // temp
                row.push("_");
        }
        grid.push(row);
    }
    return grid;
}

function drawGrid(grid) {
    background(128);
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            drawByKey(currentGrid, i, j, currentGrid[i][j], 0, 0);
            // if (grid[i][j] == '_') {
            // placeTile(i, j, (floor(random(4))), 0); 
            // }
        }
    }
}

function drawByKey(grid, i, j, target, ti, tj) {
    switch(target) {
        case '_': // dirt
            drawContext(grid, i, j, grid[i][j], 0, 0); break;
        case ':':
            drawContext(grid, i, j, grid[i][j], 0, 3); break;
        default:
    }
}

function drawContext(grid, i, j, target, ti, tj) {
    let code = gridCode(grid, i, j, target);
    const [tiOffset, tjOffset] = lookup[code];
    placeTile(i, j, ti + tiOffset - 1, tj + tjOffset - 1);  // temp sub 1 so grass is at 0 0
    handleCorners(code, target);
}

function handleCorners(code, target) {
}

function gridCode(grid, i, j, target) {
    // i believe target is the tile image to be endoced
    let northBit = gridCheck(grid, i, j-1, target);
    let southBit = gridCheck(grid, i, j+1, target);
    let eastBit =  gridCheck(grid, i+1, j, target);
    let westBit =  gridCheck(grid, i-1, j, target);
    // iot create a bit-array, use LSR
    let code = (northBit<<0)+(southBit<<1)+(eastBit<<2)+(westBit<<3);  
    // print(code);
    return code;
}

function gridCheck(grid, i, j, target) {
    if (i < 0 || j < 0 || i > numRows-1 || j > numCols-1) return true;
    return grid[i][j] == target ? true : false;
}


function placeTile(i, j, ti, tj) {  // ti, tj determine selected tile to draw
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

