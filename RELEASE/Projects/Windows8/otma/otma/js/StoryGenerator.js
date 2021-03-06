/**
 * The StoryGenerator class takes the information gathered from the
 * mapLayouts.xml and otma-config.xml files and generates a suitable amount of
 * levels which are then populated with events, actions and npcs. These are
 * linked in a proper way which will make up the "story" of the game.
 *
 * Original version 0.9 released on 12.06.2012 by Michael Seider
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Michael Seider, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */


// Use Singleton pattern
StoryGenerator.getInstance = function()
{
	if (StoryGenerator.instance == undefined) {
		StoryGenerator.instance = new StoryGenerator();
	}
		
	return StoryGenerator.instance;
}
 

function StoryGenerator() { };

StoryGenerator.prototype.values = {
	NUM_ROOMS_PER_LEVEL: 4,
	NUM_EVENTS_PER_LEVEL: 2,
	NUM_ITEMS_PER_LEVEL: 1
};
StoryGenerator.prototype.levels = null;
//events
StoryGenerator.prototype.events = null;
StoryGenerator.prototype.initialEvents = [];

StoryGenerator.prototype.reset = function() {
	this.levels = null;
	this.events = null;
	this.initialEvents = [];
};
/**
 * shuffles an array
 */
StoryGenerator.prototype.shuffleArray = function (a)
{
	var tmp, rand;
	for (var i = 0; i < a.length; i++){
		rand = Math.floor(Math.random() * a.length);
		tmp = a[i]; 
		a[i] = a[rand]; 
		a[rand] = tmp;
	}
};
/**
 * Populates the OTMA-conference room on the first floor of the map
 * @param array otma_room the readed room layout form the xml file
 */
StoryGenerator.prototype.populateOTMARoom = function(otma_room) {
	var self = this;
	for (var chair = 0; chair < otma_room.chairs.length; chair++)
	{
		/* At least one chair must be empty. Put NPCs on the
		 * others. */
		if (chair == otma_room.chairs.length - 1 || Math.random() > 0.9) {
			var eventTrigger = new EventTrigger(
				helper.concat("GEN_ET_OTMA_END", [chair]),
				otma_room.chairs[chair].pos
			);
			eventTrigger.addEvent({
				id: "E_END"
			});
			self.levels[0].ets[eventTrigger.id] = eventTrigger;
		} else {
			/* Generate NPCs for occupied chairs. */
			var npc_typ = (Math.random()*22) | 0;
			if (Math.random() > 0.5) {
				npc_typ += 22; //start of female rows in npc.png
			}
			var npc = new NPC(
				helper.concat("GEN_NPC_LISTENER", [chair]),
				"npc",
				"",
				otma_room.chairs[chair].pos,
				"up",
				npc_typ
			);
			npc.addEvent({
				id:"CHAIR_OCCUPIED"
			});
			self.levels[0].npcs.push(npc);
		}
	}
}

/** 
 * Generates events per otma workshop/conference for stepping into the room and
 * starts the lecture by sitting on one of the chairs.
 * @param array otma_events the readed events from the xml file
 */
StoryGenerator.prototype.generateRoomEvents = function(otma_events) {
	var self = this;
	for (var i = 0; i < otma_events.length; i++)
	{
		/* Generate enter room events. */
		var event = new Event(
			helper.concat("GEN_EVENT_ENTER_OTMA_EVENT", [i])
		);
		event.addAction({
			type: "set_location",
			value: otma_events[i].title
		});
		event.addAction({
			type: "play_sound",
			value: "doorOpened"
		});
		self.events[event.id] = event;

		/* Generate start events. */
		var event = new Event(
			helper.concat("GEN_EVENT_START_OTMA_EVENT", [i])
		);
		event.addAction({
			type: "look",
			direction: "up"
		});
		event.addAction({
			type: "sleep",
			value: "500"
		});
		event.addAction({
			type: "set_con_rel",
			value: helper.rand(-25, -40)
		});
		event.addAction({
			type: "dialog",
			headline: "Lecturer:",
			text: otma_events[i].description
		});
		self.events[event.id] = event;
	}
}

/**
 * Generates and returns NPCs and their introductory talkevent for persons
 * loaded from otma-config.xml file.
 * @param array persons the loaded persons from the xml file
 * @returns array the generated npcs
 */
StoryGenerator.prototype.generatePersons = function(persons)
{
	var self = this;
	var gen_npcs_persons = [];
	for (var i in persons) {
		/* Generate persons' talkevents. */
		var event = new Event(helper.concat("GEN_EVENT_PERSON_TALK", [i]));
		event.addAction({
			type: "dialog",
			img: persons[i].img,
			text: persons[i].introduction
		});
		event.addAction({
			type: "set_te_cntr_rel",
			value: 1
		});
		self.events[event.id] = event;
		
		/* Generate npcs for persons. */
		var npc = new NPC(helper.concat("GEN_NPC_PERSON", [i]),
				"scientist",
				persons[i].name,
				{x:0, y:0},
				"up",
				(persons[i].gender == "female") ? 2 : 0,
				"single");
		npc.addEvent({
			id: helper.concat("GEN_EVENT_PERSON_TALK", [i])
		});
		gen_npcs_persons[i] = npc;
	}
	return gen_npcs_persons;
};

/** 
 * Generates events for the hints and distributes them among persons.
 * @param array hints the readed hints from the xml file
 * @param array npcs generated npcs 
 */
StoryGenerator.prototype.generateHints = function(hints, npcs)
{
	var self = this;
	for (var i in hints) {
		/* Generate hints events. */
		var event = new Event(helper.concat("GEN_EVENT_HINT", [i]));
		//TODO: don't like the hardcoded text.
		var text = ["Listen carefully. What i will give you now will help you on your way to the OTMA conference.",
			"Did you know about this already?",
			"I can give you some advice."];
		event.addAction({
			type: "random_dialog",
			text: text
		});
		event.addAction({
			type: "hint_collected",
			value: i
		});
		event.addAction({
			type:"del_event",
			value:helper.concat("GEN_EVENT_HINT", [i])
		});
		self.events[event.id] = event;
		
		/* Distribute hints among npcs. */
		npcs[i % npcs.length].addEvent({
			id:helper.concat("GEN_EVENT_HINT", [i])
		});
		self.events[helper.concat("GEN_EVENT_HINT", [i])].actions[0].headline = npcs[i % npcs.length].name + ":";
	}
};

/**
 * Here, rooms will be randomly determined that are closed or have the missing
 * items (presenters) in it and the ones where a conf/ws actually takes place.
 * Returns the configuration as a layout.
 * @params int numOfLevels number of levels
 */
StoryGenerator.prototype.generateLevelsRandomLayout = function(numOfLevels)
{
	var self = this;
	var layout = {
		levels: new Array(numOfLevels)
	};

	for (var i = 1; i < numOfLevels; i++) {
		layout.levels[i] = {
			closed: new Array(self.values.NUM_ROOMS_PER_LEVEL),
			items: new Array(self.values.NUM_ROOMS_PER_LEVEL)
		};
		/* A predefined number of rooms per level is closed. */
		var closed = [];
		for (var j = 0; j < self.values.NUM_ROOMS_PER_LEVEL - self.values.NUM_EVENTS_PER_LEVEL; j++) {
			var rn = helper.rand(0, self.values.NUM_ROOMS_PER_LEVEL);
			while (helper.contains(closed, rn)) {
				rn = (rn + 1) % self.values.NUM_ROOMS_PER_LEVEL;
			}
			closed.push(rn);
		}
		var open = [];
		for (var j = 0; j < self.values.NUM_ROOMS_PER_LEVEL; j++) {
			if (!helper.contains(closed, j)) {
				open.push(j);
			}
		}

		/* Some of the closed rooms have items in it. */
		var items = [];
		for (var j = 0; j < self.values.NUM_ITEMS_PER_LEVEL && j < closed.length; j++) {
			var rn = helper.rand(0, self.values.NUM_ROOMS_PER_LEVEL - self.values.NUM_EVENTS_PER_LEVEL);
			while (helper.contains(items, closed[rn])) {
				rn = (rn + 1) % closed.length;
			}
			items.push(closed[rn]);
		}

		/*
		var quests = [];
		for (var i = 0; i < this.values.NUM_ITEMS_PER_LEVEL; i++) {
			var rn = helper.rand(0, this.values.NUM_EVENTS_PER_LEVEL);
			while (helper.contains(quests, open[rn]))
				rn = (rn + 1) % open.length;
			quests[i] = open[rn];
		}
		*/

		for (var j = 0; j < self.values.NUM_ROOMS_PER_LEVEL; j++) {
			if (helper.contains(closed, j)) {
				layout.levels[i].closed[j] = true;
			} else {
				layout.levels[i].closed[j] = false;
			}
			if (helper.contains(items, j)) {
				layout.levels[i].items[j] = true;
			} else {
				layout.levels[i].items[j] = false;
			}
			/*
			if (helper.contains(quests, r))
				layout.levels[l].quests[r] = true;
			else
				layout.levels[l].quests[r] = false;
			   */
		}
	}
	return layout;
};

/**
 * Generates the events for missing items and sets all conditions accordingly
 * in the initialEvents list. They will be executed at the beginning of the
 * game to ensure a proper setup of the conditions. The conf/ws rooms where an
 * item is missing are returned in the needed_item array.
 * @param int n_levels number of levels
 * @param int n_items number of items
 * @returns array generated needed items
 */
StoryGenerator.prototype.generateInitialItemEvents = function(n_levels, n_items)
{
	var self = this;
	var needed_item = [];

	for (var i = 0; i < self.values.NUM_EVENTS_PER_LEVEL * (n_levels - 1); i++) {
		if (i < n_items) {
			/* Here missing item. */
			/* Generate events. */
			var event = new Event(helper.concat("GEN_EVENT_ITEM_COLLECTED", [i]));
			event.addAction({type:"set_cond", value:helper.concat("GEN_COND_PLAYER_HAS_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_PLAYER_HAS_NO_ITEM", [i])});
			event.addAction({type:"sleep", value:"200"});
			event.addAction({type:"del_npc", value:helper.concat("GEN_NPC_ITEM", [i])});
			event.addAction({type:"sleep", value:"100"});
			event.addAction({type:"execute_event", value:"ITEM_COLLECTED"});
			self.events[event.id] = event;

			var event = new Event(helper.concat("GEN_EVENT_RETURNED_ITEM", [i]));
			event.addAction({type:"set_cond", value:helper.concat("GEN_COND_LECTURER_HAS_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_LECTURER_HAS_NO_ITEM", [i])});
			self.events[event.id] = event;

			/* Set initial conditions */
			var event = new Event(helper.concat("GEN_EVENT_INIT", [i]));
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_PLAYER_HAS_ITEM", [i])});
			event.addAction({type:"set_cond", value:helper.concat("GEN_COND_PLAYER_HAS_NO_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_LECTURER_HAS_ITEM", [i])});
			event.addAction({type:"set_cond", value:helper.concat("GEN_COND_LECTURER_HAS_NO_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_LECTURER_READY", [i])});
			needed_item[i] = true;
			self.events[event.id] = event;
			self.initialEvents.push(event.id);
		} else {
			/* Here no missing item. */
			/* Set initial conditions */
			var event = new Event(helper.concat("GEN_EVENT_INIT", [i]));
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_PLAYER_HAS_NO_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_PLAYER_HAS_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_LECTURER_HAS_ITEM", [i])});
			event.addAction({type:"unset_cond", value:helper.concat("GEN_COND_LECTURER_HAS_NO_ITEM", [i])});
			event.addAction({type:"set_cond", value:helper.concat("GEN_COND_LECTURER_READY", [i])});
			needed_item[i] = false;
			self.events[event.id] = event;
			self.initialEvents.push(event.id);
		}
	}
	return needed_item;
};

/**
 * This function does the actual work and populates the levels with NPCs,
 * Items, Teleports, etc. by taking into account all of the previously randomly
 * generated conditions (needed_item, layout). The actual coordinates are taken
 * from upper_rooms.
 * @param int n_otma_events number of events
 * @param int numberOfPersons number of persons
 * @param int n_items number of items
 * @param array gen_npcs_persons generated npcs 
 * @param array needed_item needed items
 * @param array layout the map layout
 * @param array upper_rooms the upper rooms read from xml file
 */
StoryGenerator.prototype.populateLevels = function(n_otma_events, numberOfPersons, n_items, gen_npcs_persons, needed_item, layout, upper_rooms)
{
	var self = this;
	
	var persons_per_room = Math.ceil(numberOfPersons / n_otma_events);
	var n_levels = self.levels.length; //save it here, because it changes during the process
	var configLoader = XMLConfigLoader.getInstance();

	for (var l = 1; l < n_levels; l++)
	{
		var level = {};
		var npcs = [];
		var ets = {};
		var teleports = {};

		/* Generate rooms. */
		for (var r = 0; r < self.values.NUM_ROOMS_PER_LEVEL; r++)
		{
			if (layout.levels[l].closed[r] || n_otma_events <= 0) {
				if (layout.levels[l].items[r]) {
					/* Generate door teleports. */
					var tp = new Teleport(helper.concat("GEN_TP_ITEM_ROOM_IN", [n_items-1]),
							upper_rooms[r].door_in.from,
							upper_rooms[r].door_in.to,
							upper_rooms[r].door_in.direction);
					tp.addEvent({id:"E_ENTER_EMPTY_ROOM"});
					teleports[tp.id] = tp;

					var tp = new Teleport(helper.concat("GEN_TP_ITEM_ROOM_OUT", [n_items-1]),
							upper_rooms[r].door_out.from,
							upper_rooms[r].door_out.to,
							upper_rooms[r].door_out.direction);
					tp.addEvent({id:"E_LEAVE_EMPTY_ROOM"});
					teleports[tp.id] = tp;

					/* Generate item as NPC. */
					var npc = new NPC(helper.concat("GEN_NPC_ITEM", [n_items-1]),
							"presenter",
							"",
							upper_rooms[r].lecturer.pos,
							"down",
							0);
					npc.addEvent({id:helper.concat("GEN_EVENT_ITEM_COLLECTED", [n_items-1])});
					npcs.push(npc);
					n_items--;
				} else {
					/* Generate closed door event trigger. */
					var et = new EventTrigger(helper.concat("GEN_ET_CLOSED_DOOR", [l,r]),
							upper_rooms[r].door_in.from);
					var direction = upper_rooms[r].door_in.direction;
					if (direction == "left") {
						et.addEvent({id:"closed_room_left"});
					} else {
						et.addEvent({id:"closed_room_right"});
					}
					ets[et.id] = et;
				}
			} else {
				/* Generate door teleports. */
				var tp = new Teleport(helper.concat("GEN_TP_ROOM_IN", [n_otma_events-1]),
						upper_rooms[r].door_in.from,
						upper_rooms[r].door_in.to,
						upper_rooms[r].door_in.direction);
				tp.addEvent({id:helper.concat("GEN_EVENT_ENTER_OTMA_EVENT", [n_otma_events-1])});
				teleports[tp.id] = tp;

				var tp = new Teleport(helper.concat("GEN_TP_ROOM_OUT", [n_otma_events-1]),
						upper_rooms[r].door_out.from,
						upper_rooms[r].door_out.to,
						upper_rooms[r].door_out.direction);
				tp.addEvent({id:"E_LEAVE_OTMA_EVENT"});
				teleports[tp.id] = tp;

				/* Generate lecturer npc. */
				var npc = new NPC(helper.concat("GEN_NPC_LECTURER", [n_otma_events-1]),
						"scientist",
						"",
						upper_rooms[r].lecturer.pos,
						"down",0);
				npc.addEvent({id:"LECTURER_MISSING_ITEM",
					condition:helper.concat("GEN_COND_PLAYER_HAS_NO_ITEM", [n_otma_events-1])});
				npc.addEvent({id:helper.concat("GEN_EVENT_RETURNED_ITEM", [n_otma_events-1]),
					condition:helper.concat("GEN_COND_PLAYER_HAS_ITEM", [n_otma_events-1])});
				npc.addEvent({id:"LECTURER_GOT_ITEM",
					condition:helper.concat("GEN_COND_LECTURER_HAS_ITEM", [n_otma_events-1])});
				npc.addEvent({id:"LECTURER_READY",
					condition:helper.concat("GEN_COND_LECTURER_READY", [n_otma_events-1])});
				npc.te_mode = "all";
				npcs.push(npc);

				/* These will be chairs for the persons. */
				var p_chairs = [];
				for (var i = 0; i < persons_per_room; i++) {
					var rn = helper.rand(0, upper_rooms[r].chairs.length);
					while (helper.contains(p_chairs, rn)) {
						rn = (rn + 1) % upper_rooms[r].chairs.length;
					}
					p_chairs[i] = rn;
				}

				/* Distribute listeners and persons on chairs. */
				for (var c = 0; c < upper_rooms[r].chairs.length; c++)
				{
					var chair = upper_rooms[r].chairs[c];
					/* At least one chair must be empty. Put NPCs on the
					 * others. */
					if (helper.contains(p_chairs, c) && numberOfPersons > 0) {
						gen_npcs_persons[numberOfPersons-1].x = chair.pos.x;
						gen_npcs_persons[numberOfPersons-1].y = chair.pos.y;
						/* Remove name from NPC to not display it. */
						gen_npcs_persons[numberOfPersons-1].name = "";
						npcs.push(gen_npcs_persons[numberOfPersons-1]);
						numberOfPersons--;
					} else if (c == upper_rooms[r].chairs.length - 1 || Math.random() > 0.5) {
						var et = new EventTrigger(helper.concat("GEN_ET_START_OTMA_EVENT", [n_otma_events-1, c]), chair.pos);
						if (needed_item[n_otma_events-1]) {
							et.addEvent({id:helper.concat("GEN_EVENT_START_OTMA_EVENT", [n_otma_events-1]),
								condition:helper.concat("GEN_COND_LECTURER_HAS_ITEM", [n_otma_events-1])});
							et.addEvent({id:"E_CHAIR_PRE_BEGIN",
								condition:helper.concat("GEN_COND_LECTURER_HAS_NO_ITEM", [n_otma_events-1])});
						} else {
							et.addEvent({id:helper.concat("GEN_EVENT_START_OTMA_EVENT", [n_otma_events-1]),
								condition:helper.concat("GEN_COND_LECTURER_READY", [n_otma_events-1])});
						}
						ets[et.id] = et;
					} else {
						/* Generate NPCs for occupied chairs. */
						var npc_typ = (Math.random()*22) | 0;
						if (Math.random() > 0.5) {
							npc_typ += 22; /* start of femal rows in npc.png */
						}
						var npc = new NPC(helper.concat("GEN_NPC_LISTENER", [n_otma_events-1, c]),
								"npc",
								"",
								chair.pos,
								"up",
								npc_typ);
						npc.addEvent({id:"CHAIR_OCCUPIED"});
						npcs.push(npc);
					}
				}
				n_otma_events -= 1;
			}
		}

		/* Generate entry teleports for second floor. */
		if (l == 1) {
			for (var i = 0; i < configLoader.otma.entry_teleports.length; i++) {
				teleports[helper.concat("GEN_TP_STAIRS_DN", [l, i])] = configLoader.map.teleports[configLoader.otma.entry_teleports[i].id];
			}
		}

		/* Generate teleports for other floors' stairs. */
		for (var i = 0; i < configLoader.otma.teleports.length; i++) {
			var otp = configLoader.otma.teleports[i];

			if (l == n_levels - 1 && otp.level == "level_up") {
				/* Top level upstairs. */
				/*
				var tp = new Teleport(helper.concat("GEN_TP_STAIRS", [l, i]),
						otp.from,
						otp.from,
						otp.direction,
						"yes");
				tp.addEvent({id:"top_level"});
				teleports[tp.id] = tp;
				*/
				var sign = new NPC(helper.concat("GEN_SIGN_TOP_LEVEL", [l, i]),
						"construction_sign",
						"",
						otp.from,
						otp.direction);
				if (otp.direction == "down") {
					sign.addEvent({id:"TE_TOP_FLOOR_CNSTR_SIGN_UPR"});
				} else {
					sign.addEvent({id:"TE_TOP_FLOOR_CNSTR_SIGN_LWR"});
				}
				npcs.push(sign);
			} else if (l == 1 && otp.level == "level_down") {
				;/* Entry teleports already generated for downstairs. */
			} else {
				var tp = new Teleport(helper.concat("GEN_TP_STAIRS", [l, i]),
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
		self.levels[l] = level;
	}
}

/**
 * Main function for generating the story. All xml configuration files have to be read first
 */
StoryGenerator.prototype.generateLevels = function()
{
	var self = this;
	var configLoader = XMLConfigLoader.getInstance();
	
	var num_levels = Math.ceil(configLoader.otma.otma_events.length / self.values.NUM_EVENTS_PER_LEVEL) + 1;
	var n_items = self.values.NUM_ITEMS_PER_LEVEL * (num_levels - 1);
	con.info("Generated number of levels: " + num_levels);

	self.levels = new Array(num_levels);

	/* First floor is populated by map layout. */
	self.levels[0] = {
		ets: configLoader.map.ets,
		npcs: configLoader.map.npcs,
		teleports: configLoader.map.teleports,
	};
	
	self.populateOTMARoom(configLoader.otma.roomsLayoutLower[0]);

	/* Creation of events. */
	self.events = configLoader.map.events;

	self.shuffleArray(configLoader.otma.persons);
	self.shuffleArray(configLoader.otma.otma_events);

	self.generateRoomEvents(configLoader.otma.otma_events);

	var gen_npcs_persons = self.generatePersons(configLoader.otma.persons);

	self.generateHints(configLoader.otma.hints, gen_npcs_persons);

	var needed_item = self.generateInitialItemEvents(num_levels, n_items);

	/* Generate levels. */
	var layout = self.generateLevelsRandomLayout(num_levels);

	self.populateLevels(configLoader.otma.otma_events.length, configLoader.otma.persons.length, n_items, gen_npcs_persons, needed_item, layout, configLoader.otma.roomsLayoutUpper);
};
