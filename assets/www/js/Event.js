/**
 * The Event class provides an identifiable object with an arbitray number of
 * actions associated with it. Events and their actions will be executed by the
 * EventManager when certain conditions are met. The events are usually called
 * by their id.
 *
 * @author	Michael Seider
 * @version 0.9
 * @since	12.6.2012
 */
function Event(id)
{
	this.id = id;
	this.actions = [];
};

/* Add an action to the event. */
Event.prototype.addAction = function(a)
{
	if (this.actions == undefined)
		this.actions = [];

	this.actions[this.actions.length] = a;
};


