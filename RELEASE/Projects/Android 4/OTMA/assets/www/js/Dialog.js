/**
 * Original version 1.0 released on 09.06.2012 by Ulrich Hornung
 * Rewritten on 23.06.2013 by Sebastian Pabel
 *
 * @author	Ulrich Hornung, Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
 
 /**
 * @classdesc Handles all in-game dialogs. 
 * - create DialogMgr object
 * - create Dialog object
 * - use DialogMgr.openDialog to show the Dialog
 * - wait till Dialog closes trough user action OR:
 * - call DialogMgr.closeDialog() to close dialog manually
 */
 
/**
 * Used to access DialogMgr.
 *
 * @returns {DialogMgr} The singleton instance.
 */
DialogMgr.getInstance = function()
{
	if (DialogMgr.instance == undefined) {
		DialogMgr.instance = new DialogMgr();
	}
		
	return DialogMgr.instance;
}

/**
 * Constructor, should not be used from outside.
 * Use getInstance() instead.
 *
 * @constructor
 * @returns {DialogMgr} 
*/
function DialogMgr() {}

/**
 * @property {object} dialog The current dialog.
*/
DialogMgr.prototype.dialog = null;

/**
 * Split text into chunks.
 *
 * @param {string} long_text The text to split.
 * @param {number} max_text_length The maximum size of a chunk.
 * @returns {object} Array of strings.
 */
function splitText(long_text, max_text_length)
{
	var result = [];
	var text = long_text.split(" ");
	var i = 0;
	while (i < text.length)
	{
		var line = text[i];
		i++;
		while (line.length < max_text_length && i < text.length)
		{
			line = line + " " + text[i];
			i++;
		}
		result.push(line);
	}
	return result;
}

/**
 * Gets the visible style.
 *
 * @returns {string} Visible style.
 */
function getVisibleStyle(visible)
{
	var visible_style = "";
	
	if (visible == false)
	{
		visible_style = "none";
	}
	
	return visible_style;
}

/**
 * Set display style of element.
 *
 * @param {string} name Name of the element.
 *
 * @returns {string} Visible style.
 */
function setElementStyle(name, display)
{
	var el = document.getElementById(name);
	el.style.display = display;
}

/**
 * Opens a dialog.
 *
 * @param {object} name The dialog to open.
 */
DialogMgr.prototype.openDialog = function(dialog)
{	
	if (dialog.texts == undefined) {
		return;
	}

	this.dialog = dialog;
	var self = this;
	
	var ddiv = document.createElement("div");
	ddiv.setAttribute("id", "dialog");
	ddiv.setAttribute("class", "visible " + dialog.dclass);
	if (dialog.headline != undefined)
	{
		ddiv.innerHTML += "<h1>" + dialog.headline + "</h1>";
	}
	if (dialog.img != undefined)
	{
		ddiv.innerHTML += "<img class=\"otmaperson\" id=\"dialog_img\" src=\"" + dialog.img + "\"/><br>";
	}
	ddiv.innerHTML += "<div id=\"dialog_text\">TEXT</div><br>";
	jQuery.facebox(ddiv, undefined, function() {self.closeDialog(true);});
	var close_btn = document.getElementById("close_facebox");
	close_btn.src = app.resDir + "facebox/nextlabel.gif";
	close_btn.onclick = function() { self.nextDialog(); };
	self.updateDialog();
};

/**
 * Updates text of current dialog.
 */
DialogMgr.prototype.updateDialog = function()
{	
	// this.dialog = dialog;
	$("#dialog_text").html(this.dialog.getCurrentText());
	
	if (this.dialog.isLastPage())
	{
		var next_link = document.getElementById("close_facebox");
		next_link.src = app.resDir + "facebox/closelabel.gif";
	}
};

/**
 * Show next page of current dialog or close it if last page is reached.
 */
DialogMgr.prototype.nextDialog = function()
{
	var self = this;
	if (self.dialog.isLastPage())
	{
		self.closeDialog();
	} else {
		self.dialog.next();
		self.updateDialog();
	}
};

/**
 * Closes current dialog.
 */
DialogMgr.prototype.closeDialog = function(alreadyClosing)
{
	if (alreadyClosing != true) {
		$(document).trigger('close.facebox');
		// return imediately, this funtion will be called a second time when dialog is vanished.
		return;
	}
	
	if (this.dialog == null){
		return;
	}

	var old = this.dialog;
	this.dialog = null;
	setTimeout(function() {old.callback(old);});
	delete old;
	
	/*var ddiv = document.getElementById("dialog");
	ddiv.parentNode.removeChild(ddiv);*/
};

/**
 * Function to check if current dialog is set.
 * 
 * @returns {boolean} True if current dialog is set, otherwise false.
 */
DialogMgr.prototype.hasActiveDialog = function()
{
	return (this.dialog != null);
};

/**
 * Function to get the current dialog.
 * 
 * @returns {Dialog} The current dialog.
 */
DialogMgr.prototype.getActiveDialog = function()
{
	if (this.hasActiveDialog()) {
		return this.dialog;
	} else {
		return null;
	}
};

/**
 * Creates a new instance of Dialog.
 *
 * @constructor
 * @param dclass string dialog class
 * @param headline string the dialog headline
 * @param img Object Image object
 * @param text string/array the dialog text
 * @param callback function will be called after the dialog has been closed
 */
function Dialog(dclass, headline, img, text, callback)
{
	if (callback == undefined) {
		callback = function(){};
	}
	this.callback = callback;
	this.headline = headline;
	this.img = img;
	if (text instanceof Array) {
		this.texts = text;
	} else {
		this.texts = splitText(text, 190);
	}
	this.textpos = 0;
	this.dclass = dclass;
}

Dialog.prototype.getCurrentText = function()
{
	return this.texts[this.textpos];
};

Dialog.prototype.isLastPage = function()
{
	return (this.textpos >= (this.texts.length-1));
};

Dialog.prototype.next = function()
{
	this.textpos++;
	if (this.textpos >= this.texts.length)
	{
		return false;
	}
	return true;
};
