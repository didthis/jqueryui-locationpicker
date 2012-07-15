(function($) {

var markerClassName = "hasLocationpicker";

$.widget("ui.locationpicker", {

	options: {
	},

	_create: function() {
		var self = this;
		// setup elements
		this.element.addClass(markerClassName);
		var widgetElement = $('<div class="ui-widget ui-locationpicker"></div>').appendTo(this.element);
		var searchElement = $('<input type="text" class="ui-locationpicker-search" placeholder="search location ..." />').appendTo(widgetElement);
		var locationButton = $('<button type="button" class="ui-locationpicker-location-button">use current location</button>').appendTo(widgetElement);
		var mapElement = $('<div class="ui-locationpicker-map"></div>').appendTo(widgetElement);
		var locationSearch = {
			source: function(request, response) {
				$.ajax({
					url: "http://ws.geonames.org/search",
					dataType: "jsonp",
					data: {
						q: request.term,
						type: "json",
						maxRows: 10
					},
					success: function(data) {
						response($.map(data["geonames"], function(item) {
							return {
								label: item.name,
								value: item.name,
								item: item
							}
						}));
					}
				});
			},
			minLength: 2,
			open: function(){
				$(this).autocomplete('widget').css('z-index', '2000');
				return false;
			},
			select: function(event, ui) {
				var item = ui.item.item;
				setMarker(item.lng, item.lat);
				searchElement.autocomplete("option", locationSearch);
				self._trigger("selected", event, { item: item });
			}
		};
		// setup map
		var markerLayer = new OpenLayers.Layer.Markers("Markers");
		var map = new OpenLayers.Map({
			div: mapElement.get(0),
			projection: new OpenLayers.Projection("EPSG:900913"),
			displayProjection: new OpenLayers.Projection("EPSG:4326"),
			layers: [
				new OpenLayers.Layer.OSM("OpenStreetMap", null),
				markerLayer
			]
		});
		map.setCenter(new OpenLayers.LonLat(9.2166667, 47.6333333).transform(
			map.displayProjection, map.getProjectionObject()
		), 2);
		var setMarker = function(lon, lat) {
			var lonLat = new OpenLayers.LonLat(lon, lat).transform(
				map.displayProjection, map.getProjectionObject()
			);
			$.each(markerLayer.markers, function() {
				markerLayer.removeMarker(this);
			});
			map.setCenter(lonLat, 10);
			markerLayer.addMarker(new OpenLayers.Marker(lonLat));
		};
		var geolocate = new OpenLayers.Control.Geolocate({
			bind: true
		});
		geolocate.events.register("locationupdated", geolocate,function(event) {
			var point = event.position.coords,
			longitude = point.longitude,
			latitude = point.latitude;
			$.ajax({
				url: "http://ws.geonames.org/findNearbyPlaceName",
				dataType: "jsonp",
				data: {
					lng: longitude,
					lat: latitude,
					type: "json",
					radius: "10"
				},
				success: function(data) {
					var choices = searchElement.autocomplete("widget");
					choices.empty();
					searchElement.autocomplete("option", "source", $.map(data["geonames"], function(item) {
						return {
							label: item.name,
							value: item.name,
							item: item
						}
					}));
					searchElement.autocomplete("option", "minLength", 0);
					searchElement.autocomplete("search", "");
				}
			});
		});
		map.addControl(geolocate);
		locationButton.click(function() {
			geolocate.activate();
			geolocate.getCurrentLocation();
		});
//		var dragMarker = new OpenLayers.Control.DragMarker(markerLayer, {
//		});
//		map.addControl(dragMarker);
//		dragMarker.activate();
		// setup geocode search
		searchElement.autocomplete(locationSearch);
	},

	_setOption: function(key, value) {
		switch(key) {
		}
		$.Widget.prototype._setOption.apply(this, arguments);
	},

	_destroy: function() {
		$.Widget.prototype.destroy.call(this);
	}
});
}) (jQuery);
