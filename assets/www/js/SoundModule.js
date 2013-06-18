/**
 * class : SoundModule: Initializes and manages the sound and music effects.
 * For each type (sound and music) a extra audio element is used.
 * A listener handles the events from the gui elements which are used for volume settings.
 * 
 * 
 * @author Richard Grötsch
 * @version 1.0
 * @since 29.05.2012
 */

// some global variables for audio element, gui element, path, audio formats
soundEnableCheckbox = null;
audioElementMusic = null;
audioSourceMusic = null;
audioSourceSfx = null;
audioPath = null;
audioExtensionWav = ".wav";
audioExtensionMp3 = ".mp3";
audioExtensionOgg = ".ogg";
platformAudioExt = "";

media_objs = {};

function SoundModule() {
	// determin on which platform the app is running to create the matching instances for audio
	audioPath = "res/audio/"
	switch (platform) {
    case "WinCE_disabled": // WP7 (With PhoneGap Audio), doesn't work well at the moment cause of a bug in PhoneGap
		// a special path to the audio files must be set
        audioPath = "/app/www\\audio\\";
		// the complete source of the audio file
		audioSourceMusic = audioPath + "theme" + audioExtensionMp3;
		// create a new phonegap media object for music
//		audioElementMusic = new Media(audioSourceMusic, onSuccessMusic, onErrorMusic);
		break;
	case "Android": // Android
		con.info("Platform: " + platform);
		// a special path to the audio files must be set
		audioPath = "/android_asset/www/" + audioPath;
		// the complete source of the audio file
		audioSourceMusic = audioPath + "theme" + audioExtensionOgg;
		break;
    case "WinCE": // WP7 (with HTML5 Audio), can't play multiple sounds simultaneously
	case "Web": // Browser
		con.info("Platform: " + platform);
		// a special path to the audio files must be set
		//audioPath = "res/audio/";
		// the html5 audio element for music
		audioElementMusic = document.getElementById("audioElementMusic");
		//audioElementMusic = document.getElementById("audio_error");
		break;
	default:
		con.info("unknown platform: " + platform);
        return;
	}
	// create a new phonegap media object for music
	audioElementMusic = new Media(audioSourceMusic, onSuccessMusic, onErrorMusic);
	
	soundEnableCheckbox = document.getElementById("sound_enable_btn");

	soundCheckBoxListener(document.getElementById("sound_enable_btn").checked);
}

function soundCheckBoxListener(checked) {
	if (checked) {
		soundEnableCheckbox.checked = true;
		audioElementMusic.play();
	} else {
		soundEnableCheckbox.checked = false;
		audioElementMusic.pause();
	}
}

function onSuccessMusic() {
	con.debug("Audio Success");
	audioElementMusic.play();
}

function onErrorMusic(error) {
	con.error("Audio Fail\ncode: " + error.code + "\nmessage: "
			+ error.message);
}

function onSuccessSfx() {
}

function onErrorSfx(error) {
	con.error("Audio Fail\ncode: " + error.code + "\nmessage: "
			+ error.message);
}

function playSfx(name) {

    con.debug("playSfx: " + name);

	if (!soundEnableCheckbox.checked)
		return;

	audioSourceSfx = audioPath + name + platformAudioExt;

	con.info("sound enabled! play: " + audioSourceSfx);
	
	var sfx = null;

	if (platform != "Web" && platform != "WinCE") {
		//mobile phone
		sfx = media_objs[name];
		if (sfx == undefined)
		{
			con.debug("create new Media Object for: " + name);
			sfx = new Media(audioSourceSfx, onSuccessSfx, onErrorSfx);
			media_objs[name] = sfx;
		}
	}
	else
	{
		//web
		sfx = document.getElementById("audio_" + name);
	}
	
    if (sfx != null)
    {
        try {
    		con.debug("Try to play");
		    sfx.play();
	    } catch (error) {
		    con.error("Catched error after try: " + error);
	    }
    }
}
