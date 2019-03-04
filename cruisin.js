// ---- Mapbox part ----
// api keys
mapboxgl.accessToken = 'pk.eyJ1IjoibW92aW5ncm9vdmluIiwiYSI6ImNqcXozd2M3YzA3MW8zeXQyMXR4NjcyMWQifQ.Wn__xJFvsBWzZmNGyvX6XA';
var OWMAPI = '0337c2626095cb7c3f744f230125a759'; // OpenWeatherMap
// var CWBAPI = 'CWB-3FB0188A-5506-41BE-B42A-3785B42C3823'; // 別人的氣象局open data 
var CWBAPI = 'CWB-356AF20D-A58F-44B4-9120-00B297790BE3'

// Add map on html
var map = new mapboxgl.Map({
  container: 'mapid',
  style: 'mapbox://styles/mapbox/streets-v10',
  center: [121.536108, 25.012340],
  zoom: 12
});
map.on('load', function () {
	map.addSource('district', {
	"type": "geojson",
	"data": "https://gist.githubusercontent.com/movingroovin/e1ebbdab46c85faa808ec2b8c2aef8b6/raw/3d96dcc9f5c2439060c8c45e0c3ac6d8a39630c6/bigTaipeiDistrict.geojson"
	});
	map.addLayer({
		"id": "district-fills",
		"type": "fill",
		"source": "district",
		"layout": {},
		"paint": {
			"fill-color": "#627BC1",
			"fill-opacity": 0.2
		}
	});
	map.addLayer({
		"id": "district-borders",
		"type": "line",
		"source": "district",
		"layout": {},
		"paint": {
			"line-color": "#627BC1",
			"line-width": 1
		}
	});
});
// Add nav control to the map
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');

// Add geolocate control to the map.
var geolocate = new mapboxgl.GeolocateControl({
	positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
});
map.addControl(geolocate);

// add weather station
var dataGot = ''
weather();

// get user location
var startPoint = ' '
var endPoint = ' '
geolocate.on('geolocate', function(e) {
      startPoint = [e.coords.longitude, e.coords.latitude];
});
// set destination
$("#navi #setDestinationButton").on("click",function(){
	map.once('click', function(e){
		endPoint = [e.lngLat.lng, e.lngLat.lat]
		map.addLayer({
		  id: 'endPoint',
		  type: 'circle',
		  source: {
		    type: 'geojson',
		    data: {
		      type: 'Feature',
		      geometry: {
		        type: 'Point',
		        coordinates: endPoint
		      }
		    }
		  }
		});
		console.log(endPoint)
	})
})

// Get Route by click button
$( "#navi #goButton" ).on("click",function() {
    getRoute(startPoint, endPoint)
    $( "#instructions" ).toggle();
});

// get route function
function getRoute(start, end) {
  var directionsRequest = 'https://api.mapbox.com/directions/v5/mapbox/walking/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;
  $.ajax({
    method: 'GET',
    url: directionsRequest,
  }).done(function(data) {
    var route = data.routes[0].geometry;
    map.addLayer({
      id: 'route',
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route
        }
      },
      paint: {
        'line-width': 2
      }
    });
    map.addLayer({
	  id: 'start',
	  type: 'circle',
	  source: {
	    type: 'geojson',
	    data: {
	      type: 'Feature',
	      geometry: {
	        type: 'Point',
	        coordinates: start
	      }
	    }
	  }
	});
  var instructions = document.getElementById('instructions');
  var steps = data.routes[0].legs[0].steps;
  steps.forEach(function(step) {
  	instructions.insertAdjacentHTML('beforeend', '<p>' + step.maneuver.instruction + '</p>');
  });
  });
}

// add weather station function
function weather() {
  // var directionsRequest = 'https://api.openweathermap.org/data/2.5/weather?id=7280290&units=metric' + '&APPID=' + OWMAPI; 
  // var directionsRequest = 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=' + CWBAPI +'&callback=?';
  var directionsRequest = 'https://json2jsonp.com/?url='+encodeURIComponent('https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=' + CWBAPI +'&format=json') +'&callback=?'
  $.ajax({
    method: 'GET',
    url: directionsRequest,
    dataType: 'jsonp'
  }).done(function(d) {
    dataGot = d;
    var stations = [];
    for (var i=0; i<d.records.locations[0].location.length; i++) {
    	stations.push([d.records.locations[0].location[i].lon, d.records.locations[0].location[i].lat]);
    }
    var allPoints = stations.map((point,index) => ({
	    type: 'Feature',
	    properties:{
	    	description:"<h5>"+d.records.locations[0].location[index].locationName+"</h5>"+
	    	"<ul><b>Weather</b>: "+d.records.locations[0].location[index].weatherElement[1].time[0].elementValue[0].value+"</ul>"+
	    	"<ul><b>Temp</b>: "+d.records.locations[0].location[index].weatherElement[3].time[0].elementValue[0].value+"</ul>"
	    },
	    geometry: {
	        type: 'Point',
	        coordinates: point
	    }
	}));
    
    map.addLayer({
	  id: 'stationTaipei',
	  type: 'circle',
	  paint: {
		"circle-radius": 7,
		"circle-color": "#708090"
	  },
	  source: {
	    type: 'geojson',
	    data: {
	      type: 'FeatureCollection',
	      features: allPoints
	    }
	  }
	});
	var stationCoord = [d.records.locations[0].location[6].lon, d.records.locations[0].location[6].lat]
	map.on('click', 'stationTaipei', function(e){
		console.log(e.features[0].geometry)
		new mapboxgl.Popup({closeButton:true})
		.setLngLat([e.lngLat.lng, e.lngLat.lat])
		.setHTML(e.features[0].properties.description)
		.addTo(map);
	});
	// Change the cursor to a pointer when the mouse is over the places layer.
	map.on('mouseenter', 'stationTaipei', function () {
		map.getCanvas().style.cursor = 'pointer';
	});
	// Change it back to a pointer when it leaves.
	map.on('mouseleave', 'stationTaipei', function () {
		map.getCanvas().style.cursor = '';
	});
  });
}

