/**
 * This File handles all ingame dialogs.
 * 
 * - create DialogMgr object
 * - create Dialog object
 * - use DialogMgr.openDialog to show the Dialog
 * - wait till Dialog closes trough user action OR:
 * - call DialogMgr.closeDialog() to close dialog manually
 * 
 * @author Ulrich Hornung
 * @version 1.0
 * @since 09.06.2012
 */

function DialogMgr()
{
	this.dialog = null;
}

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

function getVisibleStyle(visible)
{
	var visible_style = "";
	
	if (visible == false)
	{
		visible_style = "none";
	}
	
	return visible_style;
}

function setElementStyle(name, display)
{
	var el = document.getElementById(name);
	el.style.display = display;
}

DialogMgr.prototype.setGameVisibility = function(visible)
{
	var style = getVisibleStyle(visible);
	setElementStyle("foreground", style);
	setElementStyle("objects", style);
	setElementStyle("background", style);
};

DialogMgr.prototype.setMenuVisibility = function(visible)
{
	var style = getVisibleStyle(visible);
	setElementStyle("menu1", style);
};

DialogMgr.prototype.setMenuStatsVisibility = function(visible)
{
	var style = getVisibleStyle(visible);
	setElementStyle("menu_stats", style);
};

DialogMgr.prototype.setMenuHintsVisibility = function(visible)
{
	var style = getVisibleStyle(visible);
	setElementStyle("menu_hints", style);
};

DialogMgr.prototype.openDialog = function(dialog)
{	
	if (dialog.texts == undefined)
		return;

	this.dialog = dialog;
	var self = this;
	
//	setTimeout(function() {
		
		var canvas = document.getElementById("foreground");
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
		//canvas.parentElement.appendChild(ddiv);
		jQuery.facebox(ddiv, undefined, function() {self.closeDialog(true);});
		var close_btn = document.getElementById("close_facebox");
//		var close_btn = document.getElementsByClassName("close_image")[0];
		close_btn.src = "res/facebox/nextlabel.gif";
		close_btn.onclick = function() { self.nextDialog(); };
		self.updateDialog();
//	}, 40);
};

DialogMgr.prototype.updateDialog = function()
{	
	// this.dialog = dialog;
	var texttag = document.getElementById("dialog_text");
	texttag.innerHTML = this.dialog.getCurrentText();
	
	if (this.dialog.isLastPage())
	{
		var next_link = document.getElementById("close_facebox");
		next_link.src = "res/facebox/closelabel.gif";
	}
};

DialogMgr.prototype.nextDialog = function()
{
	if (this.dialog.isLastPage())
	{
		this.closeDialog();
	}
	else
	{
		this.dialog.next();
		this.updateDialog();
	}
};

DialogMgr.prototype.closeDialog = function(alreadyClosing)
{
	if (alreadyClosing != true)
	{
		$(document).trigger('close.facebox');
		// return imediately, this funtion will be called a second time when dialog is vanished.
		return;
	}
	
	if (this.dialog == null)
		return;

	var old = this.dialog;
	this.dialog = null;
	setTimeout(function() {old.callback(old);});
	delete old;
	
	/*var ddiv = document.getElementById("dialog");
	ddiv.parentNode.removeChild(ddiv);*/
};

DialogMgr.prototype.hasActiveDialog = function()
{
	return (this.dialog != null);
};

DialogMgr.prototype.getActiveDialog = function()
{
	if (this.hasActiveDialog())
		return this.dialog;
	else
		return null;
};

function Dialog(dclass, headline, img, text, callback)
{
	if (callback == undefined) callback = function(){};
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
