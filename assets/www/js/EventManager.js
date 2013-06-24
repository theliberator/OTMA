/**
 * This module handles all game events after game started and till it ends
 * Example Jobs:
 * - trigger pathfinder and player-walk-animation when user clicks on map
 * - trigger talkevents of NPCs when player user want to to NPC
 * - trigger teleports when enter/leave rooms or change level
 * - Execute events asynchronously and recursive
 * 
 * How to use:
 * - create EventManager object
 * - call EventManager.timeEvent() repeatedly with a timer of about 33 ms
 * - call EventManager.clickEvent() when user clicks on map
 * 
 * Original version 1.0 released on 09.06.2012 by Ulrich Hornung
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Ulrich Hornung, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */

//Use Singleton pattern
EventManager.getInstance = function()
{
	if (EventManager.instance == undefined) {
		EventManager.instance = new EventManager();
	}
		
	return EventManager.instance;
}

function EventManager()
{
	con.info('creating EventManager');
	this.map = Map.getInstance();
	this.animationMgr = AnimationMgr.getInstance();
	this.soundModule = SoundModule.getInstance();
	this.player = this.map.player;
	this.dialogMgr = DialogMgr.getInstance();
	this.storage = Storage.getInstance()
	this.renderer = Renderer.getInstance();
	
	this.init();
}

EventManager.prototype.event_running = 0;
EventManager.prototype.G1Time = 0;
EventManager.prototype.G1State = 0;
EventManager.prototype.was_walking = true;
EventManager.prototype.playerWalkJob = [];
EventManager.prototype.conditions = {};

/**
 * init function
 */
EventManager.prototype.init = function() {
	var self = this;
	for (var i in self.map.story.initialEvents) {
		this.executeEventId(self.map.story.initialEvents[i]);
	}

	self.executeEventId("ZERO");
	
	if (self.storage.getUnlockedAchievements().length == 0) {
		self.executeEventId("ZERO_II");
	}
}

/**
 * registers an event
 * @param array event the event
 * @returns 0 if no error, 1 if error
 */
EventManager.prototype.registerEvent = function(event)
{
	var self = this;
	if (self.map.story.events[event.id] == undefined)
	{
		self.map.story.events[event.id] = event;
		return 0;
	} else {
		con.warning("Event ID: " + event.id + " already registered.");
		return 1;
	}
};

// internal use only!
EventManager.prototype.recur_action_execute = function(nr, event, npc, onFinish)
{
	var self = this;

    var stopEvent = function()
    {
		// enable clickEvents again!
		self.event_running = self.event_running-1;
        con.debug("end event (id: " + event.mEventID + "): counter value: " + self.event_running);
        if (onFinish != undefined) onFinish();
    };

    var nextAction = function()
    {
        self.recur_action_execute(nr+1, event, npc, onFinish);
    };

	if (nr >= event.actions.length)
	{
        stopEvent();
        return;
	}
	
	var action = event.actions[nr];
    con.debug(action);
	switch (action.type)
	{
		case "execute_event":
			self.executeEventId(action.value, undefined, nextAction);
			return;
		case "set_te_mode":
			if (helper.contains(["all", "single", "rand"], action.value)) {
				npc.te_mode = action.value;
			} else {
				con.error("talkevent mode not found: " + action.value);
			}
			break;
		case "set_te_cntr_abs":
			var val = parseInt(action.value);
			if (val > npc.talkevents.length - 1 || val < 0) {
				con.error("talkevent counter set too high: " + val);
				con.error("talkevents.length: " + npc.talkevents.length);
			} else
				npc.te_cntr = val;
			break;
		case "set_te_cntr_rel":
			var val = parseInt(action.value);
			npc.te_cntr = (npc.te_cntr + val) % npc.talkevents.length;
			break;
		case "del_event":
			if (!self.map.delEvent(action.value, npc)) {
				con.error("talkevent not found: " + action.value.id);
			}
			break;
		case "del_npc":
			if (!self.map.delNPC(action.value)) {
				con.error("NPC not found: " + action.value);
			}
			self.renderer.forcedDraw();
			break;
		case "hint_collected":
			self.storage.unlockAchievement("HINT_" + action.value, function() {
				if (self.storage.getUnlockedAchievements().length == XMLConfigLoader.getInstance().otma.hints.length) {
					self.executeEventId("E_ALL_HINTS_COLLECTED", undefined, nextAction);
				} else {
					nextAction();
				}
			});
			return;
		case "check_hints": // called after game start/continue (ZERO-Event)
			if (self.storage.getUnlockedAchievements().length == XMLConfigLoader.getInstance().otma.hints.length) {
				self.executeEventId("E_ALL_HINTS_COLLECTED", undefined, nextAction);
			} else {
				nextAction();
			}
			return;
		case "set_con_rel":
			var new_value = self.player.concentration + parseInt(action.value); 
			if (new_value < 0) {
				self.executeEventId("NOT_ENOUGH_CON", undefined, stopEvent);
				return;
			} else {
				self.player.concentration = new_value;
			}
			if (self.player.concentration > 100) {
				self.player.concentration = 100;
			}
			con.debug("new concentration value: " + self.player.concentration);
			$("#statustxt").text(self.player.concentration + "%");
			break;
		case "set_location":
			var str = "";
			if (action.value.length > 40) {
				str = action.value.slice(0, 35) + "...";
			} else {
				str = action.value;
			}
			var locationElement = (document.getElementById("location"));
			locationElement.innerHTML = str;
			break;
		case "set_location_hallway":
			var locationElement = (document.getElementById("location"));
			locationElement.innerHTML = "Level " + self.map.player.z + " Hallway";
			break;
		case "set_cond":
			self.conditions[action.value] = true;
			break;
		case "unset_cond":
			self.conditions[action.value] = false;
			break;
		case "dialog":
		case "split_dialog":
			self.renderer.draw();
			var dialog = new Dialog("talk", action.headline, action.img, action.text, nextAction);
			self.dialogMgr.openDialog(dialog);
			return; // continue with actions after dialog ends
		case "linear_dialog":
			if (event.dialog_cntr == undefined) {
				event.dialog_cntr = 0;
			}
			var dialog = new Dialog("talk", 
					action.headline, action.img, action.text[event.dialog_cntr], nextAction);
			self.dialogMgr.openDialog(dialog);
			event.dialog_cntr = (event.dialog_cntr + 1) % action.text.length;
			return; // continue with actions after dialog ends
		case "random_dialog":
			var ran = rand(0, action.text.length);
			var dialog = new Dialog("talk", 
					action.headline, action.img, action.text[ran], nextAction);
			self.dialogMgr.openDialog(dialog);
			return; // continue with actions after dialog ends
		case "change_level":
			self.player.z += parseInt(action.value);
			if (self.player.z > self.map.story.levels.length) {
				self.player.z = self.map.story.levels.length;
			} else if (self.player.z < 0) {
				 self.player.z = 0;
			 }
			con.debug("level: " + self.player.z);
			self.renderer.forcedDraw();
			break;
		case "teleport":
			self.teleportPlayer(action.to, action.direction);
			break;
		case "walk":
			self.playerWalkJob.push(action.direction);
			break;
		case "look":
			self.map.player.icon = self.map.player.ani_walk[action.direction][0];
			break;
		case "stop":
			self.playerWalkJob = [];
			break;
		case "sleep":
			setTimeout(nextAction, action.value);
			return; // continue with actions after sleep ends
		case "new_highscore":
			self.storage.saveHighscore(this.player.name);
			break;
		case "show_highscore":
			$.mobile.changePage( "#highscore", {} );
			break;
		case "play_sound":
			SoundModule.getInstance().playSfx(action.value);
			break;
		case "play_sound_gender":
			SoundModule.getInstance().playSfx(action.value + (this.player.gender == "female" ? "Female" : "Male"));
			break;
		default:
			con.error("unknown action type:" + action);
			break;
	}
	
	// default: continue with execution of next action
    nextAction();
};

EventManager.prototype.executeEventId = function(id, npc, onFinish)
{
	var event = this.map.story.events[id];
    event.mEventID = id;
	
	// at start: disable clickEvent:
	this.event_running = this.event_running +1;

	con.debug("event triggered (id:" + id + "), counter: " + this.event_running);
	con.debug(event);
	
	// start execution with action 0
	this.recur_action_execute(0, event, npc, onFinish); 
};

/**
 * starts a time event
 */
EventManager.prototype.timeEvent = function(time)
{
	var self = this;
	// stop animations when dialog is open
	if (this.dialogMgr.hasActiveDialog()) {
		return;
	}
	
	if (
			(self.playerWalkJob.length > 0) && 
			((self.playerWalkAni == undefined) || (self.playerWalkAni.ready == true))
		)
	{
		self.processNextPlayerWalkJob();
		self.was_walking = true;
	}
	else
	{
	}

	if (
			(self.playerWalkJob.length == 0) && (self.was_walking == true) &&
			((self.playerWalkAni == undefined) || (self.playerWalkAni.ready == true))
		)
	{
		self.renderer.look_offset_x = 0;
		self.renderer.look_offset_y = 0;
		self.renderer.calcPosFromPlayerPos(self.player.x, self.player.y);
		self.was_walking = false;
	}
};

/**
 * teleports a player
 */
EventManager.prototype.teleportPlayer = function(to, direction)
{
	this.playerWalkJob = [];
	this.playerWalkJob.push(direction);
	
	this.player.x = to.x;
	this.player.sx = to.x;
	this.player.y = to.y;
	this.player.sy = to.y;
	//this.player.z = to.z;
	
	// update background pos
	this.renderer.calcPosFromPlayerPos(this.player.x, this.player.y);
};

EventManager.prototype.recur_event_execution = function(nr, events, npc)
{
    var self = this;

    var nextEvent = function() { self.recur_event_execution(nr+1, events, npc); };

    if (nr >= events.length) {
    	return;
    }

    var e = events[nr];
	if (this.checkCondition(e.condition)) {
		this.executeEventId(e.id, npc, nextEvent);
	} else {
        nextEvent();
	}
};

EventManager.prototype.executeEventListWithCond = function(events, npc)
{
    this.recur_event_execution(0, events, npc);
};

EventManager.prototype.playerReachedPosEvent = function()
{
	var t = this.map.getTeleport(this.player.x, this.player.y, this.player.z);
	
	if (t != null)
	{
		if (t.onWalkOver || this.playerWalkJob.length == 0)
		{
			this.teleportPlayer(t.to, t.direction);
			this.executeEventListWithCond(t.events);
		}
	}

	var et = this.map.getEventTrigger(this.player.x, this.player.y, this.player.z);

	if (et != null)
	{
		if (et.onWalkOver || this.playerWalkJob.length == 0)
		{
			this.executeEventListWithCond(et.events);
		}
	}
};

EventManager.prototype.clickEvent = function(pos)
{	
	this.storage.incClicks();
	
	if (this.event_running > 0)
	{
		// don't accept click events on canvas while event is running!
		return; 
	}
	
	if (this.dialogMgr.hasActiveDialog())
	{
		this.dialogMgr.closeDialog();
		return;
	}
	
	/*var npc = this.getNpcAt(pos);
	if (npc != null)
	{
		this.talkEvent(npc);
		// alert("clicked on npc: " + npc.id + " name: " + npc.name);
		return;
	}*/
	
	player = this.player;
	this.playerWalkJob = [];
	
	var moves = AStar(this.map, [player.sx, player.sy], [pos.x, pos.y]);
	
	if (moves.length > 0)
	{
		this.targetAni = new AnimationTargetHighlight(this.map.target, [0,1,2,3], 10, pos.x, pos.y);
		this.animationMgr.add(this.targetAni);
		
		this.playerWalkJob = moves;
		
		// Richard: Start Walk-Sound here!
	}
	else
	{
		this.targetAni = new AnimationTargetHighlight(this.map.target, [4,5,6,7], 10, pos.x, pos.y);
		this.animationMgr.add(this.targetAni);
		
		// Richard: Beep sound evtl. (position nicht erreichbar)
		// play error sound
		SoundModule.getInstance().playSfx("error");
	}
};

EventManager.prototype.checkCondition = function(name)
{
	if (name == undefined)
		return true;
	
	if (this.conditions[name] == true)
		return true;
	else
		return false;
};

EventManager.prototype.talkEvent = function(npc)
{
	this.storage.incDialogs();
	
	switch (npc.te_mode)
	{
		case "all":
			this.executeEventListWithCond(npc.talkevents, npc);
			break;
		case "single":
			var tev = npc.talkevents[npc.te_cntr];
			if (tev != undefined && this.checkCondition(tev.condition))
					this.executeEventId(tev.id, npc);
			break;
		case "rand":
			var tev = npc.talkevents[rand(0, npc.talkevents.length)];
			if (tev != undefined && this.checkCondition(tev.condition))
					this.executeEventId(tev.id, npc);
			break;
		default:
			con.error("unknown talkevent mode: " + npc.te_mode);
	}
};

// nur zum Testen ohne Pathfinder! 
EventManager.prototype.arrowPressedEvent = function(direction)
{
	if ((this.playerWalkAni == undefined) || (this.playerWalkAni.ready == true))
	{
		var dx = 0;
		var dy = 0;
		
		switch (direction)
		{
		case "up":
			dy = -1;
			break;
		case "down":
			dy = 1;
			break;
		case "left":
			dx = -1;
			break;
		case "right":
			dx = 1;
			break;
		}
		
		
		var x = this.player.sx + dx;
		var y = this.player.sy + dy;
		
		if (this.map.isColliding(x,y) == false)
		{
			this.playerWalkJob.push(direction);
			//alert(this.playerWalkJob);
		}
	}
};

EventManager.prototype.keyPressedEvent = function(key)
{
	switch (key)
	{
	case "reset":
		this.storage.reset();
		break;
	case "unlock":
		// Just some debugging.
		this.storage.unlockAchievement("HINT_1");
		break;
	case "highscore":
		// Just some debugging.
		this.storage.saveHighscore(this.player.name);
		break;
	}
};
		
EventManager.prototype.processNextPlayerWalkJob = function()
{
	var direction = this.playerWalkJob.shift();
	var dx = 0;
	var dy = 0;
	
	switch (direction)
	{
	case "up":
		dy = -1;
		break;
	case "down":
		dy = 1;
		break;
	case "left":
		dx = -1;
		break;
	case "right":
		dx = 1;
		break;
	}

	this.player.x = this.player.x | 0;
	this.player.y = this.player.y | 0;
	this.player.icon = this.player.ani_walk[direction][0];
	
	if (this.playerWalkJob.length == 0)
	{
		var npc = this.map.getNpc(this.player.x + dx, this.player.y + dy, this.player.z);
		if (npc != null)
		{
			this.talkEvent(npc);
			return;
		}
	}

	this.player.sx = this.player.x + dx;
	this.player.sy = this.player.y + dy;
	
	this.playerWalkAni = new AnimationPlayerMove(this.player, this.player.ani_walk[direction], dx, dy, 1, this);
	this.animationMgr.add(this.playerWalkAni);
	this.storage.incSteps();

};
