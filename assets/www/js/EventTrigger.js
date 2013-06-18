/**
 * EventTriggers are "invisible" fields on the map that are able to trigger an
 * arbitrary number of events. They are identifiable and can be set to trigger
 * even if the player just walks over the field on the map (not directly
 * clicking on the field) by setting the owo parameter to "yes".
 *
 * @author	Michael Seider
 * @version 0.9
 * @since	12.6.2012
 */
function EventTrigger(id, pos, owo)
{
	this.id = id;
	this.x = pos.x;
	this.y = pos.y;
	if (owo == "yes")
		this.onWalkOver = true;
	else
		this.onWalkOver = false;
	this.events = [];
};

/* Add an event to the EventTrigger. This will trigger the Event with the field
 * "id" of the passed event e if the condition in the "condition" field of e is
 * met. */
EventTrigger.prototype.addEvent = function(e)
{
	if (this.events == undefined)
		this.events = [];

	this.events[this.events.length] = e;
};


