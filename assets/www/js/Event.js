/**
 * The Event class provides an identifiable object with an arbitray number of
 * actions associated with it. Events and their actions will be executed by the
 * EventManager when certain conditions are met. The events are usually called
 * by their id.
 *
 * Original version 0.9 released on 12.06.2012 by Michael Seider
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Michael Seider, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
function Event(id)
{
	this.id = id;
	this.actions = [];
};

/**
 * Adds an action to the event
 */
Event.prototype.addAction = function(a)
{
	this.actions.push(a);
};


