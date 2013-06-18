/**
 * class : Downloader: Wrapper for PhoneGap's FileTransfer.download.
 * It's a singleton pattern based class, don't call new on it! Use the
 * getInstance()-method.
 * 
 * How to use:
 * 1.) Call Downloader.Init(), wait for device is ready event, otherwise the downloader
 * will fail.
 * 2.) Add callbacks for successful download of one file or all queued files.
 * 3.) Tell the Downloader to download stuff! Just throw all the files needed in using
 * Downloader.queueFile, watch the callbacks for status updates.
 * 
 * @author Tobias Sielaff
 * @version 1.0
 * @since 09.06.2012
 */
 
function updateConfig()
{
	// Show spinner.
	$.mobile.showPageLoadingMsg();
	
	// Get downloader and add callbacks.
	dl = Downloader.getInstance();
	dl.allDownloadsCompleteCallback(function() { window.location = 'index.html'; $.mobile.hidePageLoadingMsg(); });
	
	// Download stuff.
	dl.queueFile("http://www.onthemove-academy.org/images/documents/otma-config-game-xml.pdf", "otma-config.xml");
}

function Downloader()
{
	// Internal state
	this.ready = false;
	this.running = false;
	
	// Base path.
	this.basePath = null;
	
	// Download list.
	this.downloadList = new Array();
	
	// Downloader.
	this.fileTransfer = null;
	
	// Callbacks.
	allDownloadsComplete = null;
	downloadComplete = null;
	
	// Add page hook.
	var self = this;
	$(document).bind( "pagebeforechange", function(e, data) {
		if (typeof data.toPage === "string") {
			var url = $.mobile.path.parseUrl( data.toPage );
			if (url.hash == "#menu1") {
				// Enable update button if downloader is ready.
				if (self.ready)
					$("#update_btn").attr("class", "");
			}
		}
	});
}

// Don't call new on the downloader.
Downloader.getInstance = function()
{
	if (Downloader.instance == undefined) 
		Downloader.instance = new Downloader();
		
	return Downloader.instance;
}

Downloader.prototype.init = function()
{
	// Add listener that fires once the device is ready.
	var self = this;
	document.addEventListener("deviceready", function () {
		// Our downloader.
		con.debug("Init'ing fileTransfer");
		self.fileTransfer = new FileTransfer();
		
		// Base path.
		con.debug("Init'ing basePath");
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
			function sucess(fileSystem) {
				con.debug("Got filesystem...");
				fileSystem.root.getDirectory("otma", {create: true, exclusive: false}, 
					function success(parent) {
						con.info("Got folder... " + parent.fullPath);
						self.basePath = parent.fullPath;
					},
					function fail(error) {
						con.error("Error in requestBasePath: " + error.code);
					}
				);
			}, 
			function fail(evt) {
				con.error("Error in requestBasePath: " + evt.target.error.code)
			}
		);
		
		// We are ready!
		self.ready = true;
	}, false);
};

Downloader.prototype.allDownloadsCompleteCallback = function(func)
{
	this.allDownloadsComplete = func;
};

Downloader.prototype.downloadCompleteCallback = function(func)
{
	this.downloadComplete = func;
};

Downloader.prototype.queueFile = function(url, name)
{
	var self = this;
	
	// Either not yet ready or running in browser.
	if (!self.ready) {
		// Debug.
		con.error("queueFile failed: device not ready!");
		return false;
	}
	
	// Base path?
	if (!self.hasBasePath()) {
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
	if (!self.running) {
		self.running = true;
		self.downloadFile(url, name);		
	}
	
	// Yay!
	return true;
};

Downloader.prototype.moveToNextFile = function(lastFile, success)
{
	var self = this;
	
	// Null the entry.
	self.downloadList[lastFile] = null;
	
	// Callback for one file complete.
	if (self.downloadComplete != null || self.downloadComplete != undefined)
		self.downloadComplete(lastFile, success);
	
	// More files?
	for (key in self.downloadList) {
		if (self.downloadList[key] != null) {
			self.downloadFile(self.downloadList[key], key);
			return;
		}
	}
					
	// Nope.
	self.running = false;
	
	// Callback!
	if (self.allDownloadsComplete != null || self.allDownloadsComplete != undefined)
		self.allDownloadsComplete();
};

Downloader.prototype.downloadFile = function(url, name)
{
	// My instance.
	var self = this;
	
	// Download!
	var filePath = self.getBasePath() + "/" + name;
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

Downloader.prototype.hasBasePath = function()
{
	return (this.getBasePath() != null);
};

Downloader.prototype.getBasePath = function()
{
	return this.basePath;
};

Downloader.prototype.fileExists = function(path, fileExistsCallback, fileNotExistsCallback)
{
	if (!this.ready) {
		fileNotExistsCallback();
		return;
	}

	window.resolveLocalFileSystemURI(path, fileExistsCallback, fileNotExistsCallback);
};