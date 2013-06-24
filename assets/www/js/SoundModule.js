/**
 * class : SoundModule: Initializes and manages the sound and music effects.
 * For each type (sound and music) a extra audio element is used.
 * A listener handles the events from the gui elements which are used for volume settings.
 * 
 * Original version 1.0 released on 29.05.2012 by Richard Grötsch
 * Rewritten on 24.06.2013 by Sebastian Pabel
 *
 * @author  Richard Grötsch, Sebastian Pabel
 * @version 2.0
 * @since	24.06.2013
 */

//Use Singleton pattern
SoundModule.getInstance = function()
{
	if (SoundModule.instance == undefined) {
		SoundModule.instance = new SoundModule();
	}
		
	return SoundModule.instance;
}

//constructor
function SoundModule() {
	
	var audioExtensionWav = ".wav";
	var audioExtensionMp3 = ".mp3";
	var audioExtensionOgg = ".ogg";
	
	this.getAudioExtensionWav = function() {
		return audioExtensionWav;
	};
	this.getAudioExtensionMp3 = function() {
		return audioExtensionMp3;
	};
	this.getAudioExtensionOgg = function() {
		return audioExtensionOgg;
	};
	
	this.audioPath = app.resDir + 'audio/';
	
	this.init();
}

SoundModule.prototype.audioPath = 'res/audio/';
SoundModule.prototype.audioElementMusic = null;
SoundModule.prototype.audioSourceMusic = null;
SoundModule.prototype.soundEnabled = false;
SoundModule.prototype.platformAudioExt = "";
SoundModule.prototype.media_objs = {};

/**
 * first init
 */
SoundModule.prototype.init = function() {
	var self = this;
	
	switch (app.platform) {
    case "WinCE_disabled": // WP7 (With PhoneGap Audio), doesn't work well at the moment cause of a bug in PhoneGap
		// a special path to the audio files must be set
    	self.audioPath = "/app/www\\audio\\";
		// the complete source of the audio file
    	self.audioSourceMusic = self.audioPath + "theme" + self.getAudioExtensionMp3();
		// create a new phonegap media object for music
    	self.platformAudioExt = self.getAudioExtensionMp3();
		break;
	case "Android": // Android
		con.info("Platform: " + app.platform);
		// the complete source of the audio file
		self.audioSourceMusic = self.audioPath + "theme" + self.getAudioExtensionOgg();
		self.platformAudioExt = self.getAudioExtensionOgg();
		break;
    case "WinCE": // WP7 (with HTML5 Audio), can't play multiple sounds simultaneously
	case "Web": // Browser
		con.info("Platform: " + app.platform);
		// the html5 audio element for music
		self.audioElementMusic = document.getElementById("audioElementMusic");
		break;
	default:
		con.info("unknown platform: " + app.platform);
        return;
	}
	
	// create a new phonegap media object for music
	if (self.audioElementMusic == null) {
		self.audioElementMusic = new Media(
			self.audioSourceMusic,
			function() {
				//success callback function
				con.debug("Audio Success");
				self.audioElementMusic.play();
			},
			function(error) {
				//error callback function
				con.error("Audio Fail\ncode: " + error.code + "\nmessage: " + error.message);
			});
	}
	
	$('#sound_enable_btn').click(function() {
		if ($(this).is(':checked')) {
			con.info('sound has been enabled');
			self.soundEnabled = true;
			self.audioElementMusic.play();
		} else {
			con.info('sound disabled');
			self.soundEnabled = false;
			self.audioElementMusic.pause();
		}
	});
	
	self.audioElementMusic.pause();
}

/**
 * Plays an specified sound
 * @param string name the sound name
 */
SoundModule.prototype.playSfx = function(name) 
{
	var self = this;
	
    con.debug("playSfx: " + name);

	if (!self.soundEnabled){
		return;
	}

	var sfx = null;

	if (app.platform != "Web" && app.platform != "WinCE") {
		var audioSourceSfx = self.audioPath + name + self.platformAudioExt;
		con.info("sound enabled! play: " + audioSourceSfx);
		//mobile phone
		sfx = self.media_objs[name];
		if (sfx == undefined) {
			con.debug("create new Media Object for: " + name);
			sfx = new Media(
				audioSourceSfx,
				function() {
					
				},
				function() {
					con.error("Audio Fail\ncode: " + error.code + "\nmessage: " + error.message);
				}
			);
			self.media_objs[name] = sfx;
		}
	} else {
		//web
		sfx = document.getElementById("audio_" + name);
	}
	
    if (sfx != null) {
        try {
    		con.debug("Try to play");
		    sfx.play();
	    } catch (error) {
		    con.error("Catched error after try: " + error);
	    }
    }
}
