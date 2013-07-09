/**
 * Original version 0.9 released on 12.06.2012 by Michael Seider
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Michael Seider, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
 
 /** @classdesc The Event class provides an identifiable object with an arbitrary number of
 * actions associated with it. Events and their actions will be executed by the
 * EventManager when certain conditions are met. The events are usually called
 * by their id.
*/ 
 
 /** 
 * Creates new instance of event.
 *
 * @constructor
 * @param {string} id The event id.
 * @returns {Event} The new event instance.
*/
function Event(id)
{
	this.id = id;
	this.actions = [];
};

/**
 * Adds an action to the event
 *
 * @param {Action} a The action to add to the event.
 */
Event.prototype.addAction = function(a)
{
	this.actions.push(a);
};


