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

define(["mashupModules/publisher"], function ( publisher ) {

	var selectionInProgress = false;
	var selectionInfo = {};
	var topThreeSelInfo = {};
	var outlierSelInfo = {};
	var myLeapUI, myMyoUI;

//////////////////////////// Clear all selections /////////////////////////
	function clearAll(app){
		app.clearAll();
	}
	
//////////////////////////// Range Selection Logic /////////////////////////
	function startRangeSelection(leapUI){
		if(!selectionInProgress){
			selectionInProgress = true;
			setTimeout(function(){selectionInProgress = false;}, 1000);

			myLeapUI = leapUI;
			selectionInfo = {};

			getCursorPos()
			.then(replaceTargetRange)
			.then(identifyObj)
			.then(getID)
			.then(getObjMinMax)
			.then(getCanvasDims)
			.then(findFingers)
			.then(trackFingers, 
				function(error){
					console.log("ERROR: ", error);
					completeSelection();
				}
			);
		}
	}

// Called from myoUI (via main) when user has finished with selection
	function makeRangeSelection(myoUI){

		myMyoUI = myoUI;
		getObjectProperties(selectionInfo.extQVID)
			.then(filterValues)
			.then(makeSelection, 
				function(error){
					console.log("ERROR: ", error);
					completeSelection(myMyoUI);
				}
			);
	}

////////// Range Selection Utilities

// Get Cursor position
	function getCursorPos(){
		return new Promise(function(resolve, reject){

			var cursorX = document.getElementById('cursor').offsetLeft;
			var cursorY = document.getElementById('cursor').offsetTop;
			// console.log("Cursor",cursorX, cursorY);

			selectionInfo.cursorX = cursorX;
			selectionInfo.cursorY = cursorY;

			if(selectionInfo.cursorX)
				return resolve(selectionInfo);
			else
				return reject(Error("Unable to find cursor"));
		})
	}

// Replace target with range overlay
	function replaceTargetRange(result){
		return new Promise(function(resolve, reject) {
			$("#cursor").children().remove();
		    var cursorLVert = $("<div id='cursorLY'>");
		    var cursorRVert = $("<div id='cursorRY'>");
		    $("#cursor").append(cursorLVert);
		    $("#cursor").append(cursorRVert);
		    var cursorLVertTxt = $("<div id='cursorLtxt'>");
		    var cursorRVertTxt = $("<div id='cursorRtxt'>");
		    $("#cursorLY").append(cursorLVertTxt);
		    $("#cursorRY").append(cursorRVertTxt);
			if(selectionInfo.cursorX)
				return resolve(selectionInfo);
			else
				return reject(Error("Unable to build new target"));
		});
	}

// Identify object below cursor
	function identifyObj(result){
		return new Promise(function(resolve, reject) {
			var el;
			var exts = document.getElementsByClassName('qvobject');
			for(var i=0; i<exts.length; i++){
				var e = exts[i];
				var eRect = e.getBoundingClientRect();

				if((eRect.top<selectionInfo.cursorY) && (eRect.bottom>selectionInfo.cursorY) && (eRect.left<selectionInfo.cursorX) && (eRect.right>selectionInfo.cursorX)){
					el = e;
				}
			};
			selectionInfo.el = el;
			// console.log("el",el);

			if(selectionInfo.el)
				return resolve(selectionInfo);
			else
				return reject(Error("Unable to identify object"));
		});
	}

// Get ID
	function getID(result){
		return new Promise(function(resolve, reject) {
			selectionInfo.extID = $(selectionInfo.el).attr("id");
			// console.log("extID",selectionInfo.extID);
			selectionInfo.extQVID = $(selectionInfo.el).attr("data-qvid");
			// console.log("extQVID",selectionInfo.extQVID);

			if(selectionInfo.extQVID)
				return resolve(selectionInfo);
			else
				return reject(Error("Unable to get object ID"));
		});
	}

// Get object min & max
	function getObjMinMax(result){
		return new Promise(function(resolve, reject) {
			app.getObjectProperties(selectionInfo.extQVID).then(function(model){

				// Get Field name
				// var dim = model.layout.qHyperCube.qDimensionInfo[0].qFallbackTitle;
				var dim = model.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]; // Must use this because dim is a master item
				selectionInfo.dim = dim;

				var xMeasure = model.layout.qHyperCube.qMeasureInfo[0];
				selectionInfo.extMin = xMeasure.qMin,
				selectionInfo.extMax = xMeasure.qMax
				// console.log(selectionInfo.extQVID + 
				// 	": min: "+ selectionInfo.extMin + 
				// 	" max: "+selectionInfo.extMax);

				if(selectionInfo.extMax)
					return resolve(selectionInfo);
				else
					return reject(Error("Unable to get object min/max"));

			})
		})
	}

// Get canvas left position & width
	function getCanvasDims(result){
		return new Promise(function(resolve, reject) {
			var extCanvii = $(selectionInfo.el).find("canvas");
			var extCanvas = extCanvii[extCanvii.length-1];
			selectionInfo.extLeft     = $(extCanvas).offset().left;
			selectionInfo.extTop      = $(extCanvas).offset().top;
			selectionInfo.extWidth    = $(extCanvas).width();
			selectionInfo.extHeight   = $(extCanvas).height();
			selectionInfo.extCenterX  = selectionInfo.extLeft + selectionInfo.extWidth/2;
			selectionInfo.extCenterY  = $(extCanvas).offset().top + $(extCanvas).height()/2;
			// console.log("ext pos",selectionInfo.extLeft,selectionInfo.extWidth);

			if(selectionInfo.extCenterY)
				return resolve(selectionInfo);
			else
				return reject(Error("Unable to get object dimensions"));
		})
	}

// Look for both fingers
	function findFingers(result){
		return new Promise(function(resolve, reject) {
			var confirm = myLeapUI.setSelectionInfo(selectionInfo);

			if(confirm)
				return resolve(confirm);
			else
				return reject(Error("Unable to set info for leap"));
		})
	}

// Track both fingers
	function trackFingers(result){
		return new Promise(function(resolve, reject) {
			var confirm = myLeapUI.setRangeTracking(true);
		    // $("#cursor").css('left',selectionInfo.extCenterX);
		    $("#cursor").css('top',selectionInfo.extTop);
		    $("#cursor").children("#cursorLY").css('height',selectionInfo.extHeight);
		    $("#cursor").children("#cursorRY").css('height',selectionInfo.extHeight);

			if(confirm)
				return resolve(confirm);
			else
				return reject(Error("Unable to set range tracking for leap"));
		})
	}

// Put all extension measure values into xValues array
	function getObjectProperties(obj){
		return new Promise(function(resolve, reject) {

			app.getObjectProperties(selectionInfo.extQVID).then(function(model){

				var xValues = [];
				hyperCube = model.layout.qHyperCube.qDataPages[0].qMatrix;
				$.each(hyperCube,function(value){
					// console.log(hyperCube[value]);
					var xVal = {
						"title": hyperCube[value][0].qText,
						"X": hyperCube[value][1].qNum
					}
					xValues.push(xVal);
				});
				if(xValues.length){
					// console.log("All Objs", xValues);
					return resolve(xValues);
				}else{
					console.log("No values found in Measure!");
					completeSelection();
					return reject("No values found in Measure!");
				}
			});
		});
	}

// Find values between min & max and return selected items
	function filterValues(vals){
		console.log("Calling filterValues...");
		return new Promise(function(resolve, reject) {
			var selectedItems = [];
			vals.forEach(function(val){
				if((val.X>selectionInfo.lValue) && (val.X<selectionInfo.rValue)){
					selectedItems.push({qText: val.title});
				}
			});
			// return selection;
			if(selectedItems.length){
				// console.log("Selected Items", selectedItems);
				return resolve(selectedItems);
			}else{
				completeSelection();
				return reject(Error("No values selected in Measure!"));
			}
		});
	}

// Send selected items to Qlik Sense Engine to make selection and force redraw
	function makeSelection(selArray){
		// console.log("Making Selection",selArray);

		app.field(selectionInfo.dim).selectValues(selArray, true, true);

		// selectMatch() is another API call that could be used, but it doesn't work on master items.
		// app.field(selectionInfo.dim).selectMatch('>3000000<8000000', true);

		completeSelection();
	}

// Clean up after range selection
	function completeSelection(){
		console.log("Completing selection");
		$("#cursor").children().remove();
	    var cursorY = $("<div id='cursorY'>");
	    var cursorX = $("<div id='cursorX'>");
	    $("#cursor").append(cursorY);
	    $("#cursor").append(cursorX);
		myLeapUI.setRangeTracking(false);
		myLeapUI.resetInitPos();
	}


//////////////////////////// Top Three Selection Logic /////////////////////////
	function makeTopThreeSelection(leapUI){
		myLeapUI = leapUI;
		if(!selectionInProgress){
			console.log("Performing Top Three Selection");

			selectionInProgress = true;
			setTimeout(function(){selectionInProgress = false;}, 1000);

			topThreeSelInfo = {};

			getCursorPosTop()
			.then(replaceTargetTop)
			.then(identifyObjTop)
			.then(getIdTop)
			.then(getObjTopThree)
			.then(selectObjTopThree)
			.then(completeSelection,
				function(error){
					console.log("ERROR: ", error);
					completeSelection();
				}
			);
		}
	}

////////// Top Three Selection Utilities

// Get Cursor position
	function getCursorPosTop(){
		return new Promise(function(resolve, reject) {
			var cursorX = document.getElementById('cursor').offsetLeft;
			var cursorY = document.getElementById('cursor').offsetTop;
			// console.log("Cursor",cursorX, cursorY);

			topThreeSelInfo.cursorX = cursorX;
			topThreeSelInfo.cursorY = cursorY;

			if(topThreeSelInfo.cursorY){
				return resolve(topThreeSelInfo);
			}else{
				return reject("Unable to find cursor");
			}
		});
	}

// Replace target with circle overlay
	function replaceTargetTop(result){
		return new Promise(function(resolve, reject) {
			$("#cursor").children().remove();
		    var cursorBall = $("<div id='cursorBall'>");
		    $("#cursor").append(cursorBall);

			if($("#cursor").children()){
				return resolve(topThreeSelInfo);
			}else{
				return reject("Unable to make new target");
			}
		});
	}

// Identify object below cursor
	function identifyObjTop(result){
		return new Promise(function(resolve, reject) {
			var el;
			var exts = document.getElementsByClassName('qvobject');
			for(var i=0; i<exts.length; i++){
				var e = exts[i];
				var eRect = e.getBoundingClientRect();

				if((eRect.top<topThreeSelInfo.cursorY) && (eRect.bottom>topThreeSelInfo.cursorY) && (eRect.left<topThreeSelInfo.cursorX) && (eRect.right>topThreeSelInfo.cursorX)){
					el = e;
				}
			};
			topThreeSelInfo.el = el;

			if(el){
				return resolve(topThreeSelInfo);
			}else{
				return reject("Unable to find object");
			}
		});
	}

// Get ID
	function getIdTop(result){
		return new Promise(function(resolve, reject) {
			topThreeSelInfo.extID = $(topThreeSelInfo.el).attr("id");
			// console.log("extID",topThreeSelInfo.extID);
			topThreeSelInfo.extQVID = $(topThreeSelInfo.el).attr("data-qvid");
			// console.log("extQVID",topThreeSelInfo.extQVID);

			if(topThreeSelInfo.extQVID){
				return resolve(topThreeSelInfo);
			}else{
				return reject("Unable to get object ID");
			}
		});
	}

// Get the object's top three items
	function getObjTopThree(result){
		return new Promise(function(resolve, reject) {
			// console.log("Calling getObjectProperties for " + topThreeSelInfo.extQVID);
			app.getObjectProperties(topThreeSelInfo.extQVID).then(function(model){

				// Get Field name
				var dim = model.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]; // Must use this because dim is a master item
				topThreeSelInfo.dim = dim;

				var topThree = [];
				var qMtrx = model.layout.qHyperCube.qDataPages[0].qMatrix;

				topThree.push({qText: qMtrx[0][0].qText});
				topThree.push({qText: qMtrx[1][0].qText});
				topThree.push({qText: qMtrx[2][0].qText});
				// console.log("topThree", topThree);

				topThreeSelInfo.topThree = topThree;
				return resolve(topThreeSelInfo);
			}).catch(function(error){
				return reject(error);
			});
		});
	}

// Send selected items to Qlik Sense Engine to make selection and force redraw
	function selectObjTopThree(result){
		// console.log("Making  Selection on "+ topThreeSelInfo.dimim+ " for ",topThreeSelInfo.topThree);
		return new Promise(function(resolve, reject) {
			app.field(topThreeSelInfo.dim).selectValues(topThreeSelInfo.topThree, true, true).then(function(response){
				return resolve(response);
			}).catch(function(error){
				return reject(error);
			});
		});
	}


//////////////////////////// Outlier Selection Logic /////////////////////////
	function makeOutlierSelection(leapUI){
		console.log("Calling makeOutlierSelection...");

		if(!selectionInProgress){
			selectionInProgress = true;
			setTimeout(function(){selectionInProgress = false;}, 1000);

			selectionInfo = {};
			myLeapUI = leapUI;

			getCursorPos()
			.then(replaceTargetOutlier)
			.then(identifyObj)
			.then(getID)
			.then(getObjectOutlierProperties)
			.then(filterOutlierValues)
			.then(sendOutlierSelection, 
				function(error){
					console.log("ERROR: ", error);
					completeSelection();
				}
			);
		}
	}

////////// Outlier Selection Utilities

// Replace target with circle overlay
	function replaceTargetOutlier(result){
		// console.log("Calling replaceTargetOutlier...");
		return new Promise(function(resolve, reject) {
			$("#cursor").children().remove();
		    var cursorBall = $("<div id='cursorBallGreen'>");
		    $("#cursor").append(cursorBall);

			if($("#cursor").children()){
				return resolve(selectionInfo);
			}else{
				return reject("Unable to make new target");
			}
		});
	}

// Put all extension measure values into xValues array
	function getObjectOutlierProperties(obj){
		// console.log("Calling replaceTargetOutlier...");
		return new Promise(function(resolve, reject) {

			app.getObjectProperties(selectionInfo.extQVID).then(function(model){

				var dim = model.layout.qHyperCube.qDimensionInfo[0].qGroupFieldDefs[0]; // Must use this because dim is a master item
				selectionInfo.dim = dim;

				var xValues = [];
				hyperCube = model.layout.qHyperCube.qDataPages[0].qMatrix;
				$.each(hyperCube,function(value){
					var xVal = {
						"title": hyperCube[value][0].qText,
						"X": hyperCube[value][1].qNum
					}
					xValues.push(xVal);
				});
				xValues.shift();
				if(xValues.length){
					return resolve(xValues);
				}else{
					completeSelection();
					return reject("No values found in Measure!");
				}
			});
		});
	}

// Find outlier values and return selected items
	function filterOutlierValues(vals){
		// console.log("Calling filterOutlierValues...");
		return new Promise(function(resolve, reject) {
			var selectedItems = [];

			for(var i=1; i < vals.length-1; i++){
				if((vals[i].X > vals[i-1].X*2) && (vals[i].X > vals[i+1].X*2)){
					selectedItems.push({qText: vals[i].title});
				}
			}

			if(selectedItems.length){
				// console.log("Selected Items", selectedItems);
				return resolve(selectedItems);
			}else{
				completeSelection();
				return reject(Error("No values selected in Measure!"));
			}
		});
	}

// Send selected items to Qlik Sense Engine to make selection and force redraw
	function sendOutlierSelection(selArray){
		// console.log("Making Selection",selArray);

		app.field(selectionInfo.dim).selectValues(selArray, true, true);

		completeSelection();
	}

	return {
		startRangeSelection: startRangeSelection,
		makeRangeSelection: makeRangeSelection,
		makeTopThreeSelection: makeTopThreeSelection,
		makeOutlierSelection: makeOutlierSelection,
		clearAll: clearAll
	};

});
