/**
 * Teleports are "invisible" fields on the map that are able to trigger an
 * arbitrary number of events. They behave much like EventTriggers and provide
 * a convenient way to set up EventTriggers with a teleport action. They are
 * identifiable and can be set to trigger even if the player just walks over
 * the field on the map (not directly clicking on the field) by setting the owo
 * parameter to "yes".
 *
 * @author	Michael Seider
 * @version 0.9
 * @since	12.6.2012
 */
function Teleport(id, from, to, direction, owo)
{
	this.id = id;
	this.from = from;
	this.to = to;
	this.direction = direction;
	if (owo == "yes")
		this.onWalkOver = true;
	else
		this.onWalkOver = false;
	this.events = [];
};

/* Add an event to the Teleport. This will trigger the Event with the field
 * "id" of the passed event e if the condition in the "condition" field of e is
 * met. */
Teleport.prototype.addEvent = function(e)
{
	if (this.events == undefined)
		this.events = [];

	this.events[this.events.length] = e;
};


