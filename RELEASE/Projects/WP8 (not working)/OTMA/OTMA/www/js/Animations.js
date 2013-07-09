/**
 * Original version 1.0 released on 09.06.2012 by Ulrich Hornung
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Ulrich Hornung, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
 
 /**
 * @classdesc AnimationMgr handles player-walk animation.
 * - create AnimationMgr object
 * - create PlayerWalkAnimation object
 * - use AnimationMgr.add to add the animation
 * - call AnimationMgr.animate() in timer repeatedly
 */
 
 
/**
 * Used to access AnimationMgr.
 *
 * @returns {AnimationMgr} The singleton instance.
 */
AnimationMgr.getInstance = function()
{
	if (AnimationMgr.instance == undefined) {
		AnimationMgr.instance = new AnimationMgr();
	}
		
	return AnimationMgr.instance;
}

/**
 * Constructor, should not be used from outside.
 * Use getInstance() instead.
 *
 * @constructor
 * @returns {AnimationMgr} 
*/
function AnimationMgr() { }

/**
 * @property {object} animations Contains the animations for processing.
*/
AnimationMgr.prototype.animations = [];

/**
 * Adds an animation to animations..
 *
 * @param {object} animation The animation to add.
*/
AnimationMgr.prototype.add = function(animation)
{
	animation.last = 0;
	this.animations.push(animation);
};

/**
 * Run animations.
 *
 * @param {number} time Duration of animation in milliseconds.
*/
AnimationMgr.prototype.animate = function(time)
{
	var self = this;
	var i = 0; 
	while (i < self.animations.length)
	{
		var ani = self.animations[i];
		var end = false;
		if (ani.last == 0) {
			ani.last = time - ani.delta;
		}
		var count = ((time - ani.last) / ani.delta) | 0;
		
		for (var t = 1; (t <= count) && (!end); t++) {
			var ttime = ani.last + ani.delta;
			end = !ani.step(ttime);
			ani.last = ttime;
		}
		
		if (end) {
			if (ani.finished != undefined){
				ani.finished();
			}
			
			// remove from list
			self.animations.splice(i, 1);
		} else{
			i++;
		}
	}
};


/**
 * Initialize an instance of AnimationPlayerMove.
 *
 * @constructor
 * @param {Player} player The player.
 * @param {object} icons Array of indexes of icons for the player move animation.
 * @param {number} time Delta x in cells (?).
 * @param {number} time Delta y in cells (?).
 * @param {number} cells Count of cells forming the path of the player.
 * @param {object} caller Calling object with callback 'playerReachedPosEvent'.
*/
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

/**
 * Set player icon for current step of the player move animation.
*/
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


/**
 * Initialize an instance of AnimationTargetHighlight.
 *
 * @constructor
 * @param {object} target The targeted cell.
 * @param {object} icons Array of indexes of icons for the highlight animation.
 * @param {number} steps Count of animation steps.
 * @param {number} x X coordinate of the position of the target.
 * @param {number} y Y coordinate of the position of the target.
*/
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

/**
 * Set target.icon for current step of the highlight animation.
*/
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
