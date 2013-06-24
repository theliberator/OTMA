/**
 * class : Storage: Handles hints and highscores. Also provides save and load methods
 * to pause/resume the game at any given game state.
 * 
 * How is saving done?
 * Saving takes the this.data object (containing hints, highscores and the current player),
 * stringifys the object and saves it to the local storage. Loading is done vice-versa.
 * 
 * Rewritten by Sebastian Pabel on 22.06.2013
 * 
 * @author Tobias Sielaff, Sebastian Pabel
 * @version 2.0
 * @since 22.06.2013
 */

// Use Singleton pattern
Storage.getInstance = function()
{
	if (Storage.instance == undefined) 
		Storage.instance = new Storage();
		
	return Storage.instance;
}

//Constructor
function Storage()
{
	// Init.
	if (localStorage > 0 && localStorage.data.length > 0) {
		this.load();
	} else {
		this.reset(false);
	}
}

//Achievements.
Storage.prototype.achievements = {};
//Pages not yet init.
Storage.prototype.isPagesInit = false;
//Data
Storage.prototype.data = null;
Storage.prototype.lastTime = null;

//Highscore constants
Storage.prototype.weightTime = 0.00001;
Storage.prototype.weightSteps = 0.0001;
Storage.prototype.weightClicks = 0.0002;
Storage.prototype.weightDialogs = 0.0003;
Storage.prototype.maxScore = 10000;
Storage.prototype.minScore = 100;

/**
 * saves data to the local storage
 */
Storage.prototype.save = function()
{
	if (app.platform != 'Web') {
		//we dont use "this" in here, because this method will be called by an event handler. And "this" would be
		//the event in this scope
		
		// Update time before saving.
		Storage.getInstance().updateTime();
		
		// Save.
		localStorage.data = JSON.stringify(Storage.getInstance().data);
	}
};

/**
 * Loads data from the local storage
 */
Storage.prototype.load = function()
{
	// Load.
	this.data = JSON.parse(localStorage.data);
	
	// Init last time.
	var d = new Date();
	this.lastTime = d.getTime();
};

/**
 * Resets the local storage
 * calls save afterwards
 * @param bool retainHighscores if set to true the highscores will be kept
 * @see Storage.save()
 */
Storage.prototype.reset = function(retainHighscores)
{
	var self = this;
	self.data = {
		stats: {
			curTime: 0,
			curSteps: 0,
			curClicks: 0,
			curDialogs: 0
		},
		achievements: {
			unlocked: []
		},
		highscores: {
			highscore: []
		},
		player: {
			name: null,
			gender: null,
			hairColor: null,
			clothColor: null
		}
	};
	
	if (retainHighscores) {
		// Load local storage.
		
		if (localStorage.length == 0 && localStorage.data.length == 0) {
			return; //nothing to load
		}
		var data = JSON.parse(localStorage.data);
		
		// Null out everything but the highscores.
		self.data.highscores = data.highscores;
	}
	
	// Save.
	this.save();
};

/**
 * Inits the pages and sets isPagesInit to true if successfull
 */
Storage.prototype.initPages = function() {
	var self = this;
	// Setup checkboxes.
	for (name in self.achievements) {
		// Create selector (no # because of stupid jquery syntax)
		var sel = "hint_" + self.achievements[name].id;	
		
		// Set label.
		$("label[for='" + sel + "']").text(self.achievements[name].name);
		
		// Prevent manual changes
		$("#" + sel).change(function () {
			$(this).attr("checked", !this.checked);
		});
		
		// Give desc
		$("#" + sel).click(function () {
			ach = self.achievements[$(this).attr('id').toUpperCase()];
					
			if (self.hasAchievementUnlocked(ach.id)) {
				// http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
				var regExp = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
				var url = ach.desc.match(regExp) + "";
				
				// Phonegap present?
				if (navigator.notification) {
					// Native confirm dialog.
					navigator.notification.confirm(
						'Do you want to visit the OTMA website for futher information on this hint? Any unsaved progress might be lost!',
						function(button) {	
							// 1 == ok, 2 == cancel
							if (button == 1) {
								// Save game state.
								self.save();
								
								//only android supports the navigator.app api
								if (device.platform == 'Android') {
									navigator.app.loadUrl(url, { openExternal: true });
								} else {
									window.location.href = url;
								}
							}
						},
						'Confirm', 
						'Ok,Cancel'
					);
				} else {
					ret = confirm('Do you want to visit the OTMA website for futher information on this hint? Any unsaved progress might be lost!');
					if (ret) {
						window.location = url;
					}
				}
			}
		});
	}
	
	self.isPagesInit = true;
};

/**
 * Marks the unlocked achievements
 */
Storage.prototype.markUnlockedAchievements = function() {
	var self = this;
	for (name in self.achievements) {
		if (self.hasAchievementUnlocked(self.achievements[name].id)) {
			// Create selector
			$("#hint_" + self.achievements[name].id).attr("checked", true).checkboxradio("refresh");
		}
	}
};

/**
 * Draws the stat page
 */
Storage.prototype.drawStats = function() {
	var self = this;
	// Update time before drawing.
	self.updateTime();

	// Print.
	$("label[for='stats-1']").text(self.getPlayedTime() + " seconds");
	$("label[for='stats-2']").text(self.getSteps());
	$("label[for='stats-3']").text(self.getClicks());
	$("label[for='stats-4']").text(self.getDialogs());
};

/**
 * Updates the time in the stats
 */
Storage.prototype.updateTime = function()
{
	var self = this;
	var d = new Date();
	var time = d.getTime();
	
	if (time >= this.lastTime) {
		self.data.stats.curTime += ((d.getTime() - self.lastTime) / 1000) | 0;
		self.lastTime = d.getTime();
	}
};

/**
 * Loads the hints from the xml file
 */
Storage.prototype.initHints = function()
{
	var self = this;
	var configLoader = XMLConfigLoader.getInstance();
	// Load achievements.
	for (var i in configLoader.otma.hints) {
		var hint = {};
		hint.id = i;
		hint.name = configLoader.otma.hints[i].title;
		hint.desc = configLoader.otma.hints[i].text;
		self.achievements["HINT_" + i] = hint;
	}
}

/**
 * Updates steps count
 * @param int steps (optional) Number of steps to add to. If this value is not set, the current value will be incremented
 */
Storage.prototype.incSteps = function(steps)
{
	if (steps == undefined) {
		steps = 1;
	}
	this.data.stats.curSteps += steps;
};

/**
 * Updates clicks count
 * @param int clicks (optional) Number of clicks to add to. If this value is not set, the current value will be incremented
 */
Storage.prototype.incClicks = function(clicks)
{
	if (clicks == undefined) {
		clicks = 1;
	}
	this.data.stats.curClicks += clicks;
};

/**
 * Updates dialogs count
 * @param int dialogs (optional) Number of dialogs to add to. If this value is not set, the current value will be incremented
 */
Storage.prototype.incDialogs = function(dialogs)
{
	if (dialogs == undefined) {
		dialogs = 1;
	}
	this.data.stats.curDialogs += dialogs;
};

/**
 * Checks if there is a saved player
 */
Storage.prototype.hasSavedPlayer = function()
{
	return (this.getName() != null && this.getGender() != null && this.getHairColor() != null && this.getClothColor() != null);
};

/**
 * unlocks an achievement
 * @param string name the name of the achievement
 * @param function callback a callback function that will be called after the achievement has been unlocked
 * @return false if the achievement doesn't exist
 */
Storage.prototype.unlockAchievement = function(name, callback)
{
	var self = this;
	
	var ach = self.achievements[name];
	if (!ach) {
		return false;
	}
	
	var dialogMgr = DialogMgr.getInstance();
	
	if (!self.hasAchievementUnlocked(ach.id)) {
		self.data.achievements.unlocked.push(ach.id);
		self.save();
		dialogMgr.openDialog(new Dialog("talk", "Hint unlocked!", null, ach.desc, callback));
			
		// Update GUI.
		$("#hints_btn .ui-btn-text").text("Hints (" + self.getUnlockedAchievements().length + "/6)");
				
		// Play sound.
		SoundModule.getInstance().playSfx("achievementUnlocked");
	} else {
		dialogMgr.openDialog(new Dialog("talk", "Hint already received!", null, ach.desc, callback));
	}
};

/**
 * checks if the given achievement is already unlocked
 * @param string id the id of the achievement
 * @return true if unlocked, otherwise false
 */
Storage.prototype.hasAchievementUnlocked = function (id)
{
	var self = this;
	for (var i = 0; i < self.getUnlockedAchievements().length; i++) {
		if (self.data.achievements.unlocked[i] == id) {
			return true;
		}
	}
	return false;
};

/**
 * creates the highscore view
 */
Storage.prototype.createHighscoreView = function(){
	var self = this;
	for (var i = 0; i < self.data.highscores.highscore.length; i++) {
		var themeHeader = 'c';
		var themeContent = 'c';
		if (i == 0) {
			themeHeader = 'e';
			themeContent = 'e';
		}
		
		$('<div data-role="collapsible" data-mini="true" data-theme="' + themeHeader +'" data-content-theme="' + themeContent +'">\
			<h3>' + ((i<9) ? '&nbsp;&nbsp;' + (i+1) : (i+1)) + '. ' + self.data.highscores.highscore[i].playerName + ':  ' + self.data.highscores.highscore[i].score + ' points</h3>\
			<table class="highscoreTable">\
	        	<tr>\
		            <td><label>Time: ' + self.data.highscores.highscore[i].time + '</label></td>\
		            <td><label>Steps: ' + self.data.highscores.highscore[i].steps + '</label></td>\
		            <td><label>Clicks: ' + self.data.highscores.highscore[i].clicks + '</label></td>\
		            <td><label>Dialogs: ' + self.data.highscores.highscore[i].dialogs + '</label></td>\
		        </tr>\
			</table>\
		</div>')
		.collapsible()
		.appendTo('#highscoreContent');
	}
};

/**
 * calculates the current score
 */
Storage.prototype.calculateScore = function() {
	var self = this;
	var score = self.maxScore
			* Math.exp(-(
				self.weightTime * self.getPlayedTime() + 
				self.weightSteps * self.getSteps() + 
				self.weightClicks * self.getClicks() + 
				self.weightDialogs * self.getDialogs()
			));
	score = Math.floor(score);
	if (score < self.minScore) {
		score = self.minScore;
	}
	return score;
}

/**
 * saves the highscore and sorts it
 * @param string playerName the current player
 */
Storage.prototype.saveHighscore = function(playerName){
	var self = this;
	var highscore = new Object();
	self.updateTime();
	highscore.playerName = playerName;
	highscore.score = this.calculateScore();
	highscore.time = this.getPlayedTime();
	highscore.steps = this.getSteps();
	highscore.clicks = this.getClicks();
	highscore.dialogs = this.getDialogs();
	self.data.highscores.highscore.push(highscore);
	self.data.highscores.highscore.sort(function(a,b){return b.score - a.score});
	while(self.data.highscores.highscore.length > 10){
		self.data.highscores.highscore.splice(self.data.highscores.highscore.length - 1,1);
	}
	this.save();
};

/* Getter and Setter */
Storage.prototype.getPlayedTime = function()
{
	return this.data.stats.curTime;
};

Storage.prototype.getSteps = function()
{
	return this.data.stats.curSteps;
};

Storage.prototype.getClicks = function()
{
	return this.data.stats.curClicks;
};

Storage.prototype.getDialogs = function()
{
	return this.data.stats.curDialogs;
};

Storage.prototype.getName = function()
{
	return this.data.player.name;
};

Storage.prototype.getGender = function()
{
	return this.data.player.gender;
};

Storage.prototype.getHairColor = function()
{
	return this.data.player.hairColor;
};

Storage.prototype.getClothColor = function()
{
	return this.data.player.clothColor;
};

Storage.prototype.getUnlockedAchievements = function ()
{
	return this.data.achievements.unlocked;
};
/*---*/
Storage.prototype.setName = function(name)
{
	this.data.player.name = name;
};

Storage.prototype.setGender = function(gender)
{
	this.data.player.gender = gender;
};

Storage.prototype.setHairColor = function(hairColor)
{
	this.data.player.hairColor = hairColor;
};

Storage.prototype.setClothColor = function(clothColor)
{
	this.data.player.clothColor = clothColor;
};