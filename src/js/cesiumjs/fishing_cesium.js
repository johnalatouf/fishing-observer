// constants: colors, types, etc
// change these paths when deploying live

var path = "'../../../../fishingobserver/csv/'";	// path from php file to csv folder


// var zoom_level_globe = 1500000; 
var zoom_level_globe = 2500000; 
var zoom_level_flat =  3800000;
// var zoom_level_flat =  0.39;
var flat_map_view = 380000000.0;
var rect_flat;
var save_path = "'/data/www/fishingobserver/csv'";	// where downloaded csvs get saved
var php_path = "../py/cesium";	//where the scripts are

// color options
var hm_colors = [];
hm_colors['orange'] = [1, 0.416, 0];
hm_colors['green']  = [0, 0.6, 0.3176];
hm_colors['red']  = [0.639, 0, 0];
hm_colors['blue']  = [0.129, 0.129, 1];
hm_colors['purple']  = [0.557, 0.118, 1];
hm_colors['yellow']  = [0.867, 0.678, 0.0];

hm_colors['orange-white'] = [1, 0.941, 0.812];
hm_colors['green-white']  = [0.914, 1, 0.639];
hm_colors['red-white']  = [1, 0.729, 0.729];
hm_colors['blue-white']  = [0.8, 0.867, 1];
hm_colors['purple-white']  = [0.933, 0.8, 1];
hm_colors['yellow-white']  = [1, 0.894, 0.518];

// type colors
var hm_type_colors = [];
hm_type_colors['Longliner'] = [hm_colors['orange'].slice(), hm_colors['orange-white'].slice()];
hm_type_colors['Trawler'] = [hm_colors['green'].slice(), hm_colors['green-white'].slice()];


var ship_types = ['Trawler', 'Longliner'];

var attr;						// label entity for saving image
var attr2;
var attr3;
var picked_mmsi;				// picked object
var getShipData_tries = 0;

var circles = [];
var points;
var shipDataSource = new Cesium.CustomDataSource("ship data");	// ship routes
var ships = false;				// are ships visible?
var shipData = [];				// holds the ship data on zoom-ins

var mmsiData = {};				// holds the mmsi data
var selected_mmsis = []			// holds selected mmsis from table for filtering
var mmsi_ourlabel = []			// holds types selected
var visible_mmsis = [];			// visible vessels
var visible_labels = [];		// visible labels

// ajax related
var xmlhttp;					// ajax requests for heatmaps
var xmlhttp_ships;				// ajax request for ship points
var xmlhttp_mmsis;				// ajax request for itu info

// heatmap things
var heatmap_added = false;		// is the heatmap visible
heatmap_flat_added = false;
var split_val = 4;				// 1/split_val = pixel size in degrees
var dts_high = 3000000;			// distance to shore range high
var dts_low = 0;				// distance to shore range low
var dtm_high = 3000000;			// distance to MPA range high
var dtm_low = 0;				// distance to MPA range low
var heatmap_data = {};			// holds all heatmap data from json
var month_date;					// the current month
var week_dates = [];			// stores the weekly dates
var current_week_heatmap;		// what week's heatmap is visible?
var dtsSlider;		   			// distance to shore slider
var dtmSlider;		   			// distance to mpa's slider


var split_val_vis = false;		// is the split_val combobox visible?
var just_flattened = false;

var split_selector_html = "<div id='split_val_selector'>Heatmap Detail "+

						"<select id='split_sel'>"+
						"  <option value=1>1</option>"+
						"  <option value=2>1/2</option>"+
						"  <option value=4 selected>1/4</option>"+
						"  <option value=8>1/8</option>"+
						"  <option value=16>1/16</option>"+
						"</select>°</div>";

var month_or_week = true;		// true = month view, false = weekly view
var need_to_redraw = false;		// something in the heatmaps must be redrawn after zoom

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

var mmsi_opts = {
  lines: 13 // The number of lines to draw
, length: 1 // The length of each line
, width: 3 // The line thickness
, radius: 5 // The radius of the inner circle
, scale: 1 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: "#FFF" // #rgb or #rrggbb or array of colors
, opacity: 0.55 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: "spinner-mmsi" // The CSS class to assign to the spinner
, top: "25%" // Top position relative to parent
, left: "25%" // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: "absolute" // Element positioning
}

var opts_csv = {
  lines: 13 // The number of lines to draw
, length: 1 // The length of each line
, width: 3 // The line thickness
, radius: 5 // The radius of the inner circle
, scale: 1 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: "#FFF" // #rgb or #rrggbb or array of colors
, opacity: 0.55 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: "spinner-csv" // The CSS class to assign to the spinner
, top: "25%" // Top position relative to parent
, left: "25%" // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: "absolute" // Element positioning
}


// various spinners for loading animation
var target = document.getElementById('spin')
var spinner;

var target_csv = document.getElementById('spin-csv')
var csv_spinner;

var mmsi_target = document.getElementById('spin-mmsi')
var mmsi_spinner;



var month = 0;
var year = 2012;
//$('#date-picker-div').datepicker('setDate', new Date(year, month, 1));


var viewer = new Cesium.Viewer("cesiumContainer", {
	contextOptions: {
			webgl: {
			  //stencil: true, // true makes it white
			  //alpha : true
			}
		  },
	// imageryProvider : new Cesium.createOpenStreetMapImageryProvider({
// 		url : "https://c.tile.openstreetmap.org/"
// 			}),
// 			baseLayerPicker : false,
// 			geocoder: false,
// 			proxy : new Cesium.DefaultProxy('/proxy/')
// 		});

imageryProvider : new Cesium.UrlTemplateImageryProvider({
	url : "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_labels_under/{z}/{x}/{y}@2x.png",
	credit : "Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL."
}),
	baseLayerPicker : false,
	geocoder: false,
	proxy : new Cesium.DefaultProxy('/proxy/')
});



var scene = viewer.scene;
viewer.infoBox.frame.sandbox = "allow-same-origin allow-top-navigation allow-pointer-lock allow-popups allow-forms allow-scripts";

var frame = viewer.infoBox.frame;

frame.addEventListener('load', function () {
	console.log('table');
    //frame.$( ".cesium-infoBox-defaultTable" ).css( "font-size", '9pt');
    var cssLink = frame.contentDocument.createElement('link');
    cssLink.href = Cesium.buildModuleUrl('../../../../css/infobox.css');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    frame.contentDocument.head.appendChild(cssLink);
}, false);

viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);


var layers = viewer.scene.imageryLayers;




// test animation from here https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Interpolation.html&label=All
//Generate a random circular pattern with varying heights.
//Set the random number seed for consistent results.
Cesium.Math.setRandomNumberSeed(30);

//Set bounds of our simulation time
var start = Cesium.JulianDate.fromDate(new Date(2012, 3, 1, -3));
var stop = Cesium.JulianDate.addDays(start, 30, new Cesium.JulianDate());

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
	orientation: Cesium.StripeOrientation.VERTICAL,
});


// more efficient way to draw this
function draw_heatmap(hm) {
	// draw the rectangles
	if (heatmap_added){
		scene.primitives.remove(heatmap);
		//////////////console.log("removed heatmap");
		instances.splice(0, instances.length);
		instances = [];
		heatmap = new Cesium.Primitive({
		  geometryInstances : instances,
		  shadows: Cesium.ShadowMode.DISABLED,
		  appearance : new Cesium.PerInstanceColorAppearance({
							  translucent : true,
							  flat : true,
							  faceForward : true
							}),
		  height: 0.0,
		});
	}
	
	//////////////console.log(hm);
	var count = 0;
	
	for(var m = 0; m < hm.length; m++) {
		//var pos = (i + j*hm[j].length) * split_val; // position in buffer based on x and y
		if (hm[m][2] == 0 ) {
		
		} else {
			var offset = [1, 1];
			var j = hm[m][0] + 1;
			var i = hm[m][1] + 1;
			var alpha = hm[m][2] >> 24 & 0xFF;
			var blue = hm[m][2] >> 16 & 0xFF;
			var green = hm[m][2] >> 8 & 0xFF;
			var red = hm[m][2] & 0xFF;


var rect_calc = Cesium.Rectangle.fromDegrees(i/split_val - 
							(1/split_val)/2 - 180, j/split_val - 
							(1/split_val)/2 - 90, i/split_val + 
							(1/split_val)/2 - 180, j/split_val + 
							(1/split_val)/2 - 90);

			instances.push(new Cesium.GeometryInstance({
			  geometry : new Cesium.RectangleGeometry({
				

				rectangle: rect_calc,

				vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
			  }),
			  attributes : {
				color : new Cesium.ColorGeometryInstanceAttribute(red/255, green/255, blue/255, alpha/255)
			  }
			}));
			count++;


			}
		}
	

	scene.primitives.add(heatmap);
	heatmap_added = true;

}

function draw_heatmap_flat(hm) {
	//var instances = [];
	// draw the rectangles
	if (heatmap_flat_added){
		scene.primitives.remove(heatmap_flat);
		
		heatmap_flat = new Cesium.GroundPrimitive({
		  geometryInstances : instances,
		  appearance : new Cesium.PerInstanceColorAppearance()
		});
	}
	
	scene.primitives.add(heatmap_flat);
	heatmap_flat_added = true;

}

// returns the interpolated route animation
function computeShipRoute(mmsi) {
	var property = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.FIXED, 0);
	property.backwardExtrapolationDuration = 1;
	property.forwardExtrapolationType = 1;
	for (var i=0; i < shipData[mmsi].length; i++) {
		var time = Cesium.JulianDate.fromIso8601(shipData[mmsi][i][2]);
		var position = Cesium.Cartesian3.fromDegrees(shipData[mmsi][i][1], shipData[mmsi][i][0]);
		property.addSample(time, position);
	}
	return property;
}

// returns the interpolated fishing data for coloring
function computeShipFishing(mmsi) {
	var property = new Cesium.SampledProperty(Cesium.Color);
	var label = '-';
	var time;
	var num;
	if (mmsi.toString() in mmsiData) {
		label = mmsiData[mmsi.toString()]['ourlabel'];
	} else if (mmsi in mmsiData) {
		label = mmsiData[mmsi]['ourlabel'];
	} else {
		mmsiData[mmsi.toString()];
	}
	property.backwardExtrapolationDuration = 1;
	property.forwardExtrapolationType = 1;
	for (var i=0; i < shipData[mmsi].length; i++) {
		time = Cesium.JulianDate.fromIso8601(shipData[mmsi][i][2]);
		num = shipData[mmsi][i][3];
		var fishing = new Cesium.Color(0.5, 0.5, 0.5, 1.0);
		if (num < 1 && label == '1') {
			fishing = new Cesium.Color(hm_type_colors['Longliner'][1][0], hm_type_colors['Longliner'][1][1], hm_type_colors['Longliner'][1][2], 0.8);
		} else if (label == '1') {
			fishing = new Cesium.Color(hm_type_colors['Longliner'][0][0], hm_type_colors['Longliner'][0][1], hm_type_colors['Longliner'][0][2], 1);
		} else if (num < 1 && label == '0') {
			fishing = new Cesium.Color(hm_type_colors['Trawler'][1][0], hm_type_colors['Trawler'][1][1], hm_type_colors['Trawler'][1][2], 0.8);
		} else if (label == '0') {
			fishing = new Cesium.Color(hm_type_colors['Trawler'][0][0], hm_type_colors['Trawler'][0][1], hm_type_colors['Trawler'][0][2], 1);
		} else if (num < 1) {
			////////////////console.log("LABEL: " + mmsi + " " + label);
			fishing = new Cesium.Color(0.9, 0.9, 0.9, 0.5);
		}
		property.addSample(time, fishing);
	}
	property.setInterpolationOptions({
		interpolationDegree : 1,
		interpolationAlgorithm : Cesium.LinearApproximation
	});
	return property;
}



// draw ships in zoomed mode
function makeShips() {


	shipDataSource.entities.removeAll();
	var count = 0;
	var shipName = '-';
	var shipCountry = '-';
	var shipType = '-';
	var position;
	var fishing;
	var desc;
	//////////////console.log("ships adding");
	for (var mmsi in shipData) {
		
// 		if (mmsiData[mmsi.toString()]['ourlabel'] == '-')
// 			continue;
		
		// if we only have some ships selected, only show those
		if (selected_mmsis.length > 0 && selected_mmsis.indexOf(mmsi.toString()) == -1) {
			continue;
		}
		
		if (mmsi in mmsiData) {
			shipName = mmsiData[mmsi.toString()]['name'];
			shipCountry = ship_country(mmsiData[mmsi.toString()]['country']);
			shipType = ship_type(mmsiData[mmsi.toString()]['ourlabel']);
		} else {
			shipName = shipType;
			continue;
		}
		
		//Compute the entity position property.
		position = computeShipRoute(mmsi);
		////////////console.log(mmsiData);
		fishing = computeShipFishing(mmsi);
		
		// set the description
		desc = 'mmsi: ' + mmsi + '<br />country: ' + shipCountry
						 + '<br />type: ' + shipType;
						 
		// if user not logged in
		if (!$('#button-mmsi').length) {
			shipName = shipType;
			desc = 'country: ' + shipCountry + '<br />type: ' + shipType;
		}
		var blackline = new Cesium.Color(0.373, 0.51, 0.639, 0.7);
		//Actually create the entity
		var entity = shipDataSource.entities.add({

			id: mmsi,
			
			name: shipName,
			
			description: desc
		,

			//Set the entity availability to the same interval as the simulation time.
			availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
				start : start,
				stop : stop
			})]),


			//Use our computed positions
			position : position,
			
			point : {
				color: fishing,
				outlineColor: blackline,
				//outlineWidth: 0.1, python rewrite_csvs.py 2012-01 2012-01 ../csv

				//outlineColor: blackline,
				pixelSize: 2.95,
			},

			//Automatically compute orientation based on position movement.
			orientation : new Cesium.VelocityOrientationProperty(position),



			//Show the path as a pink line sampled in 1 second increments.
			path : {
				resolution : 256, // this is better performance higher I guess?
				show: true,
				leadTime: 0,
				trailTime: 60000,
				width: 2.2,
				material: new Cesium.StripeMaterialProperty({
					evenColor: fishing,		// changes based on time
					oddColor: new Cesium.Color(1, 1, 1, 0),
					repeat: 1,
					offset: 0.75,
					orientation: Cesium.StripeOrientation.VERTICAL
				}),
			}
		});

		entity.position.setInterpolationOptions({
			interpolationDegree : 1,
			interpolationAlgorithm : Cesium.LinearApproximation
		});

		count ++;
	}	
	
	 spinner.stop();

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
	//start = Cesium.JulianDate.fromDate(new Date(year, (month-1), 1, -3));
	var m = month.toString();
	var m_next = (month + 1).toString();
	if (month < 10)
		m = '0' + month;
	if (month < 9)
		m_next = '0' + m_next;
	var startdate = year + '-' + m + '-01T00:00:00Z';
	start = Cesium.JulianDate.fromIso8601(startdate);
	//stop = Cesium.JulianDate.addDays(start, days, new Cesium.JulianDate());
	var enddate = year + '-' + m_next + '-01T00:00:00Z';
	stop = Cesium.JulianDate.fromIso8601(enddate);
	//Make sure viewer is at the desired time.
	viewer.clock.startTime = start.clone();
	viewer.clock.stopTime = stop.clone();
	viewer.clock.currentTime = start.clone();
	viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
	viewer.clock.multiplier = 200;
	
	viewer.timeline.zoomTo(start, stop);
}


// gets the mmsi's to filter from
function getMMSIs() {
	var mmsis = 'all';
			
	if (selected_mmsis.length >= 1) {
		mmsis = selected_mmsis.join(',');
	}
	
	
	return mmsis;
}


function mmsiClear() {
	var rows = $('#mmsi-table-data > tbody > tr').not(':first');
	selected_mmsis.splice(0, selected_mmsis.length);
	selected_mmsis = [];

	rows.each(function(e) {
		this.classList.remove("mmsi-highlight");
		this.classList.add("mmsi-tr");
	});
	
	// redraw on zoom out?
	if (cartographic.height < zoom_level_globe)
		need_to_redraw = true;
}

// maintain highlights
function mmsiHighlight() {
	var rows = $('#mmsi-table-data > tbody > tr').not(':first');

	rows.each(function(e) {
		if (this.childNodes[0].textContent in selected_mmsis){
			this.classList.remove("mmsi-tr");
			this.classList.add("mmsi-highlight");
		}
	});
}


// toggle heatmaps between month and week
function toggleHeatmaps() {

	if (!ships) {
		if (month_or_week) {
			// if month: hide all weeks, set current week to -1
			for (h in heatmap_week) {
				heatmap_week[h].show = false;
			}
			heatmap.show = true;
			heatmap_added = true;
			current_week_heatmap = -1;
		} else {
		
			// if week: hide month, clock event will re-display weekly maps
			heatmap.show = false;
			heatmap_added = true;
		}
	} else {
		heatmap.show = false;
		for (h in heatmap_week) {
			heatmap_week[h].show = false;
		}
	}	
}

function toggleHeatmapLegendValues() {
	var low;
	var mid;
	var high;
	var mid_pos;
	var ten;
	var ten_pos;
	var tot;
	
	//the bar width
	var bar = 130;
	
	// these values are smaller, spaced better
	ten = 10;
	mid = 100;
	
	if (month_or_week) {
		low = parseInt(heatmap_data['total_month'][1]);
		high = parseInt(heatmap_data['total_month'][2]);
		
		//mid = parseInt(high/2);
		
		
		
		tot = Math.log10(high)/bar;
		
		ten_pos = Math.log10(ten)/tot - $('#hm-legend-mid').width()/2;
		mid_pos = Math.log10(mid)/tot - $('#hm-legend-mid').width()/2;
		
		// //////////////console.log(mid_pos);
		if (high > mid) {
			$('#hm-legend-mid').css("margin-left", mid_pos + "px");
			$('#hm-legend-mid-tick').css("margin-left", mid_pos + "px");
		} else {
			mid = parseInt(high/2);
			mid_pos = Math.log10(mid)/tot - $('#hm-legend-mid').width()/2;
			$('#hm-legend-mid').css("margin-left", mid_pos + "px");
			$('#hm-legend-mid-tick').css("margin-left", mid_pos + "px");
		}
		
		if (high > ten) {
			$('#hm-legend-ten').css("margin-left", ten_pos + "px");
			$('#hm-legend-ten-tick').css("margin-left", ten_pos + "px");
		} else {
			ten = parseInt(high/2);
			ten_pos = Math.log10(ten)/tot - $('#hm-legend-ten').width()/2;
			$('#hm-legend-ten').css("margin-left", ten_pos + "px");
			$('#hm-legend-ten-tick').css("margin-left", ten_pos + "px");
		}
		
	} else {
		
		var s = new Date(current_week_heatmap).toISOString();
		s = s.split('T')[0];
		////////////////console.log(s);
		low = parseInt(heatmap_data[s][1]);
		high = parseInt(heatmap_data[s][2]);
		
		//mid = parseInt(high/2);
		
		//mid = 100;
		
		tot = Math.log10(high)/bar;
		
		ten_pos = Math.log10(ten)/tot - $('#hm-legend-mid').width()/2;
		mid_pos = Math.log10(mid)/tot - $('#hm-legend-mid').width()/2;
		
		// //////////////console.log(mid_pos);
		if (high > mid) {
			$('#hm-legend-mid').css("margin-left", mid_pos + "px");
			$('#hm-legend-mid-tick').css("margin-left", mid_pos + "px");
		} else {
			mid = parseInt(high/2);
			mid_pos = Math.log10(mid)/tot - $('#hm-legend-mid').width()/2;
			$('#hm-legend-mid').css("margin-left", mid_pos + "px");
			$('#hm-legend-mid-tick').css("margin-left", mid_pos + "px");
		}
	
		if (high > ten) {
			$('#hm-legend-ten').css("margin-left", ten_pos + "px");
			$('#hm-legend-ten-tick').css("margin-left", ten_pos + "px");
		} else {
			ten = parseInt(high/2);
			ten_pos = Math.log10(ten)/tot - $('#hm-legend-ten').width()/2;
			$('#hm-legend-ten').css("margin-left", ten_pos + "px");
			$('#hm-legend-ten-tick').css("margin-left", ten_pos + "px");
		}
		
	}
	
	
	// set the text
	$('#hm-legend-low').text(low);
	$('#hm-legend-mid').text(mid);
	$('#hm-legend-ten').text(ten);
	$('#hm-legend-high').text(high);
}

// borrowed https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}



// Use jQuery's ajax and post method to get the heatmap data back
function getHeatMapMonth(dtfrom, path, mmsis, dts_high, dts_low, split_val, span, ourlabel){
	//xmlhttp.open("GET", php_path + "/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span + "&ourlabel=" + ourlabel, true);
	var ckey;
	var c_trawler = rgbToHex(parseInt(hm_type_colors['Trawler'][0][0]*255), parseInt(hm_type_colors['Trawler'][0][1]*255), parseInt(hm_type_colors['Trawler'][0][2]*255));
	var c_longliner = rgbToHex(parseInt(hm_type_colors['Longliner'][0][0]*255), parseInt(hm_type_colors['Longliner'][0][1]*255), parseInt(hm_type_colors['Longliner'][0][2]*255));
	ckey = '0:' + c_trawler + ',1:' + c_longliner;
	
	if (spinner != null) {
	
		 spinner.stop();
	}
	spinner = new Spinner(opts).spin(target);
	
	console.log(dtm_high + ", " + dtm_low);
	
	xmlhttp = $.ajax({
		url: php_path + "/build_ds.php",
		type: 'POST',
		data: jQuery.param({ dtfrom: dtfrom, path : path, mmsis: mmsis, dts_high: dts_high, dts_low: dts_low, split_val: split_val, span: span, ourlabel: ourlabel, color_key: ckey, dtm_high: dtm_high, dtm_low: dtm_low}) ,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		success: function (response) {
			// done request, apped these to the data
			var response_data = String(response);
			console.log(response_data);
			if (response_data == null || response_data == '' || !response_data.replace(/\s/g, '').length) {
			
				 spinner.stop();
				return;
			}
			
			//if the csv does not exist:
			if (response_data.startsWith("File")) {
				if (location.host == 'localhost:8888') {
					console.log("PYTHON ERROR: " + response_data);
				}
				// TODO - error popup
				 spinner.stop();
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
					console.log("PYTHON ERROR: " + response_data);
				}
				 spinner.stop();
				return;
			}
			//console.log(response_data);
			// parse the JSON into a global dictionary
			heatmap_data = JSON.parse(response_data);
			//////console.log(heatmap_data['mmsi']);
			// get the mmsi data from solr, but don't refill if mmsis != all
			if (mmsis == 'all') {
				
				if (heatmap_data['mmsi'].legnth > 0) {
					getItuData(heatmap_data['mmsi']);
				} else {
					getItuData(heatmap_data['mmsi']);
					spinner.stop();
				}
				visible_mmsis = heatmap_data['mmsi'].replace(/\s/g,'').split(',');
			} else {
				visible_mmsis = selected_mmsis.slice();
			}
			
			// refresh whats visible
			if (mmsi_ourlabel == 'all') {
				visible_labels = [0, 1];
			} else {
				visible_labels = mmsi_ourlabel.slice();
			}
			
			
			//draw one monthly heatmap
			draw_heatmap(heatmap_data['total_month'][0]);
			//draw_heatmap_flat(heatmap_data['total_month'][0]);

			heatmapMonth();
			
			//start the animation
			cameraHasMoved();
			viewer.animation.viewModel.playForwardViewModel.command();
			spinner.stop();
		},
		error: function (xhr) {
			 spinner.stop();
		}
    }); 
}


// Use jQuery's ajax and post method to get the heatmap data back
// gets the heatmaps from python in one big JSON string
function getShipData(dtfrom, path, mmsis, dts_high, dts_low, pos1, pos2, span){
	
	// we want to abort if started
	if (xmlhttp_ships != null) {
		xmlhttp_ships.abort();
		xmlhttp_ships = new window.XMLHttpRequest();
	}
	
	if (spinner != null) {
		 spinner.stop();
	}
	
	if (typeof(dtfrom) === 'undefined' || dtfrom.split('T').length < 2 || dtfrom.split('-').length < 2) {

		return;
	}
	getShipData_tries++;
	spinner = new Spinner(opts).spin(target);

	xmlhttp_ships = $.ajax({
		
		url: php_path + "/get_ship_data.php",
		type: 'POST',
		data: jQuery.param({ dtfrom: dtfrom,  path: path,  mmsis: mmsis,  dts_high: dts_high,  dts_low: dts_low,  pos1: pos1,  pos2: pos2,  span: span,  dtm_high: dtm_high,  dtm_low: dtm_low}) ,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		success: function (response) {
			////////console.log(response);
			
			// done request, apped these to the data
			var response_data = String(response);
			if (response_data == null || response_data == '' || !response_data.replace(/\s/g, '').length) {
				 spinner.stop();
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
					//console.log("PYTHON ERROR: " + response_data);
				}
				 spinner.stop();
				return;
			}
			
			// parse the JSON into a global dictionary
			//console.log("Worked wrong?: " + response_data);
			shipData = JSON.parse(response_data);
			getItuDataZoom(shipData);

			getShipData_tries = 0;
		},
		error: function (xhr) {
			//console.log('Request Status: ' + xhr.status + ' Status Text: ' + xhr.statusText + ' ' + xhr.responseText);
			 spinner.stop();
			 if (getShipData_tries < 3) {
			 	getShipData(dtfrom, path, mmsis, dts_high, dts_low, pos1, pos2, span);
			 }
		}
    });
    // .done(function( data ) {
// 		//////console.log(data);
// 	  }); 
}

// get the next week
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

// gets the mmsi info from python/solr from itu index
function getItuData(mmsis) {
	
	
	if (mmsi_spinner != null) {
		 mmsi_spinner.stop();
	}
	mmsi_spinner = new Spinner(opts).spin(target);
	
	if (mmsis.length < 1) {
		mmsi_spinner.stop();
		return;
	}

	////////////console.log("trying ajax");
	xmlhttp_mmsis = $.ajax({
		url: php_path + "/get_itu_data.php",
		type: 'POST',
		data: jQuery.param({ mmsis: mmsis}) ,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		success: function (response) {
			 //////console.log(response);
			
			// done request, apped these to the data
			var response_data = String(response);
			if (response_data == null || response_data == '' || !response_data.replace(/\s/g, '').length) {
				 mmsi_spinner.stop();
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
					//////////////console.log("PYTHON ERROR: " + response_data);
				}
				 mmsi_spinner.stop();
				return;
			}
			
			//replace bad chars
			var str = "\\ufffd";
			response_data = response_data.replace(/str/g, '�');
			
			
			// parse the JSON into a global dictionary
			mmsiData = JSON.parse(response_data);
			
			//updateItuTable(mmsiData);
			updateSortItuTable(mmsiData, 'asc' ,'mmsi');
			
			//ituSelectable();
			mmsi_spinner.stop();
			
			
			//////////////testing
			var dict = {};
			for (m in mmsiData) {
				dict[m.toString()] = mmsiData[m.toString()];
			}
			var rows = mmsiSort('name', dict, 'asc');
			
			sortedItuTable(mmsiData, 'name', 'asc')
			
			//////////////testing
		},
		error: function (xhr) {
			spinner.stop();
		}
    }); 
}


// gets missing itu data and adds it
function getItuDataZoom(mmsi_list){
	
	var search_list = [];
	var search_string;
	
	if (spinner != null) {
		 spinner.stop();
	}
	spinner = new Spinner(opts).spin(target);
	
	for (m in mmsi_list) {
		
		if (m.toString() in mmsiData) {
			// skip
		} else {
			////////////console.log(m);
			search_list.push(m);
		}
	}
	
	search_string = search_list.toString();
	search_string = search_string.replace(/\s/g,'');

	if (!search_string || search_string.legnth === 0 || !search_string.trim()) {
		makeShips();
		updateSortItuTable(mmsi_list, 'asc' ,'mmsi');
		
		spinner.stop();
		
		
		return;
	}
	

	xmlhttp_mmsis = $.ajax({
		url: php_path + "/get_itu_data.php",
		type: 'POST',
		data: jQuery.param({ mmsis: search_string.replace(/\s/g,'')}) ,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		success: function (response) {
			
			// done request, apped these to the data
			var response_data = String(response);
			if (response_data == null || response_data == '' || !response_data.replace(/\s/g, '').length) {
				//////////console.log("empty");
				makeShips();
				updateSortItuTable(mmsi_list, 'asc' ,'mmsi');
				spinner.stop();
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
				}
				makeShips();
				updateSortItuTable(mmsi_list, 'asc' ,'mmsi');
				spinner.stop();
				return;
			}
			
			//replace bad chars
			var str = "\\ufffd";
			response_data = response_data.replace(/str/g, '�');
			
			// parse the JSON into a global dictionary
			temp_mmsiData = JSON.parse(response_data);
			for (m in temp_mmsiData) {
				
				if (m.toString() in mmsiData) {
					if (mmsiData[m.toString()]['ourlabel'] == '-' && temp_mmsiData[m]['ourlabel'] != '-') {
						mmsiData[m.toString()] = temp_mmsiData[m];
					}
				} else {
					mmsiData[m.toString()] = temp_mmsiData[m];
				}
			}

			makeShips();
			updateSortItuTable(mmsi_list, 'asc' ,'mmsi');
			
			spinner.stop();
		},
		error: function (xhr) {
			makeShips();
			updateSortItuTable(mmsi_list, 'asc' ,'mmsi');
			spinner.stop();
		}
    }); 
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
function getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, span, ourlabel){

	if(xmlhttp){
		xmlhttp.onreadystatechange = null;
		xmlhttp.abort();
		//////console.log('abort the xmlhttp');
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

			if (response_data == null || response_data == '') {
				//////console.log("PYTHON ERROR: " + response_data);
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
				}
				 spinner.stop();
				return;
			}
			
			var data = JSON.parse(response_data);
			
			if (dtfrom != 'total_month'){
				//////////////console.log("not month");
				heatmap_data[dtfrom.split('T')[0]] = data[dtfrom.split('T')[0]];
				dtfrom = advanceWeek(dtfrom);
				if (dtfrom == 'total_month') {
					getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'month');
				} else {
					getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'week');
				}
			} else {
				////////////////console.log(data);
				heatmap_data['total_month'] = data['total_month'];
				heatmap_data['mmsi'] = data['mmsi'];
				//////////////console.log("month");
				draw_heatmap(heatmap_data['total_month'][0]);
				//draw_heatmap_flat(heatmap_data['total_month'][0]);
				//heatmap_flat.show = false;
				
				
				//remove the weekly heatmaps
				for (k in heatmap_week) {
					if (k != "total_month" && k != 'mmsi') {
						scene.primitives.remove(heatmap_week[k]);
					}
				
				}
				//heatmap_week.splice(0, heatmap_week.length);
			
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
						  appearance : new Cesium.PerInstanceColorAppearance({
							  translucent : true,
							  flat : true,
							  faceForward : true
							})
						});
						scene.primitives.add(heatmap_week[k]);
					}
				
				}
				viewer.animation.viewModel.playForwardViewModel.command();
			}
			
			////////////////console.log(heatmap_data);
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
		////////////console.log("../py/cesium/build_ds.php?&dtfrom=" + month_date + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span);
		xmlhttp.open("GET", "../py/cesium/build_ds.php?&dtfrom=" + month_date + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span, true);	
	} else {
		////////////console.log("../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span);
		xmlhttp.open("GET", "../py/cesium/build_ds.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&split_val=" + split_val + "&span=" + span, true);
	}
	xmlhttp.send();
}

// makeShips();
// 	viewer.dataSources.add(shipDataSource);
viewer.camera.moveEnd.addEventListener(function() { 
     cameraHasMoved();
});

viewer.clock.onTick.addEventListener(function(clock) {
        var currentTime = clock.currentTime;
        
        //redrawWeeklyHeatMaps(currentTime);
        showWeeklyHeatMaps(currentTime);
    });
    
// a cesium bug makes flat map camera corners too wide
// borrowed this from here https://github.com/AnalyticalGraphicsInc/cesium/issues/4346
function getFlatRect() {
	var pixWidth = viewer.scene.canvas.clientWidth;
	var pixHeight = viewer.scene.canvas.clientHeight;
	var topRight = viewer.scene.camera.pickEllipsoid(new Cesium.Cartesian2(pixWidth - 1, 1));
	var topLeft = viewer.scene.camera.pickEllipsoid(new Cesium.Cartesian2(1, 1));
	var bottomLeft = viewer.scene.camera.pickEllipsoid(new Cesium.Cartesian2(1 , pixHeight - 1));
	var bottomRight = viewer.scene.camera.pickEllipsoid(new Cesium.Cartesian2(pixWidth - 1, pixHeight -1));
	if(!topRight || !topLeft || !bottomLeft || !bottomRight){
		console.warn("Failed to find viewer edge coordinates",
			[topLeft, bottomLeft, bottomRight, topRight]);
		return;
	}
// 	var carto  = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pos);   
	return [Cesium.Ellipsoid.WGS84.cartesianToCartographic(topLeft), 
			Cesium.Ellipsoid.WGS84.cartesianToCartographic(bottomLeft), 
			Cesium.Ellipsoid.WGS84.cartesianToCartographic(bottomRight), 
			Cesium.Ellipsoid.WGS84.cartesianToCartographic(topRight), 
			Cesium.Ellipsoid.WGS84.cartesianToCartographic(topLeft)];
}
    
function cameraHasMoved() { 
	
	var pos1;
	var pos2;
	var span; // set to all for now, change if split required
	
	var mmsis = "all";
	var move_legend = "+=30px";
	
	
	if (just_flattened) {
		just_flattened = false;
		return;
	}
	
	 // the camera stopped moving
	 ellipsoid.cartesianToCartographic(camera.positionWC, cartographic);
	 ////////console.log("cartographic.height: " + cartographic.height);

	
	flat_map_view = camera.getMagnitude();
	 

	 camera.computeViewRectangle(ellipsoid, rect);
	 $('#vessel-button').hide();
	 
	 // if outside of 2012-2014
	 year = $(".ui-datepicker-year :selected").val(); 
	 console.log(year);    
	 if (year == 2015 || year == 2016) {
	 	console.log(year);
	 	return;
	 }
	 
	 // remove and make new ships on zoom
	 if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) || (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) || (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {

		if (camera._mode === Cesium.SceneMode.SCENE3D) {
			pos1 = Cesium.Math.toDegrees(rect.south) + ',' + Cesium.Math.toDegrees(rect.west);
			pos2 = Cesium.Math.toDegrees(rect.north) + ',' + Cesium.Math.toDegrees(rect.east);
			span = "month"; // set to all for now, change if split required
			////////console.log(pos1 + ", " + pos2);
			$('#rect-coords').html(Cesium.Math.toDegrees(rect.south).toFixed(4) + ',' + Cesium.Math.toDegrees(rect.west).toFixed(4) + ' to ' + Cesium.Math.toDegrees(rect.north).toFixed(4) + ',' + Cesium.Math.toDegrees(rect.east).toFixed(4));
			mmsis = "all";
		} else {
			var cam = getFlatRect();
			pos1 = Cesium.Math.toDegrees(parseFloat(cam[1].latitude)) + ',' + Cesium.Math.toDegrees(cam[1].longitude);
			pos2 = Cesium.Math.toDegrees(cam[3].latitude) + ',' + Cesium.Math.toDegrees(cam[3].longitude);
			span = "month"; // set to all for now, change if split required
			console.log(pos1 + ", " + pos2);
			console.log(Cesium.Math.toDegrees(parseFloat(cam[1].longitude)));
			$('#rect-coords').html(Cesium.Math.toDegrees(cam[1].latitude).toFixed(4) + ',' + Cesium.Math.toDegrees(cam[1].longitude).toFixed(4) + ' to ' + Cesium.Math.toDegrees(cam[3].latitude).toFixed(4) + ',' + Cesium.Math.toDegrees(cam[3].longitude).toFixed(4));
			mmsis = "all";
		}
		
		ships = true;
		toggleHeatmaps();
		
		
		if ($("#ship-legend").is(':hidden')) {
			move_legend = "-=30px"
			$( "#dtsSlider" ).animate({ "top": move_legend }, "fast" );
			$( "#dtsSlider-text" ).animate({ "top": move_legend }, "fast" );
			$( "#hm-change" ).animate({ "top": "+=11px" }, "fast" );
	 		$("#ship-legend").toggle();
		}
		if ($("#hm-legend").is(':visible')) {
	 		$("#hm-legend").toggle();
		}
		if ($("#button_month").is(':visible')) {
	 		$("#button_month").toggle();
		}
		if ($("#button_week").is(':visible')) {
	 		$("#button_week").toggle();
		}
		getShipData(month_date, path, mmsis, dts_high, dts_low, pos1, pos2, span);
		
	 } else {
	 	
	 	if (xmlhttp_ships != null) {
			xmlhttp_ships.abort();
		}
	 	
	 	//display altitude
	 	if (camera._mode === Cesium.SceneMode.SCENE3D) {
	 		$('#rect-coords').html(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4) +
	 													',' + Cesium.Math.toDegrees(cartographic.longitude).toFixed(4) +
	 													' altitude: ' + (cartographic.height/1000.0).toFixed(3) + ' km');
	 	} else {
	 		$('#rect-coords').html(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4) +
	 													',' + Cesium.Math.toDegrees(cartographic.longitude).toFixed(4));
	 	}
	 	
	 	ships = false;
	 	
	 	shipDataSource.entities.removeAll();
	 	toggleHeatmaps();

		updateSortItuTable(mmsiData, 'asc' ,'mmsi');
	 	
		
		if ($("#hm-legend").is(':hidden')) {
			move_legend = "+=30px"
			$( "#dtsSlider" ).animate({ "top": move_legend }, "fast" );
			$( "#dtsSlider-text" ).animate({ "top": move_legend }, "fast" );
			$( "#hm-change" ).animate({ "top": "-=11px" }, "fast" );
	 		$("#hm-legend").toggle();
		}
		if ($("#button_month").is(':hidden')) {
	 		$("#button_month").toggle();
		}
		if ($("#button_week").is(':hidden')) {
	 		$("#button_week").toggle();
		}
		if ($("#ship-legend").is(':visible')) {
	 		$("#ship-legend").toggle();
		}
		
		$('#vessel-button').hide();
		
		if (need_to_redraw) {
			drawHeatmaps(false);
			need_to_redraw = false;
		 }
	 }
	 
 }

// show/hide weekly heatmaps by week 
function showWeeklyHeatMaps(currentTime) {
	if (!month_or_week) {
		var date = Cesium.JulianDate.toDate(currentTime); 
		var d;
		var week;
		var w;
		for (var i = 0; i < week_dates.length-1; i++) {
			////////////////console.log(week_dates[i]);
			if (current_week_heatmap != week_dates[i] && date >= week_dates[i] && date < week_dates[i + 1]) {
				d = new Date(week_dates[i]);
				week = d.toISOString();
				w = week.split('T')[0];
				//scene.primitives.remove(heatmap_week);
				////////////////console.log(heatmap_week);
				
				for (h in heatmap_week) {
					if (h == w) {
						heatmap_week[h].show = true;
					} else {
						heatmap_week[h].show = false;
					}
				}
				
				current_week_heatmap = week_dates[i];
				toggleHeatmapLegendValues();
				//scene.primitives.add(heatmap_week);
			}
		}
	}
}


// saves the current weekly dates in an array for later use
function makeWeekDates(hm) {
	week_dates.splice(0, week_dates.length);
	for (k in hm) {
		if (k != 'total_month' && k != 'mmsi') {
			//////////////console.log(k);
			week_dates.push(Date.parse(k));
		}
		week_dates.sort();
	}
}


function showHeatMapSplit() {
	
	
	var move_legend = "+=90px";
	if($("#date-picker-div").is(":visible")) {
		move_legend = "-=90px"
	} 
	
	$("#date-picker-div").toggle('fast');
	$("#split_sel").val(split_val);
	$("#ship-legend").animate({ "top": move_legend }, "fast" );
	$( "#hm-legend" ).animate({ "top": move_legend }, "fast" );
	$( "#dtsSlider" ).animate({ "top": move_legend }, "fast" );
	$( "#hm-change" ).animate({ "top": move_legend }, "fast" );
	$( "#dtsSlider-text" ).animate({ "top": move_legend }, "fast" );
	
}





//////////////////////////////// Toolbar Functions ////////////////////////////////

//Add button to save an image
function saveImage() {
	var image_save;
	//testing
	renderAttrib();
	viewer.render();
	image_save = viewer.canvas.toDataURL().replace("image/png", "image/octet-stream");
	window.location.href=image_save;
	removeAttrib();
	removeAttrib();
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
	$('#button_week').addClass('selected-btn-mw');
	$('#button_month').removeClass('selected-btn-mw');
}

function heatmapMonth(){
	month_or_week = true;
	toggleHeatmapLegendValues();
	toggleHeatmaps();
	$('#button_week').removeClass('selected-btn-mw');
	$('#button_month').addClass('selected-btn-mw');
}

// toggle the vessel table
function mmsiToggle() {
    //$("#mmsi-table").toggle();
    $("#mmsi-popup").toggle("slow");
    //mmsi-table-text
}

// draw ships or heatmaps
function filterMmsis() {
	
	if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) || (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) || (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {
		drawHeatmaps(false);
	} else {
		need_to_redraw = true;
	}
	
	cameraHasMoved();
}

function refreshHeatmaps() {
	//////////////console.log(mmsi_ourlabel);
	drawHeatmaps(false);
}

function searchAllMmsis() {
	mmsiClear();
	
	if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) || (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) || (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {
		drawHeatmaps(false);
	} else {
		need_to_redraw = true;
	}
	cameraHasMoved();
}

// filter by vesel type
// mmsi_ourlabel should be an array
function searchByType(mmsis) {
	if (mmsi_ourlabel.length < 1) {
		return mmsis;
	}
	selected_mmsis.splice(0, selected_mmsis.length);
	selected_mmsis = [];
	if (mmsis == 'all') {
		for (m in mmsiData) {
			if (mmsi_ourlabel.indexOf(mmsiData[m]['ourlabel']) > -1) {
				selected_mmsis.push(m);
			}
		}
	} else {
		msplit = mmsis.split(',');
		for (var i = 0; i < msplit.length; i++) {
			if (mmsi_ourlabel.indexOf(mmsiData[msplit[i]]['ourlabel']) > -1) {
				selected_mmsis.push(msplit[i]);
			}
		}
	}
	
// 	cameraHasMoved();
// 	if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < 1500000) || (camera._mode === Cesium.SceneMode.SCENE2D && cartographic.height < 17000000)) {
// 		drawHeatmaps(false);
// 	} else {
// 		need_to_redraw = true;
// 	}
	if (selected_mmsis.length > 0) {
		mmsis = selected_mmsis.join(',');
	} else {
		mmsis = 'all';
	}
	return mmsis;
}

// heatmap filter
function filterByType() {
	var types = {'Longliner' : '1', 'Trawler' : '0'};
	var rows = $('#hm-legend > div');
	var index;
	rows.on('click', function(e) {
        var row = $(this);
       /* Check if 'Ctrl', 'cmd' or 'Shift' keyboard key was pressed
         * 'Ctrl' => is represented by 'e.ctrlKey' or 'e.metaKey'
         * 'Shift' => is represented by 'e.shiftKey' */
        if ((e.ctrlKey || e.metaKey) || e.shiftKey) {
            	index = mmsi_ourlabel.indexOf(types[row[0].innerHTML]);
            	//////////////console.log(index);
        	if (index > -1) {
            	/* If pressed highlight the other row that was clicked */
            	row.removeClass('hm-selected');
            	mmsi_ourlabel.splice(index, 1);
            } else {
            	row.addClass('hm-selected');
            	mmsi_ourlabel.push(types[row[0].innerHTML]);
            }
        } else {
            index = mmsi_ourlabel.indexOf(types[row[0].innerHTML]);
            //////////////console.log(index);
            if (index > -1) {
            	/* If pressed highlight the other row that was clicked */
            	rows.removeClass('hm-selected');
            	mmsi_ourlabel.splice(0, mmsi_ourlabel.length);
            	row.removeClass('hm-selected');
            	mmsi_ourlabel.splice(index, 1);
            	
            } else {
            	rows.removeClass('hm-selected');
            	mmsi_ourlabel.splice(0, mmsi_ourlabel.length);
            	row.addClass('hm-selected');
            	mmsi_ourlabel.push(types[row[0].innerHTML]);
            }
        } 
        //////////////console.log(mmsi_ourlabel);
	});
}

function oldItuTable(mmsi) {
	var table = '<table id="mmsi-table-data"><tr><th>MMSI</th><th>Name</th><th>Type</th><th>Country</th><th>Indcls</th></tr>';
	
	//write the table html from the mmsi dict
	for (m in mmsi) {
		////////////////console.log(selected_mmsis.indexOf(m.toString()));
		if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) > -1){
			table += '<tr class="mmsi-highlight"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
		} else if (m.toString() in mmsiData && selected_mmsis.length > 0){
			table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
		} else if (m.toString() in mmsiData && mmsi_ourlabel.length > 0 && mmsi_ourlabel.indexOf(mmsiData[m.toString()]['ourlabel']) == -1 ){
			table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
		} else if (m.toString() in mmsiData){
			table += '<tr><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
		}else{
			//table += '<tr><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
		}
	}
	
	table += '</table>';
	
	return table;
	
}

function ituTable(mmsi) {
	var table = '<table id="mmsi-table-data"><tr><th>MMSI</th><th>Name</th><th>Type</th><th>Country</th><th>Indcls</th></tr>';

	//write the table html from the mmsi dict
	
	if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) || (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) || (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {
	
		for (m in mmsi) {
// 			//////////console.log(selected_mmsis.indexOf(m.toString()));
			if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) > -1){
				table += '<tr class="mmsi-highlight"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) == -1){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData){
				table += '<tr class="mmsi-tr"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) == -1){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
			} else{
				//table += '<tr class="mmsi-tr"><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
			}
		}
	
	} else {
	
	
		for (m in mmsi) {
			////////////console.log(visible_mmsis.indexOf(m.toString()));
			if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) > -1){
				table += '<tr class="mmsi-highlight"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData && visible_mmsis.length > 0 && visible_mmsis.indexOf(m.toString()) < 0){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData && visible_labels.length > 0 && visible_labels.indexOf(mmsiData[m.toString()]['ourlabel']) == -1 ){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData){
				table += '<tr class="mmsi-tr"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			}else{
				//table += '<tr><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
			}
		}
	}	
	
	table += '</table>';
	
	
	
	return table;
	
}

function strcmp(a, b) {
    a = a.toString(), b = b.toString();
    for (var i=0,n=Math.max(a.length, b.length); i<n && a.charAt(i) === b.charAt(i); ++i);
    if (i === n) return 0;
    return a.charAt(i) > b.charAt(i) ? -1 : 1;
}

function updateSortItuTable(mmsi_array, order, key) {

	//////console.log(mmsi_array);
	var table = sortedItuTable(mmsi_array, key, order);
	$('#mmsi-table').html(table);
	ituSelectable();
	
}

function mmsiSort(key, dict, order) {

	var keys = [];
	var temp = {};
	var rows = [];
	var k;
	
	if (key == 'mmsi') {
		for (m in dict) {
			rows.push([m, dict[m]]);
		}
		if (order == 'desc')
			rows.reverse();
		return rows;
	}

	if (key == 'ourlabel') {
		for(var k in dict) { 
			if (k in mmsiData) {
				if (keys.indexOf(ship_type(mmsiData[k][key])) < 0)
					keys.push(ship_type(mmsiData[k][key]));
				if (ship_type(mmsiData[k][key]) in temp)
					temp[ship_type(mmsiData[k][key])].push(k);
				else
					temp[ship_type(mmsiData[k][key])] = [k];
			 }
		}		 
		 //////////console.log(temp);
	} else if (key == 'country') {
		for(var k in dict) { 
			if (k in mmsiData) {
			   if (keys.indexOf(ship_country(mmsiData[k][key])) < 0)
					keys.push(ship_country(mmsiData[k][key]));
				if (ship_country(mmsiData[k][key]) in temp)
					temp[ship_country(mmsiData[k][key])].push(k);
				else
					temp[ship_country(mmsiData[k][key])] = [k];
			 }
		 }
		 
		 //////////console.log(temp);
	} else {
		for(var k in dict) { 
			if (k in mmsiData) {
				if (keys.indexOf(mmsiData[k][key]) < 0)
					keys.push(mmsiData[k][key]);
				if (mmsiData[k][key] in temp)
					temp[mmsiData[k][key]].push(k);
				else
					temp[mmsiData[k][key]] = [k];
			 }
		 }
	 
		 //////////console.log(temp);
	}
	
    ////////console.log(keys);
	 keys.sort();
	 if (order == 'desc')
     	keys.reverse();
     
     for (var i=0; i<keys.length; i++) {
     	for (k in temp[keys[i]]) {
     		rows.push([temp[keys[i]][k], mmsiData[temp[keys[i]][k]]]);
     	}
     }
     
     //////////console.log(rows);
     
	
	
	return rows;
}

function sortedItuTable(mmsi_array, key, order) {
	//var table = '<table id="mmsi-table-data"><tr><th>MMSI</th><th>Name</th><th>Type</th><th>Country</th><th>Indcls</th></tr>';
	
	var dict = {};
	for (m in mmsi_array) {
		dict[m.toString()] = mmsiData[m.toString()];
	}
	//var rows = mmsiSort('country', dict, 'asc');

	if (order == 'asc') {
		or = 'desc';
	} else {
		or = 'asc';
	}
	
	var table = '<table id="mmsi-table-data"><tr>';
	var rows = mmsiSort(key, dict, order);
	
	
	//write the table html from the mmsi dict
	if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) || (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) || (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {
	
		if (key == 'name') {
			table += '<th onClick="updateSortItuTable(shipData, \'' + order + '\',\'mmsi\')">MMSI</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(shipData, \'' + or + '\',\'name\')">Name</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'country\')">Country</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'indcls\')">Indcls</th></tr>';
		} else if (key == 'mmsi') {
			table += '<th onClick="updateSortItuTable(shipData, \'' + or + '\',\'mmsi\')" class="mmsi-table-key mmsi-' + order + '">MMSI</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'name\')">Name</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'country\')">Country</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'indcls\')">Indcls</th></tr>';
		} else if (key == 'ourlabel') {
			table += '<th onClick="updateSortItuTable(shipData, \'' + order + '\',\'mmsi\')">MMSI</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'name\')">Name</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(shipData, \'' + or + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'country\')">Country</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'indcls\')">Indcls</th></tr>';
		} else if (key == 'country') {
			table += '<th onClick="updateSortItuTable(shipData, \'' + order + '\',\'mmsi\')">MMSI</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'name\')">Name</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'ourlabel\')">Type</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(shipData, \'' + or + '\',\'country\')">Country</th><th>Indcls</th></tr>';
		} else if (key == 'indcls') {
			table += '<th onClick="updateSortItuTable(shipData, \'' + order + '\',\'mmsi\')">MMSI</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'name\')">Name</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(shipData, \'' + order + '\',\'country\')">Country</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(shipData, \'' + or + '\',\'indcls\')">Indcls</th></tr>';
		} 
		
		for (i in rows) {
			m = rows[i][0];
// 			//////////console.log(selected_mmsis.indexOf(m.toString()));
			if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) > -1){
				table += '<tr class="mmsi-highlight"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) == -1){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData){
				table += '<tr class="mmsi-tr"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) == -1){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
			} else{
				//table += '<tr class="mmsi-tr"><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
			}
		}
	
	} else {
		
		if (key == 'name') {
			table += '<th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'mmsi\')">MMSI</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(mmsiData, \'' + or + '\',\'name\')">Name</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'country\')">Country</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'indcls\')">Indcls</th></tr>';
		} else if (key == 'mmsi') {
			table += '<th onClick="updateSortItuTable(mmsiData, \'' + or + '\',\'mmsi\')" class="mmsi-table-key mmsi-' + order + '">MMSI</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'name\')">Name</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'country\')">Country</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'indcls\')">Indcls</th></tr>';
		} else if (key == 'ourlabel') {
			table += '<th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'mmsi\')">MMSI</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'name\')">Name</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(mmsiData, \'' + or + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'country\')">Country</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'indcls\')">Indcls</th></tr>';
		} else if (key == 'country') {
			table += '<th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'mmsi\')">MMSI</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'name\')">Name</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'ourlabel\')">Type</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(mmsiData, \'' + or + '\',\'country\')">Country</th><th>Indcls</th></tr>';
		} else if (key == 'indcls') {
			table += '<th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'mmsi\')">MMSI</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'name\')">Name</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'ourlabel\')">Type</th><th onClick="updateSortItuTable(mmsiData, \'' + order + '\',\'country\')">Country</th><th class="mmsi-table-key mmsi-' + order + '" onClick="updateSortItuTable(mmsiData, \'' + or + '\',\'indcls\')">Indcls</th></tr>';
		} 
	
		for (i in rows) {
			m = rows[i][0];
			////////////console.log(visible_mmsis.indexOf(m.toString()));
			if (m.toString() in mmsiData && selected_mmsis.length > 0 && selected_mmsis.indexOf(m.toString()) > -1){
				table += '<tr class="mmsi-highlight"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData && visible_mmsis.length > 0 && visible_mmsis.indexOf(m.toString()) < 0){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData && visible_labels.length > 0 && visible_labels.indexOf(mmsiData[m.toString()]['ourlabel']) == -1 ){
				table += '<tr class="mmsi-hidden"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			} else if (m.toString() in mmsiData){
				table += '<tr class="mmsi-tr"><td>' + m.toString() + '</td><td>' + mmsiData[m.toString()]['name'] + '</td><td>' + ship_type(mmsiData[m.toString()]['ourlabel']) + '</td><td class="table-country">' + ship_country(mmsiData[m]['country']) + '</td><td>' + mmsiData[m.toString()]['indcls'] + '</td></tr>';
			}else{
				//table += '<tr><td>' + m.toString() + '</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>';
			}
		}
	}	
	
	table += '</table>';
	////////////console.log(table);
	return table;
	
}

// find ship type in dict
function ship_type(type) {
	if (isNaN(type)) {
		return '-';
	} else if (parseInt(type) < ship_types.length) {
		return ship_types[parseInt(type)];
	} else {
		return '-';
	}
}

// find the country name
function ship_country(code) {
	if (code in ship_itu) {
		return ship_itu[code];
	} else {
		return '-';
	}
}

function updateItuTable(mmsi) {

	////////////console.log(mmsi);
	var table = ituTable(mmsi);
	$('#mmsi-table').html(table);
	
}

// makes the itu table selectable
// click functionality here http://jsfiddle.net/oscarj24/ctLm8/2/
function ituSelectable() {
	//////////////console.log("itu");
	var rows = $('#mmsi-table-data > tbody > tr').not(':first');
	var index;
	/* Get current row */
	rows.on('click', function(e) {
        var row = $(this);
       /* Check if 'Ctrl', 'cmd' or 'Shift' keyboard key was pressed
         * 'Ctrl' => is represented by 'e.ctrlKey' or 'e.metaKey'
         * 'Shift' => is represented by 'e.shiftKey' */
        if ((e.ctrlKey || e.metaKey) || e.shiftKey) {
        		////////////////console.log(row.children('td')[0].innerHTML);
            	////////////////console.log(selected_mmsis);
            	index = selected_mmsis.indexOf(row.children('td')[0].innerHTML);
            	//////////////console.log(index);
        	if (index > -1) {
            	/* If pressed highlight the other row that was clicked */
            	row.removeClass('mmsi-highlight');
            	row.addClass("mmsi-tr");
            	selected_mmsis.splice(index, 1);
            } else {
            	pickListedShip(row);
            	row.addClass('mmsi-highlight');
            	row.removeClass("mmsi-tr");
            	selected_mmsis.push(row.children('td')[0].innerHTML);
            }
        } else {
            /* Otherwise just highlight one row and clean others */
            index = selected_mmsis.indexOf(row.children('td')[0].innerHTML);
            if (index > -1) {
            	/* If pressed highlight the other row that was clicked */
            	rows.removeClass('mmsi-highlight');
            	rows.addClass("mmsi-tr");
            	selected_mmsis.splice(0, selected_mmsis.length);
            	row.removeClass('mmsi-highlight');
            	row.addClass("mmsi-tr");
            	selected_mmsis.splice(index, 1);
            } else {
            
            	
            	pickListedShip(row);
            	rows.removeClass('mmsi-highlight');
            	rows.addClass("mmsi-tr");
            	selected_mmsis.splice(0, selected_mmsis.length);
            	row.addClass('mmsi-highlight');
            	row.removeClass("mmsi-tr");
            	selected_mmsis.push(row.children('td')[0].innerHTML);
            }
        } 
	});
}

// pick a ship based on selection in list if ship exists at this time
function pickListedShip(row) {
	if (typeof shipDataSource.entities.getById(row.children('td')[0].innerHTML) !== 'undefined') {
		
		var mmsi = row.children('td')[0].innerHTML;
		var ship = shipDataSource.entities.getById(mmsi);
		
		if (typeof ship === 'undefined') {
			return;
		}
		viewer.selectedEntity = ship;
		
		if (viewer.selectedEntity.id in mmsiData) {
			//////////////console.log(viewer.selectedEntity.id);
			//////////////console.log(mmsiData[viewer.selectedEntity.id]);
			picked_mmsi = viewer.selectedEntity.id;
			$('#vessel-button').show();
			placeVesselButton();
		} else {
			$('#vessel-button').hide();
		}
	}
}

//build the ui slider

function buildDtsSlider() {
	dtsSlider = document.getElementById('dtsSlider');

	noUiSlider.create(dtsSlider, {
		start: [0, 3000],
		tooltips: [ true, true ],
		orientation: "vertical",
		direction: 'rtl',
		range: {
			'min': [0],
			'50%': [  500 ],
			'90%': [  2500 ],
			'max': [3000]
		}
	});
	
	dtsSlider.noUiSlider.on('set', updateDts);
}

function buildDtmSlider() {
	dtmSlider = document.getElementById('dtmSlider');

	noUiSlider.create(dtmSlider, {
		start: [0, 3000],
		tooltips: [ true, true ],
		orientation: "vertical",
		direction: 'rtl',
		range: {
			'min': [0],
			'50%': [  500 ],
			'90%': [  2500 ],
			'max': [3000]
		}
	});
	
	dtmSlider.noUiSlider.on('set', updateDtm);
}

function placeRightToolbar() {
	var os = $('.cesium-geocoder-input').first().offset();
}

//update the dts vals
function updateDts() {
	//////////////console.log(dtsSlider.noUiSlider.get());
	
	dts_high = dtsSlider.noUiSlider.get()[1]*1000;
	dts_low = dtsSlider.noUiSlider.get()[0]*1000;
	drawHeatmaps(false);
	cameraHasMoved();
}

//update the dtm vals
function updateDtm() {
	//////////////console.log(dtsSlider.noUiSlider.get());
	
	dtm_high = dtmSlider.noUiSlider.get()[1]*1000;
	dtm_low = dtmSlider.noUiSlider.get()[0]*1000;
	drawHeatmaps(false);
	cameraHasMoved();
}

// show the button to download vessel heatmaps
function enableVesselButton() {
	var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
	var pickedObject;
	handler.setInputAction(function(click) {
		

		pickedObject = scene.pick(click.position);
		////////////console.log(pickedObject);
		if (Cesium.defined(pickedObject) && pickedObject.id.id in mmsiData) {
			picked_mmsi = pickedObject.id.id;
			$('#vessel-button').show();
			//$('.cesium-infoBox-camera').prop('disabled', true);
			placeVesselButton();
		} else {
			$('#vessel-button').hide();
		}
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function placeVesselButton() {
	var os = $('.cesium-viewer-toolbar').first().offset();
	//////////////console.log( $('.cesium-viewer-toolbar').first());
	$('#vessel-button').offset({ top: os.top + 90 });
	if(isTouchDevice()) {
		$('#vessel-button').offset({ top: os.top + 50 });
	}
}

function updateDate() {

		  month = $(".ui-datepicker-month :selected").val();
          year = $(".ui-datepicker-year :selected").val();
          ////////////console.log('month year: ' + month + ' ' + year);
		
}

// the colorpicker, sets color for type
function openColorPicker(type) {
	$('#color-picker').hide();
	var html = '';
	$('#color-picker').show();
	for (c in hm_colors) {
		////console.log(c);
		if (!c.includes("white")) {
			html += '<div id="color-' + type + '-' + c + '" style="height: 10px; width: 20px; background-color: rgb(' +
			parseInt(hm_colors[c][0]*255) + ', ' + parseInt(hm_colors[c][1]*255) + ', ' + parseInt(hm_colors[c][2]*255) + ');"> </div>';
		
		}
	}
	$('#color-picker').html(html);
	
	for (c in hm_colors) {
		////console.log(hm_colors);
		if (!c.includes("white")) {
			////console.log(c + '-white');
			
			$('#color-' + type + '-' + c).click(function(e) {  
			// c = get id split .target.id
			// type = get the id split
				var id = e.target.id.split('-');
				////console.log(hm_colors[id[2]]);
				////console.log(hm_colors[id[2] + '-white']);
				////console.log(id[1]);
				hm_type_colors[id[1]] = [hm_colors[id[2]].slice(), hm_colors[id[2] + '-white'].slice()];
				$('#hm-' + id[1].toLowerCase()).removeClass('hm-col-orange hm-col-red hm-col-green hm-col-blue hm-col-purple hm-col-yellow');
				$('#hm-' + id[1].toLowerCase()).addClass('hm-col-' + id[2]);
				$('#color-picker').hide();
				$('#circle-' + id[1].toLowerCase() + '-f').attr("fill",'rgb(' +
							parseInt(hm_colors[id[2]][0]*255) + ', ' + 
							parseInt(hm_colors[id[2]][1]*255) + ', ' + 
							parseInt(hm_colors[id[2]][2]*255) + ')');  
				$('#circle-' + id[1].toLowerCase() + '-n').attr("fill",'rgb(' +
							parseInt(hm_colors[id[2] + '-white'][0]*255) + ', ' + 
							parseInt(hm_colors[id[2] + '-white'][1]*255) + ', ' + 
							parseInt(hm_colors[id[2] + '-white'][2]*255) + ')');  
				
				cameraHasMoved();
				
				if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) || (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) || (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {
					need_to_redraw = true;
				}
			});
			
		}
	}
	
	
	$('#color-picker').addClass('color-' + type);
	
}

function isTouchDevice(){
	console.log('touch?');
    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}


//////////////////////////////// Rendering Items ////////////////////////////////

function prepareCanvas() {
	var ctx = viewer.scene.context;
	ctx.font = "30px Arial";
}

function renderAttrib() {
	//viewer.entities.remove(attr);
	var canvas = viewer.scene.canvas;
	//////console.log(canvas.width);

	attr = viewer.entities.add({
		position : new Cesium.CallbackProperty(function() {
			return viewer.camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width/1.5, canvas.height/1.5));
		}, false),
		label : {
			//text : 'MapQuest, Open Street Map and contributors, CC-BY-SA',
			text: 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.',
			font : '52px sans-serif',
			padding: new Cesium.Cartesian2(20, 30),
			showBackground : true,
			style: Cesium.LabelStyle.FILL,
			horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
			pixelOffset : new Cesium.Cartesian2(-(canvas.width/4.0), (canvas.height/2.0 - 130)),
			backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.2),
			scale: 0.25
		}
	});
	
	//var imgurl = document.getElementById('hm-legend').toDataURL();
	
	// attr2 = viewer.entities.add({
// 		position : new Cesium.CallbackProperty(function() {
// 			return viewer.camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width/1.5, canvas.height/1.5));
// 		}, false),
// 		billboard : {
// 			image: imgurl,
// 			
// 			horizontalOrigin : Cesium.HorizontalOrigin.RIGHT,
// 			pixelOffset : new Cesium.Cartesian2(-100, 150),
// 			backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.2)
// 		}
// 	});

attr2 = viewer.entities.add({
		position : new Cesium.CallbackProperty(function() {
			return viewer.camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width/2.0, canvas.height/2.0));
		}, false),
		label : {
			text : 'Longliner',
			font : '48px sans-serif',
			showBackground : true,
			padding: new Cesium.Cartesian2(20, 30),
			style: Cesium.LabelStyle.FILL,
			horizontalOrigin : Cesium.HorizontalOrigin.RIGHT,
			pixelOffset : new Cesium.Cartesian2(-(canvas.width/2.0 - 70), -(canvas.height/2.0 - 40)),
			backgroundColor: new Cesium.Color(hm_type_colors['Longliner'][0][0], hm_type_colors['Longliner'][0][1], hm_type_colors['Longliner'][0][2], 0.8),
			scale: 0.25
		}
	});
	
	attr3 = viewer.entities.add({
		position : new Cesium.CallbackProperty(function() {
			return viewer.camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width/2.0, canvas.height/2.0));
		}, false),
		label : {
			text : 'Trawler',
			font : '48px sans-serif',
			padding: new Cesium.Cartesian2(20, 30),
			showBackground : true,
			style: Cesium.LabelStyle.FILL,
			horizontalOrigin : Cesium.HorizontalOrigin.RIGHT,
			pixelOffset : new Cesium.Cartesian2(-(canvas.width/2.0 - 70), -(canvas.height/2.0 - 70)),
			backgroundColor: new Cesium.Color(hm_type_colors['Trawler'][0][0], hm_type_colors['Trawler'][0][1], hm_type_colors['Trawler'][0][2], 0.8),
			scale: 0.25
		}
	});


	//viewer.entities.add(attr);
}

function removeAttrib() {
	viewer.entities.remove(attr3);
	viewer.entities.remove(attr2);
	viewer.entities.remove(attr);
	
}

    
function renderAttribOld() {
	viewer.entities.remove(attr);

	var lon = Cesium.Math.toDegrees(cartographic.longitude);
	var lat = Cesium.Math.toDegrees(cartographic.latitude);
	var win_ratio = $(window).width()/$(window).height();
	
	if (win_ratio < 1.24) {
		win_ratio = 0.0;
	}

	attr = viewer.entities.add({
			position : Cesium.Cartesian3.fromDegrees(lon, lat),
			label : {
				text : 'MapQuest, Open Street Map and contributors, CC-BY-SA',
				eyeOffset : new Cesium.Cartesian3(-1*cartographic.height/2.3, -1*cartographic.height/(2.0 + win_ratio), 0.0),
				font: '15px sans-serif',
				horizontalOrigin : Cesium.HorizontalOrigin.LEFT
			}
		});
}

// function removeAttrib() {
// 	viewer.entities.remove(attr);
// }


// draw heatmaps
function drawHeatmaps(new_month) {
			var m;
			var mmsis;
			var dtfrom;
			var span;
			var path;
			var ourlabel;
			
			if (mmsi_ourlabel.length < 1) {
				ourlabel = 'all';
			} else {
				ourlabel = mmsi_ourlabel.join(',');
			}
			
			////console.log(ourlabel);
			
			month = $(".ui-datepicker-month :selected").val();
            year = $(".ui-datepicker-year :selected").val();
            
            if (year == 2015 || year == 2016) {
            	$('#end-modal').modal('show');
            	return;
            }
            
            $('#date-picker-div').datepicker('setDate', new Date(year, month, 1));
            //////////////console.log(month);
            //////////////console.log(year);
            // set the month in the timeline
            set_month(year, month);
            viewer.animation.viewModel.pauseViewModel.command();
            // get the monthly heatmaps
            m = '' + (parseInt(month) + 1);
            if (parseInt(m) < 10){
            	m = '0' + (parseInt(month) + 1);
            }
            dtfrom = year + '-' + m + '-01T00:00:00Z';
            month_date = dtfrom;
            
            if (new_month) {
            	mmsiClear();
            	mmsis = 'all';
            	
            } else {
            	mmsis = getMMSIs();
            }
            
            //span = "all"; // set to all for now, change if split required
            span = 'month';
            path = "'../../../../fishingobserver/csv/'";	// path from php file to csv folder
            
            split_val = $('#split_sel option:selected').val();
            ////////////console.log(split_val);
            //$('#date-picker-div').hide();
            
            split_val_vis = false;
            $(this).datepicker('setDate', new Date(year, month, 1));
            
            // empty the heatmap array for (var key in arr_jq_TabContents) {
            for (var k in heatmap_data) {
            	if (k != 'mmsi') {
            		heatmap_data[k].splice(0, heatmap_data[k].length);
            	} else {
            		heatmap_data[k] = '';
            	}
            }
            
            // over 1/4 needs to be broken up
            if (split_val <= 16) {
            	//getHeatMapsAll(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'all', ourlabel);
            	getHeatMapMonth(dtfrom, path, mmsis, dts_high, dts_low, split_val, span, ourlabel);
            } else {
            	//getHeatMaps(dtfrom, path, mmsis, dts_high, dts_low, split_val, 'week', ourlabel);
            	getHeatMapMonth(dtfrom, path, mmsis, dts_high, dts_low, split_val, span, ourlabel);
            }
            
            //TODO - move camera slightly
            cartographic.longitude += 0.001;
}

// sort the vessels
function vesselSort(mmsis, key, order) {
	var temp = [];  // the dict to print
	var high;		// the higher value
	var ind = -1;	// temp index
	for (m in mmsis) {
		if (temp.length < 1) {
			temp.push(mmsiData[m]);
			ind = 0;
		}else if (temp[ind][key] > mmsiData[m][key]) {
			high = mmsiData[m];
			temp.push(mmsiData[m]);
			temp.push(high);
			ind++;
		}
	}
	
}
        

//////////////////////////////// Ready Function ////////////////////////////////

$(function() {
	
	var vessel_button = $('#vessel-button');
	
	viewer.sceneModePicker.viewModel.duration=0.5;
	
	//Make sure viewer is at the desired time.
	viewer.clock.startTime = start.clone();
	viewer.clock.stopTime = stop.clone();
	viewer.clock.currentTime = start.clone();
	viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
	viewer.clock.multiplier = 200;
	viewer.animation.viewModel.pauseViewModel.command();
	
	// fix the padding on the top menu
	$( ".container" ).has( ".navbar-header" ).css( "padding", "0 15px" );
	
	// show the begin message
	$('#begin-modal').modal('show');
	
	$('#begin-modal').on('hidden.bs.modal', function (e) {
		// stop the video
		$( "#demo-video" ).remove();
	})
	
	// use these paths on localhost
	if (location.host == 'localhost:8888') {
		save_path = "'../../../fishingobserver/csv'";	// where downloaded csvs get saved
		php_path = "../py/cesium";	//where the scripts are
		path = "'../../../csv/'";	// path from php file to csv folder
		//////////////console.log("SAVE PATH " + save_path);
	}

	ituSelectable();
	filterByType();
	
	//applies tooltips to legends
	// $("[data-toggle='tooltip']").tooltip({
// 		trigger : 'hover'
// 	}); 
	
	if(isTouchDevice()===false) {
		console.log('not touch');
		$("[data-toggle='tooltip']").tooltip({
			trigger : 'hover'
		}); 
	}
	
	//Set timeline to simulation bounds
	viewer.timeline.zoomTo(start, stop);
	viewer.dataSources.add(shipDataSource);
	
	// makes ship legend hidden
	$("#ship-legend").toggle();
	buildDtsSlider();
	//buildDtmSlider();

	$(document).on("change", "select", updateDate);

    if ( vessel_button.length){
        //the vessel button exists
        vessel_button.hide();
        enableVesselButton();
    }

	$('.cesium-infoBox-close').click( function() {
		$('#vessel-button').hide();
	});
	
	$('.cesium-infoBox-camera').prop('disabled', true);

	//showHeatMapSplit();
	$("#split_sel").val(split_val);

	$('#color-picker').hide();

});

