// Global Map
var map;

// Global XML Requests
var xmlreq;
var xmlreq2;

// Global array of markers
var markers;

// Info on each city for heat map
var cities;
var city_locations = {}

// Global heatmap layer
var heatmap;

var overlay;

function mapping(name) {
    if (name === "Food") {
        return "food";
    } else if (name === "Shop & Service") {
        return "shopping";
    } else if (name === "Nightlife Spot") {
        return "nightlife";
    } else if (name === "Otdoors & Recreation") {
        return "outdoor";
    } else if (name === "Arts & Entertainment") {
        return "arts";
    }
    log(name);
}

function setScoreForCity(city, score) {
	$.each(cities, function (key, value) {
		if (value.name === city) {
			value.score = score;
		}
	});
}

function get_compatibilityScore(weights_object){

	$.getJSON(getBaseURL() + 'api/v1/cityscore/?format=json&&', function(stuff){

		city_objects = stuff.objects
		console.log('city_objects', city_objects)
		$.each(city_objects		, function(index, data){
			var data = city_objects[index].weighed_scores
			console.log(data)

			var data = data.replace(/u/g, "");
			var data = data.replace(/'/g, "\"");
			var data = jQuery.parseJSON(data)
			var score = 0
			var total = 0
			$.each(weights_object, function(index, val){
				val = parseInt(val)
				total += val
			})

			$.each(data, function(index, val){
				score += Math.min(val,weights_object[mapping(index)]/total)
				console.log(score)
			})

			setScoreForCity(city_objects[index].name,score);

		})
		updateHeatMap();
	});
}

function update(mult) {
    $.getJSON(getBaseURL() + 'api/v1/cityscore/?format=json', function(all) {
        var data = all.objects;
        var todo = mult[2];

        $.each(data, function(index, thing) {
            var city = thing.name;
            var scores = thing.weighed_scores;
            var scores = scores.replace(/u/g, "");
            var scores = scores.replace(/'/g, "\"");
            var scores = jQuery.parseJSON(scores);
            var heat = 0;
            $.each(scores, function(name, value) {
                heat += 10 * value * parseInt(todo[mapping(name)]);
            });
            setScoreForCity(city, heat);
           // console.log(heat);
        });
	    updateHeatMap();
    });
}

function updateHeatMapForZoomLevel(zoom) {
	var heatmapData = new Array();
	$.each (cities, function (key,value) {
		var longitude = value.longitude;
		var latitude = value.latitude;
		var latlong = { location : new google.maps.LatLng(latitude, longitude), weight : Math.max(0.01,value.score) };
		heatmapData.push(latlong);
	});
    if (heatmap) {
        heatmap.setMap(null);
        delete heatmap;
    }
	heatmap = new google.maps.visualization.HeatmapLayer({ data: heatmapData, dissipating : false, radius : 1 });
	heatmap.setMap(map);
}

function updateHeatMap() {
	updateHeatMapForZoomLevel(map.getZoom());
}

function log(msg) {
    setTimeout(function() {
        throw new Error(msg);
    }, 0);
}

function initialiseMap() {
	//Initiallisation of global variables
	markers = new Array();
	scores = new Array();
	locations = new Array();

	var point = new google.maps.LatLng(52.536273,13.623047);

	var mapOptions = {
		center: point,
		zoom: 4,
    	//disableDefaultUI: true,
		mapTypeId: google.maps.MapTypeId.HYBRID
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

	google.maps.event.addListener(map, 'zoom_changed', function() { updateHeatMap() });

	$.getJSON(getBaseURL() + 'api/v1/citylocation/?format=json', recieveCities);

}

function recieveCities(data, status, jqXHR) {
	cities = data.objects;
	$.each(cities, function (key,value) {
		value.score = 0;//Math.random();
		addMarker(value);
	});
	updateHeatMap();
}

function addMarker(city) {
	var latitude = city.latitude;
	var longitude = city.longitude;
	var longandlat = new google.maps.LatLng(latitude, longitude);
	var marker = new google.maps.Marker({
		map: map,
		position: longandlat,
		title: city.name,
		icon: '../resources/24.png'
	});

	google.maps.event.addListener(marker, 'click', function () {
		var latitude = city.latitude;
		var longitude = city.longitude;
		var location = new google.maps.LatLng(latitude, longitude);
		if (overlay) overlay.setMap(null);
		overlay = new USGSOverlay(location, city.name, city.score, map);

		google.maps.event.addListener(map, 'click', function () {
			overlay.setMap(null);
		});
	});
	markers.push(marker);
}

function getBaseURL () {
   return location.protocol + "//" + location.hostname + 
      (location.port && ":" + location.port) + "/";
}

