Ext.namespace('GeoNetwork');

var catalogue;
var app;
var cookie;

GeoNetwork.app = function() {

	// public space:
	return {
		generateAdvancedSearchForm : function() {

			// formItems.push(GeoNetwork.util.SearchFormTools.getSimpleFormFields(
			// catalogue.services, GeoNetwork.map.BACKGROUND_LAYERS,
			// GeoNetwork.map.MAP_OPTIONS, true,
			// GeoNetwork.searchDefault.activeMapControlExtent, undefined,
			// {
			// width : 290
			// }), adv);

			var what = [];

			what.push(new GeoNetwork.form.OpenSearchSuggestionTextField({
				hideLabel : true,
				width : 285,
				minChars : 2,
				loadingText : '...',
				hideTrigger : true,
				url : catalogue.services.opensearchSuggest
			}));

			// {
			// title:OpenLayers.i18n('What'),
			// margins:'0 5 0 0',
			// layout:'form',
			// items:[
			// advancedCriteria,GeoNetwork.util.SearchFormTools.getTypesField(GeoNetwork.searchDefault.activeMapControlExtent,
			// true)
			// ]
			// }

			var where = {};

			// {
			// title : OpenLayers.i18n('Where'),
			// margins : '0 5 0 5',
			// bodyStyle : 'padding:0px',
			// layout : 'form',
			// items : [ GeoNetwork.util.SearchFormTools.getSimpleMap(
			// GeoNetwork.map.BACKGROUND_LAYERS,
			// GeoNetwork.map.MAP_OPTIONS, false)
			// // ,new GeoExt.ux.GeoNamesSearchCombo({ map:
			// // Ext.getCmp('geometryMap').map, zoom: 12})
			// ]
			// };

			var when = {
				title : OpenLayers.i18n('When'),
				margins : '0 5 0 5',
				defaultType : 'datefield',
				layout : 'form',
				items : GeoNetwork.util.SearchFormTools.getWhen()
			};
			var inspire = {
				title : 'INSPIRE',
				margins : '0 5 0 5',
				defaultType : 'datefield',
				layout : 'form',
				items : GeoNetwork.util.INSPIRESearchFormTools
						.getINSPIREFields(catalogue.services, true)
			};

			var formItems = [];

			formItems.push({
				id : 'advSearchTabs',
				layout : {
					type : 'hbox',
					pack : 'center',
					align : 'center'
				},
				plain : true,
				autoHeight : true,
				border : false,
				deferredRender : false,
				defaults : {
					bodyStyle : 'padding:10px'
				},
				items : [ what, when, inspire ]
			});

			return new GeoNetwork.SearchFormPanel({
				id : 'searchForm',
				renderTo : 'advanced-search-options-content',
				stateId : 's',
				border : false,
				searchCb : function() { // TODO
				},
				padding : 5,
				items : formItems
			});
		},
		generateMaps : function() {

			var map = new OpenLayers.Map();
			var layer = new OpenLayers.Layer.WMS("Global Imagery",
					"http://maps.opengeo.org/geowebcache/service/wms", {
						layers : "bluemarble"
					});
			map.addLayer(layer);

			new GeoExt.MapPanel({
				renderTo : 'mini-map',
				height : 200,
				width : 200,
				map : map,
				title : 'Mini Map'
			});

		},
		init : function() {
			geonetworkUrl = GeoNetwork.URL
					|| window.location.href.match(/(http.*\/.*)\/apps\/ngr2.*/,
							'')[1];

			urlParameters = GeoNetwork.Util.getParameters(location.href);
			var lang = urlParameters.hl || GeoNetwork.Util.defaultLocale;
			if (urlParameters.extent) {
				urlParameters.bounds = new OpenLayers.Bounds(
						urlParameters.extent[0], urlParameters.extent[1],
						urlParameters.extent[2], urlParameters.extent[3]);
			}

			// Init cookie
			cookie = new Ext.state.CookieProvider({
				expires : new Date(new Date().getTime()
						+ (1000 * 60 * 60 * 24 * 365))
			});

			// set a permalink provider which will be the main state provider.
			permalinkProvider = new GeoExt.state.PermalinkProvider({
				encodeType : false
			});

			Ext.state.Manager.setProvider(permalinkProvider);

			// Create connexion to the catalogue
			catalogue = new GeoNetwork.Catalogue(
					{
						// statusBarId: 'info',
						lang : lang,
						hostUrl : geonetworkUrl,
						mdOverlayedCmpId : 'resultsPanel',
						adminAppUrl : geonetworkUrl + '/srv/' + lang + '/admin',
						// Declare default store to be used for records and
						// summary
						metadataStore : GeoNetwork.Settings.mdStore ? GeoNetwork.Settings
								.mdStore()
								: GeoNetwork.data.MetadataResultsStore(),
						metadataCSWStore : GeoNetwork.data
								.MetadataCSWResultsStore(),
						summaryStore : GeoNetwork.data.MetadataSummaryStore()
					});

			this.generateMaps();
			this.generateAdvancedSearchForm();
		}
	};
};

Ext.onReady(function() {
	var lang = /hl=([a-z]{3})/.exec(location.href);
	GeoNetwork.Util.setLang(lang && lang[1], '..');

	Ext.QuickTips.init();

	app = new GeoNetwork.app();
	app.init();

});
