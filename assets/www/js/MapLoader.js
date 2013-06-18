/**
 * This module loads and stores the map, NPCs, playerCharacter, Events, ...
 * In Short: all relevant data needed by the Renderer to display the game
 * 
 * How to use:
 * - create Map object
 * - call Map.init() directly afterwards
 * 
 * @author Ulrich Hornung
 * @version 1.0
 * @since 09.06.2012
 */

function Map(story)
{
	this.levels = story.levels;
	this.events = story.events;
	this.n_hints = story.n_otma_hints;
	this.init_events = story.initialEvents;
};

Map.prototype.generateCharacterName = function(gender, hair, color)
{
	var name = gender + "_" + hair + "_" + color;
	return name;
};

Map.prototype.init = function(map_data, player_name, char_gender, char_hair, char_shirt, on_init_done)
{
	var self = this;
	self.nrtoload = 1;
	
	this.player = new Object();
	this.player.icon = 41;
	this.player.ani_walk = [];
	this.player.ani_walk["left"]  = [54,53,52,51];
	this.player.ani_walk["right"] = [5,6,7,8];
	this.player.ani_walk["up"]    = [20,21,22,23];
	this.player.ani_walk["down"]  = [35,36,37,38];
	this.player.name = player_name;
	this.player.gender = char_gender;
	this.player.class = "player";
	this.player.z = 0;
	this.player.concentration = 100;
	this.player.npc_typ = 0;
	
	this.target = {};
	this.target.x = -1;
	this.target.y = -1;
	this.target.icon = 1;

	this.rows = 0 | map_data.height;
	this.cols = 0 | map_data.width;
	this.cellsize = 0 | map_data.tileheight;
	//this.tilesets_i = map_data.tilesets;
	this.tilesets = {};
	
	for (var nr in map_data.tilesets)
	{
		var tileset = map_data.tilesets[nr];
		
		if (tileset.name == "player")
			tileset.image = "img/" + this.generateCharacterName(char_gender, char_hair, char_shirt) + '.png';

		self.nrtoload++;
		this.tilesets[tileset.name] = new Tileset(tileset.image,
				0 | tileset.tilewidth, 0 | tileset.tileheight,
				0 | tileset.imagewidth, 0 | tileset.imageheight,
				tileset.properties, 0 | tileset.firstgid,
				function() {
			self.nrtoload--;
			if (self.nrtoload == 0)
				on_init_done();
		});
	}
	
	for (var nr in map_data.layers)
	{
		var layer = map_data.layers[nr];
		
		switch (layer.name)
		{
		case "ground":
			this.layer_ground = layer;
			break;
		case "background":
			this.layer_background = layer;
			break;
		case "foreground":
			this.layer_foreground = layer;
			break;
		case "collision":
			this.layer_collision = layer;
			break;
		default:
			con.error("unknown layer: " + layer.name);
		}
	}
	
	// Workaround for not being able to set icon in Renderer.prototype.drawCharacter function
	for (var i = 0; i < this.levels.length; i++) {
		var npcs = this.levels[i].npcs;
		for (k in npcs) {
			npc = npcs[k];
			try {
				npc.icon = parseInt(this.tilesets[npc.class].properties[npc.direction]);
			} catch (err) {
				npc.icon = null;
			}
		}
	}
	
	self.nrtoload--;
	if (self.nrtoload == 0)
		on_init_done();
};

Map.prototype.indexOfID = function(str, arr)
{
	for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		if (item.id == str)
			return i;
	}
	return -1;
};

Map.prototype.delNPC = function(npc_id)
{
	for (var i = 0; i < this.levels.length; i++) {
		var npcs = this.levels[i].npcs;
		var index = this.indexOfID(npc_id, npcs);
		if (index != -1) {
			npcs.splice(index, 1);
			return true;
		}
	}
	return false;
}

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

Map.prototype.getEventTrigger = function(x,y,z)
{
	for (var i in this.levels[z].ets)
	{
		et = this.levels[z].ets[i];
		
		if (et.x == x && et.y == y)
		{
			return et;
		}
	}
	
	return null;
};

Map.prototype.getTeleport = function(x,y,z)
{
	for (var tnr in this.levels[z].teleports)
	{
		t = this.levels[z].teleports[tnr];
		
		if (t.from.x == x && t.from.y == y)
		{
			return t;
		}
	}
	
	return null;
};

Map.prototype.getNpc = function (x,y,z)
{
	for (var nr in this.levels[z].npcs)
	{
		var npc = this.levels[z].npcs[nr];
		if (npc.x == x && npc.y == y)
		{
			return npc;
		}
	}
	return null;
};

Map.prototype.isColliding = function(x,y, end)
{
	for (var id in this.levels[this.player.z].npcs) {
		var npc = this.levels[this.player.z].npcs[id];
		if (npc.x == x && npc.y == y)
			 if (end.x != npc.x || end.y != npc.y)
				 return true;
	}
	var i = x + y*this.cols; 
	var data = this.layer_collision.data[i]; 
	if ((data == undefined) || (data > 0) )
		return true;
	else
		return false;
};

