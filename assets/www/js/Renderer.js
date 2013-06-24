/**
 * This module cares about all relevant stuff to display the game in the three canvas layers.
 * Also it handles resize-events of the canvas and it assigns mouse and touch-events (swipe) 
 * needed for user interaction.
 *  
 * How to use:
 * - create Renderer object
 * - call Renderer.draw() repeatedly in timer of about 33 ms
 * 
 * Original version 1.0 released on 09.06.2012 by Ulrich Hornung
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Ulrich Hornung, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */

/* init canvas functions */

//Use Singleton pattern
Renderer.getInstance = function()
{
	if (Renderer.instance == undefined) {
		Renderer.instance = new Renderer();
	}
		
	return Renderer.instance;
}

function Renderer()
{
	this.map = Map.getInstance();
	this.dialogMgr = DialogMgr.getInstance();
	this.ctx_height = $("#objects").height();
	this.ctx_width = $("#objects").width();
	
	var self = this;
	$(window).resize(function() {
		self.updateCanvasSize();
	});
	self.updateCanvasSize();
}

Renderer.prototype.bgdx = 0;
Renderer.prototype.bgdy = 0;
Renderer.prototype.last_bgdx = 0;
Renderer.prototype.last_bgdy = 0;
Renderer.prototype.last_px = 0;
Renderer.prototype.last_py = 0;
Renderer.prototype.last_p_icon = -1;
Renderer.prototype.last_tx = 0;
Renderer.prototype.last_ty = 0;
Renderer.prototype.look_offset_x = 0;
Renderer.prototype.look_offset_y = 0;

/**
 * updates the canvas size
 */
Renderer.prototype.updateCanvasSize = function()
{
	var s = app.resizeCanvas();
	this.ctx_width = s.width;
	this.ctx_height = s.height;
	this.setLookOffset(0, 0);
	this.calcPosFromPlayerPos(this.map.player.x, this.map.player.y);
};

/**
 * updates the look offset
 * @param int x,y coordinates
 */
Renderer.prototype.setLookOffset = function(x,y)
{
	var self = this;
	if (x > (self.ctx_width / 2)) {
		x = (self.ctx_width / 2);
	}
	if (y > (self.ctx_height / 2)) {
		y = (self.ctx_height / 2);
	}
	if (-x > (self.ctx_width / 2)) {
		x = -(self.ctx_width / 2);
	}
	if (-y > (self.ctx_height / 2)) {
		y = -(self.ctx_height / 2);
	}
	
	self.look_offset_x = x;
	self.look_offset_y = y;
};

/**
 * calculates current position
 */
Renderer.prototype.calcPosFromPlayerPos = function(x,y)
{
	var self = this;
	
	x = x * self.map.cellsize | 0;
	y = y * self.map.cellsize | 0;
	var height = self.map.rows * self.map.cellsize;
	var width = self.map.cols * self.map.cellsize;
	
	var hx = (self.ctx_width / 2) | 0;
	var hy = (self.ctx_height / 2) | 0;
	var tx = -x -16 + hx + self.look_offset_x;
	var ty = -y -16 + hy + self.look_offset_y;
	if (tx > 0) {
		tx = 0;
	}
	if (ty > 0) {
		ty = 0;
	}
	if (tx < -width + self.ctx_width) {
		tx = -width + self.ctx_width;
	}
	if (ty < -height + self.ctx_height) {
		ty = -height + self.ctx_height;
	}
	self.bgdx = tx | 0;
	self.bgdy = ty | 0;
	self.look_offset_x = -(-x -16 + hx) + tx;
	self.look_offset_y = -(-y -16 + hy) + ty;
};

/**
 * NO DOKU YET
 */
Renderer.prototype.translateClickPos = function(x,y)
{
	x = x - this.bgdx;
	y = y - this.bgdy;
	x = x / this.map.cellsize;
	y = y / this.map.cellsize;
	x = x | 0; // truncate
	y = y | 0; // truncate
	return { x:x, y:y };
};

/**
 * Returns the current text width
 * @param
 * @param
 * @param
 * @return the text wdith
 */
Renderer.prototype.getTextWidth = function(ctx, text, font)
{
	ctx.save();
    ctx.font = font || "15px sans-serif";
    var width = ctx.measureText(text).width;
	ctx.restore();
	return width;
};

/**
 * draws some text
 */
Renderer.prototype.drawText = function(ctx, text, x, y, centered, color, strokeColor, font) {
    
    var strokeSize;
    
    ctx.save();
    ctx.font = font || "15px sans-serif";

    strokeSize = 3;
    
    if(text && x && y)
    {
        if(centered) {
            ctx.textAlign = "center";
        }
        ctx.strokeStyle = strokeColor || "#373737";
        ctx.lineWidth = strokeSize;
        ctx.strokeText(text, x, y);
        ctx.fillStyle = color || "white";
        ctx.fillText(text, x, y);
    }
    ctx.restore();
};

Renderer.prototype.forcedDraw = function()
{
	this.draw(true);
};

/**
 * draws the screen
 * @param bool forced wether the draw should be forced or not
 */
Renderer.prototype.draw = function(forced)
{
	//this.calcPosFromPlayerPos(this.map.player.x, this.map.player.y);
	var self = this;
	
	var ctx_bg = $("#background")[0].getContext("2d");
	var ctx_obj = $("#objects")[0].getContext("2d");
	var ctx_fg = $("#foreground")[0].getContext("2d");
	
	if (this.dialogMgr.hasActiveDialog())
	{
		//TODO: temporary fixed by commenting out (ctx undefined)
		//this.drawDialog(ctx,this.dialogMgr.dialog);
		
		//var dialog_div = document.getElementById("dialog");
		//dialog_div.setAttribute("class", "visible");
	}
	else
	{
		//var dialog_div = document.getElementById("dialog");
		//dialog_div.setAttribute("class", "invisible");
		
		var dx = (self.last_bgdx - self.bgdx);
		var dy = (self.last_bgdy - self.bgdy);
//		con.log('dx: ' + dx + ', dy: ' + dy);
//		con.debug(self.last_bgdx + '_' + self.last_bgdy);
//    	con.debug(self.bgdx + '_' + self.bgdy);
		var bg_pos_changed = (forced == true) || ( !( (dx < 0.2) && (dx > -0.2) && (dy < 0.2) && (dy > -0.2)) );
		
		if (bg_pos_changed) {
			self.drawLayer_V2(ctx_bg, self.map.layer_background);
			self.drawLayer_V2(ctx_bg, self.map.layer_ground);
			for (var nr in self.map.story.levels[self.map.player.z].npcs)
			{
				self.drawCharacter(ctx_bg,self.map.story.levels[self.map.player.z].npcs[nr]);
			}
			ctx_fg.clearRect(0, 0, self.ctx_width, self.ctx_height);
			self.drawLayer_V2(ctx_fg,this.map.layer_foreground);
			
			//var coords = document.getElementById("coords");
			//coords.innerHTML = "x: " + this.map.player.x + ", y: " + this.map.player.y;
		}
		
		var target_pos_changed = (self.last_tx != self.map.target.x)||(self.last_ty != self.map.target.y);
		if (target_pos_changed || bg_pos_changed)
		{
			var ts = self.map.tilesets["target"];
			
			if (! bg_pos_changed)
			{
				ts.clear(ctx_fg,
						self.last_tx * self.map.cellsize + self.last_bgdx,
						self.last_ty * self.map.cellsize + self.last_bgdy);
			}
			self.drawLayer_tile(ctx_fg, self.map.layer_foreground);
			ts.draw(ctx_fg, ts.firstgid + this.map.target.icon,
				self.map.target.x * self.map.cellsize + self.bgdx,
				self.map.target.y * self.map.cellsize + self.bgdy
			);
		}
		
		var kd = 0.01; //dafuq?
		
		dx = (self.last_px - self.map.player.x);
		dy = (self.last_py - self.map.player.y);
		
		var player_pos_changed = (!( (dx < kd) && (dx > -kd) && (dy < kd) && (dy > -kd)))
								|| (self.last_p_icon != self.map.player.icon);
		if (player_pos_changed || bg_pos_changed || target_pos_changed)
		{
			// first clear old player:
			self.clearCharacter(ctx_obj,self.last_bgdx,self.last_bgdy,self.last_px,self.last_py,self.map.player);
			// draw new pos
			self.drawCharacter(ctx_obj,self.map.player);
		}
		
		if (bg_pos_changed)
		{
			self.last_bgdx = self.bgdx;
			self.last_bgdy = self.bgdy;
		}
		if (player_pos_changed)
		{
			self.last_px = self.map.player.x;
			self.last_py = self.map.player.y;
			self.last_p_icon = self.map.player.icon;
		}	
		if (target_pos_changed)
		{
			self.last_tx = self.map.target.x;
			self.last_ty = self.map.target.y;
		}	
	}	
};

/**
 * draws the layers
 */
Renderer.prototype.drawLayer_V2 = function(ctx,layer)
{
	var self = this;
	con.debug(ctx);
    var sx = (-self.bgdx / self.map.cellsize) | 0;
    var sy = (-self.bgdy / self.map.cellsize) | 0;
    
    var x_count = 2+ sx + ((self.ctx_width / self.map.cellsize) | 0);
    var y_count = 2+ sy + ((self.ctx_height / self.map.cellsize) | 0);
    
    var ts = self.map.tilesets["tilesheet"];
    var cellsize = self.map.cellsize;
    	
    for (var y = sy; y < y_count; y++)
    {
    	var row_start = y*self.map.cols;
		var vy = y*cellsize + self.bgdy;
		for (var x = sx; x < x_count; x++)
		{
			var nr = row_start + x;
			var tile = layer.data[nr];
			if (tile != 0)
			{	
				var vx = x*cellsize + self.bgdx;
				ts.draw(ctx, tile, vx | 0, vy | 0);
			}
		}
    }
};

/**
 * 
 */
Renderer.prototype.drawLayer_tile = function(ctx, layer)
{
	var self = this;
    var ts = self.map.tilesets["tilesheet"];
    var cellsize = self.map.cellsize;
    	
    var row_start = self.last_ty * self.map.cols;
	var vy = self.last_ty * cellsize + self.bgdy;
	var nr = row_start + self.last_tx;
	var tile = layer.data[nr];
	if (tile != 0)
	{	
		var vx = self.last_tx * cellsize + self.bgdx;
		ts.draw(ctx, tile, vx | 0, vy | 0);
	}
};

/**
 * Renders a charachter
 */
Renderer.prototype.drawCharacter = function(r_ctx, npc)
{
	var self = this;
	if (npc.class == "none") {
		return;
	}

	var ts = self.map.tilesets[npc.class];
	
	var px = ((npc.x * self.map.cellsize) + self.bgdx) | 0;
	var py = ((npc.y * self.map.cellsize) + self.bgdy) | 0;
	ts.draw(r_ctx,ts.firstgid+npc.icon+npc.npc_typ*ts.cols,px-16,py-24); // -16 , -24 fix coordinates since we have 64x64 character tiles!
	
	var h = this.map.cellsize / 2;
	
	if (npc.name != "")
	{
		if (npc.preRenderedName == undefined)
		{
			npc.preRenderedName = document.createElement('canvas');
			var canvas = npc.preRenderedName;
			canvas.width = 0 | (self.getTextWidth(r_ctx, npc.name) + 20);
			canvas.height = 26;
			var ctx = canvas.getContext("2d");
			self.drawText(ctx, npc.name, canvas.width / 2, 13, true);
		}
		
		var w = npc.preRenderedName.width;
		r_ctx.drawImage(npc.preRenderedName,0,0,w,26,px + h - ((w/2)|0), py - h - 13,w,26);
	}
};

/**
 * Removes a character from the screen
 */
Renderer.prototype.clearCharacter = function(r_ctx,bg_x,bg_y,npc_x,npc_y,npc)
{
	var px = 0 | (npc_x*this.map.cellsize) + bg_x;
	var py = 0 | (npc_y*this.map.cellsize) + bg_y;
	r_ctx.clearRect(px-16,py-24,64,64);
	
	var h = this.map.cellsize / 2;
	
	if (npc.preRenderedName != undefined)
	{
		var w = npc.preRenderedName.width;
		r_ctx.clearRect(px + h -((w/2)|0), py - h - 13,w,26);
	}
};

/**
 * draw a dialog
 * not in use atm
 */
Renderer.prototype.drawDialog = function(ctx, dialog)
{
	var border = 100;
	var width = this.ctx_width - border;
	var height = this.ctx_height - border;
	
	ctx.fillStyle = 'white';
	ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';
	ctx.rect(border/2,border/2,width,height);

	var text = dialog.text.split(" ");
	var i = 0;
	var y = border;
	while (i < text.length)
	{
		var line = text[i];
		i++;
		
		while (line.length < 20 && i < text.length)
		{
			line = line + " " + text[i];
			i++;
		}
		this.drawText(ctx, line, border, y, false, 'black', 'white', "15pt sans-serif");
		y = y + 40;
	}
};
