// ---- Mapbox part ----
// api keys
mapboxgl.accessToken = 'pk.eyJ1IjoibW92aW5ncm9vdmluIiwiYSI6ImNqcXozd2M3YzA3MW8zeXQyMXR4NjcyMWQifQ.Wn__xJFvsBWzZmNGyvX6XA';
var OWMAPI = '0337c2626095cb7c3f744f230125a759'; // OpenWeatherMap
// var CWBAPI = 'CWB-3FB0188A-5506-41BE-B42A-3785B42C3823'; // cwb key from other site
var CWBAPI = 'CWB-356AF20D-A58F-44B4-9120-00B297790BE3';

// init map
var map = new mapboxgl.Map({
    container: 'mapid',
    style: 'mapbox://styles/mapbox/streets-v10',
    center: [121.536108, 25.012340],
    zoom: 12
});

var colors = [
    '#006000',
    '#007500',
    '#009100',
    '#00a600',
    '#00bb00',
    '#00db00',
    '#00ec00',
    '#28ff28',
    '#53ff53',
    '#79ff79',
    '#93ff93',
    '#a6ffa6'
];
var dataGot = '';
var stationsName = [];
var stationsCI = [];

map.on('load', function () {
    map.addSource('district', {
        "type": "geojson",
        "data": "https://gist.githubusercontent.com/movingroovin/e1ebbdab46c85faa808ec2b8c2aef8b6/raw/3d96dcc9f5c2439060c8c45e0c3ac6d8a39630c6/bigTaipeiDistrict.geojson"
    });
    // map.setPaintProperty("district-fills","fill-color","#3CB371")
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
    // add weather station
    weather();
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

// get user location
var startPoint = '';
var endPoint = '';
geolocate.on('geolocate', function (e) {
    startPoint = [e.coords.longitude, e.coords.latitude];
});
// set destination
$("#navi #setDestinationButton").on("click", function () {
    map.once('click', function (e) {
        endPoint = [e.lngLat.lng, e.lngLat.lat];
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
    });
});

// Get Route by click button
$("#navi #goButton").on("click", function () {
    getRoute(startPoint, endPoint);
    $("#instructions").toggle();
});

// get route function
function getRoute(start, end) {
    var directionsRequest = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;
    $.ajax({
        method: 'GET',
        url: directionsRequest,
    }).done(function (data) {
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
        steps.forEach(function (step) {
            instructions.insertAdjacentHTML('beforeend', '<p>' + step.maneuver.instruction + '</p>');
        });
    });
}


// add weather station function
function weather() {
    // var directionsRequest = 'https://api.openweathermap.org/data/2.5/weather?id=7280290&units=metric' + '&APPID=' + OWMAPI; 
    // var directionsRequestTest = 'https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=' + CWBAPI +'&callback=?';
    // $.ajax({method: 'GET',
    //   url: directionsRequestTest,
    //   dataType: 'json'
    // }).done(function(d) {
    //   console.log(d)
    // })
    // let request = `https://mysites.mwhglobal.com.tw/CommonServices/api/Proxy?URL=https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=${CWBAPI}&format=json`;
    let request = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=${CWBAPI}&format=json`;
    // let request = 'https://json2jsonp.com/?url=' + encodeURIComponent('https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=' + CWBAPI + '&format=json') + '&callback=?';
    
    // $.ajax({
    //     method: 'GET',
    //     url: request
    // }).done(function (d) {
    fetch(request, {
        method: 'GET',
        headers: {
            'Accept': '*/*'
        }
    }).then(res => {
        return res.json();
    }).then(d => {
        // console.log(d);
        dataGot = d;
        var stations = [];
        for (var i = 0; i < d.records.locations[0].location.length; i++) {
            stations.push([d.records.locations[0].location[i].lon, d.records.locations[0].location[i].lat]);
            stationsName.push(d.records.locations[0].location[i].locationName);
            stationsCI.push(d.records.locations[0].location[i].weatherElement[5].time[0].elementValue[0].value);
        }
        var levelCI = stationsCI.map(function (s) {
            if (s <= 10) {
                return colors[0];
            } else if (s >= 11 && s <= 15) {
                return colors[1];
            } else if (s >= 16 && s <= 19) {
                return colors[2];
            } else if (s >= 20 && s <= 26) {
                return colors[3];
            } else if (s >= 27 && s <= 30) {
                return colors[4];
            } else if (s >= 31) {
                return colors[5];
            }
        });
        var allPoints = stations.map((point, index) => ({
            type: 'Feature',
            properties: {
                description: "<h5>" + d.records.locations[0].location[index].locationName + "</h5>" +
                    "<ul><b>Weather</b>: " + d.records.locations[0].location[index].weatherElement[1].time[0].elementValue[0].value + "</ul>" +
                    "<ul><b>Temp</b>: " + d.records.locations[0].location[index].weatherElement[3].time[0].elementValue[0].value + "</ul>" +
                    "<ul><b>Temp feels like</b>: " + d.records.locations[0].location[index].weatherElement[2].time[0].elementValue[0].value + "</ul>" +
                    "<ul><b>Comfort Index</b>: " + d.records.locations[0].location[index].weatherElement[5].time[0].elementValue[0].value + "</ul>"
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
        map.on('click', 'stationTaipei', function (e) {
            // console.log(e.features[0].geometry);
            new mapboxgl.Popup({ closeButton: true })
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
        stationsName.forEach(function (station, i) {
            map.addLayer({
                "id": station,
                "type": "fill",
                "source": "district",
                "layout": {},
                "paint": {
                    "fill-color": levelCI[i],
                    "fill-opacity": 0.2
                },
                "filter": ["==", "T_Name", station]
            });
        });
    });
}

