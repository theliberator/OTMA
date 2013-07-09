/** 
 * Author of Version 1.0 released on 09.06.2012: Tobias Sielaff
 * 
 * Completely rewritten on 22.06.2013 by Sebastian Pabel
 * 
 * @author Tobias Sielaff, Sebastian Pabel
 * @version 2.0
 * @since 22.06.2013
 */
 
 /**
 * @classdesc Downloader is a wrapper for PhoneGap's FileTransfer.download.
 */

/**
 * Used to access Downloader. 
 * 
 * @returns {Downloader} The singleton instance.
 */
Downloader.getInstance = function()
{
	if (Downloader.instance == undefined) {
		Downloader.instance = new Downloader();
	}
		
	return Downloader.instance;
}
 
/**
 * Constructor, should not be used from outside.
 * Use getInstance() instead.
 *
 * @constructor
 * @returns {Downloader} 
*/
function Downloader() { }

/**
 * @property {boolean} isReady Indicates if downloads have finished.
 */
Downloader.prototype.isReady = false;

/**
 * @property {boolean} isRunning Indicates if any download transactions are running.
 */
Downloader.prototype.isRunning = false;

/**
 * @property {object} downloadList List of downloads. 
 */
Downloader.prototype.downloadList = new Array();

/**
 * @property {string} basePath Base path for downloads.
 */
Downloader.prototype.basePath = null;

/**
 * @property {object} fileTransfer The PhoneGap file transfer object used for downloading.
 */
Downloader.prototype.fileTransfer = null;

/**
 * Callback function when all downloads have finished.
 * Sets location back to index.html and hides the loading message.
 */
Downloader.prototype.allDownloadsCompleteCallback = function() {
	window.location = 'index.html';
	$.mobile.hidePageLoadingMsg(); 
};

/**
 * @property {function} downloadCompleteCallback Property to hold callback function when a download has finished.
 */
Downloader.prototype.downloadCompleteCallback = null;

/**
 * @property {string} updateUrl Url used for updates.
 */
Downloader.prototype.updateUrl = "http://www.onthemove-academy.org/images/documents/otma-config-game-xml.pdf";

/**
 * @property {string} updateFilename Filename of file to update.
 */
Downloader.prototype.updateFilename = "otma-config.xml";

/**
 * Downloads a file
 * @param string url the url where the new is located
 * @param string name the filename of the new config file
 * @returns true if success, otherwise false
 */
Downloader.prototype.queueFile = function(url, name)
{
	var self = this;
	
	// Either not yet ready or running in browser.
	if (!self.isReady) {
		// Debug.
		con.error("queueFile failed: device not ready!");
		return false;
	}
	
	// Base path?
	if (self.basePath == null) {
		// Debug.
		con.warning("No base path...");
		return false;
	}
		
	// Duplicate?
	if (name in self.downloadList) {
		// Debug.
		con.warning("queueFile failed: duplicate file!");
		return false;
	}
		
	// Add to list.
	self.downloadList[name] = url;
	con.debug("file added to download list")
	
	// Start downloader (if not running)
	if (!self.isRunning) {
		self.isRunning = true;
		self.downloadFile(url, name);		
	}
	
	// Yay!
	return true;
};

/**
 * Downloads a file from a given resource.
 *
 * @param string url The URL where the file is located.
 * @param string name The filename.
 */
Downloader.prototype.downloadFile = function(url, name)
{
	// My instance.
	var self = this;
	
	// Download!
	var filePath = self.basePath + "/" + name;
	self.fileTransfer.download(
		url,
		filePath,
		function success(entry) {
			// Move along.
			self.moveToNextFile(name, true);
		},
		function fail(error) {
			// Move along.
			self.moveToNextFile(name, false);
		}
	);
};

/**
 * Moves along to the next file if any.
 *
 * @param string lastFile the filename of the last downloaded file
 * @param bool success wether the last file was downloaded successfully or not
 */
Downloader.prototype.moveToNextFile = function(lastFile, success)
{
	var self = this;
	
	// Null the entry.
	self.downloadList[lastFile] = null;
	
	// Callback for one file complete.
	if (self.downloadCompleteCallback != null || self.downloadCompleteCallback != undefined) {
		self.downloadCompleteCallback(lastFile, success);
	}
	
	// More files?
	for (key in self.downloadList) {
		if (self.downloadList[key] != null) {
			self.downloadFile(self.downloadList[key], key);
			return;
		}
	}
					
	self.isRunning = false;
	
	// Callback!
	if (self.allDownloadsCompleteCallback != null || self.allDownloadsCompleteCallback != undefined)
		self.allDownloadsCompleteCallback();
};

/**
 * Checks if a file exists
 *
 * @param string fullFilename filename with path which should be checked
 * @param function fileExistsCallback function that will be called if file exists
 * @param function fileNotExistsCallback function that will be called if file does not exist
 */
Downloader.prototype.fileExists = function(fullFilename, fileExistsCallback, fileNotExistsCallback)
{
	if (!this.isReady) {
		fileNotExistsCallback();
		return;
	}

	window.resolveLocalFileSystemURI(fullFilename, fileExistsCallback, fileNotExistsCallback);
};

/**
 * Updates the config file
 */
Downloader.prototype.updateConfig = function()
{
	// Show spinner.
	$.mobile.showPageLoadingMsg();
	
	// Download stuff.
	this.queueFile(this.updateUrl, this.updateFilename);
}