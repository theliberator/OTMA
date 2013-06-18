/**
 * The StoryGenerator class takes the information gathered from the
 * mapLayouts.xml and otma-config.xml files and generates a suitable amount of
 * levels which are then populated with events, actions and npcs. These are
 * linked in a proper way which will make up the "story" of the game.
 *
 * @author	Michael Seider
 * @version 0.9
 * @since	12.6.2012
 */
function StoryGenerator()
{
};

StoryGenerator.prototype.Values = {
	NUM_ROOMS_PER_LEVEL: 4,
	NUM_EVENTS_PER_LEVEL: 2,
	NUM_ITEMS_PER_LEVEL: 1
};

/* Helper functions. */
function rand(lo, hi)
{
	return Math.floor(Math.random() * (hi - lo)) + lo;
};

function contains(a, obj)
{
	for (var i = 0; i < a.length; i++) {
		if (a[i] === obj) {
			return true;
		}
	}
	return false;
};

function shufArray(a)
{
	var tmp, rand;
	for (var i = 0; i < a.length; i++){
		rand = Math.floor(Math.random() * a.length);
		tmp = a[i]; 
		a[i] = a[rand]; 
		a[rand] = tmp;
	}
};

function concat(str, adds, sep)
{
	if (sep == undefined)
		sep = "_";
	var ret_str = str;
	for(var i = 0; i < adds.length; i++)
	{
		add = adds[i];
		ret_str += sep + add;
	}
	return ret_str;
};

/* Populates the OTMA-conference room on the first floor of the map. */
StoryGenerator.prototype.populateOTMARoom = function(otma_room, ets, npcs)
{
	/* Distribute listeners and persons on chairs. */
	for (var c = 0; c < otma_room.chairs.length; c++)
	{
		var chair = otma_room.chairs[c];
		/* At least one chair must be empty. Put NPCs on the
		 * others. */
		if (c == otma_room.chairs.length - 1 || Math.random() > 0.9) {
			var et = new EventTrigger(concat("GEN_ET_OTMA_END", [c]), chair.pos);
			et.addEvent({id:"E_END"});
			ets[et.id] = et;
		} else {
			/* Generate NPCs for occupied chairs. */
			var npc_typ = (Math.random()*22) | 0;
			if (Math.random() > 0.5) npc_typ += 22; /* start of femal rows in npc.png */
			var npc = new NPC(concat("GEN_NPC_LISTENER", [c]),
					"npc",
					"",
					chair.pos,
					"up",
					npc_typ);
			npc.addEvent({id:"CHAIR_OCCUPIED"});
			npcs[npcs.length] = npc;
		}
	}
};

/* Generates events per otma workshop/conference for stepping into the room and
 * starting the lecture by sitting on one of the chairs. */
StoryGenerator.prototype.generateRoomEvents = function(otma_events, events)
{
	for (var i = 0; i < otma_events.length; i++)
	{
		var oe = otma_events[i];

		/* Generate enter room events. */
		var e = new Event(concat("GEN_EVENT_ENTER_OTMA_EVENT", [i]));
		e.addAction({type: "set_location", value: oe.title});
		e.addAction({type: "play_sound", value: "doorOpened"});
		events[e.id] = e;

		/* Generate start events. */
		var e = new Event(concat("GEN_EVENT_START_OTMA_EVENT", [i]));
		e.addAction({type:"look", direction:"up"});
		e.addAction({type:"sleep", value:"500"});
		e.addAction({type:"set_con_rel", value:rand(-25, -40)});
		e.addAction({type:"dialog", headline:"Lecturer:", text:oe.description});
		events[e.id] = e;
	}
};

/* Generates and returns NPCs and their introductory talkevent for persons
 * loaded from otma-config.xml file. */
StoryGenerator.prototype.generatePersons = function(persons, events)
{
	/* Generate persons' talkevents. */
	for (var i in persons) {
		var p = persons[i];
		var e = new Event(concat("GEN_EVENT_PERSON_TALK", [i]));
		e.addAction({type:"dialog", img:p.img, text:p.introduction});
		e.addAction({type:"set_te_cntr_rel", value:1});
		events[e.id] = e;
	}

	/* Generate npcs for persons. */
	var gen_npcs_persons = [];
	for (var i in persons) {
		var npc = new NPC(concat("GEN_NPC_PERSON", [i]),
				"scientist",
				persons[i].name,
				{x:0, y:0},
				"up",
				(XMLConfig.otma.persons[i].gender == "female") ? 2 : 0,
				"single");
		npc.addEvent({id:concat("GEN_EVENT_PERSON_TALK", [i])});
		gen_npcs_persons[i] = npc;
	}
	return gen_npcs_persons;
};

/* Generates events for the hints and distributes them among persons. */
StoryGenerator.prototype.generateHints = function(hints, persons, events)
{
	this.n_otma_hints = hints.length;

	/* Generate hints events. */
	for (var i in hints) {
		var h = hints[i];
		var e = new Event(concat("GEN_EVENT_HINT", [i]));
		//TODO: don't like the hardcoded text.
		var text = ["Listen carefully. What i will give you now will help you on your way to the OTMA conference.",
			"Did you know about this already?",
			"I can give you some advice."];
		e.addAction({type:"random_dialog", text:text});
		e.addAction({type:"hint_collected", value:i});
		e.addAction({type:"del_event", value:concat("GEN_EVENT_HINT", [i])});
		events[e.id] = e;
	}

	/* Distribute hints among persons. */
	for (var i = 0; i < XMLConfig.otma.hints.length; i++) {
		persons[i % persons.length].addEvent({id:concat("GEN_EVENT_HINT", [i])});
		events[concat("GEN_EVENT_HINT", [i])].actions[0].headline = persons[i % persons.length].name + ":";
	}
};

/* Here, rooms will be randomly determined that are closed or have the missing
 * items (presenters) in it and the ones where a conf/ws actually takes place.
 * Returns the configuration as a layout. */
StoryGenerator.prototype.generateLevelsRandomLayout = function(levels)
{
	var layout = {};
	layout.levels = new Array(levels);

	for (var l = 1; l < levels; l++) {
		layout.levels[l] = {};
		layout.levels[l].closed = new Array(this.Values.NUM_ROOMS_PER_LEVEL);
		layout.levels[l].items = new Array(this.Values.NUM_ROOMS_PER_LEVEL);

		/* A predefined number of rooms per level is closed. */
		var closed = [];
		for (var i = 0; i < this.Values.NUM_ROOMS_PER_LEVEL - this.Values.NUM_EVENTS_PER_LEVEL; i++) {
			var rn = rand(0, this.Values.NUM_ROOMS_PER_LEVEL);
			while (contains(closed, rn))
				rn = (rn + 1) % this.Values.NUM_ROOMS_PER_LEVEL;
			closed[i] = rn;
		}
		var open = [];
		for (var i = 0; i < this.Values.NUM_ROOMS_PER_LEVEL; i++) {
			if (!contains(closed, i))
				open[open.length] = i;
		}

		/* Some of the closed rooms have items in it. */
		var items = [];
		for (var i = 0; i < this.Values.NUM_ITEMS_PER_LEVEL && i < closed.length; i++) {
			var rn = rand(0, this.Values.NUM_ROOMS_PER_LEVEL - this.Values.NUM_EVENTS_PER_LEVEL);
			while (contains(items, closed[rn]))
				rn = (rn + 1) % closed.length;
			items[i] = closed[rn];
		}

		/*
		var quests = [];
		for (var i = 0; i < this.Values.NUM_ITEMS_PER_LEVEL; i++) {
			var rn = rand(0, this.Values.NUM_EVENTS_PER_LEVEL);
			while (contains(quests, open[rn]))
				rn = (rn + 1) % open.length;
			quests[i] = open[rn];
		}
		*/

		for (var r = 0; r < this.Values.NUM_ROOMS_PER_LEVEL; r++) {
			if (contains(closed, r))
				layout.levels[l].closed[r] = true;
			else
				layout.levels[l].closed[r] = false;
			if (contains(items, r))
				layout.levels[l].items[r] = true;
			else
				layout.levels[l].items[r] = false;
			/*
			if (contains(quests, r))
				layout.levels[l].quests[r] = true;
			else
				layout.levels[l].quests[r] = false;
			   */
		}
	}
	return layout;
};

/* Generates the events for missing items and sets all conditions accordingly
 * in the initialEvents list. They will be executed at the beginning of the
 * game to ensure a proper setup of the conditions. The conf/ws rooms where an
 * item is missing are returned in the needed_item array. */
StoryGenerator.prototype.generateInitialItemEvents = function(n_levels, n_items, events, initialEvents)
{
	var needed_item = [];

	for (var i = 0; i < this.Values.NUM_EVENTS_PER_LEVEL * (n_levels - 1); i++) {
		if (i < n_items) {
			/* Here missing item. */
			/* Generate events. */
			var e = new Event(concat("GEN_EVENT_ITEM_COLLECTED", [i]));
			e.addAction({type:"set_cond", value:concat("GEN_COND_PLAYER_HAS_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_PLAYER_HAS_NO_ITEM", [i])});
			e.addAction({type:"sleep", value:"200"});
			e.addAction({type:"del_npc", value:concat("GEN_NPC_ITEM", [i])});
			e.addAction({type:"sleep", value:"100"});
			e.addAction({type:"execute_event", value:"ITEM_COLLECTED"});
			events[e.id] = e;

			var e = new Event(concat("GEN_EVENT_RETURNED_ITEM", [i]));
			e.addAction({type:"set_cond", value:concat("GEN_COND_LECTURER_HAS_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_LECTURER_HAS_NO_ITEM", [i])});
			events[e.id] = e;

			/* Set initial conditions */
			var e = new Event(concat("GEN_EVENT_INIT", [i]));
			e.addAction({type:"unset_cond", value:concat("GEN_COND_PLAYER_HAS_ITEM", [i])});
			e.addAction({type:"set_cond", value:concat("GEN_COND_PLAYER_HAS_NO_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_LECTURER_HAS_ITEM", [i])});
			e.addAction({type:"set_cond", value:concat("GEN_COND_LECTURER_HAS_NO_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_LECTURER_READY", [i])});
			needed_item[i] = true;
			events[e.id] = e;
			initialEvents[initialEvents.length] = e.id;
		} else {
			/* Here no missing item. */
			/* Set initial conditions */
			var e = new Event(concat("GEN_EVENT_INIT", [i]));
			e.addAction({type:"unset_cond", value:concat("GEN_COND_PLAYER_HAS_NO_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_PLAYER_HAS_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_LECTURER_HAS_ITEM", [i])});
			e.addAction({type:"unset_cond", value:concat("GEN_COND_LECTURER_HAS_NO_ITEM", [i])});
			e.addAction({type:"set_cond", value:concat("GEN_COND_LECTURER_READY", [i])});
			needed_item[i] = false;
			events[e.id] = e;
			initialEvents[initialEvents.length] = e.id;
		}
	}
	return needed_item;
};

/* This function does the actual work and populates the levels with NPCs,
 * Items, Teleports, etc. by taking into account all of the previously randomly
 * generated conditions (needed_item, layout). The actual coordinates are taken
 * from upper_rooms. */
StoryGenerator.prototype.populateLevels = function(rem_events, rem_persons, rem_items, gen_npcs_persons, needed_item, layout, upper_rooms, levels)
{
	var persons_per_room = Math.ceil(rem_persons / rem_events);
	var n_levels = levels.length;

	for (var l = 1; l < n_levels; l++)
	{
		var level = {};
		var npcs = [];
		var ets = {};
		var teleports = {};

		/* Generate rooms. */
		for (var r = 0; r < this.Values.NUM_ROOMS_PER_LEVEL; r++)
		{
			if (layout.levels[l].closed[r] || rem_events <= 0) {
				if (layout.levels[l].items[r]) {
					/* Generate door teleports. */
					var tp = new Teleport(concat("GEN_TP_ITEM_ROOM_IN", [rem_items-1]),
							upper_rooms[r].door_in.from,
							upper_rooms[r].door_in.to,
							upper_rooms[r].door_in.direction);
					tp.addEvent({id:"E_ENTER_EMPTY_ROOM"});
					teleports[tp.id] = tp;

					var tp = new Teleport(concat("GEN_TP_ITEM_ROOM_OUT", [rem_items-1]),
							upper_rooms[r].door_out.from,
							upper_rooms[r].door_out.to,
							upper_rooms[r].door_out.direction);
					tp.addEvent({id:"E_LEAVE_EMPTY_ROOM"});
					teleports[tp.id] = tp;

					/* Generate item as NPC. */
					var npc = new NPC(concat("GEN_NPC_ITEM", [rem_items-1]),
							"presenter",
							"",
							upper_rooms[r].lecturer.pos,
							"down",
							0);
					npc.addEvent({id:concat("GEN_EVENT_ITEM_COLLECTED", [rem_items-1])});
					npcs[npcs.length] = npc;
					rem_items--;
				} else {
					/* Generate closed door event trigger. */
					var et = new EventTrigger(concat("GEN_ET_CLOSED_DOOR", [l,r]),
							upper_rooms[r].door_in.from);
					var direction = upper_rooms[r].door_in.direction;
					if (direction == "left")
						et.addEvent({id:"closed_room_left"});
					else
						et.addEvent({id:"closed_room_right"});
					ets[et.id] = et;
				}
			} else {

				/* Generate door teleports. */
				var tp = new Teleport(concat("GEN_TP_ROOM_IN", [rem_events-1]),
						upper_rooms[r].door_in.from,
						upper_rooms[r].door_in.to,
						upper_rooms[r].door_in.direction);
				tp.addEvent({id:concat("GEN_EVENT_ENTER_OTMA_EVENT", [rem_events-1])});
				teleports[tp.id] = tp;

				var tp = new Teleport(concat("GEN_TP_ROOM_OUT", [rem_events-1]),
						upper_rooms[r].door_out.from,
						upper_rooms[r].door_out.to,
						upper_rooms[r].door_out.direction);
				tp.addEvent({id:"E_LEAVE_OTMA_EVENT"});
				teleports[tp.id] = tp;

				/* Generate lecturer npc. */
				var npc = new NPC(concat("GEN_NPC_LECTURER", [rem_events-1]),
						"scientist",
						"",
						upper_rooms[r].lecturer.pos,
						"down",0);
				npc.addEvent({id:"LECTURER_MISSING_ITEM",
					condition:concat("GEN_COND_PLAYER_HAS_NO_ITEM", [rem_events-1])});
				npc.addEvent({id:concat("GEN_EVENT_RETURNED_ITEM", [rem_events-1]),
					condition:concat("GEN_COND_PLAYER_HAS_ITEM", [rem_events-1])});
				npc.addEvent({id:"LECTURER_GOT_ITEM",
					condition:concat("GEN_COND_LECTURER_HAS_ITEM", [rem_events-1])});
				npc.addEvent({id:"LECTURER_READY",
					condition:concat("GEN_COND_LECTURER_READY", [rem_events-1])});
				npc.te_mode = "all";
				npcs[npcs.length] = npc;

				/* These will be chairs for the persons. */
				var p_chairs = [];
				for (var i = 0; i < persons_per_room; i++) {
					var rn = rand(0, upper_rooms[r].chairs.length);
					while (contains(p_chairs, rn))
						rn = (rn + 1) % upper_rooms[r].chairs.length;
					p_chairs[i] = rn;
				}

				/* Distribute listeners and persons on chairs. */
				for (var c = 0; c < upper_rooms[r].chairs.length; c++)
				{
					var chair = upper_rooms[r].chairs[c];
					/* At least one chair must be empty. Put NPCs on the
					 * others. */
					if (contains(p_chairs, c) && rem_persons > 0) {
						gen_npcs_persons[rem_persons-1].x = chair.pos.x;
						gen_npcs_persons[rem_persons-1].y = chair.pos.y;
						/* Remove name from NPC to not display it. */
						gen_npcs_persons[rem_persons-1].name = "";
						npcs[npcs.length] = gen_npcs_persons[rem_persons-1];
						rem_persons--;
					} else if (c == upper_rooms[r].chairs.length - 1 || Math.random() > 0.5) {
						var et = new EventTrigger(concat("GEN_ET_START_OTMA_EVENT", [rem_events-1, c]), chair.pos);
						if (needed_item[rem_events-1]) {
							et.addEvent({id:concat("GEN_EVENT_START_OTMA_EVENT", [rem_events-1]),
								condition:concat("GEN_COND_LECTURER_HAS_ITEM", [rem_events-1])});
							et.addEvent({id:"E_CHAIR_PRE_BEGIN",
								condition:concat("GEN_COND_LECTURER_HAS_NO_ITEM", [rem_events-1])});
						} else {
							et.addEvent({id:concat("GEN_EVENT_START_OTMA_EVENT", [rem_events-1]),
								condition:concat("GEN_COND_LECTURER_READY", [rem_events-1])});
						}
						ets[et.id] = et;
					} else {
						/* Generate NPCs for occupied chairs. */
						var npc_typ = (Math.random()*22) | 0;
						if (Math.random() > 0.5) npc_typ += 22; /* start of femal rows in npc.png */
						var npc = new NPC(concat("GEN_NPC_LISTENER", [rem_events-1, c]),
								"npc",
								"",
								chair.pos,
								"up",
								npc_typ);
						npc.addEvent({id:"CHAIR_OCCUPIED"});
						npcs[npcs.length] = npc;
					}
				}
				rem_events -= 1;
			}
		}

		/* Generate entry teleports for second floor. */
		if (l == 1) {
			for (var i = 0; i < XMLConfig.otma.entry_teleports.length; i++) {
				teleports[concat("GEN_TP_STAIRS_DN", [l, i])] = XMLConfig.map.teleports[XMLConfig.otma.entry_teleports[i].id];
			}
		}

		/* Generate teleports for other floors' stairs. */
		for (var i = 0; i < XMLConfig.otma.teleports.length; i++) {
			var otp = XMLConfig.otma.teleports[i];

			if (l == n_levels - 1 && otp.level == "level_up") {
				/* Top level upstairs. */
				/*
				var tp = new Teleport(concat("GEN_TP_STAIRS", [l, i]),
						otp.from,
						otp.from,
						otp.direction,
						"yes");
				tp.addEvent({id:"top_level"});
				teleports[tp.id] = tp;
				*/
				var sign = new NPC(concat("GEN_SIGN_TOP_LEVEL", [l, i]),
						"construction_sign",
						"",
						otp.from,
						otp.direction);
				if (otp.direction == "down")
					sign.addEvent({id:"TE_TOP_FLOOR_CNSTR_SIGN_UPR"});
				else
					sign.addEvent({id:"TE_TOP_FLOOR_CNSTR_SIGN_LWR"});
				npcs[npcs.length] = sign;
			} else if (l == 1 && otp.level == "level_down") {
				;/* Entry teleports already generated for downstairs. */
			} else {
				var tp = new Teleport(concat("GEN_TP_STAIRS", [l, i]),
						otp.from,
						otp.to,
						otp.direction,
						"yes");
				tp.addEvent({id:otp.level});
				teleports[tp.id] = tp;
			}
		}

		level.npcs = npcs;
		level.ets = ets;
		level.teleports = teleports;
		levels[l] = level;
	}
}

/* Main function for generating the story. All xml configuration files have to
 * be read first and passed as an argument XMLConfig. */
StoryGenerator.prototype.generateLevels = function(XMLConfig)
{
	var n_otma_events = XMLConfig.otma.otma_events.length;
	var n_otma_persons = XMLConfig.otma.persons.length;
	var pad_len = Math.max(1, Math.floor(Math.log(n_otma_events) / Math.log(10))); //wird nicht benutzt Oo

	var num_levels = Math.ceil(n_otma_events / this.Values.NUM_EVENTS_PER_LEVEL) + 1;
	var n_items = this.Values.NUM_ITEMS_PER_LEVEL * (num_levels - 1);
	con.info("Generated number of levels: " + num_levels);

	this.levels = new Array(num_levels);

	/* First floor is populated by map layout. */
	this.levels[0] = {};
	this.levels[0].ets = XMLConfig.map.ets;
	this.levels[0].npcs = XMLConfig.map.npcs;
	this.levels[0].teleports = XMLConfig.map.teleports;
	this.populateOTMARoom(XMLConfig.otma.roomsLayoutLower, this.levels[0].ets, this.levels[0].npcs);

	/* Creation of events. */
	this.events = XMLConfig.map.events;
	this.initialEvents = [];

	shufArray(XMLConfig.otma.persons);
	shufArray(XMLConfig.otma.otma_events);

	this.generateRoomEvents(XMLConfig.otma.otma_events, this.events);

	var gen_npcs_persons = this.generatePersons(XMLConfig.otma.persons, this.events);

	this.generateHints(XMLConfig.otma.hints, gen_npcs_persons, this.events);

	var needed_item = this.generateInitialItemEvents(num_levels, n_items, this.events, this.initialEvents);

	/* Generate levels. */
	layout = this.generateLevelsRandomLayout(num_levels);

	this.populateLevels(n_otma_events, n_otma_persons, n_items, gen_npcs_persons, needed_item, layout, XMLConfig.otma.roomsLayoutUpper, this.levels);
};
