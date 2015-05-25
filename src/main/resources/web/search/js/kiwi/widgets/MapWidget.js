/*
 * Copyright (C) 2013 Salzburg Research.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
	/**
	 * AjaxSolr.MapWidget displays the geo-pos of the search result on a google-maps map.
	 * Requires http://maps.googleapis.com/maps/api/js and jQuery
	 * <script type='text/javascript' src='http://maps.googleapis.com/maps/api/js?sensor=false&libraries=geometry'></script>
	 */
	AjaxSolr.MapWidget = AjaxSolr.AbstractWidget.extend({
		/**
		 * default start pos is SRFG ;-)
		 */ 
		startPos: [47.635784, 13.590088],
		/**
		 * resultSelector, used for the connection result -> marker.
		 * Implemented by $(resultSelector).live('hover')
		 */
		resultSelector: 'div.result',
		/**
		 * resultPrefix, used for the connection marker -> result.
		 * Implemented by $(resultIdPrefix + doc.id).addClass(...)
		 * @see #resultHighlightClass
		 */
		resultIdPrefix: 'doc-',
		/**
		 * resultHighlightClass, @see #resultIdPrefix
		 */
		resultHighlightClass: 'hoover',
		/**
		 * field: how to get the coordinates from the result document.
		 * Available options:
		 * > [ latitude-field, longitude-field ] (both float)
		 * > position (solr.LatLonType)
		 * > position (solr.GeoHash)
		 */
		field: ['lat', 'lng'],
		/**
		 * altField: how to get the alternative coordinates from the result document (may be multi-value).
		 * Available options:
		 * > [ latitude-field, longitude-field ] (both float)
		 * > position (solr.LatLonType)
		 * > position (solr.GeoHash)
		 */
		altField: null,
		/**
		 * searchField: field used for spatial fq querys.
		 * > position (solr.LatLonType)
		 * > position (solr.GeoHash)
		 */
		searchField: null,
		/**
		 * internal. Reference to the (google)-map
		 */
		map: null,
		/**
		 * options used to create the map.
		 * @see #map
		 * @see http://code.google.com/apis/maps/documentation/javascript/reference.html#MapOptions
		 */
		mapOptions: null,
		/**
		 * internal. Reference to the (search) region (aka: the circle)
		 */
		region: null,
		/**
		 * options used to create the region
		 * @see #region
		 * @see http://code.google.com/apis/maps/documentation/javascript/reference.html#CircleOptions
		 */
		regionOptions: null,
		
		init: function() {
			var self = this
			$(this.resultSelector).live('mouseover', function() {
				var id = $(this).attr('id');
				self.markerBounce(true, id);
			});
			$(this.resultSelector).live('mouseout', function() {
				var id = $(this).attr('id');
				self.markerBounce(false, id);				
			});
			
			var container = $(this.target);
			container.empty();
			var opts = this.mapOptions || {
					zoom: 6,
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					disableDefaultUI: true
			};
			var iniLoc = new google.maps.LatLng(this.startPos[0], this.startPos[1]);
			this.map = new google.maps.Map(container[0], opts);
			this.map.setCenter(iniLoc);
			this.marks = [];
			
			var isCircling = false;
			var adjustRadius = function(event) {
				if (self.region) {
					var center = self.region.getCenter();
					var dist = google.maps.geometry.spherical.computeDistanceBetween(center, event.latLng);
					if (dist < 10) {
						self.region.setMap(null);
						self.region = null;
					} else {
						self.region.setRadius(dist);
					}
				}
			};
			var createCircle = function(event) {
				if (isCircling) {
					adjustRadius(event);
					self.manager.doRequest(0);
				} else {
				    self.removeCircle();
					var cOpts = self.regionOptions || {
							strokeColor: "#FF0000",
							strokeOpacity: 0.8,
							strokeWeight: 2,
							fillColor: "#FF0000",
							fillOpacity: 0.35
					};
					cOpts.map = self.map;
					cOpts.center = event.latLng;
					
					self.region = new google.maps.Circle(cOpts);
					google.maps.event.addListener(self.region, 'mousemove', function(event) {
						if (isCircling) {
							adjustRadius(event);
						}
					});
					google.maps.event.addListener(self.region, 'rightclick', createCircle);
					self.region._c = new google.maps.Marker({
						icon: baseURI + '/solr/ui/img/map/center.png',
						map: self.map, 
						position: event.latLng
					});
					google.maps.event.addListener(self.region._c, 'rightclick', function() {
						self.removeCircle();
						self.manager.doRequest(0);
					});
				}
				isCircling = !isCircling;
			};
			google.maps.event.addListener(this.map, 'rightclick', createCircle);
			google.maps.event.addListener(this.map, 'mousemove', function(event) {
				if (isCircling) {
					adjustRadius(event);
				}
			});
			google.maps.event.addListener(this.map, 'mouseout', function(event) {
				if (isCircling) {
					self.removeCircle();
					isCircling = false;
					self.manager.doRequest(0);
				}
			});

		},
		beforeRequest: function() {
			var f = this.searchField || this.field;
			this.manager.store.removeByValue('fq', new RegExp('^\\{\\!geofilt sfield=' + f + ' pt='));
			if (typeof f == 'string' && this.region) {
				var center = this.region.center.lat() + ',' + this.region.center.lng();
				var dist = this.region.radius / 1000 ; // google uses [m], solr [km]
				this.manager.store.addByValue('fq', '{!geofilt sfield=' + f + ' pt=' +center+ ' d=' + dist + '}');
			}
		},
        removeCircle: function() {
            if (this.region) {
                this.region.setMap(null);
                if (this.region._c) this.region._c.setMap(null);
                this.region = null;
            }
        },
		_hasLocation: function(doc, field) {
			if (!field) return null; 
			if ($.isArray(field)) {
				return (doc[field[0]] !== undefined && doc[field[1]] !== undefined);
			} else if (typeof field == 'string') {
				return (doc[field] !== undefined);
			} 
			return false;
		},
		_getLatLon: function(doc, field) {
			if (!field) return null;
			if ($.isArray(field)) {
				return [new google.maps.LatLng(doc[field[0]][0], doc[field[1]][0])];
			} else if (typeof field == 'string') {
				if ($.isArray(doc[field])) {
					var r = [];
					for (var i in doc[field]) {
						var lalo = doc[field][i].split(',');
						r.push(new google.maps.LatLng(lalo[0], lalo[1]));
					}
					return r;
				} else {
					var lalo = doc[field].split(',');
					return [new google.maps.LatLng(lalo[0], lalo[1])];
				}
			}
			return null;
		},
		afterRequest: function () {
			// Remove old markers
			for(i in this.marks) {
				for (m in this.marks[i]) {
					this.marks[i][m].setMap(null);
				}
			}
			this.marks = [];
			// Add markers
			var region = new google.maps.LatLngBounds();
			var docs = this.manager.response.response.docs;
			var self = this;

			for(i in docs) {
				var doc = docs[i];
				this.marks[this.resultIdPrefix + doc.id] = [];
				if (this._hasLocation(doc, this.field)) {
					var pos = this._getLatLon(doc, this.field);
					for (var i in pos) {
						var marker = this.createMarker(doc);
						marker.res_id = doc.id;
						google.maps.event.addListener(marker, 'mouseover', function() {
							self.resultHoover(this.res_id);
						});
						google.maps.event.addListener(marker, 'mouseout', function() {
							self.resultHoover(null);
						});
						google.maps.event.addListener(marker, 'click', function() {
							var entry = $("#" + self.resultIdPrefix + this.res_id);
							if (entry.length > 0) $("html").scrollTop(entry.offset().top);
						});
						marker.setPosition(pos[i]);
						region.extend(pos[i]);
						marker.setMap(this.map);
						this.marks[this.resultIdPrefix + doc.id].push(marker);
					}
				}
				if (this._hasLocation(doc, this.altField)) {
					var pos = this._getLatLon(doc, this.altField);
					for (var i in pos) {
						var marker = this.createAltMarker(doc);
						marker.res_id = doc.id;
						google.maps.event.addListener(marker, 'mouseover', function() {
							self.resultHoover(this.res_id);
						});
						google.maps.event.addListener(marker, 'mouseout', function() {
							self.resultHoover(null);
						});
						google.maps.event.addListener(marker, 'click', function() {
							var entry = $("#" + self.resultIdPrefix + this.res_id);
							if (entry.length > 0) $("html").scrollTop(entry.offset().top);
						});
						marker.setPosition(pos[i]);
						region.extend(pos[i]);
						marker.setMap(this.map);
						this.marks[this.resultIdPrefix + doc.id].push(marker);
					}

				}
			}
			if (self.region) {
				self.map.fitBounds(self.region.getBounds());
			}
			if (!region.isEmpty()) {
				self.map.panTo(region.getCenter());
				var mapBounds = self.map.getBounds();
				if (mapBounds && !(mapBounds.contains(region.getNorthEast()) && mapBounds.contains(region.getSouthWest()))) {
					self.map.fitBounds(region);
				}
			}
		},
		resultHoover: function(id) {
			$(this.resultSelector).removeClass(this.resultHighlightClass);
			if (id === undefined || id == null) {
			} else {
				$("#" + this.resultIdPrefix + id).addClass(this.resultHighlightClass);
			}
		},
		markerBounce: function(on, id) {
			if (on === true) {
				if (id && this.marks[id]) {
					for (var m in this.marks[id]) {
						this.marks[id][m].setAnimation(google.maps.Animation.BOUNCE);
					}
				}
			} else if (on === false) {
				if (id && this.marks[id]) {
					for (var m in this.marks[id]) {
						this.marks[id][m].setAnimation(null);
					}
				} else {
					for(i in this.marks) {
						for (var m in this.marks[i]) {
							this.marks[i][m].setAnimation(null);
						}
					}
				}
			}
		},
		createMarker: function(doc) {
			var marker = new google.maps.Marker({
				title: doc.title + ""
			});
			return marker;
		},
		createAltMarker: function(doc) {
			return null;
		},
		multivalue: false
	});
