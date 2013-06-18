/**
 * class : Storage: Handles hints and highscores. Also provides save and load methods
 * to pause/resume the game at any given game state.
 * 
 * How is saving done?
 * Saving takes the this.data object (containing hints, highscores and the current player),
 * stringifys the object and saves it to the local storage. Loading is done vice-versa.
 * 
 * @author Tobias Sielaff
 * @version 1.0
 * @since 09.06.2012
 */

function Storage()
{
	var self = this;
	
	// Achievements.
	this.achievements = {};
	
	// Highscore Constants
	this.setHighscoreConstants();
	
	// Init.
	if (localStorage.data != null)
		this.load();
	else
		this.reset(false);
		
	// Pages not yet init.
	initPages = false;
	
	// Add event listner for saving.
	document.addEventListener("pause", function() { self.save() }, false);
	document.addEventListener("startcallbutton", function() { self.save() }, false);
	
	// Add page hooks.
	$(document).bind( "pagebeforechange", function(e, data) {
		if (typeof data.toPage === "string") {
			var url = $.mobile.path.parseUrl( data.toPage );
			if (url.hash == "#menuhints") {	
				var $page = $(url.hash),
					$content = $page.children( ":jqmData(role=content)" );
				
				if (!self.initPages) {
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
							id = $(this).attr('id');
							ach = self.achievements[id.toUpperCase()];
									
							if (self.hasUnlockedAchievement(ach.id)) {
								// http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
								exp = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
								url = ach.desc.match(exp) + "";
								
								// Phonegap present?
								if (navigator.notification) {
									// Native confirm dialog.
									navigator.notification.confirm(
										'Do you want to visit the OTMA website for futher information on this hint? Any unsaved progress might be lost!',
										function(button) {	
											// Navigate.
											if (button == 1) {
												// Save game state.
												self.save();
												
												// 1 == ok, 2 == cancel
												navigator.app.loadUrl(url, { openExternal: true });
											}
										},
										'Confirm', 
										'Ok,Cancel'
									);
								}
								else {
									ret = confirm('Do you want to visit the OTMA website for futher information on this hint? Any unsaved progress might be lost!');
									if (ret)
										window.location = url;
								}
							}
						});
					}
					
					self.initPages = true;
				}
				
				// Enhance the page.
				$page.page();
				
				// Mark completed achievements.
				for (name in self.achievements) {
					if (self.hasUnlockedAchievement(self.achievements[name].id)) {
						// Create selector
						var sel = "#hint_" + self.achievements[name].id;
						$(sel).attr("checked", true).checkboxradio("refresh");
					}
				}
								
				// Now call changePage() and tell it to switch to
				// the page we just modified.
				$.mobile.changePage( $page );
					
				// Make sure to tell changePage() we've handled this call so it doesn't
				// have to do anything.
				e.preventDefault();
			}
			else if (url.hash == "#menustats") {
				var $page = $(url.hash),
					$content = $page.children( ":jqmData(role=content)" );

				// Update time before drawing.
				self.updateTime();

				// Print.
				$("label[for='stats-1']").text(self.getPlayedTime() + " seconds");
				$("label[for='stats-2']").text(self.getSteps());
				$("label[for='stats-3']").text(self.getClicks());
				$("label[for='stats-4']").text(self.getDialogs());
				
				// Enhance the page.
				$page.page();
				
				// Now call changePage() and tell it to switch to
				// the page we just modified.
				$.mobile.changePage( $page );
				
				// Make sure to tell changePage() we've handled this call so it doesn't
				// have to do anything.
				e.preventDefault();
			}
			else if (url.hash == "#highscore") {
				var $page = $(url.hash),
					$content = $page.children( ":jqmData(role=content)" );
				
				self.clearHighscoreView();
				self.createHighscoreView(self);
	
				// Now call changePage() and tell it to switch to
				// the page we just modified.
				$.mobile.changePage( $page );
				
				// Make sure to tell changePage() we've handled this call so it doesn't
				// have to do anything.
				e.preventDefault();
			}
		}
	});
}

Storage.prototype.initHints = function(xml)
{
	// Load achievements.
	for (var i in xml.otma.hints) {
		var hint = {};
		hint.id = i;
		hint.name = xml.otma.hints[i].title;
		hint.desc = xml.otma.hints[i].text;
		this.achievements["HINT_" + i] = hint;
	}
}

Storage.prototype.save = function()
{	
	// Update time before saving.
	this.updateTime();
	
	// Save.
	localStorage.data = JSON.stringify(this.data);
};

Storage.prototype.load = function()
{
	// Load.
	this.data = JSON.parse(localStorage.data);
	
	// Init last time.
	var d = new Date();
	this.lastTime = d.getTime();
};

Storage.prototype.reset = function(retainHighscores)
{
	this.data = {
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
		var data = JSON.parse(localStorage.data);
		
		// Safety first.
		if (data == null)
			return;
		
		// Null out everything but the highscores.
		this.data.highscores = data.highscores;
	}
	
	// Save.
	this.save();
}

Storage.prototype.updateTime = function()
{
	var d = new Date();
	var time = d.getTime();
	
	if (time >= this.lastTime) {
		this.data.stats.curTime += ((d.getTime() - this.lastTime) / 1000) | 0;
		this.lastTime = d.getTime();
	}
};

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

Storage.prototype.incSteps = function(steps)
{
	if (steps == undefined)
		steps = 1;
	
	this.data.stats.curSteps += steps;
};

Storage.prototype.incClicks = function(clicks)
{
	if (clicks == undefined)
		clicks = 1;
	
	this.data.stats.curClicks += clicks;
};

Storage.prototype.incDialogs = function(dialogs)
{
	if (dialogs == undefined)
		dialogs = 1;
	
	this.data.stats.curDialogs += dialogs;
};

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

Storage.prototype.hasSavedPlayer = function()
{
	return (this.getName() != null && this.getGender() != null && this.getHairColor() != null && this.getClothColor() != null);
};

Storage.prototype.unlockAchievement = function(name)
{
	if (name in this.achievements)
		this.unlockAchievement(name);
};

Storage.prototype.unlockAchievement = function(name, callback)
{
	var ach = this.achievements[name];
	if (!ach)
		return false;
	
	if (!this.hasUnlockedAchievement(ach.id)) {
		this.data.achievements.unlocked.push(ach.id);
		this.save();
		this.showAchievmentUnlocked(ach, callback);
			
		// Update GUI.
		$("#hints_btn .ui-btn-text").text(
				"Hints (" + this.getUnlockedAchievements().length + "/6)");
				
		// Play sound.
		playSfx("achievementUnlocked");
	}
	else 
	{
		var dialog = new Dialog("talk", "Hint already received!", null, ach.desc, callback);
		dialogMgr.openDialog(dialog);
	}
};

Storage.prototype.hasUnlockedAchievement = function (id)
{
	for (var i = 0; i < this.getUnlockedAchievements().length; i++) {
		if (this.data.achievements.unlocked[i] == id)
			return true;
	}	
};

Storage.prototype.getUnlockedAchievements = function ()
{
	return this.data.achievements.unlocked;
};

Storage.prototype.showAchievmentUnlocked = function(ach, callback)
{
	var dialog = new Dialog("talk", "Hint unlocked!", null, ach.desc, callback);
	dialogMgr.openDialog(dialog);
};

Storage.prototype.setHighscoreConstants = function(){
	// Highscore Constants
	this.weightTime = 0.00001;
	this.weightSteps = 0.0001;
	this.weightClicks = 0.0002;
	this.weightDialogs = 0.0003;
	this.maxScore = 10000;
	this.minScore = 100;
}

Storage.prototype.createHighscoreView = function(self){
	var themeHeader = null;
	var themeContent = null;
	for (var i = 0; i < this.data.highscores.highscore.length; i++) {
		if (i == 0) {
			themeHeader = 'e';
			themeContent = 'e';
		} else {

			themeHeader = 'c';
			themeContent = 'c';
		}
		
		$('<div data-role="collapsible" data-mini="true" data-theme="' + themeHeader +'" data-content-theme="' + themeContent +'">\
			<h3>' + ((i<9) ? '&nbsp;&nbsp;' + (i+1) : (i+1)) + '. ' + this.data.highscores.highscore[i].playerName + ':  ' + this.data.highscores.highscore[i].score + ' points</h3>\
			<table class="highscoreTable">\
	        	<tr>\
		            <td><label>Time: ' + this.data.highscores.highscore[i].time + '</label></td>\
		            <td><label>Steps: ' + this.data.highscores.highscore[i].steps + '</label></td>\
		            <td><label>Clicks: ' + this.data.highscores.highscore[i].clicks + '</label></td>\
		            <td><label>Dialogs: ' + this.data.highscores.highscore[i].dialogs + '</label></td>\
		        </tr>\
			</table>\
		</div>')
		.collapsible()
		.appendTo('#highscoreContent');
	}
};

Storage.prototype.clearHighscoreView = function(){
	$('#highscoreContent').empty();
};

Storage.prototype.calculateScore = function() {
	var score = this.maxScore
			* Math.exp(-(
				this.weightTime * this.getPlayedTime() + 
				this.weightSteps * this.getSteps() + 
				this.weightClicks * this.getClicks() + 
				this.weightDialogs * this.getDialogs()
			));
	score = Math.floor(score);
	if (score < this.minScore)
		return this.minScore;
	return score;
}

Storage.prototype.saveHighscore = function(playerName){
	var highscore = new Object();
	this.updateTime();
	highscore.playerName = playerName;
	highscore.score = this.calculateScore();
	highscore.time = this.getPlayedTime();
	highscore.steps = this.getSteps();
	highscore.clicks = this.getClicks();
	highscore.dialogs = this.getDialogs();
	this.data.highscores.highscore.push(highscore);
	this.data.highscores.highscore.sort(function(a,b){return b.score - a.score});
	while(this.data.highscores.highscore.length > 10){
		this.data.highscores.highscore.splice(this.data.highscores.highscore.length - 1,1);
	}
	this.save();
};