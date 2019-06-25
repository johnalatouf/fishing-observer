// creates a csv and displays the download link
// store this separately so it doesn't appear in source for non logged-in users
function genCSVOld(dtfrom, path, mmsis, dts_high, dts_low, pos1, pos2, span, username, csv_type){
	
	var xmlhttp_csv; // for this instance, we can have multiple csv's generating at once
	
	if(xmlhttp_csv){
		console.log('ready state on call ' + xmlhttp_csv.readyState);
		xmlhttp_csv.onreadystatechange = null;
		xmlhttp_csv.abort();
		console.log('abort the xmlhttp');
	}
	
	xmlhttp_csv = new XMLHttpRequest();

	xmlhttp_csv.onreadystatechange = function() {
		if(this.readyState == 1) {

			if (csv_spinner != null) {
				csv_spinner.stop();
			}
		
			csv_spinner = new Spinner(opts_csv).spin(target_csv);
		}
		if (this.readyState == 4 && this.status == 200) {
		
			// done request, apped these to the data
			var response_data = String(this.responseText);
			//console.log(response_data);
			if (response_data == null || response_data == '' || !response_data.replace(/\s/g, '').length) {
				csv_spinner.stop();
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
					console.log("PYTHON ERROR: " + response_data);
				}
				return;
			}
			
			if (location.host == 'localhost:8888') {
			//http://localhost:8888/Composer/Fishing_project/fishing/csv/web_admin/s_20121201_0_3000_1506099713.9.csv
				var filename = response_data.split('/')[response_data.split('/').length - 2] + '/' + response_data.split('/')[response_data.split('/').length - 1];
				response_data = '"http://localhost:8888/Composer/Fishing_project/fishing/csv/' + filename;	// where downloaded csvs get saved
			} else {
				var filename = response_data.split('/')[response_data.split('/').length - 2] + '/' + response_data.split('/')[response_data.split('/').length - 1];
				response_data = '"../csv/' + filename;	// where downloaded csvs get saved
			}
			
			// parse the JSON into a global dictionary
			var file_info = '<p>CSV file ready for <a href=' + response_data + ' target="_blank">download here</a>. It is ' +
							'also available on the Downloads page for 48 hours.</p>';
							
			csvResponse(file_info);
			
		}
		
		// always stop the spinner
		if(this.readyState == 4) {
		
			if (csv_spinner != null) {
				csv_spinner.stop();
			}
		}
	}
	
	// the ajax request
	//console.log("../py/cesium/dl_csv.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&pos1=" + pos1 + "&pos2=" + pos2 + "&span=" + span + "&save_path=" + save_path + "&csv_type=" + csv_type + "&username=" + username);
	xmlhttp_csv.open("GET", "../py/cesium/dl_csv.php?&dtfrom=" + dtfrom + "&path=" + path + "&mmsis=" + mmsis + "&dts_high=" + dts_high + "&dts_low=" + dts_low + "&pos1=" + pos1 + "&pos2=" + pos2 + "&span=" + span + "&save_path=" + save_path + "&csv_type=" + csv_type + "&username=" + username, true);
	xmlhttp_csv.send();
}

// store this separately so it doesn't appear in source for non logged-in users
function genCSV(dtfrom, path, mmsis, dts_high, dts_low, pos1, pos2, span, username, csv_type){
	var xmlhttp_csv;
	
	if (csv_spinner != null) {
		csv_spinner.stop();
	}
	csv_spinner = new Spinner(opts_csv).spin(target_csv);
	
	if (Array.isArray(mmsis)) {
		mmsis = mmsis.join(',').replace(/\s/g,'');
	}
	
	//console.log(mmsis);
	xmlhttp_csv = $.ajax({
		url: php_path + "/dl_csv.php",
		type: 'POST',
		data: jQuery.param({ dtfrom: dtfrom, path: path, mmsis: mmsis, dts_high: dts_high, dts_low: dts_low, pos1: pos1, pos2: pos2, span: span, save_path: save_path, csv_type: csv_type, username: username }) ,
		contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
		success: function (response) {
			console.log(response);
			
			// done request, apped these to the data
			var response_data = String(response);
			if (response_data == null || response_data == '' || !response_data.replace(/\s/g, '').length) {
				csv_spinner.stop();
				return;
			}
			
			// the request returned a python error, print it locally
			// otherwise return
			if (response_data.includes("Traceback")) {
				if (location.host == 'localhost:8888') {
					console.log("PYTHON ERROR: " + response_data);
				}
				return;
			}
			
			if (location.host == 'localhost:8888') {
			//http://localhost:8888/Composer/Fishing_project/fishing/csv/web_admin/s_20121201_0_3000_1506099713.9.csv
				var filename = response_data.split('/')[response_data.split('/').length - 2] + '/' + response_data.split('/')[response_data.split('/').length - 1];
				response_data = '"http://localhost:8888/Composer/Fishing_project/fishing/csv/' + filename;	// where downloaded csvs get saved
			} else {
				var filename = response_data.split('/')[response_data.split('/').length - 2] + '/' + response_data.split('/')[response_data.split('/').length - 1];
				response_data = '"../csv/' + filename;	// where downloaded csvs get saved
			}
			
			// parse the JSON into a global dictionary
			var file_info = '<p>CSV file ready for <a href=' + response_data + ' target="_blank">download here</a>. It is ' +
							'also available on the Downloads page for 48 hours.</p>';
							
			csvResponse(file_info);
			csv_spinner.stop();
		},
		error: function () {
			console.log("error");
			csv_spinner.stop();
		}
    }); 
}

// post a response
function csvResponse(text) {
	console.log(text);
	$('#csv-response').append(text);
	toggleCSVResponse(true);
}

function toggleCSVResponse(open) {
	if (!open && $("#csv-response").is(':visible')) {
		$('#csv-response').toggle("fast");
	}
	
	if (open && !$("#csv-response").is(':visible')) {
		$('#csv-response').toggle("fast");
	}
	//$('#csv-response').toggle("fast");
}

// toggle the csv buttons
function csvToggle() {
    $("#csv-popup").toggle("fast");
    //mmsi-table-text
}

function csvMonth(username) {
	//getShipData(month_date, path, mmsis, 3000000, 0, pos1, pos2, span);
	genCSV(month_date, path, 'all', dts_high, dts_low, '0,0', '0,0', 'month', username, 'month');
}

function csvSnapshot(username) {
	var rect = new Cesium.Rectangle(0.0, 0.0, 0.0, 0.0);
	var cartographic = new Cesium.Cartographic();
	var cartesian = new Cesium.Cartesian3();
	 ellipsoid.cartesianToCartographic(camera.positionWC, cartographic);
	 camera.computeViewRectangle(ellipsoid, rect);
	 console.log(rect);
	 // remove and make new ships on zoom
	 if ( !(rect.south == 0 && rect.north == 0 && rect.west == 0 && rect.east == 0) ) {
		//updateShips();
		//makeShips();
		// get the ship data
		var pos1 = Cesium.Math.toDegrees(rect.south) + ',' + Cesium.Math.toDegrees(rect.west);
		var pos2 = Cesium.Math.toDegrees(rect.north) + ',' + Cesium.Math.toDegrees(rect.east);
		
		var mmsis = visible_mmsis.join(',');
		flat_map_view = camera.getMagnitude();
		if ( (camera._mode === Cesium.SceneMode.SCENE3D && cartographic.height < zoom_level_globe) 
		|| (camera._mode === Cesium.SceneMode.SCENE2D && flat_map_view < zoom_level_flat) 
		|| (camera._mode === Cesium.SceneMode.COLUMBUS_VIEW && flat_map_view < zoom_level_flat/2.0)) {
			mmsis = Object.keys(shipData).join(',');
		}
		
		genCSV(month_date, path, visible_mmsis, dts_high, dts_low, pos1, pos2, 'month', username, 'snapshot');
	} else {
		//updateShips();
		//makeShips();
		// get the ship data
		if (camera._mode === Cesium.SceneMode.SCENE3D) {
			var lon = Cesium.Math.toDegrees(cartographic.longitude);
			var lat = Cesium.Math.toDegrees(cartographic.latitude);
			var s,w,n,e;
		
			s = lat -90.0;
			n = lat + 90.0;
			w = lon - 90.0;
			e = lon + 90.0;
		
			if (w < -180) {
				w = 180.0 - w;
			}
		
			if (e > 180) {
				e = e - 180.0;
			}
		
			if (s < -90.0)
				s = -90.0;
			else if (s > 90)
				s = 360 - s;
			if (n > 90.0)
				n = 90.0;
			else if (n < -90.0)
				n = 360 + n;
		} else {
			if (rect.south == 0.0)
				s = -90.0;
			else
				s = Cesium.Math.toDegrees(rect.south);
			if (rect.north == 0.0)
				n = 90.0;
			else
				n = Cesium.Math.toDegrees(rect.north);
			if (rect.west == 0.0)
				w = -180.0;
			else
				w = Cesium.Math.toDegrees(rect.west);
			if (rect.east == 0.0)
				e = -90.0;
			else
				e = Cesium.Math.toDegrees(rect.east);
		}
	 	
		var pos1 = s + ',' + w;
		var pos2 = n + ',' + e;
		
		var mmsis = visible_mmsis.join(',');
		console.log(pos1 + ' ' + pos2);
		
		genCSV(month_date, path, visible_mmsis, dts_high, dts_low, pos1, pos2, 'month', username, 'snapshot');
	}
}


function csvVessel(username) {
	var pos1 = "-90.0,-180.0";
	var pos2 = "90.0,180.0";
	genCSV(month_date, path, picked_mmsi, 3000000, 0, pos1, pos2, 'month', username, 'vessel');
}
