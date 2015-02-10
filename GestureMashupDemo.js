/*
 * @todd.margolis@qlik.com Todd Margolis (Qlik Partner Engineering)
 */

var config = {
	host: window.location.hostname,
	prefix: "/",
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};
require.config({
	baseUrl: ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "resources",
	paths: {
		// custom path decleration to access js libraries in mashup directory
		"mashupModules": ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "extensions" + config.prefix + "GestureMashupDemo"
	}
});

var app;

require( ["js/qlik", 
			"mashupModules/appSelectors", 
			"mashupModules/leapUI", 
			"mashupModules/myoUI", 
			"mashupModules/famous-global", 
			"mashupModules/publisher"], 
			function ( qlik, sel, leapUI, myoUI, famous, publisher ) {

	qlik.setOnError( function ( error ) {
		alert( error.message );
	} );

	//Open Sense apps
	app = qlik.openApp('Gestural Device Demo App.qvf', config);

	//Get Sense objects
	var numSurfaces = 3;

	// KPI Dashboard
	app.getObject('QV01','myxjGaT');
	app.getObject('QV02','GrXUm');
	app.getObject('QV03','anSNQJ');

	app.getObject('QV07','bbec4dd8-6003-4a8a-adce-9884f65af472');
	app.getObject('QV08','98776691-2393-4bc5-ac0d-7e4c6e3ec3c2');
	app.getObject('QV09','1e9d538f-a48b-4a1e-ae5a-7aa87d18bd17');
	
	app.getObject('QV10','b3171868-d335-49c8-997a-1337ffbaa56e');
	app.getObject('QV11','1300e2ac-4c22-46f2-b608-05e6437ffc0c');
	app.getObject('QV12','66647c64-e2a8-4887-bff8-deab6f995a01');

	//Sales Analysis
	app.getObject('QV20','NUnxYNe');
	app.getObject('QV21','cfd52bf6-e52a-4553-b289-85c852b4d782');
	app.getObject('QV22','e4d2a6f0-b6ac-44b0-a0d0-74363c3af744');

	// Customer Analysis
	app.getObject('QV57','RSfXpWZ');
	app.getObject('QV56','JmKTaF');
	app.getObject('QV55','ZCLPX');
	app.getObject('QV54','zVghQK');
	app.getObject('QV53','PRPs');
	app.getObject('QV52','KSupFHP');
	app.getObject('QV51','HPJpkhX');
/*
	// Sales Trend
	app.getObject('QV30','gGEvB');
	app.getObject('QV31','sACtR');
	app.getObject('QV32','vjUsp');
	app.getObject('QV33','KQXXHvC');
	app.getObject('QV34','ejEQJB');

	// Budget Analysis
	app.getObject('QV60','a4b5fe83-a63f-4ab3-a5fd-9f6824bf1f0e');
	app.getObject('QV61','d5c8dbda-3f5c-4243-86bd-6e276c32f53f');
	app.getObject('QV62','760d90f8-443a-4600-8403-551b19d684fb');
	app.getObject('QV63','kdpJKE');
*/
	app.getObject('CurrentSelections','CurrentSelections');

// Get App Bookmarks
	var bookmarks = [];
	app.getList("BookmarkList", function(reply){
		$.each(reply.qBookmarkList.qItems, function(key, value) {
			bookmarks.push({name: value.qData.description, id: value.qInfo.qId});
		});
		// console.log("Stored Bookmarks:", bookmarks);
	});

// Initialize Gesture Tracking modules
	leapUI.startTracking();
	myoUI.initMyo();

//////////////////////////// Bookmark Handlers /////////////////////////
	// Create a new bookmark
	publisher.subscribe('saveBookmark', function(){
		app.bookmark.create('SummitBookmark'+bookmarks.length,"test"+bookmarks.length);
		console.log("Saving bookmark");
	});

	// Open the last bookmark
	publisher.subscribe('loadBookmark', function(){
		app.bookmark.apply(bookmarks[bookmarks.length-1].id);
		console.log("Loading bookmark");
	});


//////////////////////////// General Selection Handler /////////////////////////
	var selectionInProgress = false;

	publisher.subscribe('clear', function(){
		sel.clearAll(app);
	});

//////////////////////////// Range Selection Handlers /////////////////////////
	publisher.subscribe('startRangeSelection', function(){
		sel.startRangeSelection(leapUI);
	});

	publisher.subscribe('makeRangeSelection', function(){
		sel.makeRangeSelection(myoUI);
	});

//////////////////////////// Top Three Selection Handlers /////////////////////////
	publisher.subscribe('keyTapGesture', function(pointer){
		sel.makeTopThreeSelection(leapUI);
	});

//////////////////////////// Outlier Selection Handlers /////////////////////////
	publisher.subscribe('circleGesture', function(){
		sel.makeOutlierSelection(leapUI);
	});


///////////////////// Famo.us Rendering Logic
	// Import Famo.us dependencies
	var Engine          = famous.core.Engine;
	var Modifier        = famous.core.Modifier;
	var StateModifier   = famous.modifiers.StateModifier;
	var Transform       = famous.core.Transform;
	var Surface         = famous.core.Surface;
	var Easing          = famous.transitions.Easing;
	var SequentialLayout = famous.views.SequentialLayout;
	var EventHandler     = famous.core.EventHandler;

	var destElement = document.getElementById("pages");
	var mainContext = Engine.createContext();
	var surfaces = [], modifiers = [], wiggles = [];
	var showingAll = false;
	var eventHandlerA = new EventHandler();

	// Size Definitions
	var windowWidth  = document.body.offsetWidth;
	var windowHeight = document.body.offsetHeight;
	var pWidth  = windowWidth/numSurfaces;
	var pHeight = windowHeight/1.05;
	var margin  = 5;

	// Set camera position
	mainContext.setPerspective(5500);

// Create each surface and add associated transformation
	for(var p=0; p<numSurfaces; p++){
	    pageSurface = new Surface({
	      content: "",
	      size: [windowWidth/numSurfaces*3, windowHeight/1.25], // Initial size during intro wiggle
	      properties: {
	        backgroundColor: 'rgb(255,255,255)',
	        textAlign: 'center',
	        padding: '5px',
	        marginLeft: '10px'
	      }
	    });
	    pageSurface.setAttributes({'id':'pageSurface'+p});
	    surfaces.push(pageSurface);

	    // modifier to hold wiggle transformations
		stateModifierW = new StateModifier({
			origin: [0.0, 0.0]
		});
		wiggles.push(stateModifierW);

		// modifier to hold focused transformations
		stateModifierF = new StateModifier({
			origin: [0.5, 0.0],
			align: [0.0, 0.0],
			opacity: 1.0,
			transform: Transform.translate(windowWidth/2, 25*p, -500*p)
		});
		modifiers.push(stateModifierF);

		// Add each surface and associated transformation to the main context view
		mainContext.add(wiggles[wiggles.length-1]).add(modifiers[modifiers.length-1]).add(surfaces[surfaces.length-1]);

		// Main visualization container. Determines overall offsets
		$(".famous-container").css({'top':'40px', 'left':'10px', 'right':'100px'});
	}

// Create intro wiggle
    function introEase(){
    	for(var i=1; i<numSurfaces; i++){
    		var randWiggle = Math.random() * 400 - 200;
	    	wiggles[i].setTransform(Transform.translate(0, 0, randWiggle), {duration: 1000, curve: 'linear'});
	    }
    }
    introEaseTimer = setInterval(introEase, 1000);

// Toggle between showing all sheets and focusing on single sheet
	publisher.subscribe('toggleShowAll', function() {
		if(showingAll){
			focusPage(pageIndex);
		}else{
			for(var p=0; p<numSurfaces; p++){
				surfaces[p].setSize([pWidth-margin, pHeight]);
				modifiers[p].setOrigin([0,0]);
				modifiers[p].setTransform(Transform.translate(pWidth*p, 0, 0*p), { duration: 2000, curve: 'linear' });
			}
		}
		showingAll = !showingAll;

		// Cludge to force redraw on all charts
		// just pick any field you don't plan on actually selecting
		app.field("City").toggleSelect();

		clearInterval(introEaseTimer);
    	for(var i=1; i<numSurfaces; i++){
	    	wiggles[i].setTransform(Transform.translate(0, 0, 0));
	    }
	});

// Focus on a single sheet
	function focusPage(pageIndex){
		console.log("Switching to page " + pageIndex);
		for(var p=0; p<numSurfaces; p++){
			surfaces[p].setSize([windowWidth/2,pHeight]);

			// Show individual sheet in "carousel" mode where prev/next are smaller to each side of focused sheet
			var scaleFactor = 1 / (Math.abs(p-(pageIndex-1))+1);
			var yFactor		= (Math.abs(p-(pageIndex-1))) * 450;
			modifiers[p].setOrigin([0.5,0]);
			modifiers[p].setTransform(Transform.thenMove(Transform.scale(scaleFactor,scaleFactor,scaleFactor), [windowWidth/2.6*(p-pageIndex+1)+windowWidth/2.0, yFactor, 0]), { duration: 1000, curve: 'linear' });
		}

		// Cludge to force redraw on all charts
		// just pick any field you don't plan on actually selecting
		app.field("City").toggleSelect();

		showingAll = false;
	}

	var pageIndex = 0;

	// move to next sheet
	publisher.subscribe('advance', function(){
		if(pageIndex <= numSurfaces-1){
			pageIndex++;
			focusPage(pageIndex);
		}
	});

	// move to previous sheet
	publisher.subscribe('reverse', function(){
		if(pageIndex > 1){
			pageIndex--;
			focusPage(pageIndex);
		}else{
			pageIndex = 1;
			focusPage(pageIndex);
		}
	});

// Backup HTML Button Handlers
	$("#showAll").click(function (){
		publisher.publish('toggleShowAll');
	});

	$("#advance").click(function (){
		publisher.publish('advance');
	});

	$("#reverse").click(function (){
		publisher.publish('reverse');
	});

	$("#select").click(function (){
		publisher.publish('keyTapGesture');
	});

	$("#clear").click(function (){
		publisher.publish('clear');
	});


//////////////////////////// Keyboard Shortcut Handlers /////////////////////////
	document.onkeydown = checkKey;
	function checkKey(e) {
		e = e || window.event;
		if (e.keyCode == '67') {
			// c = Clear
			publisher.publish('clear');
		}else if (e.keyCode == '32') {
			// Spacebar = Show All
			publisher.publish('toggleShowAll');
		}else if (e.keyCode == '51') {
			// 3 = Top Three
			publisher.publish('keyTapGesture');
		}else if (e.keyCode == '79') {
			// o = Outlier
			publisher.publish('circleGesture');
		}else if (e.keyCode == '37') {
			// left arrow = reverse
			publisher.publish('reverse');
		}else if (e.keyCode == '39') {
			// right arrow= advance
			publisher.publish('advance');
		}
	}

} );


// Attach Sense visualizations to Famo.us surfaces
setTimeout(moveAll, 1000);

function moveAll(){
	$("#Dashboard").appendTo("#pageSurface0");
	$("#SalesMarginAnalysis").appendTo("#pageSurface1");
	$("#CustomerAnalysis").appendTo("#pageSurface2");
	$("#SalesTrend").appendTo("#pageSurface3");
	$("#BudgetAnalysis").appendTo("#pageSurface4");
}

