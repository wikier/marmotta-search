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
	 * MoreLikeThisWidget
	 */
	AjaxSolr.MoreLikeThisWidget = AjaxSolr.AbstractWidget.extend({
		afterRequest : function() {
			var resp = this.manager.response.response;
			var targ = $(this.target).empty();
			if (resp && resp.docs && resp.docs.length > 0) {
				for ( var i in resp.docs) {
					targ.append(AjaxSolr.theme('mlt_recommendation', resp.docs[i]));
				}
			} else {
				targ.html(AjaxSolr.theme('no_mlt_recommendation'));
			}
		}
	});
	/**
	 * InterestingTermsWidget
	 */
	AjaxSolr.InterestingTermsWidget = AjaxSolr.AbstractWidget.extend({
		boost : false,
		init : function() {
			if (this.boost) {
				this.manager.store.addByValue('mlt.boost', 'true');
			}
			this.manager.store.addByValue('mlt.interestingTerms', 'details');
		},
		afterRequest : function() {
			var terms = this.manager.response.interestingTerms;
			var target = $(this.target).empty();
			if (terms && AjaxSolr.size(terms) > 0) {
				var interesting = [];
				if (AjaxSolr.isArray(terms)) {
					// solr produces weird terms array: [term1, score1, term2,
					// score2, ... ]
					for ( var i = 0; i + 1 < terms.length; i += 2) {
						var _x = terms[i].split(':');
						var term = _x[_x.length - 1];
						var field = _x[_x.length - 2];
						var weight = value[i + 1];
						interesting.push({term: term, field: field, weight: weight});
					}
				} else {
					// object
					for ( var t in terms ) {
						var _x = t.split(':');
						var term = _x[_x.length - 1];
						var field = _x[_x.length - 2];
						var weight = terms[t];
						interesting.push({term: term, field: field, weight: weight});
					}
				}
				var self = this;
				interesting.sort(function (a, b) {
					return a.term< b.term ? -1 : 1;
				});
				for (var i in interesting) {
					var term = interesting[i];
					target.append(AjaxSolr.theme('mlt_interestingTermLink',
							term, function() {
								self.termClickHandler(term)
							}));
					target.append(' ');

				}
			} else {
				target.html(AjaxSolr.theme('no_mlt_interestingTerms'));
			}
		},
		termClickHandler : function(term) {
		}
	});
