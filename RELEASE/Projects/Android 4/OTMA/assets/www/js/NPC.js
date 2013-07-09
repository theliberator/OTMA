/**
 * Original version 0.9 by Michael Seider on 12.6.2012
 * Rewritten by Sebastian Pabel on 23.06.2013
 * 
 * @author	Michael Seider, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
 
/**
 * @classdesc NPCs are "visible" fields on the map that are represented by an icon on the
 * map. This icon is composed of the class, npc_typ, and direction attribute.
 * NPCs are able to trigger an arbitrary number of events (here called
 * talkEvents). The way these events are executed can be controlled by the
 * te_mode attribute (see also mapEvents.xml and mapLayout.xml for examples). 
 */
 
/** 
 * Creates new instance of NPC.
 *
 * @constructor
 * @param {string} id The id of the NPC.
 * @param {string} cls The class of the NPC ('npc', 'scientist', 'presenter').
 * @param {string} name The name of the NPC.
 * @param {object} pos The (x,y) position of the NPC.
 * @param {string} direction The direction ('up', 'down', 'right', 'left') the NPC is facing.
 * @param {string} te_mode Meaning unclear (valid values:'all, 'single').
 * @returns {NPC} The new NPC instance.
*/
function NPC(id, cls, name, pos, direction, npc_typ, te_mode)
{
	this.id = id;
	this.class = cls;
	this.name = name;
	this.x = pos.x;
	this.y = pos.y;
	this.direction = direction;
	if (npc_typ == undefined) {
		this.npc_typ = 0;
	} else {
		this.npc_typ = npc_typ;
	}
	if (te_mode == undefined) {
		this.te_mode = "all";
	} else {
		this.te_mode = te_mode;
	}
	this.te_cntr = 0;
	this.talkevents = [];
};

/**
 * Add an event to the NPC. This will trigger the Event with the field "id" of
 * the passed event e if the condition in the "condition" field of e is met.
 *
 * @param {Event} e The event.
 */
NPC.prototype.addEvent = function(e)
{
	this.talkevents.push(e);
};

