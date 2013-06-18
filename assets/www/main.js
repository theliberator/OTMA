/**
 * The main module of the OTMA-Game
 *
 * Here some initialisation of the game is done. The Game-Timer is located here.
 * And a reset game function. Which is able the end the current game. And can reset the 
 * Highscores.
 * 
 * @author Ulrich Hornung, Tobias Sielaff, Richard Grötsch, Michael Seider
 * @version 1.0
 * @since 09.06.2012
 */

//var first_call_of_main = true;

/* main function. called directly after phonegap-init (and after 1 second in webbrowser) */
function main() {

	platform = "Web";
    con.debug("main() -------------------------------- ");
	
	// Hook pagebeforchange.
	$(document).bind( "pagebeforechange", function(e, data) {
		if (typeof data.toPage === "string") {
			var url = $.mobile.path.parseUrl( data.toPage );
			if (url.hash == "#newgamepage") {
				// set initial colors
				var hairColor = "goldenrod";
				var clothColor = "white";

				// hair color picker
				var lastColorSpanHair = null;
				$('#hairColor').empty().addColorPicker({
					clickCallback : function(span, color) {
						if (lastColorSpanHair) {
							lastColorSpanHair.css({
								"border-color" : "black",
								"border-width" : "1px"
							});
						}
						else{
							$('#defaultHairColor').css({
								"border-color" : "black",
								"border-width" : "1px"
							});
						}
						lastColorSpanHair = span;
						span.css({
							"border-color" : "#e20000",
							"border-width" : "3px"
						});
						hairColor = span.attr("title");
					},
					colors : [ 'goldenrod', 'peru' ],
					context : "Hair"
				});
				
				// cloth color picker
				var lastColorSpanCloth = null;
				$('#clothColor').empty().addColorPicker({
					clickCallback : function(span, color) {
						if (lastColorSpanCloth) {
							lastColorSpanCloth.css({
								"border-color" : "black",
								"border-width" : "1px"
							});
						}
						else{
							$('#defaultClothColor').css({
								"border-color" : "black",
								"border-width" : "1px"
							});
						}
						lastColorSpanCloth = span;
						span.css({
							"border-color" : "#e20000",
							"border-width" : "3px"
						});
						clothColor = span.attr("title");;
					},
					context : "Cloth"
				});
				
				var start_btn = document.getElementById("start_btn");
				start_btn.onclick = function()
				{
					// Reset local storage.
					storage.reset(true);
					
					// Set player attributes.
					storage.setName(document.getElementById("player_name").value);
					storage.setGender($("input[name='player-class']:checked").val());
					storage.setHairColor(hairColor);
					storage.setClothColor(clothColor);
					
					// Go.
					initGame();
				};
			}
		}
	});
	
	// Get device platform.
	document.addEventListener("deviceready", function () {
		platform = device.platform;
        con.info(" ------------------- platform is: " + platform);
	}, false);
	
	// facebox dark background:
	$.facebox.settings.opacity = 0.5;
	
	// Init downloader.
	dl = Downloader.getInstance();
	dl.init();
	
	// Init storage.
	storage = new Storage();
	
	// Saved settings?
	if (storage.hasSavedPlayer()) {
		con.debug("Saved player data found, starting game");
		
		// Enable resuming.
		$("#continue_game_btn").attr("class", "ui-btn ui-shadow ui-btn-corner-all ui-btn-icon-left ui-btn-up-c");
		
		// Yo.
		var continue_game_btn = document.getElementById("continue_game_btn");
		continue_game_btn.onclick = function() {
			// Go.
			initGame();
		}
	}
}

resizeCanvases = null;

/* start game, called when switching over to the gamediv-page and the game is started */
function initGame()
{
    con.debug("initGame");

	var player_name = storage.getName();
	var player_gender = storage.getGender();
	var hairColor = storage.getHairColor();
	var clothColor = storage.getClothColor();
	
	con.info("Name: " + player_name);
	con.info("Gender: " + player_gender);
	con.info("Hair: " + hairColor);
	con.info("Cloth: " + clothColor);
		
	var canv_div = document.getElementById("canvasesdiv");
	var canvas_bg = document.getElementById("background");
	var ctx_bg = canvas_bg.getContext("2d");
	var canvas_obj = document.getElementById("objects");
	var ctx_obj = canvas_obj.getContext("2d");
	var canvas_fg = document.getElementById("foreground");
	var ctx_fg = canvas_fg.getContext("2d");
	
	resizeCanvases = function()
	{
		setSizeDiv(canv_div);
		setSize(canvas_bg);
		setSize(canvas_fg);
		return setSize(canvas_obj);
	};
	
	$(window).resize(resizeCanvases);
	resizeCanvases();
		
	var canvasWidth = canvas_obj.width;
	var canvasHeight = canvas_obj.height;

	initMouseEventsOnCanvas(canvas_fg);

	var resDir;
	// TODO: Change to phonegap path api?
//	if (platform != "WinCE")
//	{
		resDir = "res/xml/";
//	}
//	else
//	{
//		resDir = "/app/www\\res\\xml";
//	}
        
	XMLConfig = new XMLConfigLoader();
	con.debug("before xml config load");
	
	// For futher use.
	var loadMoreStuff = function() {
		XMLConfig.loadLayoutXML(resDir + "mapLayout.xml", function() {

			XMLConfig.loadEventsXML(resDir + "mapEvents.xml", function() {

				con.debug("after xml config load");
		
				story = new StoryGenerator();
				story.generateLevels(XMLConfig);
		
				map = new Map(story);
				map.init(mapFile, player_name, player_gender, hairColor, clothColor, function() {

					con.debug("map_init done");

					mapFile = null;
					map.player.x = 7;
					map.player.y = 20;
					map.player.sx = map.player.x;
					map.player.sy = map.player.y;
				
					animationMgr = new AnimationMgr();
					con.debug("init animationMgr done");
					soundModule = new SoundModule();
					con.debug("init SoundModule done");
					dialogMgr = new DialogMgr();
					con.debug("init DialogMgr done");
					gui = new Renderer(map, dialogMgr, ctx_bg, ctx_obj, ctx_fg, canvasWidth, canvasHeight);
					$(window).resize(function() {gui.updateCanvasSize();});
					con.debug("init Renderer done");
					game = new EventManager(map, animationMgr, soundModule, dialogMgr, storage, gui);
					con.debug("init EventManager done");
				
					// Init hints.
					storage.initHints(XMLConfig);
					con.debug("initHints done");
					
					// Update GUI.
					$("#hints_btn .ui-btn-text").text(
						"Hints (" + storage.getUnlockedAchievements().length + "/6)");
				
					// Run game loop!
					con.info("game start now!");
					gameLoop();
				});
			});
		});
	};
	
	// Try loading newer config file.
	dl.fileExists(dl.getBasePath() + "/otma-config.xml", 
		function() {
			XMLConfig.loadOtmaXML(dl.getBasePath() + "/otma-config.xml", function() {
				loadMoreStuff();
			});
		}, 
		function(err) {
			XMLConfig.loadOtmaXML(resDir + "otma-config.xml", function() {
				loadMoreStuff();
			});
		}
	);
}

/* reset game function: */
function resetGame(retainHighscores)
{
	storage.reset(retainHighscores);
	
	// go to start screen
	window.location='index.html';
}

/* For debug only: trigger some special events:
function controls(event) {
	if (typeof game ===  'undefined')
		return;
		
	if (event.keyCode == 37) {
		game.arrowPressedEvent("left");
	} else if (event.keyCode == 39) {
		game.arrowPressedEvent("right");
	} else if(event.keyCode == 38){
		game.arrowPressedEvent("up");
	} else if(event.keyCode == 40){
		game.arrowPressedEvent("down");
	} else if(event.keyCode == 82){
		game.keyPressedEvent("reset");
	} else if(event.keyCode == 72){
		game.keyPressedEvent("unlock");
	} else if(event.keyCode == 83){
		game.keyPressedEvent("highscore");
	}
}
*/

/* game timer, 40 ms */
gameLoop = function()
{
	if (dialogMgr.hasActiveDialog())
	{
		// nothing!
	}
	else
	{
		var currentTime = new Date().getTime();
		animationMgr.animate(currentTime);
		gui.draw();
		game.timeEvent(currentTime);
	}
	setTimeout(gameLoop, 40);
};
