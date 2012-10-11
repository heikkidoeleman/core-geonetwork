Ext.namespace('GeoNetwork');

var catalogue;
var app;
var cookie;

GeoNetwork.app = function() {
	// public space:
	return {

		maps : [],
		/**
		 * Bottom bar
		 * 
		 * @return
		 */
		createBBar : function() {

			var previousAction = new Ext.Action({
				id : 'previousBt',
				text : '&lt;&lt;',
				handler : function() {
					var from = catalogue.startRecord
							- parseInt(Ext.getCmp('E_hitsperpage').getValue(),
									10);
					if (from > 0) {
						catalogue.startRecord = from;
						search();
					}
				},
				scope : this
			});

			var nextAction = new Ext.Action({
				id : 'nextBt',
				text : '&gt;&gt;',
				handler : function() {
					catalogue.startRecord += parseInt(Ext.getCmp(
							'E_hitsperpage').getValue(), 10);
					search();
				},
				scope : this
			});

			return new Ext.Toolbar({
				items : [ previousAction, '|', nextAction, '|', {
					xtype : 'tbtext',
					text : '',
					id : 'info'
				} ]
			});

		},

		/**
		 * Results panel layout with top, bottom bar and DataView
		 * 
		 * @return
		 */
		createResultsPanel : function(permalinkProvider) {
			var metadataResultsView = new GeoNetwork.MetadataResultsView({
				catalogue : catalogue,
				displaySerieMembers : true,
				autoScroll : true,
				tpl : GeoNetwork.Templates.FULL,
				featurecolor : GeoNetwork.Settings.results.featurecolor,
				colormap : GeoNetwork.Settings.results.colormap,
				featurecolorCSS : GeoNetwork.Settings.results.featurecolorCSS
			});

			catalogue.resultsView = metadataResultsView;

			// set a permalink provider which will be the main state provider.
			var permalinkProvider = new GeoExt.state.PermalinkProvider({
				encodeType : false
			});

			Ext.state.Manager.setProvider(permalinkProvider);

			var tBar = new GeoNetwork.MetadataResultsToolbar({
				catalogue : catalogue,
				searchFormCmp : Ext.getCmp('searchForm'),
				sortByCmp : Ext.getCmp('E_sortBy'),
				metadataResultsView : metadataResultsView,
				permalinkProvider : permalinkProvider
			});

			var bBar = this.createBBar();

			var resultPanel = new Ext.Panel({
				id : 'resultsPanel',
				border : false,
				hidden : true,
				bodyCssClass : 'md-view',
				autoWidth : true,
				layout : 'fit',
				tbar : tBar,
				items : metadataResultsView,
				renderTo : 'result-panel',
				// paging bar on the bottom
				bbar : bBar
			});
			return resultPanel;
		},

		generateAdvancedSearchForm : function() {

			var advancedCriteria = [];
			// Multi select keyword
			var themekeyStore = new GeoNetwork.data.OpenSearchSuggestionStore({
				url : catalogue.services.opensearchSuggest,
				rootId : 1,
				baseParams : {
					field : 'keyword'
				}
			});

			var themekeyField = new Ext.ux.form.SuperBoxSelect({
				hideLabel : false,
				minChars : 0,
				queryParam : 'q',
				hideTrigger : false,
				id : 'E_themekey',
				name : 'E_themekey',
				store : themekeyStore,
				valueField : 'value',
				displayField : 'value',
				valueDelimiter : ' or ',
				// tpl: tpl,
				fieldLabel : OpenLayers.i18n('keyword')
			// FIXME : Allow new data is not that easy
			// allowAddNewData: true,
			// addNewDataOnBlur: true,
			// listeners: {
			// newitem: function(bs,v, f){
			// var newObj = {
			// value: v
			// };
			// bs.addItem(newObj, true);
			// }
			// }
			});

			var orgNameStore = new GeoNetwork.data.OpenSearchSuggestionStore({
				url : catalogue.services.opensearchSuggest,
				rootId : 1,
				baseParams : {
					field : 'orgName'
				}
			});

			var orgNameField = new Ext.ux.form.SuperBoxSelect({
				hideLabel : false,
				minChars : 0,
				queryParam : 'q',
				hideTrigger : false,
				id : 'E_orgName',
				name : 'E_orgName',
				store : orgNameStore,
				valueField : 'value',
				displayField : 'value',
				valueDelimiter : ' or ',
				// tpl: tpl,
				fieldLabel : OpenLayers.i18n('org')
			});
			var categoryField = GeoNetwork.util.SearchFormTools
					.getCategoryField(catalogue.services.getCategories,
							'../images/default/category/', true);

			var spatialTypes = GeoNetwork.util.SearchFormTools
					.getSpatialRepresentationTypeField(null, true);

			var denominatorField = GeoNetwork.util.SearchFormTools
					.getScaleDenominatorField(true);

			var catalogueField = GeoNetwork.util.SearchFormTools
					.getCatalogueField(catalogue.services.getSources,
							catalogue.services.logoUrl, true);
			var groupField = GeoNetwork.util.SearchFormTools.getGroupField(
					catalogue.services.getGroups, true);
			var metadataTypeField = GeoNetwork.util.SearchFormTools
					.getMetadataTypeField(true);
			var validField = GeoNetwork.util.SearchFormTools
					.getValidField(true);

			advancedCriteria.push(themekeyField, orgNameField, categoryField,
					spatialTypes, denominatorField, catalogueField, groupField,
					metadataTypeField, validField);

			var what = {
				title : OpenLayers.i18n('What'),
				margins : '0 5 0 0',
				layout : 'form',
				forceLayout : true,
				items : [
						advancedCriteria,
						GeoNetwork.util.SearchFormTools
								.getTypesField(
										GeoNetwork.searchDefault.activeMapControlExtent,
										true) ]
			};

			// what.push(new GeoNetwork.form.OpenSearchSuggestionTextField({
			// hideLabel : true,
			// width : 285,
			// minChars : 2,
			// loadingText : '...',
			// hideTrigger : true,
			// url : catalogue.services.opensearchSuggest
			// }));

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
				forceLayout : true,
				defaultType : 'datefield',
				layout : 'form',
				items : GeoNetwork.util.SearchFormTools.getWhen()
			};
			var inspire = {
				title : 'INSPIRE',
				margins : '5 5 5 5',
				defaultType : 'datefield',
				layout : 'form',
				defaults : {
					anchor : '100%'
				},
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
				forceLayout : true,
				border : false,
				deferredRender : false,
				defaults : {
					bodyStyle : 'padding:10px'
				},
				items : [ what, when, inspire ]
			});

			return new GeoNetwork.SearchFormPanel({
				id : 'advanced-search-options-content-form',
				renderTo : 'advanced-search-options-content',
				stateId : 's',
				border : false,
				searchCb : function() {
					if (catalogue.resultsView && app.maps.length > 0) {
						catalogue.resultsView.addMap(app.maps[0], true);
					}
					var any = Ext.get('E_any');
					if (any) {
						if (any.getValue() === OpenLayers
								.i18n('fullTextSearch')) {
							any.setValue('');
						}
					}

					catalogue.startRecord = 1; // Reset start record
					searching = true;
					catalogue
							.search('advanced-search-options-content-form',
									this.loadResults, null,
									catalogue.startRecord, true);
				},
				forceLayout : true,
				padding : 5,
				items : formItems
			});
		},
		loadResults : function(response) {
			// Show "List results" panel

			Ext.getCmp('previousBt').setDisabled(catalogue.startRecord === 1);
			Ext.getCmp('nextBt').setDisabled(
					catalogue.startRecord
							+ parseInt(Ext.getCmp('E_hitsperpage').getValue(),
									10) > catalogue.metadataStore.totalLength);
			if (Ext.getCmp('E_sortBy').getValue()) {
				Ext.getCmp('sortByToolBar').setValue(
						Ext.getCmp('E_sortBy').getValue() + "#"
								+ Ext.getCmp('sortOrder').getValue());

			} else {
				Ext.getCmp('sortByToolBar').setValue(
						Ext.getCmp('E_sortBy').getValue());

			}

			// Fix for width sortBy combo in toolbar
			// See this:
			// http://www.sencha.com/forum/showthread.php?122454-TabPanel-deferred-render-false-nested-toolbar-layout-problem
			Ext.getCmp('sortByToolBar').syncSize();
			Ext.getCmp('sortByToolBar').setWidth(130);

			resultsPanel.syncSize();

			// resultsPanel.setHeight(Ext.getCmp('center').getHeight());

			// Ext.getCmp('west').syncSize();
			// Ext.getCmp('center').syncSize();
			// Ext.ux.Lightbox.register('a[rel^=lightbox]');
		},
		generateMaps : function() {

			var map = new OpenLayers.Map();

			var baseOSM = new OpenLayers.Layer.OSM(
					"MapQuest-OSM Tiles",
					[
							"http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg",
							"http://otile2.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg",
							"http://otile3.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg",
							"http://otile4.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.jpg" ]);
			var baseAerial = new OpenLayers.Layer.OSM(
					"MapQuest Open Aerial Tiles",
					[
							"http://oatile1.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
							"http://oatile2.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
							"http://oatile3.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
							"http://oatile4.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg" ]);

			map.addLayer(baseOSM);
			map.addLayer(baseAerial);
			new GeoExt.MapPanel({
				renderTo : 'mini-map',
				height : 200,
				width : 200,
				map : map,
				title : 'Mini Map'
			});

			this.maps.push(map);

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
			this.createResultsPanel();
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
