var circles = [];
var points;
var shipDataSource = new Cesium.CustomDataSource("ship data")	// ship routes
var ships = false;				// are ships visible?

// heatmap things
var heatmap_added = false;		// is the heatmap visible
var xmlhttp;					// zoom points ajax requests
var split_val = 4;				// 1/split_val = pixel size in degrees
var dts_high = 3000000;			// distance to shore range high
var dts_low = 0;				// distance to shore range low
var heatmap_data = {};			// holds all heatmap data from json
var month_date;					// the current month
var week_dates = [];			// stores the weekly dates
var current_week_heatmap;		// what week's heatmap is visible?

var split_val_vis = false;		// is the split_val combobox visible?

var split_selector_html = "<div id='split_val_selector'>Heatmap Detail "+
						"<select id='split_sel'>"+
						"  <option value=1>1</option>"+
						"  <option value=2>1/2</option>"+
						"  <option value=4 selected>1/4</option>"+
						"  <option value=8>1/8</option>"+
						"</select></div>";

var month_or_week = true;		// true = month view, false = weekly view
var instances = [];				// geometry instances of heatmap

var heatmap = new Cesium.Primitive({
  geometryInstances : instances,
  appearance : new Cesium.PerInstanceColorAppearance()
});

var heatmap_week = [];



// spinner settings
var opts = {
  lines: 13 // The number of lines to draw
, length: 0 // The length of each line
, width: 23 // The line thickness
, radius: 57 // The radius of the inner circle
, scale: 1.25 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: "#FFF" // #rgb or #rrggbb or array of colors
, opacity: 0.25 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: "spinner" // The CSS class to assign to the spinner
, top: "50%" // Top position relative to parent
, left: "50%" // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: "absolute" // Element positioning
}


// various spinners for loading animation
var target = document.getElementById('spin')
var spinner;



var month = 0;
var year = 2012;
//$('.date-picker').datepicker('setDate', new Date(year, month, 1));


var viewer = new Cesium.Viewer("cesiumContainer", {


imageryProvider : new Cesium.UrlTemplateImageryProvider({
	url : "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
	credit : "Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL."
}),
	baseLayerPicker : false
});



var scene = viewer.scene;
viewer.infoBox.frame.sandbox = "allow-same-origin allow-top-navigation allow-pointer-lock allow-popups allow-forms allow-scripts";

var layers = viewer.scene.imageryLayers;

// // add a mouse over handler for primitives
// var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
// handler.setInputAction(function(movement) {
// 	var feature = scene.pick(movement.endPosition);
// 
// 	if (typeof feature !== "undefined" && feature.hasOwnProperty("id")) {
// 		//feature.color = Cesium.Color.YELLOW;
// 
// 		console.log(typeof feature);
// 		console.log(feature);
// 		console.log(feature.id);
// 		//scene.primitives.destroy();
// 		//updateCicles();
// 	}
// }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);



// test animation from here https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Interpolation.html&label=All
//Generate a random circular pattern with varying heights.
//Set the random number seed for consistent results.
Cesium.Math.setRandomNumberSeed(30);

//Set bounds of our simulation time
var start = Cesium.JulianDate.fromDate(new Date(2012, 3, 1, -3));
var stop = Cesium.JulianDate.addDays(start, 30, new Cesium.JulianDate());

//Make sure viewer is at the desired time.
viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
viewer.clock.multiplier = 100;

// get the camera altitude
// partially taken from here https://stackoverflow.com/questions/33237064/get-current-zoom-in-cesium
var cartographic = new Cesium.Cartographic();
var cartesian = new Cesium.Cartesian3();
var camera = viewer.scene.camera;
var ellipsoid = viewer.scene.mapProjection.ellipsoid;
var rect = new Cesium.Rectangle(0.0, 0.0, 0.0, 0.0);


var fadedLine = new Cesium.StripeMaterialProperty({
	evenColor: new Cesium.Color(1, 1, 0, 1),
	oddColor: new Cesium.Color(1, 1, 0, 0),
	repeat: 1,
	offset: 0.5,
	orientation: Cesium.StripeOrientation.VERTICAL
});

function draw_heatmap(hm) {
	// draw the rectangles
	if (heatmap_added){
		scene.primitives.remove(heatmap);
		console.log("removed heatmap");
		instances.splice(0, instances.length);
		instances = [];
		heatmap = new Cesium.Primitive({
		  geometryInstances : instances,
		  appearance : new Cesium.PerInstanceColorAppearance()
		});
	}
		
	for(var j = 0; j < hm.length; j++) {
	for(var i = 0; i < hm[j].length; i++) {
		var pos = (i + j*hm[j].length) * split_val; // position in buffer based on x and y
		if (hm[j][i] == 0 ) {

		} else {
			var alpha = hm[j][i] >> 24 & 0xFF;
			var blue = hm[j][i] >> 16 & 0xFF;
			var green = hm[j][i] >> 8 & 0xFF;
			var red = hm[j][i] & 0xFF;


			instances.push(new Cesium.GeometryInstance({
			  geometry : new Cesium.RectangleGeometry({
				rectangle : Cesium.Rectangle.fromDegrees(i/split_val - (1/split_val)/2 - 180, j/split_val - (1/split_val)/2 - 90, i/split_val + (1/split_val)/2 - 180, j/split_val + (1/split_val)/2 - 90),
				vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
			  }),
			  attributes : {
				color : new Cesium.ColorGeometryInstanceAttribute(red/255, green/255, blue/255, alpha/255)
			  }
			}));
			//i++;


			}
		}
	}

	console.log(heatmap);
	scene.primitives.add(heatmap);
	heatmap_added = true;

}

function make_heatmap_geo(hm, fade) {

	var instance = [];
	var count = 0;
	for(var j = 0; j < hm.length; j++) {
	for(var i = 0; i < hm[j].length; i++) {
		var pos = (i + j*hm[j].length) * split_val; // position in buffer based on x and y
		if (hm[j][i] == 0 ) {

		} else {
			var alpha = hm[j][i] >> 24 & 0xFF;
			var blue = hm[j][i] >> 16 & 0xFF;
			var green = hm[j][i] >> 8 & 0xFF;
			var red = hm[j][i] & 0xFF;
			count++;
			instance.push(new Cesium.GeometryInstance({
			  id: j + ',' + i,
			  geometry : new Cesium.RectangleGeometry({
				rectangle : Cesium.Rectangle.fromDegrees(i/split_val - (1/split_val)/2 - 180, j/split_val - (1/split_val)/2 - 90, i/split_val + (1/split_val)/2 - 180, j/split_val + (1/split_val)/2 - 90),
				vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
			  }),
			  attributes : {
				color : new Cesium.ColorGeometryInstanceAttribute(red/255, green/255, blue/255, alpha/255)
			  }
			}));
			//i++;

			
			}
		}
	}
// 	console.log("INSTANCES");
// 	console.log(instance);
// 	console.log(instances);
	return instance;
}


function computeCirclularFlight(lon, lat, radius) {
	var property = new Cesium.SampledPositionProperty();
	for (var i = 0; i <= 360; i += 45) {
		var radians = Cesium.Math.toRadians(i);
		var time = Cesium.JulianDate.addSeconds(start, i, new Cesium.JulianDate());
		var position = Cesium.Cartesian3.fromDegrees(lon + (radius * 1.5 * Math.cos(radians)), lat + (radius * Math.sin(radians)), Cesium.Math.nextRandomNumber() * 500 + 1750);
		property.addSample(time, position);

	}
	return property;
}

// returns the interpolated route animation
function computeShipRoute(mmsi) {
	var property = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.FIXED, 0);
	property.backwardExtrapolationDuration = 1;
	property.forwardExtrapolationType = 1;
	//console.log(shipData[mmsi].length);
	for (var i=0; i < shipData[mmsi].length; i++) {
		//console.log(shipData[mmsi][i][2]);
		var time = Cesium.JulianDate.fromIso8601(shipData[mmsi][i][2]);
		var position = Cesium.Cartesian3.fromDegrees(shipData[mmsi][i][1], shipData[mmsi][i][0]);
		property.addSample(time, position);
	}
	//console.log(property);
	return property;
}

// returns the interpolated fishing data for coloring
function computeShipFishing(mmsi) {
	var property = new Cesium.SampledProperty(Cesium.Color);
	property.backwardExtrapolationDuration = 1;
	property.forwardExtrapolationType = 1;
	//console.log(shipData[mmsi].length);
	for (var i=0; i < shipData[mmsi].length; i++) {
		//console.log(shipData[mmsi][i][2]);
		var time = Cesium.JulianDate.fromIso8601(shipData[mmsi][i][2]);
		var num = shipData[mmsi][i][3];
		// make sure no -1"s are included
		if (num < 0)
			num = 0;
		var fishing = new Cesium.Color(1, 1, (1-num), 1);
		//var fishing = shipData[mmsi][i][3];
		property.addSample(time, fishing);
	}
	//console.log(property);
	property.setInterpolationOptions({
		interpolationDegree : 3,
		interpolationAlgorithm : Cesium.HermitePolynomialApproximation
	});
	return property;
}

function makeShips() {
	//shipEntityCollection.removeAll();


	var count = 0;
	console.log("ships adding");
	for (var mmsi in shipData) {

		//Compute the entity position property.
		var position = computeShipRoute(mmsi);
		var fishing = computeShipFishing(mmsi);
		console.log(fishing);

		//Actually create the entity

		//var entity = viewer.entities.add({
		var entity = shipDataSource.entities.add({

			id: mmsi,

			//Set the entity availability to the same interval as the simulation time.
			availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
				start : start,
				stop : stop
			})]),


			//Use our computed positions
			position : position,

			//Automatically compute orientation based on position movement.
			orientation : new Cesium.VelocityOrientationProperty(position),



			//Show the path as a pink line sampled in 1 second increments.
			path : {
				resolution : 256, // this is better performance higher I guess?
				leadTime: 0,
				trailTime: 86400,
				width: 3,
				material: new Cesium.StripeMaterialProperty({
					evenColor: fishing,		// changes based on time
					oddColor: new Cesium.Color(1, 1, 1, 0),
					repeat: 1,
					offset: 0.5,
					orientation: Cesium.StripeOrientation.VERTICAL
				}),
			}
		});

		entity.position.setInterpolationOptions({
			interpolationDegree : 1,
			interpolationAlgorithm : Cesium.LinearApproximation
		});

		count ++;
// 			if (count > 10) {
// 				break;
// 			}
	}	

}

function updateShips() {
	shipDataSource.entities.removeAll();
	console.log("ships removed");
	for (var i = -100; i<100; i++) {

		//Compute the entity position property.
		var position = computeCirclularFlight(i*Math.random(), i*Math.random(), 1 + Math.abs(i*Math.random())/10);



		//Actually create the entity

		//var entity = viewer.entities.add({
		var entity = shipDataSource.entities.add({
			//Set the entity availability to the same interval as the simulation time.
			availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
				start : start,
				stop : stop
			})]),

			//Use our computed positions
			position : position,

			//Automatically compute orientation based on position movement.
			orientation : new Cesium.VelocityOrientationProperty(position),



			//Show the path as a pink line sampled in 1 second increments.
			path : {
				resolution : 1,
				leadTime: 0,
				trailTime: 15000,
				width: 13,
			}
		});


		var fadedLine = new Cesium.StripeMaterialProperty({
			evenColor: new Cesium.Color(1, 1, 0, 1),
			oddColor: new Cesium.Color(1, 1, 0, 0),
			repeat: 1,
			offset: 0.6,
			orientation: Cesium.StripeOrientation.VERTICAL
		});
		entity.path.material = fadedLine;
	}	
}

// set the times based on month selected
function set_month(year, month) {
	//Set bounds of our simulation time
	var days = 31;
	if (month in [4, 6, 9, 11]) {
		days = 30;
	} else if (month==2) {
		days = 28; 
	}
	month = parseInt(month) + 1;
	var d = new Date(year, month, 1, 0, 0, 0);
	start = Cesium.JulianDate.fromDate(new Date(year, (month-1), 1, -3));
	stop = Cesium.JulianDate.addDays(start, days, new Cesium.JulianDate());

	//Make sure viewer is at the desired time.
	viewer.clock.startTime = start.clone();
	viewer.clock.stopTime = stop.clone();
	viewer.clock.currentTime = start.clone();
	viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
	viewer.clock.multiplier = 100;
	
	viewer.timeline.zoomTo(start, stop);
}


// gets the mmsi's to filter from
function getMMSIs() {
	return "all";
}

// returns the heatmaps with times
function computeWeeklyHeatmap(hm) {

// new Cesium.Primitive({
//   geometryInstances : instances,
//   appearance : new Cesium.PerInstanceColorAppearance()
// });
	var property = new Cesium.SampledProperty(Cesium.GeometryInstance);
	property.backwardExtrapolationDuration = 1;
	property.forwardExtrapolationType = 1;
	//console.log(shipData[mmsi].length);
	for (var k in hm) {
			if (k != 'mmsi' && k != "total_month") {
			var time = Cesium.JulianDate.fromIso8601(k + 'T00:00:00Z');
			var inst = make_heatmap_geo(hm[k], false);
// 			var map = new Cesium.Primitive({
// 				  geometryInstances : inst,
// 				  appearance : new Cesium.PerInstanceColorAppearance()
// 				});
			//var fishing = shipData[mmsi][i][3];
			property.addSample(time, inst);
		}
	}
	//console.log(property);
	property.setInterpolationOptions({
		interpolationDegree : 1,
		interpolationAlgorithm : Cesium.LinearApproximation
	});
	return property;
}

//put the heatmaps in intervals for weeks
function weeklyHeatmapIntervals(hm) {
	var composite = new Cesium.TimeIntervalCollectionProperty();
	for (var k in hm) {
			if (k != 'mmsi' && k != "total_month") {
			var time = Cesium.JulianDate.fromIso8601(k + 'T00:00:00Z');
			var end_time = Cesium.JulianDate.addDays(time, 7, new Cesium.JulianDate()); 
			var e_time = Cesium.JulianDate.toIso8601(end_time); 
			var inst = make_heatmap_geo(hm[k][0], false);
			console.log(inst);
			composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
				iso8601 : k + 'T00:00:00Z' + '/' + e_time,
				isStartIncluded : true,
				isStopIncluded : false,
				data : inst
			}));
			
			}
		}
	console.log(composite);
	return composite;
}

// put the show/hides for each heatmap in an interval
function showHideInterval(hm, date) {
	var composite = new Cesium.TimeIntervalCollectionProperty();
	for (var k in hm) {
			if (k != 'mmsi' && k != "total_month") {
			var time = Cesium.JulianDate.fromIso8601(k + 'T00:00:00Z');
			var end_time = Cesium.JulianDate.addDays(time, 7, new Cesium.JulianDate()); 
			var e_time = Cesium.JulianDate.toIso8601(end_time); 
			var inst = false;
			if (k == date) {
				inst = true;
			}
// 			composite.intervals.addInterval(Cesium.TimeInterval.fromIso8601({
// 				iso8601 : k + 'T00:00:00Z' + '/' + e_time,
// 				isStartIncluded : true,
// 				isStopIncluded : false,
// 				data : inst
// 			}));
			var ti = new Cesium.TimeInterval(time, end_time, true, false, inst);
			composite.intervals.addInterval(ti);
			//composite.intervals.addInterval({start:time,stop:end_time,data:inst});
			
			}
		}
	console.log(composite);
	return composite;
}

// toggle heatmaps
function toggleHeatmaps() {
	if (month_or_week) {
		// scene.primitives.remove(heatmap_week);
// 		scene.primitives.add(heatmap);
		for (h in heatmap_week) {
			console.log(h);
			console.log(heatmap_week);
			//heatmap_week[h].show = false;
		}
		//heatmap_week.show = false;
		heatmap.show = true;
		heatmap_added = true;
	} else {
		//scene.primitives.remove(heatmap);
		//console.log(heatmap);
		
		//var show_int = showHideInterval(heatmap_data, '2013-07-08');
		//heatmap_week.show = show_int;
		
		//console.log(heatmap_week);
		heatmap.show = false;
		//scene.primitives.add(heatmap_week);
		heatmap_added = true;
	}
}


// construct heatmap data from different setup



// gets the heatmap from python
function getHeatMapsAll(dtfrom, path, mmsis, dts_high, dts_low, split_val, span){
	
	if(xmlhttp){
		console.log('ready state on call ' + xmlhttp.readyState);
		xmlhttp.onreadystatechange = null;
		xmlhttp.abort();
		console.log('abort the xmlhttp');
	}
	
	xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if(this.readyState == 1) {

			if (spinner != null) {
				spinner.stop();
			}
		
			spinner = new Spinner(opts).spin(target);
		}
		if (this.readyState == 4 && this.status == 200) {
		
			// done request, apped these to the data
			var response_data = String(this.responseText);   // the string that gets sent back JSON.parse(this.responseText);
			//console.log(response_data);
			if (response_data == null || response_data == '') {
				return;
			}
			
			heatmap_data = JSON.parse(response_data);
			
			/////////////// TESTING DIFFERENT AJAX ///////////////////
			
			//heatmap_data = constructHeatmapData(JSON.parse(response_data));
			
			
			
			/////////////// TESTING DIFFERENT AJAX ///////////////////
			
			console.log(heatmap_data);
			
			//draw one heatmap
			draw_heatmap(heatmap_data['total_month'][0]);
			
			//remove the weekly heatmaps
			for (k in heatmap_data) {
				if (k != "total_month" && k != 'mmsi') {
					scene.primitives.remove(heatmap_week[k]);
					
				}
				
			}
			heatmap_week.splice(0, heatmap_week.length);
			
			// add the weekly heatmaps
			for (k in heatmap_data) {
				if (k != "total_month" && k != 'mmsi') {
					heatmap_week[k] = new Cesium.Primitive({
					  //asynchronous: false,
					  //show: show_int,
					  show: false,
					  allowPicking: false,
					  //releaseGeometryInstances: false,
					  //geometryInstances : weeklyHeatmapIntervals(heatmap_data),
					  // TESTING
					  geometryInstances: make_heatmap_geo(heatmap_data[k][0], false),
					  appearance : new Cesium.PerInstanceColorAppearance()
					});
					scene.primitives.add(heatmap_week[k]);
				}
				
			}

			makeWeekDates(heatmap_data);
			current_week_heatmap = -1;
			console.log(week_dates);
			
			//set the heatmaps
			
			
			
			viewer.animation.viewModel.playForwardViewModel.command();
		}
		if(this.readyState == 4) {
		
			if (spinner != null) {
				spinner.stop();
			}
		}
	}
	
	console.log("../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span);
	xmlhttp.open("GET", "../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span, true);
	xmlhttp.send();
}

function advanceWeek(dtfrom) {
	var date = dtfrom.split('T')[0];
	var y = date.split('-')[0];
	var m = date.split('-')[1];
	var d = parseInt(date.split('-')[2]);
	var end = 29;
	if (parseInt(m) == 2) {
		end = 22;
	}
	
	if (d == end) {
		return 'total_month';
	} else {
		var day = '' + (d + 7);
		if (parseInt(day) < 10) {
			day = '0' + (d + 7);
		}
		var fd = y + '-' + m + '-' + day + 'T00:00:00Z';
		return fd;
	}
}


// gets the heatmap from python one at a time
function getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, span){
	
	if(xmlhttp){
		console.log('ready state on call ' + xmlhttp.readyState);
		xmlhttp.onreadystatechange = null;
		xmlhttp.abort();
		console.log('abort the xmlhttp');
	}
	
	xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if(this.readyState == 1) {

			if (spinner != null) {
				spinner.stop();
			}
		
			spinner = new Spinner(opts).spin(target);
		}
		if (this.readyState == 4 && this.status == 200) {
		
			// done request, apped these to the data
			var response_data = String(this.responseText);   // the string that gets sent back JSON.parse(this.responseText);
			//console.log(response_data);
			if (response_data == null || response_data == '') {
				return;
			}
			var data = JSON.parse(response_data);
			
			if (dtfrom != 'total_month'){
				console.log("not month");
				heatmap_data[dtfrom.split('T')[0]] = data[dtfrom.split('T')[0]];
				dtfrom = advanceWeek(dtfrom);
				if (dtfrom == 'total_month') {
					getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'month');
				} else {
					getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'week');
				}
			} else {
				//console.log(data);
				heatmap_data['total_month'] = data['total_month'];
				heatmap_data['mmsi'] = data['mmsi'];
				console.log("month");
				draw_heatmap(heatmap_data['total_month'][0]);
				
				//remove the weekly heatmaps
				for (k in heatmap_data) {
					if (k != "total_month" && k != 'mmsi') {
						scene.primitives.remove(heatmap_week[k]);
					}
				
				}
				heatmap_week.splice(0, heatmap_week.length);
			
				// add the weekly heatmaps
				for (k in heatmap_data) {
					if (k != "total_month" && k != 'mmsi') {
						heatmap_week[k] = new Cesium.Primitive({
						  //asynchronous: false,
						  //show: show_int,
						  show: false,
						  allowPicking: false,
						  //releaseGeometryInstances: false,
						  //geometryInstances : weeklyHeatmapIntervals(heatmap_data),
						  // TESTING
						  geometryInstances: make_heatmap_geo(heatmap_data[k][0], false),
						  appearance : new Cesium.PerInstanceColorAppearance()
						});
						scene.primitives.add(heatmap_week[k]);
					}
				
				}
				console.log(heatmap_week);
				console.log(scene.primitives);
				viewer.animation.viewModel.playForwardViewModel.command();
			}
			
			//console.log(heatmap_data);
			//draw one heatmap
			//draw_heatmap(data[0]);
			
			
			
		}
		if(this.readyState == 4) {
		
			if (spinner != null) {
				spinner.stop();
			}
		}
	}
	
	
	if (dtfrom == 'total_month') {
		console.log("../py/cesium/build_ds.php?&dtfrom=" + month_date + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span);
		xmlhttp.open("GET", "../py/cesium/build_ds.php?&dtfrom=" + month_date + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span, true);	
	} else {
		console.log("../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span);
		xmlhttp.open("GET", "../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span, true);
	}
	xmlhttp.send();
}

// gets the heatmap from python in two parts
function getHeatMapsSplit(dtfrom, path, mmsis, dts_high, dts_low, split_val, span){
	
	if(xmlhttp){
		console.log('ready state on call ' + xmlhttp.readyState);
		xmlhttp.onreadystatechange = null;
		xmlhttp.abort();
		console.log('abort the xmlhttp');
	}
	
	xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
		if(this.readyState == 1) {

			if (spinner != null) {
				spinner.stop();
			}
		
			spinner = new Spinner(opts).spin(target);
		}
		if (this.readyState == 4 && this.status == 200) {
		
			// done request, apped these to the data
			var response_data = String(this.responseText);   // the string that gets sent back JSON.parse(this.responseText);
			//console.log(response_data);
			if (response_data == null || response_data == '') {
				return;
			}
			var data = JSON.parse(response_data);
			
			heatmap_data = data;
			
			getHeatMaps('total_month', path, mmsis, dts_high, dts_low, split_val, 'month');
			//draw one heatmap
			//draw_heatmap(data[0]);
			
			
			viewer.animation.viewModel.playForwardViewModel.command();
		}
		if(this.readyState == 4) {
		
			if (spinner != null) {
				spinner.stop();
			}
		}
	}
	
	console.log("../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span);
	xmlhttp.open("GET", "../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span, true);
	xmlhttp.send();
}

// makeShips();
// 	viewer.dataSources.add(shipDataSource);
viewer.camera.moveEnd.addEventListener(function() { 
	 // the camera stopped moving
	 ellipsoid.cartesianToCartographic(camera.positionWC, cartographic);
	 camera.computeViewRectangle(ellipsoid, rect);
	 console.log("CAM LON: " + Cesium.Math.toDegrees(cartographic.longitude));
	 console.log("CAM LON: " + Cesium.Math.toDegrees(cartographic.latitude));
	 console.log("CAM HEIGHT: " + cartographic.height); 
	 console.log("CAM RECT: " + Cesium.Math.toDegrees(rect.north) + " " + Cesium.Math.toDegrees(rect.west)  + " " +  Cesium.Math.toDegrees(rect.south) + " " + Cesium.Math.toDegrees(rect.east)); 

	 console.log(shipDataSource);

	 // remove and make new ships on zoom
// 	 if (cartographic.height < 1500000 && !ships) {
// 		//updateShips();
// 		makeShips();
// 		viewer.dataSources.add(shipDataSource);
// 		ships = true;
// 
// 	 }
// 
// 	 if (cartographic.height < 1500000 && heatmap_added) {
// 		scene.primitives.get(1).show = false;
// 		heatmap_added = false;
// 	 }
// 
// 	 if (cartographic.height >= 1500000 && !heatmap_added) {
// 		console.log(scene.primitives);
// 		scene.primitives.get(1).show = true;
// 		heatmap_added = true;
// 		shipDataSource.entities.removeAll();
// 		ships = false;
// 
// 	 }
});

viewer.clock.onTick.addEventListener(function(clock) {
        var currentTime = clock.currentTime;
        
        //redrawWeeklyHeatMaps(currentTime);
        showWeeklyHeatMaps(currentTime);
    });
    
    
// show/hide weekly heatmaps by week 
function showWeeklyHeatMaps(currentTime) {
	if (!month_or_week) {
		var date = Cesium.JulianDate.toDate(currentTime); 
		for (var i = 0; i < week_dates.length-1; i++) {
			//console.log(week_dates[i]);
			if (current_week_heatmap != week_dates[i] && date >= week_dates[i] && date < week_dates[i + 1]) {
				var d = new Date(week_dates[i]);
				var week = d.toISOString();
				var w = week.split('T')[0];
				//scene.primitives.remove(heatmap_week);
				//console.log(heatmap_week);
				
				for (h in heatmap_week) {
					if (h == w) {
						heatmap_week[h].show = true;
					} else {
						heatmap_week[h].show = false;
					}
				}
				

				//heatmap_week[w].show = true;

				console.log(heatmap_week);
				//console.log("changed");
				current_week_heatmap = week_dates[i];
				//scene.primitives.add(heatmap_week);
			}
		}
	}
}
    
// redraws the heatmap each time a week changes    
// function redrawWeeklyHeatMaps(currentTime) {
// 	var date = Cesium.JulianDate.toDate(currentTime); 
// 	for (var i = 0; i < week_dates.length-1; i++) {
// 		//console.log(week_dates[i]);
// 		if (current_week_heatmap != week_dates[i] && date >= week_dates[i] && date < week_dates[i + 1]) {
// 			var d = new Date(week_dates[i]);
// 			var week = d.toISOString();
// 			var w = week.split('T')[0];
// 			scene.primitives.remove(heatmap_week);
// 			console.log(heatmap_week);
// 
// 			heatmap_week = new Cesium.Primitive({
// 							  //asynchronous: false,
// 							  allowPicking: false,
// 							  //releaseGeometryInstances: false,
// 							  //geometryInstances : weeklyHeatmapIntervals(heatmap_data),
// 							  // TESTING
// 							  geometryInstances: make_heatmap_geo(heatmap_data[w][0], false),
// 							  appearance : new Cesium.PerInstanceColorAppearance()
// 							});
// 
// 			console.log(heatmap_week);
// 			console.log("changed");
// 			current_week_heatmap = week_dates[i];
// 			scene.primitives.add(heatmap_week);
// 		}
// 	}
// }

// saves the current weekly dates in an array for later use
function makeWeekDates(hm) {
	week_dates.splice(0, week_dates.length);
	for (k in hm) {
		if (k != 'total_month' && k != 'mmsi') {
			console.log(k);
			week_dates.push(Date.parse(k));
		}
		week_dates.sort();
	}
}


function showHeatMapSplit() {
	split_val_vis = true;
	console.log("????");
	console.log(split_selector_html);
	$('#ui-datepicker-div').append( split_selector_html);
	$("#split_sel").val(split_val);
}

//////////////////////////////// Toolbar Functions ////////////////////////////////

//Add button to save an image
function saveImage() {
	//testing
	viewer.render();
	var image_save = viewer.canvas.toDataURL().replace("image/png", "image/octet-stream");
	console.log(image_save);
	window.location.href=image_save;
	// 0:00:08.148119
	// 0:00:59.301605
}

function zoomIn() {
	camera.zoomIn(700000.0);
}

function zoomOut() {
	camera.zoomOut(700000.0);
}

function heatmapWeek(){
	month_or_week = false;
	toggleHeatmaps();
}

function heatmapMonth(){
	month_or_week = true;
	toggleHeatmaps();
}


//////////////////////////////// Ready Function ////////////////////////////////

$(function() {


	//Set timeline to simulation bounds
	viewer.timeline.zoomTo(start, stop);
	
	

	//http://jsfiddle.net/bopperben/DBpJe/
	$('.date-picker').datepicker('setDate', new Date(year, month, 1));
    $('.date-picker').datepicker( {
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        dateFormat: 'MM yy',
        yearRange: '2012:2016',
        minDate: new Date(2012, 0, 1),
        maxDate: new Date(2016, 11, 31),
        closeText: "Go",
        onClose: function(dateText, inst) { 
        	
            month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
            year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
            console.log(month);
            console.log(year);
            // set the month in the timeline
            set_month(year, month);
            viewer.animation.viewModel.pauseViewModel.command();
            // get the monthly heatmaps
            var m = '' + (parseInt(month) + 1);
            if (parseInt(m) < 10){
            	m = '0' + (parseInt(month) + 1);
            }
            var dtfrom = year + '-' + m + '-01T00:00:00Z';
            month_date = dtfrom;
            var mmsis = getMMSIs();
            var span = "all"; // set to all for now, change if split required
            var path = "'../../../csv/'";	// path from php file to csv folder
            
            split_val = $('#split_sel option:selected').val();
            split_val_vis = false;
            $(this).datepicker('setDate', new Date(year, month, 1));
            //getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'week');
            //getHeatMapsAll(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'all');
            //getHeatMapsSplit(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'week');
            
            //getHeatMapsSplit(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'all_weeks');
            
            // empty the heatmap array for (var key in arr_jq_TabContents) {
            for (var k in heatmap_data) {
//             	console.log(k);
//             	console.log(heatmap_data[k]);
            	if (k != 'mmsi') {
            		heatmap_data[k].splice(0, heatmap_data[k].length);
            	} else {
            		heatmap_data[k] = '';
            	}
            }
            
            // over 1/4 needs to be broken up
            if (split_val <= 4) {
            	getHeatMapsAll(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'all');
            } else {
            	getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'week');
            }
            
            
        },
        onChangeMonthYear: function (y, m, i) {
        	split_val_vis = false;
        }
    }).bind("click",function(){
		if (!split_val_vis) {
			  console.log("div opened");
			  showHeatMapSplit();
		  }
	});
	
	$('#ui-datepicker-div').bind("DOMSubtreeModified",function(){
		if (!split_val_vis) {
			  console.log("div changed");
			  showHeatMapSplit();
		  }
	});
});