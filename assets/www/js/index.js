/**
 * index file of the app.
 * 
 * You only need to call "app.initialize()".
 * 
 * @author	Sebastian Pabel
 * @version 2.0
 * @since	23.06.2013
 */
var app = {
	//variables
	platform: 'Web',
	resDir: 'res/',


    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
    	if (app.isPhoneGap()) {
    		document.addEventListener('deviceready', this.onDeviceReady, false);
    	} else {
    		window.addEventListener('load', this.onDeviceReady, false);
    	}
    	$(document).on("pagebeforechange", this.onPageBeforeChange);
    	document.addEventListener('pause', Storage.getInstance().save, false);
        document.addEventListener('startcallbutton', Storage.getInstance().save, false);
    },
    
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. 
    onDeviceReady: function() {
    	con.info("device Ready");
    	if (device.platform != null) {
			app.platform = device.platform;
    	}
        con.info("Current platform is: " + app.platform);
        con.debug("userAgent: " + navigator.userAgent);
  		$("#exit_game_button").click(function() {
  			navigator.app.exitApp();
  		});
  		if (app.platform == 'Android') {
    		app.resDir = '/android_asset/www/' + app.resDir;
    	}
  		
  		// Init downloader.
  		con.debug('init downloader');
  		var downloader = Downloader.getInstance();
  		downloader.fileTransfer = new FileTransfer();

		// Base path.
		con.debug("Init basePath");
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
			function sucess(fileSystem) {
				con.debug("Got filesystem...");
				fileSystem.root.getDirectory("otma", {create: true, exclusive: false}, 
					function success(parent) {
						con.info("Got folder... " + parent.fullPath);
						downloader.basePath = parent.fullPath;
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
		downloader.ready = true;
		con.debug('downloader set up complete');

		$('update_btn').click(function(e) {
			e.preventDefault();
			Downloader.getInstance().updateConfig();
		});

		app.main();
    },
    
    onPageBeforeChange: function(e, data) {
    	con.debug("onPageBeforeChange");
    	var url = $.mobile.path.parseUrl(data.toPage).hash;
		if (typeof data.toPage === "string" && url == "#newgamepage") {
			con.debug("onPageBeforeChange: newGame");
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

			$("#start_btn").click(function()
			{
				var storage = Storage.getInstance()
				// Reset local storage.
				storage.reset(true);
				//TODO delete achievements

				// Set player attributes.
				storage.setName(document.getElementById("player_name").value);
				storage.setGender($("input[name='player-class']:checked").val());
				storage.setHairColor(hairColor);
				storage.setClothColor(clothColor);

				con.debug('color successfully set');
				// Go.
				app.initGame();
			});
		} else if (typeof data.toPage === "string" && url == "#menu1") {
			// Enable update button if downloader is ready.
			if (Downloader.getInstance().isReady) {
				$("#update_btn").attr("class", "");
			}
		} else if (typeof data.toPage === "string" && url == "#menuhints") {	
			storage = Storage.getInstance()
			if (!storage.isPagesInit) {
				storage.initPages();
			}
			storage.markUnlockedAchievements();
		} else if (typeof data.toPage === "string" && url == "#menustats") {
			Storage.getInstance().drawStats();
		}
		else if (typeof data.toPage === "string" && url == "#highscore") {
			storage = Storage.getInstance()
			$('#highscoreContent').empty();
			storage.createHighscoreView(self);
		}
    },
    
    main: function() {
    	con.debug('main function');
    	// facebox dark background:
    	$.facebox.settings.opacity = 0.5;
    	
    	//load storage data
    	if (Storage.getInstance().hasSavedPlayer()) {
    		con.debug("Saved player data found, starting game");
    		
    		// Enable resuming.
    		$("#continue_game_btn").attr("class", "ui-btn ui-shadow ui-btn-corner-all ui-btn-icon-left ui-btn-up-c");
    		
    		$("#continue_game_btn").click(function() {
    			// Go.
    			app.initGame();
    		});
    	}
    	
    	navigator.splashscreen.hide();
    },
    
    initGame: function() {
    	$.mobile.loading('show', {
    		text: '',
    		textVisible: false,
    		theme: 'a',
    		textonly: false,
    		html: ''
    	});
    	con.info("Init the game!");
    	var storage = Storage.getInstance()
    	con.info("Name: " + storage.getName());
    	con.info("Gender: " + storage.getGender());
    	con.info("Hair: " + storage.getHairColor());
    	con.info("Cloth: " + storage.getClothColor());
    	
    	$(window).resize(app.resizeCanvas);
    	app.resizeCanvas();
    	
    	app.initMouseEventsOnForeground();
    	
    	con.debug("before xml config load");
    	var configLoader = XMLConfigLoader.getInstance();
    	
    	// load config file
    	// used as callback later
    	var loadMoreStuff = function() {
			configLoader.loadTextsXML(app.resDir + 'xml/', function() {
			
				configLoader.loadLayoutXML(app.resDir + 'xml/', function() {

					configLoader.loadEventsXML(app.resDir +  'xml/', function() {

						con.debug("after xml config load");
				
						var story = StoryGenerator.getInstance();
						story.generateLevels();
				
						var map = Map.getInstance();
						map.init(mapFile, function() {
							//this is the callback function which will be called after the map has been set up

							con.debug("map_init done");

							var animationMgr = AnimationMgr.getInstance();
							con.debug("init animationMgr done");
							var soundModule = SoundModule.getInstance();
							con.debug("init SoundModule done");
							var dialogMgr = DialogMgr.getInstance();
							con.debug("init DialogMgr done");
							var gui = Renderer.getInstance();
							con.debug("init Renderer done");
							var game = EventManager.getInstance();
							con.debug("init EventManager done");
						
							// Init hints.
							storage.initHints();
							con.debug("initHints done");
							
							// Update GUI.
							$("#hints_btn .ui-btn-text").text(
								"Hints (" + storage.getUnlockedAchievements().length + "/6)");
						
							// Run game loop!
							con.info("game start now!");
							app.gameLoop();
						});
					});
				});
			});
    	};
    	var downloader = Downloader.getInstance();
    	downloader.fileExists(downloader.basePath + "/" + configLoader.getConfigFilename(), 
			function() {
    			con.debug('downloading xml file');
    			configLoader.loadOtmaXML(downloader.basePath + "/", function() {
					loadMoreStuff();
				});
			}, 
			function(err) {
				con.debug('load existing xml file');
				configLoader.loadOtmaXML(app.resDir + 'xml/', function() {
					loadMoreStuff();
				});
			}
		);
    },
    
    resizeCanvas: function() {
    	con.debug('resizing canvas');
    	app.setCanvasSize($("#canvasesdiv"));
		app.setCanvasSize($("#background"));
		app.setCanvasSize($("#foreground"));
		return app.setCanvasSize($("#objects"));
    },
    
    gameLoop: function()
    {
    	var dialogMgr = DialogMgr.getInstance();
    	if (dialogMgr.hasActiveDialog()) {
    		// nothing!
    	} else {
    		var currentTime = new Date().getTime();
    		AnimationMgr.getInstance().animate(currentTime);
//    		Renderer.getInstance().draw();
    		EventManager.getInstance().timeEvent(currentTime);
    	}
    	setTimeout(app.gameLoop, 40);
    },
    
    initMouseEventsOnForeground: function() {
    	con.debug('init mouse events');
    	var canvas = $("#foreground");
    	canvas.on('tap', function(event) {
    		if ($('.ui-page-active').attr('id') != "gamediv") {
    			return;
    		}
//    		con.debug('trigger tap event');
    		var x = event.pageX - $("#foreground").parent().offset().left;
    		var y = event.pageY - $("#foreground").parent().offset().top;
    		EventManager.getInstance().clickEvent(Renderer.getInstance().translateClickPos(x,y));
    	});
        canvas.on('touchmove', false);
    },
    
    setCanvasSize: function(ctx)
    {
    	var max_w = 8000;
    	var max_h = 6000;
    	
    	var w = window.innerWidth;
    	if (w > max_w) {
    		w = max_w;
    	}
    	var h = window.innerHeight - /*taskbar*/ 44*2;
    	if (h > max_h) {
    		h = max_h;
    	}
    	if (ctx[0].tagName == 'DIV') {
    		con.log('div');
    		ctx.css('width', w);
    		ctx.css('height', h);
    	} else {
    		con.log('canvas');
    		ctx.attr('width', w);
    		ctx.attr('height', h);
    	}
    	
    	return {width: w, height: h};
    },

    //detect if mobile device or browser
    isPhoneGap: function() {
        return ((cordova || PhoneGap || phonegap)
    		&& (/^file:\/{3}[^\/]/i.test(window.location.href) || /ms-appx:/i.test(window.location.href))
            && /ios|iphone|ipod|ipad|android/i.test(navigator.userAgent)) ||
            window.tinyHippos; //this is to cover phonegap emulator
    },
    
    resetGame: function(keepHighscore) {
    	Storage.getInstance().reset(keepHighscore);
    	XMLConfigLoader.getInstance().reset();
    	StoryGenerator.getInstance().reset();
    	Map.getInstance().reset();
    	Renderer.getInstance().reset();
    	EventManager.getInstance().reset();
    	$.mobile.changePage('index.html', {
    		transition: 'pop',
    		reverse: false,
    		changeHash: false
    	});
    }
};