function AddstopAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	this.items = [];
	this.xmlData;
	this.baseUrl = 'http://developer.trimet.org/ws/V1/arrivals?appID=4830CC8DCF9D9BE9EB56D3256&locIDs=';
	
	this.busRoutes = [];
	
	this.askForStopList();
}

AddstopAssistant.prototype.setup = function() {
	
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);

	//this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
	// Spinner
	////////////////////////////////
	this.controller.setupWidget("addStopSpinner",
        this.spinnerAttributes = {
            spinnerSize: "small"
        },
        this.spinnerModel = {
            spinning: false
        }
    );
	
	// Add Stop Button
	////////////////////////////////
	this.addStopButtonModel = {
		buttonLabel : 'Add Stop',
		buttonClass : '',
		disabled : false
	};
	
	this.controller.setupWidget('add-stop-button', {}, this.addStopButtonModel);
	Mojo.Event.listen(this.controller.get('add-stop-button'),Mojo.Event.tap, this.onAddStopButtonTap.bind(this));
	
	// Find Stop Button
	////////////////////////////////
	this.findStopButtonModel = {
		buttonLabel : 'Search',
		buttonClass : '',
		disabled : false
	};
	
	this.controller.setupWidget('find-stop-button', {}, this.findStopButtonModel);
	Mojo.Event.listen(this.controller.get('find-stop-button'),Mojo.Event.tap, this.onFindStopButtonTap.bind(this));
	
	
	// Preview Button
	////////////////////////////////
	this.previewButtonModel = {
		buttonLabel : 'Preview',
		buttonClass : '',
		disabled : false
	};
	
	this.controller.setupWidget('preview-button', {}, this.previewButtonModel);
	Mojo.Event.listen(this.controller.get('preview-button'),Mojo.Event.tap, this.onPreviewButtonTap.bind(this));
	
	// Nearby Stops Button
	////////////////////////////////
	this.nearbyStopsButtonModel = {
		buttonLabel : 'Find Nearby Stops',
		buttonClass : '',
		disabled : false
	};
	
	this.controller.setupWidget('nearby-stops-button', {}, this.nearbyStopsButtonModel);
	Mojo.Event.listen(this.controller.get('nearby-stops-button'),Mojo.Event.tap, this.onNearbyStopsButtonTap.bind(this));
	
	// Add Stop Text Field
	////////////////////////////////
	this.textFieldModel = {
       	value : "",
       	disabled : false
	};
	
	this.textFieldAttributes = {
		modifierState: 	Mojo.Widget.numLock,
		focusMode:		Mojo.Widget.focusSelectMode,
		hintText: "Enter a stop ID"
	};
		
	this.controller.setupWidget('add-stop-textfield', this.textFieldAttributes, this.textFieldModel);


	// Route Filter Text Field
	////////////////////////////////
	this.routeFilterTextFieldModel = {
       	value : "",
       	disabled : false
	};
	
	this.routeFilterTextFieldAttributes = {
		modifierState: 	Mojo.Widget.numLock,
		hintText: "Optional - Choose a route"
	};
		
	this.controller.setupWidget('route-filter-textfield', this.routeFilterTextFieldAttributes, this.routeFilterTextFieldModel);

	// Stop Drawer
	////////////////////////////////
	
	this.controller.setupWidget("stops-drawer",
		this.attributes = {
			modelProperty: 'open',
			unstyled: true
		},
		this.model = {
			open: false
		}
	);
	
	 // Stop Search List
	////////////////////////////////
	this.searchResultsList = [];
	this.searchResultsListModel = {items:this.searchResultsList};
	
    this.searchResultsListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'addstop/listcontainer',
		itemTemplate: 'addstop/listItem',
		swipeToDelete: false,
        reorderable: false,

    };
	
    this.controller.setupWidget('search-results-list', this.searchResultsListAttrs, this.searchResultsListModel);		
	Mojo.Event.listen($('search-results-list'), Mojo.Event.listTap, this.handleListClick.bind(this));
	
};

AddstopAssistant.prototype.fillSearchResultsList = function(){
	
	// Clear the list
	this.searchResultsList = [];
	// Fills the stopList with the items from the depot
	
	Mojo.Log.info("********* Filling the search results");
	
	for (var index = 0; index < this.stopSearch.getLength(); ++index) {
	
		var busRoutes = this.stopSearch.getBusRouteList(index);
		var busRoutesString = Trimet.Utility.parseRouteList(busRoutes);
		
		// Filter for the chosen route
		if (this.stopSearch.hasRoute(index, this.routeFilterTextFieldModel.value)){
			var stopData = {
				stop_id: this.stopSearch.getStopID(index),
				description: this.stopSearch.getDescription(index),
				direction: this.stopSearch.getDirection(index),
				busRoutes: busRoutes,
				busRoutesString: busRoutesString
			}
			
			this.searchResultsList.push(stopData);
		}
	}
	//sync the list back up with the model
	this.searchResultsListModel.items = this.searchResultsList;
	this.updateStopSearchList();
};

AddstopAssistant.prototype.handleListClick = function(event){
	// Setup the data for the Display Stop Scene and push the scene
	
	this.controller.showAlertDialog({
		onChoose: function(value) {this.onDialogChoose(value, event.item)},
		title: event.item.description,
		//message: $L("How would you like your steak done?"),
		choices:[
			{label:$L('Add To Favorites'), value:"add", type:'view'},  
			{label:$L("View Arrivals"), value:"view"},
			{label:$L("Cancel"), value:"cancel", type:'negative'}   
		]
    });	
}

AddstopAssistant.prototype.onDialogChoose = function(value, listItem){
	switch (value) {
		case 'add':
		var stopData = {
			stop_id: listItem.stop_id, 
			description: listItem.description,
			direction: listItem.direction,
			busRoutes: listItem.busRoutes
		};
		this.doAddStop(stopData);
		break;
		case 'view':
		this.controller.stageController.pushScene('displaystop', listItem.stop_id);
		break;
	}
}

AddstopAssistant.prototype.askForStopList = function(){
	// Get the stop list from the depot
	Mojo.Log.info("********* About to ask for list");
	TrimetTracker.stopListDepot.simpleGet("stops", this.gotListFromDepot.bind(this), AppInfo.Depot.getFailure.bind(this));
	
}

AddstopAssistant.prototype.gotListFromDepot = function(stopList){
	if (stopList == undefined){
		Mojo.Log.info("********* Stops undefined")
		stopList = [];
	}
	
	this.stopList = stopList;
}

AddstopAssistant.prototype.startSpinner = function(){
	Mojo.Log.info("********* Starting Spinner");
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
}

AddstopAssistant.prototype.stopSpinner = function(){
	Mojo.Log.info("********* Stopping Spinner");	
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
}

AddstopAssistant.prototype.getStopData = function(stopID, action) {
	
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(Trimet.baseArrivalsUrl + stopID);
	}
	else{
		url = Trimet.baseArrivalsUrl + stopID;
	}
	
	// Check for internet connection
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var ajaxOptions = {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotStopData.bind(this, action),
		onFailure: this.getFailure.bind(this)
	}
	
	var request = new Ajax.Request(url, ajaxOptions);
	
}

/*
 * Called by Prototype when the request succeeds. Parse the XML response
 */
AddstopAssistant.prototype.gotStopData = function(action, transport) {
	
	this.xmlData = Trimet.getXML(transport);
	
	this.busStop = new BusStop(this.xmlData);
	// deactivate the spinner
	this.stopSpinner();
	
	if (!this.busStop.hasError()){
		
		switch (action) {
			case 'add':
			var stopData = {
				stop_id: this.textFieldModel.value, 
				description: this.busStop.getStopDescription(),
				direction: this.busStop.getDirection(),
				busRoutes: this.busStop.getBusRouteList()
			};
			this.doAddStop(stopData);
			break;
			
			case 'lookup':
			this.doLookupOnce();
			break;
		}
	}
	else{
		Trimet.showError(this, this.busStop.getError());
	}
}

/*
 * Called by Prototype when the request fails.
 */
AddstopAssistant.prototype.getFailure = function(transport) {
	/*
	 * Use the Prototype template object to generate a string from the return status.
	 */
	var template = new Template($L("Error: Status #{status} returned from Trimet xml request."));
	var message = template.evaluate(transport);
	
	this.stopSpinner();
	
	/*
	 * Show an alert with the error.
	 */
	Trimet.showError(this, message);
}

AddstopAssistant.prototype.onAddStopButtonTap = function()
{
	this.getStopData(this.textFieldModel.value, "add");
}

AddstopAssistant.prototype.onFindStopButtonTap = function()
{
	this.controller.stageController.pushScene('findstop');
}

AddstopAssistant.prototype.onPreviewButtonTap = function()
{
	this.getStopData(this.textFieldModel.value, "lookup");
}

AddstopAssistant.prototype.onNearbyStopsButtonTap = function()
{
	var request = this.controller.serviceRequest('palm://com.palm.location', {
		method:"getCurrentPosition",
		parameters: {
			accuracy: 1,
			responseTime: 2
		},
		onSuccess: this.gotGpsData.bind(this),
		onFailure: this.gpsFailure.bind(this)
	});
	
	this.startSpinner();
	
	// For testing, location of downtown portland
	/*this.gotGpsData({
		latitude: 45.510332,
		longitude: -122.6844468
	});*/
}

AddstopAssistant.prototype.gotGpsData = function(gpsData){
	Mojo.Log.info("********* Got GPS Data: " + gpsData.latitude +','+ gpsData.longitude);

	this.getStopSearchData(gpsData.latitude, gpsData.longitude);
}

AddstopAssistant.prototype.gpsFailure = function(error){
	Mojo.Log.error("********* GPS Failure: ", error.errorCode);
	Trimet.showError(this, "GPS Error: " + GPS.getError(error.errorCode));
}



AddstopAssistant.prototype.getStopSearchData = function(lon, lat){
	var url = Trimet.baseStopsUrl + lon + ',' + lat;
	
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(url);
	}
	
	Mojo.Log.info("********* URL: " + url);
	
	// Check for internet connection
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var ajaxOptions = {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotStopSearchData.bind(this),
		onFailure: this.getFailure.bind(this)
	}
	
	var request = new Ajax.Request(url, ajaxOptions);
}

AddstopAssistant.prototype.gotStopSearchData = function(transport) {
	
	this.xmlStopSearchData = Trimet.getXML(transport);
	
	this.stopSearch = new StopSearch(this.xmlStopSearchData);
	Mojo.Log.info("********* Got Stop Search Data");
	// deactivate the spinner
	this.stopSpinner();
	
	if (!this.stopSearch.hasError()){
		this.fillSearchResultsList();
		$('stops-drawer').mojo.setOpenState(true);
	}
	else{
		Trimet.showError(this, this.stopSearch.getError());
	}
}

AddstopAssistant.prototype.updateStopSearchList = function(){
	Mojo.Log.info("*************Updating List");
	
	this.controller.modelChanged(this.searchResultsListModel);
	
	
	// show or hide the the appropriate messages
	if (this.searchResultsListModel.items.length == 0){
		if (this.stopSearch.getLength() == 0){
			this.showNoNearbyStopsMessage();
			this.hideNoMatchesMessage();
		}
		else{
			this.showNoMatchesMessage();
			this.hideNoNearbyStopsMessage();
		}
	}
	else{
		this.hideNoMatchesMessage();
		this.hideNoNearbyStopsMessage();
	}

}

AddstopAssistant.prototype.showNoNearbyStopsMessage = function(){
	$("no-nearby-stops-message").show();
}

AddstopAssistant.prototype.hideNoMatchesMessage = function(){
	$("no-matches-message").hide();
}

AddstopAssistant.prototype.showNoMatchesMessage = function(){
	$("no-matches-message").show();
}

AddstopAssistant.prototype.hideNoNearbyStopsMessage = function(){
	$("no-nearby-stops-message").hide();
}


AddstopAssistant.prototype.doLookupOnce = function(){
	this.controller.stageController.pushScene('displaystop', this.textFieldModel.value);
}

AddstopAssistant.prototype.doAddStop = function(stopData)
{	
	this.stopList.push(stopData);
	
	TrimetTracker.stopListDepot.add("stops", this.stopList, AppInfo.Depot.addSuccess.bind(this), AppInfo.Depot.addFailure.bind(this));

	this.controller.stageController.popScene();

}

AddstopAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
	if (event != undefined) {
		Mojo.Log.info("********* StopID: ", event.stopID);
		this.textFieldModel.value = event.stopID;
		this.controller.modelChanged(this.textFieldModel);
	}
};

AddstopAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	 
};

AddstopAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('add-stop-button'),Mojo.Event.tap, this.onAddStopButtonTap.bind(this));
	Mojo.Event.stopListening(this.controller.get('preview-button'),Mojo.Event.tap, this.onPreviewButtonTap.bind(this));
	Mojo.Event.stopListening(this.controller.get('nearby-stops-button'),Mojo.Event.tap, this.onNearbyStopsButtonTap.bind(this));
	Mojo.Event.stopListening(this.controller.get('search-results-list'), Mojo.Event.listTap, this.handleListClick.bind(this));
	Mojo.Event.stopListening(this.controller.get('find-stop-button'),Mojo.Event.tap, this.onFindStopButtonTap.bind(this));
	
	
};
