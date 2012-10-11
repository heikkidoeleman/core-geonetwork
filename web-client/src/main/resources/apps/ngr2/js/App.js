Ext.namespace('GeoNetwork');

var catalogue;
var app;
var cookie;
var metadataResultsPanel;

GeoNetwork.app = function() {

	// public space:
	return {
	    /**
	     * Results panel layout with top, bottom bar and DataView
	     *
	     * @return
	     */
	    createResultsPanel: function(permalinkProvider){
	        metadataResultsView = new GeoNetwork.MetadataResultsView({
	            catalogue: catalogue,
	            displaySerieMembers: true,
	            autoScroll: true,
	            tpl: GeoNetwork.Templates.FULL,
	            featurecolor: GeoNetwork.Settings.results.featurecolor,
	            colormap: GeoNetwork.Settings.results.colormap,
	            featurecolorCSS: GeoNetwork.Settings.results.featurecolorCSS
	        });
	        
	        catalogue.resultsView = metadataResultsView;
	        
	        tBar = new GeoNetwork.MetadataResultsToolbar({
	            catalogue: catalogue,
	            searchFormCmp: Ext.getCmp('searchForm'),
	            sortByCmp: Ext.getCmp('E_sortBy'),
	            metadataResultsView: metadataResultsView,
	            permalinkProvider: permalinkProvider
	        });
	        
	        bBar = createBBar();
	        
	        resultPanel = new Ext.Panel({
	            id: 'resultsPanel',
	            border: false,
	            hidden: true,
	            bodyCssClass: 'md-view',
	            autoWidth: true,
	            layout: 'fit',
	            tbar: tBar,
	            items: metadataResultsView,
	            // paging bar on the bottom
	            bbar: bBar
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
				forceLayout: true,
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
				forceLayout: true,
				defaultType : 'datefield',
				layout : 'form',
				items : GeoNetwork.util.SearchFormTools.getWhen()
			};
			var inspire = {
				title : 'INSPIRE',
				margins : '5 5 5 5',
				defaultType : 'datefield',
				layout : 'form',
			    defaults: {
			        anchor: '100%'
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
	                if (metadataResultsView && Ext.getCmp('geometryMap')) {
	                    metadataResultsView.addMap(Ext.getCmp('mini-map').map, true);
	                 }
	                 var any = Ext.get('E_any');
	                 if (any) {
	                     if (any.getValue() === OpenLayers.i18n('fullTextSearch')) {
	                         any.setValue('');
	                     }
	                 }
	                 
	                 catalogue.startRecord = 1; // Reset start record
	                 search();
				},
				forceLayout: true,
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
