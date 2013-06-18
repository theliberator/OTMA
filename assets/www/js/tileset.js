/**
 * class: Tileset
 * it loads the tileset image and provides functions to draw and clear the tiles on a html-canvas
 * 
 * How to use:
 * - create Tileset object
 * - call Map.draw() to draw an tile of the set
 * 
 * @author Ulrich Hornung
 * @version 1.0
 * @since 09.06.2012
 */


function Tileset(filename, tilewidth, tileheight, imgwidth, imgheight, properties, firstgid, onload)
{
	this.firstgid = firstgid | 0;
	this.filename = filename;
	this.tilewidth = tilewidth | 0;
	this.tileheight = tileheight | 0;
	this.imgwidth = imgwidth | 0;
	this.imgheight = imgheight | 0;
	this.properties = properties;
	
	this.cols = (imgwidth / tilewidth) | 0;
	this.rows = (imgheight / tileheight) | 0;
	
    var img = new Image();
	img.onload = onload;
    img.onerror = function() { con.error("ERROR: failed to load image: " + filename); };
	img.src = filename;
	this.img = img;
}

Tileset.prototype.draw = function(ctx, id, x, y)
{
	size_x = this.tilewidth;
	size_y = this.tileheight;

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

Tileset.prototype.clear = function(ctx, x, y)
{
	size_x = this.tilewidth;
	size_y = this.tileheight;

	ctx.clearRect(
            x,  // dest pos + size
            y,
            size_x,
            size_y);
};
