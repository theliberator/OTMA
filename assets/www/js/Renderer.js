/**
 * This module cares about all relevant stuff to display the game in the three canvas layers.
 * Also it handles resize-events of the canvas and it assigns mouse and touch-events (swipe) 
 * needed for user interaction.
 *  
 * How to use:
 * - create Renderer object
 * - call Renderer.draw() repeatedly in timer of about 33 ms
 * 
 * @author Ulrich Hornung
 * @version 1.0
 * @since 09.06.2012
 */

/* init canvas functions */

function setSize(ctx)
{
	var max_w = 8000;
	var max_h = 6000;
	
	var w = window.innerWidth;
	if (w > max_w) w = max_w;
	ctx.width = w;
	var h = window.innerHeight - /*taskbar*/ 44*2;
	if (h > max_h) h = max_h;
	ctx.height = h;
	
	return {width: w, height: h};
}

function setSizeDiv(ctx)
{
	var max_w = 8000;
	var max_h = 6000;
	
	var w = window.innerWidth;
	if (w > max_w) w = max_w;
	var h = window.innerHeight - /*taskbar*/ 44*2;
	if (h > max_h) h = max_h;
	ctx.setAttribute("style", 'width: ' + w + 'px; height: ' + h + 'px;');
}

function initMouseEventsOnCanvas(canvas)
{
	var tool = {};
	tool.pressed = false;
    tool.done = false;
	
	var isnot_gamediv = function(pos_obj)
	{
		var requested_page = $('.ui-page-active').attr('id');
		if (requested_page != "gamediv") {
		      return true;
		}
		return false;
	}
	
	var update_offset = function()
	{
		tool.offsetLeft = $("#foreground").parent().offset().left;
		tool.offsetTop = $("#foreground").parent().offset().top;
	};
	
	var touchmove = function(e, pos_obj)
	{
		if (tool.pressed == false) return;
		con.debug("touchmove");
        // disable the standard ability to select the touched object
		e.preventDefault();
		
        var x = pos_obj.pageX - tool.offsetLeft;
        var y = pos_obj.pageY - tool.offsetTop;
        var dx = (tool.sx - x);
        var dy = (tool.sy - y);
        var nx = gui.look_offset_x - dx;
        var ny = gui.look_offset_y - dy;
        gui.setLookOffset(nx,ny);
        gui.calcPosFromPlayerPos(map.player.x, map.player.y);
        tool.sx = x;
        tool.sy = y;
        
        gui.draw(); // is needed on android!
        con.debug("touchmove_end: " + dx + "," + dy);
	};
	
	var touchstart = function(e, pos_obj)
	{
		if (isnot_gamediv(pos_obj)) return;
		tool.pressed = true;
        // disable the standard ability to select the touched object
		//e.preventDefault();
		update_offset();
        tool.sx = pos_obj.pageX - tool.offsetLeft;
        tool.sy = pos_obj.pageY - tool.offsetTop;
	};
	
	var touchend = function(e, pos_obj)
	{
		if (tool.pressed == false) return;
        // disable the standard ability to select the touched object
		//e.preventDefault();
		tool.pressed = false;
	};
	
	// bind mouse events
    canvas.onmousemove = function(e) {
        if (!tool.pressed) {
           return;
        }
        var x = e.pageX - tool.offsetLeft;
        var y = e.pageY - tool.offsetTop;
        
        var dx = (tool.sx - x);
        var dy = (tool.sy - y);
        var dd = Math.sqrt(dx*dx + dy*dy);
        var nx = gui.look_offset_x - dx;
        var ny = gui.look_offset_y - dy;
        
        if (tool.moved || (dd > 8))
        {
	        tool.moved = true;
	        touchmove(e,e);
        }
    };
    canvas.onmousedown = function(e) {
        tool.pressed = true;
        tool.moved = false;
        update_offset();
        touchstart(e,e);
//        tool.done = false;
    };
    canvas.onmouseup = function(e) {
        tool.pressed = false;
        if (tool.moved == false && tool.done == false)
        {
            var x = e.pageX - tool.offsetLeft;
    		var y = e.pageY - tool.offsetTop;
    		game.clickEvent(gui.translateClickPos(x,y));
        }
        tool.done = true;
        setTimeout(function() { tool.done = false; }, 500);
    	touchend(e,e);
    };
    
    canvas.addEventListener('touchstart', function(e) { touchstart(e, e.touches[0]); }, false);
    canvas.addEventListener('touchmove', function(e) { touchmove(e, e.touches[0]); }, false);
    canvas.addEventListener('touchend', function(e) { touchend(e, e.touches[0]); }, false);
}

function Renderer(map,dialogMgr,ctx_bg,ctx_obj,ctx_fg,width,height)
{
	this.map = map;
	this.dialogMgr = dialogMgr;
	this.bgdx = 0;
	this.bgdy = 0;
	this.ctx_bg = ctx_bg;
	this.ctx_obj = ctx_obj;
	this.ctx_fg = ctx_fg;
	this.ctx_height = height;
	this.ctx_width = width;
	
	this.last_bgdx = 0;
	this.last_bgdy = 0;
	this.last_px = 0;
	this.last_py = 0;
	this.last_p_icon = -1;
	this.last_tx = 0;
	this.last_ty = 0;
	
	this.look_offset_x = 0;
	this.look_offset_y = 0;
}

Renderer.prototype.updateCanvasSize = function()
{
	var s = resizeCanvases();
	this.ctx_width = s.width;
	this.ctx_height = s.height;
	this.setLookOffset(0, 0);
	this.calcPosFromPlayerPos(this.map.player.x, this.map.player.y);
};

Renderer.prototype.setLookOffset = function(x,y)
{
	if (x > (this.ctx_width / 2))
		x = (this.ctx_width / 2);
	if (y > (this.ctx_height / 2))
		y = (this.ctx_height / 2);
	if (-x > (this.ctx_width / 2))
		x = -(this.ctx_width / 2);
	if (-y > (this.ctx_height / 2))
		y = -(this.ctx_height / 2);
	
	this.look_offset_x = x;
	this.look_offset_y = y;
};

Renderer.prototype.calcPosFromPlayerPos = function(x,y)
{
	x = x*this.map.cellsize | 0;
	y = y*this.map.cellsize | 0;
	var height = (this.map.rows)*this.map.cellsize;
	var width = (this.map.cols)*this.map.cellsize;
	
	hx = (this.ctx_width / 2) | 0;
	hy = (this.ctx_height / 2) | 0;
	var tx = -x -16 + hx + this.look_offset_x;
	var ty = -y -16 + hy + this.look_offset_y;
	if (tx > 0)
		tx = 0;
	if (ty > 0)
		ty = 0;
	if (tx < -width + this.ctx_width)
		tx = -width + this.ctx_width;
	if (ty < -height + this.ctx_height)
		ty = -height + this.ctx_height;
	this.bgdx = tx | 0;
	this.bgdy = ty | 0;
	this.look_offset_x = -(-x -16 + hx) + tx;
	this.look_offset_y = -(-y -16 + hy) + ty;
};

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

Renderer.prototype.getTextWidth = function(ctx, text, font)
{
	ctx.save();
    ctx.font = font || "15px sans-serif";
    var width = ctx.measureText(text).width;
	ctx.restore();
	return width;
};

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

Renderer.prototype.draw = function(forced)
{
	//this.calcPosFromPlayerPos(this.map.player.x, this.map.player.y);
	
	var ctx_bg = this.ctx_bg;
	var ctx_obj = this.ctx_obj;
	var ctx_fg = this.ctx_fg;
	
	var x = this.bgdx;
	var y = this.bgdy;
	var width = this.ctx_width;
	var height = this.ctx_height;
	
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
		
		var dx = (this.last_bgdx - this.bgdx);
		var dy = (this.last_bgdy - this.bgdy);
		con.log('dx: ' + dx + ', dy: ' + dy);
		con.debug(this.last_bgdx + '_' + this.last_bgdy);
    	con.debug(this.bgdx + '_' + this.bgdy);
		var bg_pos_changed = (forced == true) || ( !( (dx < 0.2) && (dx > -0.2) && (dy < 0.2) && (dy > -0.2)) );
		
		if (bg_pos_changed)
		{
			this.drawLayer_V2(ctx_bg,x,y,width,height,this.map.layer_background);
			this.drawLayer_V2(ctx_bg,x,y,width,height,this.map.layer_ground);
			for (var nr in this.map.levels[this.map.player.z].npcs)
			{
				var npc = this.map.levels[this.map.player.z].npcs[nr];
				this.drawCharacter(ctx_bg,x,y,npc);
			}
			ctx_fg.clearRect(0, 0, width, height);
			this.drawLayer_V2(ctx_fg,x,y,width,height,this.map.layer_foreground);
			
			//var coords = document.getElementById("coords");
			//coords.innerHTML = "x: " + this.map.player.x + ", y: " + this.map.player.y;
		}
		
		var target_pos_changed = (this.last_tx != this.map.target.x)||(this.last_ty != this.map.target.y);
		if (target_pos_changed || bg_pos_changed)
		{
			var ts = this.map.tilesets["target"];
			
			if (! bg_pos_changed)
			{
				ts.clear(ctx_fg,
						this.last_tx*this.map.cellsize+this.last_bgdx,
						this.last_ty*this.map.cellsize+this.last_bgdy);
			}
			this.drawLayer_tile(ctx_fg, this.last_tx, this.last_ty, this.map.layer_foreground);
			//this.drawLayer_tile(ctx_fg, this.last_tx, this.last_ty, this.map.layer_ground);
			ts.draw(ctx_fg, ts.firstgid + this.map.target.icon,
					this.map.target.x*this.map.cellsize+this.bgdx,
					this.map.target.y*this.map.cellsize+this.bgdy);
		}
		
		var kd = 0.01;
		
		dx = (this.last_px - this.map.player.x);
		dy = (this.last_py - this.map.player.y);
		
		var player_pos_changed = (!( (dx < kd) && (dx > -kd) && (dy < kd) && (dy > -kd)))
								|| (this.last_p_icon != this.map.player.icon);
		if (player_pos_changed || bg_pos_changed || target_pos_changed)
		{
			// first clear old player:
			this.clearCharacter(ctx_obj,this.last_bgdx,this.last_bgdy,this.last_px,this.last_py,this.map.player);
			// draw new pos
			this.drawCharacter(ctx_obj,x,y,this.map.player);
		}
		
		if (bg_pos_changed)
		{
			this.last_bgdx = this.bgdx;
			this.last_bgdy = this.bgdy;
		}
		if (player_pos_changed)
		{
			this.last_px = this.map.player.x;
			this.last_py = this.map.player.y;
			this.last_p_icon = this.map.player.icon;
		}	
		if (target_pos_changed)
		{
			this.last_tx = this.map.target.x;
			this.last_ty = this.map.target.y;
		}	
	}	
};

Renderer.prototype.drawLayer = function(r_ctx,dx,dy,width,height,layer)
{
	if (layer.PreRenderedCanvas == undefined)
	{
		layer.PreRenderedCanvas = document.createElement('canvas');
		var canvas = layer.PreRenderedCanvas;
		canvas.width = this.map.cols * this.map.cellsize;
		canvas.height = this.map.rows * this.map.cellsize;
		var ctx = canvas.getContext("2d");
		
		ctx.save();
	    //ctx.textAlign = "center";
	    //ctx.strokeStyle = "black" || "#373737";
	    //ctx.lineWidth = 1;
	    //ctx.strokeText(id, x, y);
	    ctx.fillStyle = "white" || "white";
	    	
	    for (var y = 0; y < this.map.rows; y++)
	    {
	    	var row_start = y*this.map.cols;
			for (var x = 0; x < this.map.cols; x++)
			{
				var nr = row_start + x;
				var tile = layer.data[nr];
				if (tile != 0)
				{	
					var vx = x*this.map.cellsize;
					var vy = y*this.map.cellsize;
					this.map.tilesets["tilesheet"].draw(ctx, tile, vx | 0, vy | 0);
				}
			}
	    }
	    ctx.restore();
	    layer.preRendered = true;
	}
	
	r_ctx.drawImage(layer.PreRenderedCanvas,
            -dx, // source pos + size
            -dy,
            width,
            height,
            0,  // dest pos + size
            0,
            width,
            height);
};

Renderer.prototype.drawLayer_V2 = function(ctx,dx,dy,width,height,layer)
{
	con.debug(ctx);
    var sx = (-dx / this.map.cellsize) | 0;
    var sy = (-dy / this.map.cellsize) | 0;
    
    var x_count = 2+ sx + ((width / this.map.cellsize) | 0);
    var y_count = 2+ sy + ((height / this.map.cellsize) | 0);
    
    var ts = this.map.tilesets["tilesheet"];
    var cellsize = this.map.cellsize;
    	
    for (var y = sy; y < y_count; y++)
    {
    	var row_start = y*this.map.cols;
		var vy = y*cellsize + dy;
		for (var x = sx; x < x_count; x++)
		{
			var nr = row_start + x;
			var tile = layer.data[nr];
			if (tile != 0)
			{	
				var vx = x*cellsize + dx;
				ts.draw(ctx, tile, vx | 0, vy | 0);
			}
		}
    }
};

Renderer.prototype.drawLayer_tile = function(ctx,x,y,layer)
{
    var ts = this.map.tilesets["tilesheet"];
    var cellsize = this.map.cellsize;
    	
    var row_start = y*this.map.cols;
	var vy = y*cellsize + this.bgdy;
	var nr = row_start + x;
	var tile = layer.data[nr];
	if (tile != 0)
	{	
		var vx = x*cellsize + this.bgdx;
		ts.draw(ctx, tile, vx | 0, vy | 0);
	}
};

Renderer.prototype.drawCharacter = function(r_ctx, bg_x, bg_y, npc)
{
	if (npc.class == "none")
		return;

	var ts = this.map.tilesets[npc.class];
	
	px = ((npc.x*this.map.cellsize) + bg_x) | 0;
	py = ((npc.y*this.map.cellsize) + bg_y) | 0;
	//this.tilesets[0].draw(ctx,this.tilesets[0].firstgid,px,py);
	ts.draw(r_ctx,ts.firstgid+npc.icon+npc.npc_typ*ts.cols,px-16,py-24); // -16 , -24 fix coordinates since we have 64x64 character tiles!
	
	var h = this.map.cellsize / 2;
	
	if (npc.name != "")
	{
		if (npc.preRenderedName == undefined)
		{
			npc.preRenderedName = document.createElement('canvas');
			var canvas = npc.preRenderedName;
			canvas.width = 0 | (this.getTextWidth(r_ctx, npc.name) + 20);
			canvas.height = 26;
			var ctx = canvas.getContext("2d");
			this.drawText(ctx, npc.name, canvas.width / 2, 13, true);
		}
		
		var w = npc.preRenderedName.width;
		r_ctx.drawImage(npc.preRenderedName,0,0,w,26,px + h - ((w/2)|0), py - h - 13,w,26);
	}
};

Renderer.prototype.clearCharacter = function(r_ctx,bg_x,bg_y,npc_x,npc_y,npc)
{
	px = 0 | (npc_x*this.map.cellsize) + bg_x;
	py = 0 | (npc_y*this.map.cellsize) + bg_y;
	r_ctx.clearRect(px-16,py-24,64,64);
	
	var h = this.map.cellsize / 2;
	
	if (npc.preRenderedName != undefined)
	{
		var w = npc.preRenderedName.width;
		r_ctx.clearRect(px + h -((w/2)|0), py - h - 13,w,26);
	}
};

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
