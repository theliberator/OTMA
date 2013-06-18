/**
 * NPCs are "visible" fields on the map that are represented by an icon on the
 * map. This icon is composed of the class, npc_typ, and direction attribute.
 * NPCs are able to trigger an arbitrary number of events (here called
 * talkEvents). The way these events are executed can be controlled by the
 * te_mode attribute (see also mapEvents.xml and mapLayout.xml for examples).
 *
 * @author	Michael Seider
 * @version 0.9
 * @since	12.6.2012
 */
function NPC(id, cls, name, pos, direction, npc_typ, te_mode)
{
	this.id = id;
	this.class = cls;
	this.name = name;
	this.x = pos.x;
	this.y = pos.y;
	this.direction = direction;
	this.npc_typ = npc_typ;
	if (te_mode == undefined)
		this.te_mode = "all";
	else
		this.te_mode = te_mode;
	this.te_cntr = 0;
	this.talkevents = [];

	if (this.npc_typ == undefined)
	{
		this.npc_typ = 0;
	}
};

/* Add an event to the NPC. This will trigger the Event with the field "id" of
 * the passed event e if the condition in the "condition" field of e is met. */
NPC.prototype.addEvent = function(e)
{
	if (this.talkevents == undefined)
		this.talkevents = [];

	this.talkevents[this.talkevents.length] = e;
};

