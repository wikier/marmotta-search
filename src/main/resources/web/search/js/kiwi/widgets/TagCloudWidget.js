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
	AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({
	    tagTheme: 'tag',
	    emptyTheme: 'no_facets',
		init: function() {
	        this.initStore();
			$(this.target).html(AjaxSolr.theme(this.emptyTheme));
		},
		afterRequest: function () {
			var plainField = this.field.replace(/^\{.*\}/,"");
			if (this.manager.response.facet_counts.facet_fields[plainField] === undefined) {
				$(this.target).html(AjaxSolr.theme(this.emptyTheme));
				return;
			}

			var maxCount = 0;
			var objectedItems = [];
			for (var facet in this.manager.response.facet_counts.facet_fields[plainField]) {
				var count = parseInt(this.manager.response.facet_counts.facet_fields[plainField][facet]);
				if (count > maxCount) {
					maxCount = count;
				}
				objectedItems.push({ facet: facet, count: count });
			}
			objectedItems.sort(function (a, b) {
				return a.facet < b.facet ? -1 : 1;
			});

			$(this.target).empty();
			for (var i = 0, l = objectedItems.length; i < l; i++) {
				var facet = objectedItems[i].facet;
				$(this.target).append(AjaxSolr.theme(this.tagTheme, {value:facet,count:objectedItems[i].count}, parseInt(objectedItems[i].count / maxCount * 10), this.clickHandler(facet))).append(' ');
			}
			if(objectedItems.length==0) {
				$(this.target).html(AjaxSolr.theme(this.emptyTheme));
			}
		}
	});
