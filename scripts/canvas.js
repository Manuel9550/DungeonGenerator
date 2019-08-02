
var c;
var canvas;

// ----------------constants / configuration -----------------
// how big the grid will be 
const gridWidth = 40;
const gridHeight = 40;

// the smallest/biggest width or height a room can be
const minRoomSpace = 4;
const maxRoomSpace = 11;


// canvas and square width and height
const totalLength = 800;
const totalHeight = 1000;

const squareHeight = 20;
const squareWidth = 20;

// names of the different sets of Tiles
const TilesNames = {Void:"Void", Room:"Room", Wall:"Wall", Hallway:"Hallway", Door:"Door", Node:"Node"}; // Is this really the best way for constant strings?

// -----------------------------------------------------------

// the room array to keep all our completed room
var RoomList = [];

// A node represents a point in a room, used to connect the rooms together via hallways
class Node {
    constructor(locationX,locationY)
    {
        this.x = locationX;
        this.y = locationY;
    }
}

// this class defines a room in the dungeon
// has a location, and a height and width
class Room {
    constructor(locationX,locationY, roomWidth, roomHeight)
    {
        this.x = locationX;
        this.y = locationY;
        this.width = roomWidth;
        this.height = roomHeight;
    }

}

// the "tile" class represents a tile on the gridmap
// all othe tiles will extend from this one

// in order to generate paths from one tile to the other, we will give each tile a "Neighbor"
// (effectively using each tile as a node on a gridmap)
class Tile {
    constructor(locationX,locationY)
    {
        this.x = locationX;
        this.y = locationY;

        this.passable = false;
        this.TileColour = "white";
        this.TileType = TilesNames.Void;

        // the neighbours of the tile. Since we are using this to generate hallways, we mostly only care about void tiles and room/door tiles
        this.Neighbours = [];

        // the path of this tile, from the selected starting point to this tile (for pathfinding/creating hallways purposes)
        this.Path = [];
    }
}

// the 'Room' tile represents a tile in a room that the player can walk in

class RoomTile extends Tile{
    constructor(locationX,locationY){
        super(locationX,locationY);
        this.TileColour = "grey";
        this.passable = true;
        this.TileType = TilesNames.Room;
    }
}

// the 'Hallway' tile is the tile for the hallways that connect all the room together
class HallwayTile extends Tile{
    constructor(locationX,locationY){
        super(locationX,locationY);
        this.TileColour = "brown";
        this.passable = true;
        this.TileType = TilesNames.Hallway;
    }
}

// the 'Wall' tile marks the border of the room
class WallTile extends Tile{
    constructor(locationX,locationY){
        super(locationX,locationY);
        this.TileColour = "black";
        this.passable = false;
        this.TileType = TilesNames.Wall;
    }
}

// the 'Door' tile marks a door of the room, obviously
class DoorTile extends Tile{
    constructor(locationX,locationY){
        super(locationX,locationY);
        this.TileColour = "yellow";
        this.passable = true;
        this.TileType = TilesNames.Door;
    }
}

// for testing purposes
class NodeTile extends Tile{
    constructor(locationX,locationY){
        super(locationX,locationY);
        this.TileColour = "Green";
        this.passable = true;
        this.TileType = TilesNames.Node;
    }
}

// we need to create the 'grid' that will hold all of the tiles for dungeon
// it needs to be an array of arrays

var Tiles = new Array(gridWidth);

function CreateGrid()
{
    for (var i = 0; i < gridWidth; i++)
    {
        Tiles[i] = new Array(gridHeight);

        // fill the grid with generic tiles, the "default" tile. It represents the black void, squares players cannot interact with
        // we'll overwrite these tiles with rooms and passageways
        for (var x = 0; x < gridHeight; x++)
        {
            Tiles[i][x] = new Tile(i,x);
        }
     }
    

}

// once we have a tileset that includes the room Tiles, we can generate each tiles' neighbouring tiles for hallway creation
// 
function GenerateTileNeighbours()
{
    // loop through each tile on the map
    var currentX = 0;
    var currentY = 0;

    // since the highest x values can really only be gridheight/width -1, make these the highest tiles we check
    var maxX = (gridHeight - 1);
    var maxY = (gridHeight - 1);

    for(currentX = 0; currentX < gridWidth; currentX++)
    {
        for (currentY = 0; currentY < gridHeight; currentY++)
        {

            var CurrentTile = Tiles[currentX][currentY];
            // first, if this is a wall tile, we don't care, as we can't generate paths through here, so don't add it to the nodes
            if (!(CurrentTile.TileType == TilesNames.Wall))
            {
                // check each of the tiles neighbours, if it's a valid tile
                if (CurrentTile.x != 0)
                {
                    // check the tile to the left of it
                    if (IsValidTile(CurrentTile.x - 1, CurrentTile.y))
                    {
                          // add it to the tiles neighbours
                          CurrentTile.Neighbours.push(Tiles[CurrentTile.x - 1][CurrentTile.y]);
                    }
                }
            
                if (CurrentTile.x != maxX)
                {
                    // check the tile to the right of it
                    if (IsValidTile(CurrentTile.x + 1, CurrentTile.y))
                    {
                         // add it to the tiles neighbours
                         CurrentTile.Neighbours.push(Tiles[CurrentTile.x + 1][ CurrentTile.y]);
                    }
                }

                if (CurrentTile.y != 0)
                 {
                    // check the tile to the top of it
                    if (IsValidTile(CurrentTile.x, CurrentTile.y - 1))
                   {
                        // add it to the tiles neighbours
                        CurrentTile.Neighbours.push(Tiles[CurrentTile.x][CurrentTile.y - 1]);
                    }
                }

                if (CurrentTile.y != maxY)
                {
                    // check the tile below it
                    if (IsValidTile(CurrentTile.x, CurrentTile.y + 1))
                    {
                        // add it to the tiles neighbours
                        CurrentTile.Neighbours.push(Tiles[CurrentTile.x][CurrentTile.y + 1]);
                    }
                }

            }
        }

    }
      
}

// a simple helper function, to check if the tile is a 'valid' tile for Hallway Creation (either passable or void)
function IsValidTile(x,y)
{
    var TileToCheck = Tiles[x][y];
    var finalResult = false;

    if (TileToCheck.passable == true || TileToCheck.TileType == TilesNames.Void)
    {
        finalResult = true;
    }

    return finalResult;
}

// Goes through the Tiles and resets all their paths to an empty array
function ResetPaths()
{

    // loop through every tile, and sets it's path to be blank
    var currentX = 0;
    var currentY = 0;

    for(currentX = 0; currentX < gridWidth; currentX++)
    {
        for (currentY = 0; currentY < gridHeight; currentY++)
        {
            Tiles[currentX][currentY].Path = [];
        }

    }
}

// this is the main function that will find a route from one tile to another tile
// takes in the beginning node and goal node
function Findpath(xStart, yStart, xGoal, yGoal)
{

    

    // reset the paths of the tiles from the previous pathfinding tile
    ResetPaths();

    var attempts = 0;

    var StartingTile = Tiles[xStart][yStart];

    if (StartingTile == null)
    {
        console.log("uh oh");
    }

    // this array keeps track of all tiles that we need to check (aka the neighboring tiles of already explored tiles)
    var TileQueue = [];

    TileQueue.push(StartingTile);

    // this array keeps track of all the tiles we've already checked
    //let alreadyVisitedTiles = [StartingTile];
    var alreadyVisitedTiles = [];

    // we are returning the final path of the tiles, from beginning to end
    var FinalPath = [];

    let EndTileFound = false;

    // loop through every tile in the tile queue
    while(TileQueue.length > 0 && EndTileFound == false)
    {
        attempts++;
        var CurrentTile = TileQueue.pop();
        alreadyVisitedTiles.push(CurrentTile);
        // is this the end tile?
        if (CurrentTile.x == xGoal && CurrentTile.y == yGoal)
        {


            // return the path to get to this tile
            FinalPath = CurrentTile.Path;

            // add the finalTile to the path
            FinalPath.push(CurrentTile);

            EndTileFound = true;

            // we don't need to check the rest of the TileQueue
            break;
        }

        if (attempts == 1)
        {
            console.log("test");
        }

        // add each of the neighboring tiles to the TileQueue, if we haven't visited them before
        CurrentTile.Neighbours.forEach(function (item, index){

         
            // get the path that the pathfinding algorithm took up to this point
            let CurrentPath = CurrentTile.Path;

            if((TileQueue.indexOf(item) == -1 ) &&
            alreadyVisitedTiles.indexOf(item) == -1)
            {
                // Javascript copies by reference by default, so we need to create a new object and assign it to the temporary variable...
                let TemporaryPath = [];        
                Object.assign(TemporaryPath, CurrentPath);  
                TemporaryPath.push(CurrentTile);
                

                // add the tile we are visiting the neighboring tile from (the current tile)
                item.Path = TemporaryPath;

                // add the neighboring tile to the TileQueue
                TileQueue.unshift(item);
            }

        });
    }

    if (FinalPath.length == 0)
    {
        console.log(FinalPath.length + Tiles[xStart][yStart].TileType + " " + Tiles[xGoal][yGoal].TileType + "  Attempts = " + attempts);
        console.log(xStart + "," + yStart + "|");
        console.log(xGoal + "," + yGoal);

        console.log(alreadyVisitedTiles);
    }
 
    // return the finalPath
    return FinalPath;
}

window.onload = function() {

     // grab the html canvas element
     canvas = document.querySelector('canvas');

    //set the canvas to the entire window width and height
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // get the canvas context
    c = canvas.getContext('2d');



    // create the Dungeon Grid
    CreateGrid();

   // generate the layout!
    CreateDungeon();
}
    

// this function creates a random room. It does NOT place it in the 'passed' rooms grid objects!
// it will only return rooms with "acceptable" dimensions: Their width and height are in between the min and max width and height,
// and they have at least one tile between the walls of the room and the edge of the map
function CreateRandomRoom()
{

    var FinalXWidth;
    var FinalyHeight;

    var finalX;
    var finalY;

    var dimensionsSet = false;

    var FinalRoom;

    // we want to continue generating dimensions until we find an acceptable one
    while (!dimensionsSet)
    {

        // get the random location
        var x = Math.floor(Math.random()*(gridWidth - maxRoomSpace) + 1);

        var y = Math.floor(Math.random()*(gridHeight - maxRoomSpace) + 1);


        // we need to find out how far the room is away from the edge of the map, in both x and y directions,
        // as there has to be at least 1 tile between the walls of the room and the edge of the map

        var maxXValue = gridWidth - x - 1;
        var maxYValue = gridHeight - y - 1;

        // check if there is enough room in the x and y directions to spawn a room.
        // we also want to make sure 
        if ( maxXValue >= minRoomSpace &&  maxYValue >= minRoomSpace)
        {
            // there is enough space here to make a 'legal' room
            // make sure we don't go above the maximum height/width of a room
            if (maxXValue > maxRoomSpace)
            {
                maxXValue = maxRoomSpace;
            }

            if (maxYValue > maxRoomSpace)
            {
                maxYValue = maxRoomSpace;
            }


             // determine width and height
            var width = Math.floor(Math.random()*(maxXValue - minRoomSpace + 1) + minRoomSpace);
            var height = Math.floor(Math.random()*(maxYValue - minRoomSpace + 1) + minRoomSpace);

            // create the room an break out of the loop
            FinalRoom = new Room(x,y,width,height);

            dimensionsSet = true;

        }


       

    }
    // return it!
    return FinalRoom;
    
}




function CheckIfRoomOverlaps(roomToCheck)
{
    var finalResult = false;

    // if we cycle through each room successfully, then we know the room doesn't overlap
    for (var i = 0; i < RoomList.length; i++) { 

        // get the currrent room from the master list
        var currentRoom = RoomList[i];

        // start the bounding box check
        // as soon as one of the side checks fail, we know the room's don't intersect
        if ( !((roomToCheck.x + roomToCheck.width) >= currentRoom.x)) 
        {
            continue;
        }
        if ( !((roomToCheck.x) <= (currentRoom.x + currentRoom.width))) 
        {
            continue;
        }
        if ( !((roomToCheck.y + roomToCheck.height) >= currentRoom.y)) 
        {
            continue;
        }
        if ( !((roomToCheck.y) <= (currentRoom.y + currentRoom.height))) 
        {
            continue;
        }

        // we've made it this far, the boxes are colliding!    
        finalResult = true;

      



        
        break;
    }

    return finalResult;

}

// takes a room, and adds it to the grid
function RoomToGrid(room)
{
    // the current x and y values of the dungeon grid we are currently filling in
    var currentx = 0;
    var currenty = 0;

    // for each square of the room, convert it into a tile on the grid
    for (var w = 0; w < room.width; w++)
    {
        for (var h = 0; h < room.height; h++)
        {
            currentx = room.x + w;
            currenty = room.y + h;
            // if we are hitting the border of the room, then insetad of a room tile, put in a 'wall' tile
            if (currentx == room.x || 
                currentx == (room.x + room.width - 1) ||
                currenty == room.y ||
                currenty == (room.y + room.height - 1))
            {
                // fill the current grid square with a "wall" tile
                Tiles[room.x + w][room.y + h] = new WallTile(room.x + w, room.y + h);
            }
            else 
            {
               // this is inside the room, give it a regular room tile
                Tiles[room.x + w][room.y + h] = new RoomTile(room.x + w, room.y + h);
            }
        }
    }
}

// the main dungeon generation function
// takes care of creating randomly generated rooms, and placing the hallways between them
function CreateDungeon() {

    
    
    var numAttempts = 100; // the number of attempts that can happen. Each attempt is a potential room
    var totalAttempts = 0;

    // in order to generate paths in between the rooms, keep the previously created room on hand 
    var previousRoom = null;

    for (attempts = 0; attempts < numAttempts; attempts++) { 
        
        // first, create a random room at a random location
        var CurrentRoom = CreateRandomRoom();

        // now, check if our room overlaps with any other rooms previously created;
        var DoesOverlap = CheckIfRoomOverlaps(CurrentRoom);

        if (!DoesOverlap)
        {
            // the room is safe to add the the dungeon, add it to the RoomList
            RoomList.push(CurrentRoom);

            // add it to the grid
            RoomToGrid(CurrentRoom);
        }

       

        totalAttempts += 1;
    }

    // ALL the rooms had to be created first, before we created the hallways
    // otherwise, the rooms might spawn over hallways, essentially cutting them off
    // now that the rooms are created, go over each room and connect it to a previous one.
    // this will generally lead to somewhat (appearing) random and winding hallways. It's a simple method, may replace it with a better one later



    // first, generate the tiles neighbours
    GenerateTileNeighbours();

    // we create the hallways now
    RoomList.forEach(function(currentRoom) {
        // connect a passageway from this room to the previous room
        if (previousRoom != null)
        {
          CreateHallwayFromNodes(RandomRoomSpot(currentRoom),RandomRoomSpot(previousRoom));
        }

        previousRoom = currentRoom;
      });

    DrawGrid();

    c.stroke();
}

// draws the entire dungeon grid onto the screen
function DrawGrid()
{
    // draw the tiles
    for (var i = 0; i < gridWidth; i++)
    {
        for (var x = 0; x < gridHeight; x++)
        {
            
            var currentTile = Tiles[i][x];
            c.fillStyle = currentTile.TileColour;
            c.fillRect(currentTile.x * squareWidth, currentTile.y * squareHeight, squareWidth, squareHeight);
        }
     }
}

// this function takes in a room, and gets a random x and y coordinate that's on the walls of the room
// it can be on any wall, as long as it's not in the corner of the room
function RandomRoomSpot(room)
{

    var FinalX = 0;
    var FinalY = 0;

    var DoorX = 0;
    var DoorY = 0;

    var AlongXAxis = Math.round(Math.random());
    var AlongYAxis = Math.round(Math.random());

    // this one to see whther the location is in the "first" wall (left on the x axis) or "second" wall (top on the y axis)
    var WallPlacement = Math.round(Math.random()); 
    // first off, see if we are going to create the door along the top/bottom or left/right wall of the room
    if (AlongXAxis)
    {
        // get a random x value along the rooms width 
        FinalX = Math.floor(Math.random()*((room.x + room.width - 1) - (room.x + 1)) + (room.x + 1));

        // see if it's on the first or second wall
       
        if (WallPlacement)
        {
            DoorY = room.y;
            FinalY = room.y -1;
            
        }
        else
        {
            DoorY = room.y + room.height - 1;
            FinalY = room.y + room.height;
        }

        // also, while we are here, might as well place the door tile
        Tiles[FinalX][DoorY] = new DoorTile(FinalX,DoorY);
        
    }
    else
    {
        // get a random y value along the rooms height
        FinalY = Math.floor(Math.random()*((room.y + room.height - 1) - (room.y + 1)) + (room.y + 1));

        // see if it's on the first or second wall
       
        if (WallPlacement)
        {
            DoorX = room.x;
            FinalX = room.x -1;
            
        }
        else
        {
            DoorX = room.x + room.width - 1;
            FinalX = room.x + room.width;
        }

         // also, while we are here, might as well place the door tile
        Tiles[DoorX][FinalY] = new DoorTile(DoorX,FinalY);

    }

    /*
    // get a random x and y value from the room
    // we offset the maximum x and y values by +1, so the node is located inside the actual room, not in a wall
    var x = Math.floor(Math.random()*((room.x + room.width - 1) - (room.x + 1)) + (room.x + 1));
    var y = Math.floor(Math.random()*((room.y + room.height - 1) - (room.y + 1)) + (room.y + 1));
*/
    // create the node that we will return
    var NewNode = new Node(FinalX,FinalY);
    

    return NewNode;
}


// this function takes two nodes, and creates a hallway between them in the tileset
// the hallway is created using a pathfinder algorithm that finds the shortest distacne between 2 tiles on the grid
function CreateHallwayFromNodes(node1, node2)
{

    // first off, we have to find the path from one node to the other
    var HallwayPath = Findpath(node1.x, node1.y, node2.x, node2.y);

    // generate a hallwaytile on each tile in the path that was returned
    HallwayPath.forEach(function(item,index){

        // we are replacing the tile with a new hallway tile
        // however, for the next hallway to be generated properly, we need to keep this tiles neighbours!
        var CurrentNeighbors = Tiles[item.x][item.y].Neighbours;

        Tiles[item.x][item.y] = new HallwayTile(item.x,item.y);
        Tiles[item.x][item.y].Neighbours = CurrentNeighbors;

    });


    


    /*
    var CurrentTileX = 0;
    var CurrentTileY = 0;

    var YFix = 0;
    var XFix = 0;

    // make a hallway to the same y from the first node to the second
    var Y_Offset = node2.y - node1.y;
    var YDirection = 0;
    var Ylength = Math.abs(Y_Offset);
    if (Y_Offset > 0)
    {
        YDirection = 1;
    }
    else if (Y_Offset < 0)
    {
        YDirection = -1;
    }

    for(var lengthY = 0; lengthY < Ylength; lengthY++)
    {
         // create the hallway tile from the first room node to the y-axis of the second room node
        CurrentTileX = node1.x;
        CurrentTileY = node1.y + (YDirection * lengthY);

        CreateHallwayTile(CurrentTileX, CurrentTileY, 'y', YDirection);
        DrawGrid();
    }

    // repeat the process for the x-axis (to-do, refunction this into it's own function)
    var X_Offset = node2.x - node1.x;
    var XDirection = 0;
    var Xlength = Math.abs(X_Offset);
    if (X_Offset > 0)
    {
        XDirection = 1;
    }
    else if (X_Offset < 0)
    {
        XDirection = -1;
    }

    for(var lengthX = 0; lengthX < Xlength; lengthX++)
    {

        CurrentTileX = node1.x + (XDirection * lengthX);
        CurrentTileY = node1.y + Y_Offset;

       CreateHallwayTile(CurrentTileX, CurrentTileY, 'x', XDirection);
    }
    */
}

// checks that we are attempting to overwrite a void tile (or wall tile) and creates the appropriate Hallway (or door) tile
function CreateHallwayTile(x,y, axis, direction)
{
    if (CheckForTileType(x, y) == "Wall")
    {

        // check if this is an okay placement for a door.
        // is is an okay placement if there's a room tile in the next tile over (hallway in void digging into room)
        // OR if the next tile is void, and the previous tile is a room (Hallway in room digging into void)
        if (axis == 'x')
        {
            if (CheckForTileType(x + direction, y) != "Wall" && CheckForTileType(x + direction, y) != "Door"
            && CheckForTileType(x - direction, y) != "Wall" && CheckForTileType(x - direction, y) != "Door")
            {
                // create a door tile here, this is an okay placement
                Tiles[x][y] = new DoorTile(x, y);
            }
 
        }
        else if(axis == 'y')
        {
            if (CheckForTileType(x, y + direction) != "Wall" && CheckForTileType(x, y + direction) != "Door"
            && CheckForTileType(x, y - direction) != "Wall" && CheckForTileType(x, y - direction) != "Door")
            {
                // create a door tile here, this is an okay placement
                Tiles[x][y] = new DoorTile(x, y);
            }
        }        
    }
    else if (CheckForTileType(x, y) == "Void")
    {
        // create the hallway tile from the first room node to the y-axis of the second room node
        Tiles[x][y] = new HallwayTile(x, y);
    }
}

// checks if the x and y location is a wall
function CheckForTileType(x, y){
    return Tiles[x][y].TileType;
}

