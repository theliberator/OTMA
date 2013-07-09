/**
 * Teleports are "invisible" fields on the map that are able to trigger an
 * arbitrary number of events. They behave much like EventTriggers and provide
 * a convenient way to set up EventTriggers with a teleport action. They are
 * identifiable and can be set to trigger even if the player just walks over
 * the field on the map (not directly clicking on the field) by setting the owo
 * parameter to "yes".
 * 
 * Original version 0.9 released on 12.06.2012 by Michael Seider
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Michael Seider, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
function Teleport(id, from, to, direction, onWalkover)
{
	this.id = id;
	this.from = from;
	this.to = to;
	this.direction = direction;
	this.onWalkOver = false;
	if (onWalkover == "yes") {
		this.onWalkOver = true;
	}
	this.events = [];
};

/**
 * Add an event to the Teleport. This will trigger the Event with the field
 * "id" of the passed event e if the condition in the "condition" field of e is met.
 * @param array e the event
 */
Teleport.prototype.addEvent = function(e)
{
	this.events[this.events.length] = e;
};


