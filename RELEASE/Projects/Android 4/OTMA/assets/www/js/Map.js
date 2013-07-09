/**
 * Original version 1.0 released on 09.06.2012 by Ulrich Hornung
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Ulrich Hornung, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
 
 /**
 * @classdesc  This module loads and stores the map, NPCs, playerCharacter, Events, ...
 * In Short: all relevant data needed by the Renderer to display the game
 * 
 * How to use:
 * - call Map.getInstance()
 * - call Map.init() directly afterwards
 */

/**
 * Used to access Map.
 *
 * @returns {Map} The singleton instance.
 */
Map.getInstance = function()
{
	if (Map.instance == undefined) {
		Map.instance = new Map();
	}
		
	return Map.instance;
}

/**
 * Constructor, should not be used from outside.
 * Use getInstance() instead.
 *
 * @constructor
 * @returns {Map} 
*/
function Map()
{
	this.story = StoryGenerator.getInstance();
};

/**@property {number} nrtoload Number of tileset to load.
*/
Map.prototype.nrtoload = 1;

/**@property {object} player The player.
*/
Map.prototype.player = {
	icon: 41,
	ani_walk: {
		left: [54,53,52,51],
		right: [5,6,7,8],
		up: [20,21,22,23],
		down: [35,36,37,38]
	},
	name: '',
	gender: '',
	class: 'player',
	x: 7,
	y: 20,
	z: 0,
	sx: 7,
	sy: 20,
	concentration: 100,
	npc_typ: 0
};

/**@property {object} target The current target of the player.
*/
Map.prototype.target = {
	x: -1,
	y: -1,
	icon: 1
};
/**@property {number} rows Number of rows of the map.
*/
Map.prototype.rows = 0;

/**@property {number} cols Number of columns of the map.
*/
Map.prototype.cols = 0;

/**@property {number} cellsize Size of a cell in pixels.
*/
Map.prototype.cellsize = 0;

/**@property {object} tilesets Tilesets comprising the map.
*/
Map.prototype.tilesets = {};

/**@property {object} layer_ground Ground layer.
*/
Map.prototype.layer_ground = null;

/**@property {object} layer_ground Background layer.
*/
Map.prototype.layer_background = null;

/**@property {object} layer_ground Foreground layer.
*/
Map.prototype.layer_foreground = null;

/**@property {object} layer_ground Layer for collisions.
*/
Map.prototype.layer_collision = null;

/**
 * Set singleton instance of Map to null, to trigger
 * reinitialization on next call of 'getInstance()'.
*/
Map.prototype.reset = function() {
	Map.instance = undefined;
};
/**
 * Initial function
 *
 * @param {object} map_data Map data stored in otma_map.js
 * @param {function} on_init_done Callback function, that will be called afterwards
 */
Map.prototype.init = function(map_data, on_init_done)
{
	var self = this;
	var storage = Storage.getInstance()
	
	self.player.name = storage.getName();
	self.player.gender = storage.getGender();
	
	self.rows = 0 | map_data.height;
	self.cols = 0 | map_data.width;
	self.cellsize = 0 | map_data.tileheight;
	
	for (var nr in map_data.tilesets)
	{
		var tileset = map_data.tilesets[nr];
		
		if (tileset.name == "player") {
			tileset.image = "img/" + storage.getGender() + '_' + storage.getHairColor() + '_' + storage.getClothColor() + '.png';
		}

		self.nrtoload++;
		this.tilesets[tileset.name] = new Tileset(tileset.image,
				tileset.tilewidth, tileset.tileheight,
				tileset.imagewidth, tileset.imageheight,
				tileset.properties, tileset.firstgid,
				function() {
					self.nrtoload--;
					if (self.nrtoload == 0){
						on_init_done();
					}
				}
		);
	}
	
	//layers
	for (var nr in map_data.layers)
	{
		var layer = map_data.layers[nr];
		
		switch (layer.name)
		{
		case "ground":
			self.layer_ground = layer;
			break;
		case "background":
			self.layer_background = layer;
			break;
		case "foreground":
			self.layer_foreground = layer;
			break;
		case "collision":
			self.layer_collision = layer;
			break;
		default:
			con.error("unknown layer: " + layer.name);
		}
	}
	
	// Workaround for not being able to set icon in Renderer.prototype.drawCharacter function
	for (var i = 0; i < self.story.levels.length; i++) {
		var npcs = self.story.levels[i].npcs;
		for (var k in npcs) {
			var npc = npcs[k];
			try {
				npc.icon = parseInt(self.tilesets[npc.class].properties[npc.direction]);
			} catch (err) {
				npc.icon = null;
			}
		}
	}
	
	self.nrtoload--;
	if (self.nrtoload == 0){
		on_init_done();
	}
};

/**
 * Gets the index of an id.
 *
 * @param {string} str The string to search for.
 * @param {object} arr The array in which should be searched.
 * @returns The index or -1 if not found.
 */
Map.prototype.indexOfID = function(str, arr)
{
	for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		if (item.id == str) {
			return i;
		}
	}
	return -1;
};

/**
 * Removes a NPC from the list.
 *
 * @param {string|int} npc_id The id of the NPC.
 * @returns {boolean} True if successful, otherwise false.
 */
Map.prototype.delNPC = function(npc_id)
{
	for (var i = 0; i < this.story.levels.length; i++) {
		var npcs = this.story.levels[i].npcs;
		var index = this.indexOfID(npc_id, npcs);
		if (index != -1) {
			npcs.splice(index, 1);
			return true;
		}
	}
	return false;
}

/**
 * Removes an event from the list.
 *
 * @param {string} e The id of the event
 * @param {string} npc The NPC who owns the event
 * @returns {boolean} True if successful, otherwise false.
 */
Map.prototype.delEvent = function(e, npc)
{
	var index = this.indexOfID(e, npc.talkevents);
	if (index != -1) {
		npc.talkevents.splice(index, 1);
		if (npc.te_cntr > npc.talkevents.length - 1) {
			/* Last element removed. */
			npc.te_cntr = npc.talkevents.length - 1;
		}
		return true;
	}
	return false;
}

/**
 * Gets an event trigger.
 *
 * @param {number} x X coordinate of position.
 * @param {number} y Y coordinate of position.
 * @param {number} z The level of the map.
 * @returns {EventTrigger} The event trigger if successful, otherwise null.
*/
Map.prototype.getEventTrigger = function(x,y,z)
{
	var self = this;
	for (var i in self.story.levels[z].ets)
	{
		var et = self.story.levels[z].ets[i];
		
		if (et.x == x && et.y == y)
		{
			return et;
		}
	}
	
	return null;
};

 /**
 * Gets a teleport.
 *
 * @param {number} x X coordinate of position.
 * @param {number} y Y coordinate of position.
 * @param {number} z The level of the map.
 * @returns {EventTrigger} The teleport if successful, otherwise null.
*/
Map.prototype.getTeleport = function(x,y,z)
{
	var self = this;
	for (var tnr in self.story.levels[z].teleports)
	{
		var t = self.story.levels[z].teleports[tnr];
		
		if (t.from.x == x && t.from.y == y)
		{
			return t;
		}
	}
	
	return null;
};

/**
 * Gets an NPC.
 *
 * @param {number} x X coordinate of position.
 * @param {number} y Y coordinate of position.
 * @param {number} z The level of the map.
 * @returns {EventTrigger} The NPC if successful, otherwise null.
*/
Map.prototype.getNpc = function (x,y,z)
{
	var self = this;
	for (var nr in self.story.levels[z].npcs)
	{
		var npc = self.story.levels[z].npcs[nr];
		if (npc.x == x && npc.y == y)
		{
			return npc;
		}
	}
	return null;
};

/**
 * Checks if the given coordinates are colliding with something else.
 *
 * @param {number} x X coordinate of position.
 * @param {number} y Y coordinate of position.
 * @param {object} end End point of the path.
 * @returns {boolean} True if a collision is detected, otherwise null.
*/
Map.prototype.isColliding = function(x,y, end)
{
	var self = this;
	for (var id in self.story.levels[self.player.z].npcs) {
		var npc = self.story.levels[self.player.z].npcs[id];
		if (npc.x == x && npc.y == y) {
			 if (end.x != npc.x || end.y != npc.y){
				 return true;
			 }
		}
	}
	var i = x + y * self.cols; 
	var data = self.layer_collision.data[i]; 
	if ((data == undefined) || (data > 0) ) {
		return true;
	} else {
		return false;
	}
};

