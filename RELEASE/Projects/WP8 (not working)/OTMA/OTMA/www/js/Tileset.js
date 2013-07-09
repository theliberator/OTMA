/**
 * class: Tileset
 * it loads the tileset image and provides functions to draw and clear the tiles on a html-canvas
 * 
 * How to use:
 * - create Tileset object
 * - call Map.draw() to draw an tile of the set
 * 
 * Original version 1.0 released on 09.06.2012 by Ulrich Hornung
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Ulrich Hornung, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */

  
/**
 * @classdesc  Loads the tileset image and provides functions to draw and clear the tiles on a html-canvas
 * 
 * How to use:
 * - create Tileset object
 * - call Map.draw() to draw an tile of the set
 */
 
 
 /**
 * Initialize an instance of Tileset.
 *
 * @constructor
 * @param {string} filename Name of the file containing the tileset images.
 * @param {int} tilewidth  Width of a tile.
 * @param {int} tileheight Height of a tile.
 * @param {int} imgwidth Width of the image.
 * @param {int} imgheight Height of the image.
 * @param {object} properties Properties for the tileset.
 * @param {number} firstgid Id of start tile. 
 * @param {function} onload Callback function, called after loading of tileset is finished.
 * @returns A new Tileset instance.
*/
function Tileset(filename, tilewidth, tileheight, imgwidth, imgheight, properties, firstgid, onload)
{
	this.filename = filename;
	this.tilewidth = tilewidth | 0;
	this.tileheight = tileheight | 0;
	this.imgwidth = imgwidth | 0;
	this.imgheight = imgheight | 0;
	this.properties = properties;
	this.firstgid = firstgid | 0;
	
	this.cols = (imgwidth / tilewidth) | 0;
	this.rows = (imgheight / tileheight) | 0;
	
    var img = new Image();
	img.onload = onload;
    img.onerror = function() { con.error("ERROR: failed to load image: " + filename); };
	img.src = filename;
	this.img = img;
}

/**
 * Draws a tile at specified position.
 *
 * @param {object} ctx Context.
 * @param {int} id Id of the tile.
 * @param {int} x X coordinate of the position of the tile.
 * @param {int} y Y coordinate of the position of the tile.
*/
Tileset.prototype.draw = function(ctx, id, x, y)
{
	var size_x = this.tilewidth;
	var size_y = this.tileheight;

	id = id - this.firstgid;

	var sx = ((id % this.cols) | 0)*size_x;
	var sy = ((id / this.cols) | 0)*size_y;
	
	{			
		ctx.drawImage(this.img,
                sx, // source pos + size
                sy,
                size_x,
                size_y,
                x,  // dest pos + size
                y,
                size_x,
                size_y);
	}
};

/**
 * Clear tile at specified position.
 *
 * @param {object} ctx Context.
 * @param {int} x X coordinate of the position of the tile.
 * @param {int} y Y coordinate of the position of the tile.
*/
Tileset.prototype.clear = function(ctx, x, y)
{
	var size_x = this.tilewidth;
	var size_y = this.tileheight;

	ctx.clearRect(
            x,  // dest pos + size
            y,
            size_x,
            size_y);
};
