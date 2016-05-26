function changeType(object, func) {
  d3.select('#type')
    .on('change', function() {
      var newType = d3.select(this).property('value');
      func(object,newType);
    });
};

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

var pos = $('.btn').offset();

var thisType = document.getElementById("type");
var showThisType = thisType.options[thisType.selectedIndex].value;

// Initialize variables...
var marker, circles, name, substr="", tooltip_hide, radius=4,
opacity=0.6, high_opacity=1,tooltip_opacity=0.8, resizeTime=400, flashTime=100,
tooltipTime=50, tooltip_pos, tooltip_width, xout_width;

var tooltip = d3.select("body").append("div")
  .attr("class","tooltip")
  .style("opacity",0);

var xout = d3.select("body").append("div")
  .attr("class","xout")
  .style("opacity",0)
  .html('<span class="glyphicon glyphicon-remove"></span>')
  .on('click', function(){
    tooltip.attr("class","hiddenDiv");
    xout.attr("class","hiddenDiv");
  });

var infobox = d3.select("body").append("div")
  .attr("class","infobox")
  .style("opacity",0)
  .style('left', pos.left + 'px')
  .style('top', pos.top + 30 + 'px')
infobox.html('<p>For information on other rental properties in Chicago and Illinois, follow this link or call (877) 428-8844</p>')

// Create the Google Map...
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 8,
  center: new google.maps.LatLng(41.862606,-87.695794),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles: [{
    stylers: [{
      saturation: -100
    }]
  }]
});


map.setOptions({draggableCursor: ''});

// Load the rental housing data. When data comes back, create an overlay.
d3.json("RentalHousing.json", function(data) {
  var bounds = new google.maps.LatLngBounds();
  d3.entries(data).forEach(function(d) {
    bounds.extend(d.value.lat_lng = new google.maps.LatLng(d.value[8], d.value[9]));
  });
  map.fitBounds(bounds);
  var overlay = new google.maps.OverlayView(),
  padding = 10;

  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {
    var layer = d3.select(this.getPanes().overlayMouseTarget).append("svg")
      .attr("class", "rental_housing");

      // Draw each marker as a separate SVG element.
      // We could use a single SVG, but what size would it have?
      overlay.draw = function() {
        tooltip_hide = false;

        var projection = this.getProjection(),
        sw = projection.fromLatLngToDivPixel(bounds.getSouthWest()),
        ne = projection.fromLatLngToDivPixel(bounds.getNorthEast());
        sw.x -= padding;
        sw.y += padding;
        ne.x += padding;
        ne.y -= padding;

        d3.select('.rental_housing')
          .attr('width', (ne.x - sw.x) + 'px')
          .attr('height', (sw.y - ne.y) + 'px')
          .style('position', 'absolute')
          .style('left', sw.x + 'px')
          .style('top', ne.y + 'px');

        marker = layer.selectAll(".marker")
          .data(d3.entries(data))
          .each(transform)
          .enter()
          .append("circle")
          .each(transform)
          .attr("class", "marker")
          .attr("r", radius)
          .style("fill-opacity", opacity)
          .attr('cx', function(d) {
            d = projection.fromLatLngToDivPixel(d.value.lat_lng);
            return d.x-sw.x;
          })
          .attr('cy', function(d) {
            d = projection.fromLatLngToDivPixel(d.value.lat_lng);
            return d.y-ne.y
          })
          .on("mouseover", function(d) {
            if (d.value[1] == showThisType || showThisType == 'ALL') {
              d3.select(this).transition().duration(flashTime)
                .style("fill-opacity", high_opacity);
              d3.select("svg").style("cursor","crosshair");
            }
          })
          .on("mouseout", function(d) {
            if (d.value[1] == showThisType || showThisType == 'ALL') {
              d3.select(this).transition().duration(flashTime)
                .style("fill-opacity", opacity);
              d3.select("svg").style("cursor",'');
            }
          })
          .on("click", function(d) {
            if (d.value[1] == showThisType || showThisType == 'ALL') {
              tooltip.transition().duration(tooltipTime)
                .style("opacity", tooltip_opacity)
                .attr("class","tooltip");
              tooltip.html('<span class="glyphicon glyphicon-home"></span>&nbsp&nbsp' + d.value[2] + '<br>' + '<span class="glyphicon glyphicon-info-sign"></span>&nbsp&nbsp' + d.value[0] + ', ' + d.value[7] + ' units' + '<br>' + '<span class="glyphicon glyphicon-map-marker"></span>&nbsp&nbsp' + d.value[3] + ', ' + d.value[4] + '<br>' + '<span class="glyphicon glyphicon-phone"></span>&nbsp&nbsp' + d.value[5])
                .style('left', $(this).position().left + 9 + 'px')
                .style('top', $(this).position().top + 9 + 'px');
                // .style('left', (d3.event.pageX) + 6 + 'px')
                // .style('top', (d3.event.pageY) + 3 + 'px');
              xout.transition().duration(tooltipTime)
                .html('<span class="glyphicon glyphicon-remove"></span>')
                .attr("class","xout")
                .style("opacity", tooltip_opacity)
                .style('left', $(this).position().left - 2 + 'px')
                .style('top', $(this).position().top - 2 + 'px');
                // .style('left', (d3.event.pageX) - 7 + 'px')
                // .style('top', (d3.event.pageY) - 7 + 'px');
              tooltip_hide = true;
            }
          });

          layer.on("click", function() {
            if (tooltip_hide) {
              tooltip.attr("class","hiddenDiv");
              xout.attr("class","hiddenDiv");
            }
          });

          map.addListener("bounds_changed", function(){
            tooltip.attr("class","hiddenDiv");
              xout.attr("class","hiddenDiv");
          })

      circles = layer.selectAll(".marker");
      changeType(circles, updateSelection);

      function transform(d) {
        d = projection.fromLatLngToDivPixel(d.value.lat_lng);
        return d3.select(this)
          .attr('cx', d.x - sw.x)
          .attr('cy', d.y - ne.y);
      };

      function updateSelection(object, newType) {
        tooltip.attr("class","hiddenDiv");
        xout.attr("class","hiddenDiv");
        thisType = document.getElementById("type");
        showThisType = thisType.options[thisType.selectedIndex].value;
        circles
          .filter(function(d) { return (d.value[1] == showThisType || showThisType == 'ALL'); })
          .transition().duration(resizeTime).ease("linear")
          .attr("r", radius);
        circles
          .filter(function(d) { return (d.value[1] != showThisType && showThisType != 'ALL'); })
          .transition().duration(resizeTime).ease("linear")
          .attr("r",0);
        substr = $('#search').val().toUpperCase();
        userSearch(substr);
      };

      $('#search').on('input', function() {
        tooltip.attr("class","hiddenDiv");
        xout.attr("class","hiddenDiv");
        substr = $(this).val().toUpperCase();
        userSearch(substr);
      });

      $('.btn').on('mouseover', function() {
        infobox.transition().duration(200);
        infobox.style("opacity",0.8);
      })

      $('.btn').on('mouseout', function() {
        infobox.transition().duration(200);
        infobox.style("opacity",0);
      })

      function userSearch(subString) {
        circles
          .filter(function(d) { return (d.value[1] == showThisType || showThisType == 'ALL'); })
          .filter(function(d) { neighborhood = d.value[0], name = d.value[2], address = d.value[3];
            return (neighborhood.search(subString) != -1 || name.search(subString) != -1 || address.search(subString) != -1); })
          .transition().duration(resizeTime).ease("linear")
          .attr("r",radius);
        circles
          .filter(function(d) { return (d.value[1] == showThisType || showThisType == 'ALL'); })
          .filter(function(d) { neighborhood = d.value[0], name = d.value[2], address = d.value[3];
            return (neighborhood.search(subString) == -1 && name.search(subString) == -1 && address.search(subString) == -1); })
          .transition().duration(resizeTime).ease("linear")
          .attr("r",0);
      }
    };
  };
  // Bind our overlay to the map...
  overlay.setMap(map);
});
