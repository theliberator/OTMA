/**
 * This file handles player-walk animation.
 * 
 * - create AnimationMgr object
 * - create PlayerWalkAnimation object
 * - use AnimationMgr.add to add the animation
 * - call AnimationMgr.animate() in timer repeatedly
 * 
 * @author Ulrich Hornung
 * @version 1.0
 * @since 09.06.2012
 */

function AnimationMgr()
{
	this.animations = []; // array
}

AnimationMgr.prototype.add = function(animation)
{
	animation.last = 0;
	this.animations.push(animation);
};

AnimationMgr.prototype.animate = function(time)
{
	i = 0; 
	while (i < this.animations.length)
	{
		ani = this.animations[i];
		var end = false;
		if (ani.last == 0) ani.last = time - ani.delta;
		var delta = (time - ani.last);
		var count = (delta / ani.delta) | 0;
		
		for (var t = 1; (t <= count) && (!end); t++)
		{
			var ttime = ani.last + ani.delta;
			end = !ani.step(ttime);
			ani.last = ttime;
		}
		
		if (end)
		{
			if (ani.finished != undefined)
				ani.finished();
			
			// remove from list
			this.animations.splice(i, 1);
		}
		else
			i++;
	}
};

function AnimationPlayerMove(player, icons, dx, dy, cells, caller)
{
	if (cells == undefined)
		cells = 1;
	
	var stepsPerCell = 8;
	dx = (dx / stepsPerCell);
	dy = (dy / stepsPerCell);
	
	this.player = player;
	this.steps = stepsPerCell*cells;
	this.icons = icons;
	this.dx = dx;
	this.dy = dy;
	this.pos = 0;
	this.ready = false;
	this.iconstep = 2;
	this.delta = 30; // ms
	this.caller = caller;
}

AnimationPlayerMove.prototype.step = function()
{
	if (this.pos < this.steps)
		this.pos++;
	else
	{
		this.ready = true;
		if (this.caller != undefined)
			this.caller.playerReachedPosEvent(this);
		return false;
	}
	
	this.player.x = this.player.x + this.dx;
	this.player.y = this.player.y + this.dy;
	
	this.player.icon = this.icons[((this.pos/this.iconstep) | 0) % this.icons.length];
	return true;
};

function AnimationTargetHighlight(target, icons, steps, x, y)
{
	this.target = target;
	this.target.x = x;
	this.target.y = y;
	this.icons = icons;
	this.steps = steps;
	this.pos = 0;
	this.ready = false;
	this.delta = 60;
}

AnimationTargetHighlight.prototype.step = function()
{
	if (this.pos < this.steps)
		this.pos++;
	else
	{
		this.ready = true;
		this.target.x = -1;
		this.target.y = -1;
		return false;
	}
	
	this.target.icon = this.icons[this.pos % this.icons.length];
	return true;
};
