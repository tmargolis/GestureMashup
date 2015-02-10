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
	},
	shim : {
		"mashupModules/leap-plugins-0.1.10" : {
			"deps" : ["mashupModules/leap-0.6.4"]
		}
	}
});

define(["mashupModules/leap-plugins-0.1.10", 
		"mashupModules/publisher"], function ( LeapPlugin, publisher ) {

    var rangeTracking = false;
	var handLX, handRX;
	var selectionInfo = {};
	var initLPos = initRPos = null;


	return  {

		setRangeTracking: function(val){
			rangeTracking = val;
			return true;
		},

		setSelectionInfo: function(sInfo){
			selectionInfo = sInfo;
			return true;
		},

		resetInitPos: function(){
			initLPos = initRPos = null;
		},

		startTracking: function() {

		    // Setup Leap Helper Divs
		    var cursorVert = $("<div id='cursorY'>");
		    var cursorHorz = $("<div id='cursorX'>");
		    $("#cursor").append(cursorVert);
		    $("#cursor").append(cursorHorz);

		    $("#cursor").css('left',document.body.offsetWidth/2);
		    $("#cursor").css('top',document.body.offsetHeight/2);

		    // Setup Leap
		    window.cursor = $('#cursor');
		    var gestureDuration = 150000;
		    var keyTap = false, screenTap = false;
		    var flipped = false;

		    Leap.loop({enableGestures: true, hand: function(hand){

		        // Leap loop for pointer tracking

		    }}, 
// Leap loop for pointer tracking AND gesture recognition
		    function(frame){
		    	if(frame.valid && frame.hands.length>0){
		    		if(!rangeTracking){
// Normal pointer tracking
						var hand = frame.hands[0];
						// var screenPosition = hand.screenPosition(hand.palmPosition);
						var screenPosition = hand.screenPosition();

// Normalized Position for Leap/Screen Offset
						var np = [  screenPosition[0] - 500, 
						            screenPosition[1] + 500, 
						            screenPosition[2] - 500];

						screenPosition[1] = screenPosition[1] + 1000;
						cursor.css({
							left: screenPosition[0] + 'px',
							top:  screenPosition[1] + 'px'
						});

		    		}else if(frame.hands.length == 2){
// Track both hand during selection
						var lHand, rHand;
						if(frame.hands[0].type == "left"){
							lHand = frame.hands[0];
							rHand = frame.hands[1];
						}else{
							lHand = frame.hands[1];
							rHand = frame.hands[0];
						}

						if(initLPos == null){
							initLPos = lHand.screenPosition()[0];
							// console.log("Initializing initLPos to " + initLPos);
						}
						handLX = lHand.screenPosition()[0];
						$("#cursor").children("#cursorLY").css({
							left: (handLX - initLPos) + 'px'
						});

						if(initRPos == null){
							initRPos = rHand.screenPosition()[0];
							// console.log("Initializing initRPos to " + initRPos);
						}
						handRX = rHand.screenPosition()[0];
						$("#cursor").children("#cursorRY").css({
							left: (handRX - initRPos) + 'px'
						});

// Conform cursor positions to measure range
						var handLoffset = (handLX - initLPos + initRPos - selectionInfo.extLeft) / selectionInfo.extWidth;
						var handLvalue = (selectionInfo.extMax - selectionInfo.extMin) * handLoffset + selectionInfo.extMin;
						selectionInfo.lValue = handLvalue;

						$("#cursorLtxt").css("font-size", "30px");
						$("#cursorLtxt").html(" " + selectionInfo.lValue);

						var handRoffset = (handRX - selectionInfo.extLeft) / selectionInfo.extWidth;
						var handRvalue = (selectionInfo.extMax - selectionInfo.extMin) * handRoffset + selectionInfo.extMin;
						selectionInfo.rValue = handRvalue;

						$("#cursorRtxt").css("font-size", "30px");
						$("#cursorRtxt").html(" " + selectionInfo.rValue);

		    		}else{
						
// Start tracking ONE hand during selection
						var hand = frame.hands[0];
						if(hand.type == "left"){
							if(initLPos == null){
								initLPos = hand.screenPosition()[0];
							}
							handLX = hand.screenPosition()[0];
							$("#cursor").children("#cursorLY").css({
								left: (handLX - initLPos) + 'px'
							});
						}else{
							if(initRPos == null){
								initRPos = hand.screenPosition()[0];
							}
							handRX = hand.screenPosition()[0];
							$("#cursor").children("#cursorRY").css({
								left: (handRX - initRPos) + 'px'
							});
						}

						// console.log("handLX",handLX,"handRX",handRX);
						// console.log("ext pos",selectionInfo.extLeft,selectionInfo.extWidth);
					}
				}

// GESTURE TRACKING
		        if(frame.valid && frame.gestures.length > 0){
		            // Loop through all the gestures found
		            frame.gestures.forEach(function(gesture){
		                // Has the gesture completed?
		                if(gesture.state == "stop"){
		                    switch (gesture.type){
		                        // Outlier Selection
		                        case "circle":
		                            if(gesture.duration > gestureDuration*2){
			                            var screenPosition = frame.hands[0].screenPosition();
			                            screenPosition[1] = window.innerHeight + screenPosition[1];
		                                console.log("Circle Gesture");
			                            publisher.publish('circleGesture', screenPosition);
		                            }
		                            break;
		                        // Top Three Selection
		                        case "keyTap":
		                            var screenPosition = frame.hands[0].screenPosition();
		                            screenPosition[1] = window.innerHeight + screenPosition[1];
		                            console.log("Key Tap Gesture", screenPosition);
		                            publisher.publish('keyTapGesture', screenPosition);
		                            break;
		                        // Not assigned for now
		                        case "screenTap":
		                            console.log("Screen Tap Gesture");
		                            break;
		                        // Bookmarks
		                        case "swipe":
		                            if(gesture.duration > gestureDuration){
		                                if(gesture.direction[0] > 0){
			                                publisher.publish('saveBookmark');
		                                } else {
			                                publisher.publish('loadBookmark');
		                                }
		                                console.log("Swipe Gesture");
		                            }
		                            break;
	                        }
	                    }
	                });
	            }

	        })
			.use('screenPosition', {
		        scale: 1
		    });
		}
	}
});
