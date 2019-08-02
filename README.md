# DungeonGenerator
Generates Random 2D dungeon layouts, with rooms and hallways

This meant as a starting point for a 2d-Dungeon Roguelike.
By refreshing the page, you get a random 2d dungeon with
- black tiles = wall tiles
- grey tiles = room tiles
- brown tiles - hallway tiles
- yellow tiles = door tiles

In order to see the dungeon layout, click index.html, and refresh for a new layout

The map consists of a 2 dimensional array filled with tiles. 
To generate random rooms, it picks an x and y location, and then picks a random width and height, within the Map boundaries. 
If the room does not overlap any other rooms, it is successfully placed.
It will repeat this process 100 times. By trial and error, I found this generates about 10 valid rooms on average with the default grid sizes. 

Once all the rooms are generated, the hallways are created.

To generate a hallway between one room to another, two tiles are selectly randomly from just outside the two rooms we wish to connect. 
In order to find the shortest path between these two tiles, all tiles are mapped so they have knowledge of their neghboring tiles (with room tiles not being mapped, as they are surrounded by impassable walls).
We then find the path between two tiles using Dijkstra’s Algorithm, exiting the search loop once the goal tile has been reached from the starting tile. 
