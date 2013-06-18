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
 * @author Ulrich Hornung
 * @version 1.0
 * @since 09.06.2012
 */

function EventManager(map, animationMgr, soundModule, dialogMgr, storage, renderer)
{
	// lock gui while executing events
    // init event running counter
	this.event_running = 0;

	this.map = map;
	this.animationMgr = animationMgr;
	this.soundModule = soundModule;
	this.player = map.player;
	this.dialogMgr = dialogMgr;
	this.storage = storage;
	this.renderer = renderer;
	
	this.G1Time = 0;
	this.G1State = 0;
	this.was_walking = true;
	
	this.playerWalkJob = [];
	
	this.conditions = {};
	
	for (var i in map.init_events)
		this.executeEventId(map.init_events[i]);

	this.executeEventId("ZERO");
	
	if (this.storage.getUnlockedAchievements().length == 0)
		this.executeEventId("ZERO_II");
}

EventManager.prototype.registerEvent = function(event)
{
	if (this.map.events[event.id] == undefined)
	{
		this.map.events[event.id] = event;
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
			if (contains(["all", "single", "rand"], action.value))
				npc.te_mode = action.value;
			else
				con.error("talkevent mode not found: " + action.value);
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
			if (!map.delEvent(action.value, npc))
				con.error("talkevent not found: " + action.value.id);
			break;
		case "del_npc":
			if (!map.delNPC(action.value))
				con.error("NPC not found: " + action.value);
			this.renderer.forcedDraw();
			break;
		case "hint_collected":
			this.storage.unlockAchievement("HINT_" + action.value, function() {
				if (self.storage.getUnlockedAchievements().length == self.map.n_hints)
				{
					self.executeEventId("E_ALL_HINTS_COLLECTED", undefined, nextAction);
				}
				else
				{
					nextAction();
				}
			});
			return;
		case "check_hints": // called after game start/continue (ZERO-Event)
			{
				if (self.storage.getUnlockedAchievements().length == self.map.n_hints)
				{
					self.executeEventId("E_ALL_HINTS_COLLECTED", undefined, nextAction);
				}
				else
				{
					nextAction();
				}
				return;
			}
		case "set_con_rel":
			var new_value = this.player.concentration + parseInt(action.value); 
			if (new_value < 0) {
				this.executeEventId("NOT_ENOUGH_CON", undefined, stopEvent);
				return;
			} else {
				this.player.concentration = new_value;
			}
			if (this.player.concentration > 100)
				this.player.concentration = 100;
			con.debug("new concentration value: " + this.player.concentration);
			$("#statustxt").text(this.player.concentration + "%");
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
			locationElement.innerHTML = "Level " + this.map.player.z + " Hallway";
			break;
		case "set_cond":
			this.conditions[action.value] = true;
			break;
		case "unset_cond":
			this.conditions[action.value] = false;
			break;
		case "dialog":
		case "split_dialog":
			this.renderer.draw();
			var dialog = new Dialog("talk", action.headline, action.img, action.text, nextAction);
			this.dialogMgr.openDialog(dialog);
			return; // continue with actions after dialog ends
		case "linear_dialog":
			if (event.dialog_cntr == undefined)
				event.dialog_cntr = 0;
			var dialog = new Dialog("talk", 
					action.headline, action.img, action.text[event.dialog_cntr], nextAction);
			this.dialogMgr.openDialog(dialog);
			event.dialog_cntr = (event.dialog_cntr + 1) % action.text.length;
			return; // continue with actions after dialog ends
		case "random_dialog":
			var ran = rand(0, action.text.length);
			var dialog = new Dialog("talk", 
					action.headline, action.img, action.text[ran], nextAction);
			this.dialogMgr.openDialog(dialog);
			return; // continue with actions after dialog ends
		case "change_level":
			this.player.z += parseInt(action.value);
			if (this.player.z > this.map.levels.length)
				this.player.z = this.map.levels.length;
			else if (this.player.z < 0)
				this.player.z = 0;
			con.debug("level: " + this.player.z);
			this.renderer.forcedDraw();
			break;
		case "teleport":
			this.teleportPlayer(action.to, action.direction);
			break;
		case "walk":
			this.playerWalkJob.push(action.direction);
			break;
		case "look":
			this.map.player.icon = this.map.player.ani_walk[action.direction][0];
			break;
		case "stop":
			this.playerWalkJob = [];
			break;
		case "sleep":
			setTimeout(nextAction, action.value);
			return; // continue with actions after sleep ends
		case "new_highscore":
			this.storage.saveHighscore(this.player.name);
			break;
		case "show_highscore":
			$.mobile.changePage( "#highscore", {} );
			break;
		case "play_sound":
			playSfx(action.value);
			break;
		case "play_sound_gender":
			playSfx(action.value + (this.player.gender == "female" ? "Female" : "Male"));
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
	var event = this.map.events[id];
    event.mEventID = id;
	
	// at start: disable clickEvent:
	this.event_running = this.event_running +1;

	con.debug("event triggered (id:" + id + "), counter: " + this.event_running);
	con.debug(event);
	
	// start execution with action 0
	this.recur_action_execute(0, event, npc, onFinish); 
};

EventManager.prototype.timeEvent = function(time)
{
	// stop animations when dialog is open
	if (this.dialogMgr.hasActiveDialog()) return;

	
	
	if (
			(this.playerWalkJob.length > 0) && 
			((this.playerWalkAni == undefined) || (this.playerWalkAni.ready == true))
		)
	{
		this.processNextPlayerWalkJob();
		this.was_walking = true;
	}
	else
	{
	}

	if (
			(this.playerWalkJob.length == 0) && (this.was_walking == true) &&
			((this.playerWalkAni == undefined) || (this.playerWalkAni.ready == true))
		)
	{
		this.renderer.look_offset_x = 0;
		this.renderer.look_offset_y = 0;
		this.renderer.calcPosFromPlayerPos(this.player.x, this.player.y);
		this.was_walking = false;
	}
};

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

    if (nr >= events.length)
        return;

    var e = events[nr];
	if (this.checkCondition(e.condition))
		this.executeEventId(e.id, npc, nextEvent);
    else
        nextEvent();
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
		playSfx("error");
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
