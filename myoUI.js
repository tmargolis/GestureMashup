var config = {
	host: window.location.hostname,
	prefix: "/",
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};
require.config({
	baseUrl: ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "resources",
	paths: {
		"mashupModules": ( config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port: "") + config.prefix + "extensions" + config.prefix + "GestureMashupDemo"
	}
});

define(["mashupModules/publisher", 
		"mashupModules/myo"], function ( publisher, myMyo ) {


	var myMyo = Myo.create();
	var myMyoFistTwisting = false;
	var myMyoRangeSelecting = false;

	return  {

		initMyo: function(){

			// Setup Mouse wheel event system to simulate scrolling
			var ext = null;
			window.ChromeWheel  = function(angle) {
				// Get Leap Cursor position
				var cursorX = document.getElementById('cursor').offsetLeft;
				var cursorY = document.getElementById('cursor').offsetTop;

				var evt = document.createEvent("MouseEvents");
				evt.initMouseEvent(
					'mousewheel', // in DOMString typeArg,
					true,  // in boolean canBubbleArg,
					true,  // in boolean cancelableArg,
					window,// in views::AbstractView viewArg,
					15*angle,   // in long detailArg,
					cursorX,     // in long screenXArg,
					cursorY,     // in long screenYArg,
					cursorX,     // in long clientXArg,
					cursorY,     // in long clientYArg,
					0,     // in boolean ctrlKeyArg,
					0,     // in boolean altKeyArg,
					0,     // in boolean shiftKeyArg,
					0,     // in boolean metaKeyArg,
					0,     // in unsigned short buttonArg,
					null   // in EventTarget relatedTargetArg
				);

				// Find Target Viz
				if(ext === null){
					var el;
					// Find qvoject extensions and see if cursor is hovering over them
					var exts = document.getElementsByClassName('qvobject');
					for(var i=0; i<exts.length; i++){
						var e = exts[i];
						var eRect = e.getBoundingClientRect();

						if((eRect.top<cursorY) && (eRect.bottom>cursorY) && (eRect.left<cursorX) && (eRect.right>cursorX)){
							el = e;
						}
					};

					// Get canvas element within extension object
					extCanvi = el.getElementsByTagName('canvas');
					ext = extCanvi[extCanvi.length-1];

					// If there is no canvas element to this extension, use the scroll area instead
					if(!ext){
						extDivs = el.getElementsByClassName('qv-listbox-scroll-area');
						ext = extDivs[extDivs.length-1];

						extLI = el.getElementsByTagName('li');
						ext = extLI[extLI.length-1];

					}
					// console.log(ext);

					ext.addEventListener('mousewheel', wheel, false);
				}

				// Send our mousewheel event
				ext.dispatchEvent(evt);
			}

			function clearAll(){
				app.clearAll();
			}

			function wheel(event) {
				// for debugging purposes
			    // console.log("mousewheel event", event);
			}

			document.addEventListener('mousewheel', realWheel, false);
			function realWheel(event) {
			    // console.log("REAL mousewheel event", event);
			}

			// Range Tracking Gesture
			myMyo.on('fingers_spread', function(edge){
			    if(edge){
			        console.log("Starting Range selection");
			        publisher.publish('startRangeSelection');
			        myMyoRangeSelecting = true;
				    myMyo.unlock();
			    }else{
			        console.log("Performing selection");
			        publisher.publish('makeRangeSelection');
			        myMyoRangeSelecting = false;
					myMyo.lock();
			    }
			});

			// Navigate Forwards Gesture
			myMyo.on('wave_in', function(edge){
			    if(edge && !myMyoRangeSelecting){
			        publisher.publish('advance');
			        console.log("advancing");
			    }
			});
			// Navigate Backwards Gesture
			myMyo.on('wave_out', function(edge){
			    if(edge && !myMyoRangeSelecting){
			        publisher.publish('reverse');
			        console.log("reversing");
			    }
			});

			// Start/Stop Scroll Gesture
			myMyo.on('fist', function(edge){
				if(!myMyoRangeSelecting){
				    if(edge){
					    myMyo.unlock();
					    myMyo.zeroOrientation();
					    myMyoFistTwisting = true;
					}else{
						myMyo.lock();
						ext = null;
					    myMyoFistTwisting = false;
					}
				}
			});

			// Orientation/Gyro movement controllers
			var goUp, goDown;
			myMyo.on('imu', function(data){
				if(myMyoFistTwisting){
					// Simulate mouse scrollwheel
				    ChromeWheel(data.orientation.y);
				}else{
					// Show all
					if(data.gyroscope.z > 300){
						clearTimeout(goUp);
						goUp = setTimeout(function(){publisher.publish('toggleShowAll');}, 100);
					}else if(data.gyroscope.z < -300){
						clearTimeout(goDown);
						goDown = setTimeout(function(){clearAll();}, 100);
					}
				}
			});
		}

	}
});
