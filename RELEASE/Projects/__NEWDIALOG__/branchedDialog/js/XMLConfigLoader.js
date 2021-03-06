/**
 * This class is responsible for parsing xml configuration files (mainly
 * mapEvents.xml, mapLayout.xml and the dynamically loaded otma-config.xml) and
 * extracting level layouts from them.
 *
 * For 'map' members, the final classes used in the game (like npcs, events,
 * etc. are created on the fly. For 'otma' members only the layout is stored.
 * Final classes are later generated by the StoryGenerator class.
 *
 * @author	Michael Seider
 * @version 0.9
 * @since	19.5.2012
 */
function XMLConfigLoader()
{
	this.otma = {};
	this.otma.dialogPageCollection = new DialogPageCollection();
}

function DialogPageCollection() {
	this.dialogPages = new Array();
}

DialogPageCollection.prototype.getDialogPageById = function(id) {
	var self = this;
	
	for(var i=0; i<self.dialogPages.length; i++) {
		var dialogPage = self.dialogPages[i];
		if(dialogPage.id == id) {
			return dialogPage;
		}
	}
}

XMLConfigLoader.prototype.parseDialogPages = function(xmlDoc)
{
	var dialogPageNodes = xmlDoc.getElementsByTagName("DialogPage");

	for (var i = 0; i < dialogPageNodes.length; i++)
	{
		var dialogPageNode = dialogPageNodes[i];
		
		var id = dialogPageNode.getAttribute('id');
		var message = dialogPageNode.getElementsByTagName('Content')[0].childNodes[0].nodeValue;
		var options = getOptions(dialogPageNode);
	
		this.otma.dialogPageCollection.dialogPages[i] = new DialogPageData(id, message, options);
	}
};

function getOptions(dialogPageNode) {
	var optionsNode = dialogPageNode.getElementsByTagName('Options')[0];	
	var children = getChildren(optionsNode);
	var options = new Array();
	
	for(var i=0; i<children.length; i++) {
		var child = children[i];		
		var id = child.getAttribute('id');
		var text;
		
		if(child.tagName=='Answer') {
			text = child.getElementsByTagName('Text')[0].textContent;
			var successor = child.getAttribute('successor');
			options[i] = new Answer(id,text,successor);
		}
		else if(child.tagName=='Hint') {
			text = child.textContent;
			options[i] = new Hint(id,text);
		}
	}
	return options;
}

function getChildren(xmlNode) {
	var children = new Array();
	var childIndex = 0;
    for (var childNodeIndex=0; childNodeIndex < xmlNode.childNodes.length; childNodeIndex++) {
		if(xmlNode.childNodes[childNodeIndex].nodeType == 1) {
			children[childIndex] = xmlNode.childNodes[childNodeIndex];
			childIndex++;
		}       
    }
    return children;
}

function DialogPageData(id,message,options) {
	this.id=id;
	this.message=message;
	this.options=options;
}

function Answer(id, text, successor) {
	this.id=id;
	this.text=text;
	this.successor=successor;
}

function Hint(id, text) {
	this.id=id;
	this.text=text;
}


/* Load and parse branched dialog related stuff. */
XMLConfigLoader.prototype.loadBranchedDialogXML = function(filename, callback) {
	var self = this;
	
    loadXMLDoc(filename, function(xmlDoc) { 
		self.parseDialogPages(xmlDoc);
		callback();
	});
};
