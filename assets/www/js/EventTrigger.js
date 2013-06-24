/**
 * EventTriggers are "invisible" fields on the map that are able to trigger an
 * arbitrary number of events. They are identifiable and can be set to trigger
 * even if the player just walks over the field on the map (not directly
 * clicking on the field) by setting the owo parameter to "yes".
 *
 * Original version 0.9 released on 12.06.2012 by Michael Seider
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Michael Seider, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
function EventTrigger(id, pos, onWalkOver)
{
	this.id = id;
	this.x = pos.x;
	this.y = pos.y;
	this.onWalkOver = false;
	if (onWalkOver == "yes") {
		this.onWalkOver = true;
	}
	this.events = [];
};

/**
 * Add an event to the EventTrigger. This will trigger the Event with the field
 * "id" of the passed event e if the condition in the "condition" field of e is met.
 * @param array e the event to add
 */
EventTrigger.prototype.addEvent = function(e)
{
	this.events.push(e);
};


