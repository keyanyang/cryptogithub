d3.json('static/markers.json', function(error, data) {
    var itemsData = data;
    _.each(itemsData, function(d) {
        d["lon"] = +d["lon"];
		d["lat"] = +d["lat"];
		d["star"] = +d["star"];
		d["commits"] = +d["commits"];
		d["contributors"] = +d["contributors"];
		d['name'] = d['name'].split('/').pop()
    });

var ndx = crossfilter(itemsData);

var regionDim  = ndx.dimension(function(d) {return d.region;});
var companyDim = ndx.dimension(function(d) {return d.name;});
var allDim = ndx.dimension(function(d) {return d;});

var all = ndx.groupAll();
var regionGroup = regionDim.group().reduceCount();
var companyGroup = companyDim.group().reduceSum(function(d) { return d.contributors; });

var regionChart = dc.pieChart('#chart-ring-region');
var companyChart = dc.rowChart('#chart-row-company');

regionChart
.width(150)
.height(150)
.dimension(regionDim)
.group(regionGroup);

companyChart
.width(150)
.height(500)
.dimension(companyDim)
.group(companyGroup)
.ordering(function(d) { return -d.value })
.elasticX(true)
.xAxis().ticks(3);


var cramps = d3.scale.linear()
    .domain([0,15000])
    .range(['#ffeda0', '#f03b20']);


var drawMap = function(center, zoom){
        map = L.map('map').setView(center, zoom);
	    //map.setView([31.75, 110], 4);
		mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
		L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
         subdomains: ['a','b','c']
        }).addTo( map );

		//Map
        function circlesize(commits) {
        if (commits <= 500) {
            return 3 + commits/100;
        } else {
            return 8 + (commits-1000)/500;
        }
        }

		_.each(allDim.top(Infinity), function (d) {
            var markLat = d.lat;
            var markLong = d.lon;
            var markCommits = d.commits;
            var markStar = d.star;

            var circle = new L.circleMarker([markLat, markLong], {
            color: cramps(markStar),
            fillColor: cramps(markStar),
            fillOpacity: 0.7,
            radius: circlesize(markCommits)
            });
            circle.bindPopup("<p>" + d.name+ "</p>");
            map.addLayer(circle);
      });

    var legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'legend'),
        grades = ["0", "2500", "5000", "7500", "10000", "15000"],
        labels = [0,2500,5000,7500,10000,15000];

    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + cramps(labels[i]) + '"></i> ' +
             (grades[i] ? grades[i] + '<br>' : '+');
    }
    return div;
    };
    legend.addTo(map);
	};





var mapmargin = 160;
$('#map').css("height", ($(window).height()));
$(window).on("resize", resize);
resize();
function resize(){
    $('#map').css("height", ($(window).height() - mapmargin));
    $('#map').css("margin-top",14);
    $('#map').css("margin-bottom",15);
}

drawMap([0, 0], 2);



// register handlers
d3.selectAll('a#all').on('click', function () {
    dc.filterAll();
    dc.renderAll();
  });

d3.selectAll('a#region-rest').on('click', function () {
    regionChart.filterAll();
    dc.redrawAll();
  });

d3.selectAll('a#company-rest').on('click', function () {
    companyChart.filterAll();
    dc.redrawAll();
  });

dcCharts = [regionChart, companyChart];

_.each(dcCharts, function (dcChart) {
    dcChart.on("filtered", function (chart, filter) {
        map.eachLayer(function (layer) {
            map.removeLayer(layer)
        });
        var center = map.getCenter()
        var zoom = map.getZoom()
        map.remove()
        drawMap(center, zoom);

    });
});

// showtime!
dc.renderAll();

});
