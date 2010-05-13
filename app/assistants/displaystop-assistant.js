function DisplaystopAssistant(stopData) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	// Timers
	////////////////////////////////
	this.countDownTimer = "";
	this.refreshTimer = "";
	
	// Spinner
	////////////////////////////////
	// Used to allow multiple ajax 
	// 	requests to use the same spinner
	////////////////////////////////
	this.spinnerTracker = new Trimet.Utility.Spinner();  
	
	// Gather Data from args
	////////////////////////////////
	this.stopID = stopData.stopID;
	this.stopDescription = stopData.stopDescription;
	this.direction = stopData.direction;
	this.busRoutes = stopData.busRoutes;
	if (stopData.listIndex == undefined){
		this.listIndex = -1;
	}
	else {
		this.listIndex = stopData.listIndex;
	}
	this.xmlData;
	this.xmlDetourList;
}

DisplaystopAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	// Bus List
	////////////////////////////////
	
	
	this.busList = [];
	
	this.busListModel = {
		items:this.busList,
		listTitle: ''
	};
	
    this.ListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'displaystop/listcontainer',
		itemTemplate: 'displaystop/busListItem',
    };
	
	this.controller.setupWidget('bus-list', this.ListAttrs, this.busListModel);
	
	
	// Detour List
	////////////////////////////////
	
	this.detourList = [];
	
	this.detourListModel = {
		items:this.detourList,
		listTitle: 'Detours active:'
	};
	
    this.detourListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'displaystop/listcontainer',
		itemTemplate: 'displaystop/detourListItem',
    };
	
	this.controller.setupWidget('detour-list', this.detourListAttrs, this.detourListModel);
	

	// Refresh button
	////////////////////////////////
	
	this.reloadModel = {
    	label: "Refresh",
    	icon: "refresh",
	    command: "refreshStops"
    };                

    this.cmdMenuModel = {
        visible: true,
        items: [this.reloadModel, {}, {}]
    };

	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);

	// Spinner
	////////////////////////////////
	this.controller.setupWidget("busStopSpinner",
        this.spinnerAttributes = {
            spinnerSize: "small"
        },
        this.spinnerModel = {
            spinning: false
        }
    );
	
	
	// put out request for the bus stop data
	this.controller.get('has_scheduled_arrival').hide();
	
	this.getStopData();
	
	// Stage Activate and Deactivate Listeners
	//////////////////////////////////////////
	Mojo.Event.listen(this.controller.document, Mojo.Event.stageActivate, this.handleStageActivate.bind(this));
	Mojo.Event.listen(this.controller.document, Mojo.Event.stageDeactivate, this.handleStageDeactivate.bind(this));
	
};



DisplaystopAssistant.prototype.startTimers = function(){
	// clear the timers if either are active
	if (this.countDownTimer != "" || this.refreshTimer != ""){
		this.stopTimers();
	}
	if(this.controller.stageController.isActiveAndHasScenes()){
		Mojo.Log.info("********* Starting Timers");
		this.countDownTimer = setInterval(this.updateTimes.bind(this), Trimet.Timers.updateTime);
		this.refreshTimer = setInterval(this.getStopData.bind(this), Trimet.Timers.refreshTime);
	}
	else{
		Mojo.Log.info("******* Stage is not active; aborting startTimers().");
	}
}

DisplaystopAssistant.prototype.stopTimers = function(){
	if(this.countDownTimer != ""){
		clearInterval(this.countDownTimer);
		this.countDownTimer = "";
	}
	if (this.refreshTimer != ""){
		clearInterval(this.refreshTimer);
		this.refreshTimer = "";
	}
}

// Runs every time the window is put into focus
DisplaystopAssistant.prototype.handleStageActivate = function(){
	Mojo.Log.info("********** Stage Activated");
	this.getStopData();
}

// Runs every time the window is put out of focus
DisplaystopAssistant.prototype.handleStageDeactivate = function(){
	Mojo.Log.info("********** Stage Deactivate");
	this.stopTimers();
}

DisplaystopAssistant.prototype.updateBusList = function(isScheduled){
	this.controller.modelChanged(this.busListModel);
	
	// Display notice for scheduled stops
	if(isScheduled == true){
		$("has_scheduled_arrival").show();
	}
	else{
		$("has_scheduled_arrival").hide();
	}
}

DisplaystopAssistant.prototype.updateDetourList = function(){
	this.controller.modelChanged(this.detourListModel);
	Mojo.Log.info("********* detour list length: ", this.detourListModel.items.length);
	
	if (this.detourListModel.items.length > 0){
		$("detour-list").show();
	}
	else{
		$("detour-list").hide();
	}
}

DisplaystopAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'refreshStops':
			this.getStopData();
			break;
		}
	}
	
	if (event.type === Mojo.Event.back){
		Mojo.Log.info("********* Caught back gesture");
		//pop the current scene off the scene stack
		var stopData = {
			stopID: this.stopID, 
			description: this.description,
			direction: this.direction,
			busRoutes: this.busRoutes,
			listIndex: this.listIndex
		};
		
		this.controller.stageController.popScene(stopData);
	}
}

DisplaystopAssistant.prototype.getStopData = function() {
	Mojo.Log.info("******** Getting Stop Data");
	
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(Trimet.baseArrivalsUrl + this.stopID);
	}
	else{
		url = Trimet.baseArrivalsUrl + this.stopID;
	}
	
	
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotStopDataResults.bind(this),
		onFailure: this.failure.bind(this)
	});
	
	Mojo.Log.info("********* After ajax");
	
}

DisplaystopAssistant.prototype.getDetourData = function() {
	Mojo.Log.info("******** Getting Detour Data");
	
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(Trimet.baseDetoursUrl + this.busRoutes);
	}
	else{
		url = Trimet.baseDetoursUrl + this.busRoutes;
	}
	
	
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotDetourResults.bind(this),
		onFailure: this.failure.bind(this)
	});
	
}

DisplaystopAssistant.prototype.startSpinner = function(){
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	this.spinnerTracker.addUser();
}

DisplaystopAssistant.prototype.stopSpinner = function(){
	this.spinnerTracker.removeUser();
	
	if (this.spinnerTracker.hasNoUsers()){
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
}

/*
 * Called by Prototype when the request succeeds. Parse the XML response
 */
DisplaystopAssistant.prototype.gotStopDataResults = function(transport) {
	Mojo.Log.info("********** Got Results")
	// Clear out the bus list
	Trimet.Utility.clearList(this.busList);
	
	this.stopSpinner();
	
	this.xmlData = Trimet.getXML(transport);
	
	this.busStop = new BusStop(this.xmlData);
	
	$("stop-header").update(this.stopID + ': ' + this.busStop.getStopDescription());
	
	if (!Trimet.hasError(this.xmlData)){
		this.fillBusRouteList();
		this.fillBusList();
	}
	else{
		Trimet.showError(Trimet.getError(this.xmlData));
	}
	
	this.startTimers();
}

DisplaystopAssistant.prototype.gotDetourResults = function(transport) {
	Mojo.Log.info("********** Got Detour Results")
	// Clear out the detour list
	Trimet.Utility.clearList(this.detourList);
	
	this.stopSpinner();
	
	var xmlDetourData = Trimet.getXML(transport);
	this.xmlDetourList = Trimet.Detours.getDetours(xmlDetourData);
	
	this.fillDetourList();
}

DisplaystopAssistant.prototype.fillBusRouteList = function(){
	Trimet.Utility.clearList(this.busRoutes);
	
	var xmlBusList = this.xmlData.getElementsByTagName("arrival");
	
	for (var index = 0; index < xmlBusList.length; ++index) {
		var routeNumber = xmlBusList[index].getAttribute("route");
		
		if (this.busRoutes.lastIndexOf(routeNumber) < 0){
			this.busRoutes.push(routeNumber);
		}
	}
	this.busRoutes.sort();
}

DisplaystopAssistant.prototype.fillDetourList = function()
{
	for (var index = 0; index < this.xmlDetourList.length; ++index)
	{
		var detourDescription = this.xmlDetourList[index].getAttribute("desc");
		var xmlDetourRouteList = this.xmlDetourList[index].getElementsByTagName("route");
		var detourRoutes = [];
		
		for (var routeIndex = 0; routeIndex < xmlDetourRouteList.length; ++routeIndex){
			detourRoutes.push(xmlDetourRouteList[routeIndex].getAttribute("route"))
		}
		
		detourRoutes = Trimet.Utility.parseRouteList(detourRoutes);
		
		var detourListData = {
			detourRoutes: detourRoutes,
			detourDescription: detourDescription
		}
		
		this.detourListModel.items.push(detourListData);
	}
	//update list on screen
	this.updateDetourList();
}

DisplaystopAssistant.prototype.updateTimes = function(){
	Mojo.Log.info("******** Updating times");
	Trimet.Utility.clearList(this.busList);
	this.fillBusList();
};

DisplaystopAssistant.prototype.fillBusList = function(){
	
	var xmlBusList = this.busStop.getXmlBusList();
	var isScheduled = false;
	var hasDetour = false;
	
	
	for (var index = 0; index < xmlBusList.length; ++index)
	{
		var routeDescription = xmlBusList[index].getAttribute("shortSign");
		var routeNumber = xmlBusList[index].getAttribute("route");

		var arrivalTimeStyle = "";
		// set to invisible by default
		var detourStyle = "display:none";
		
		var arrivalTime = Trimet.Arrivals.getMinutesLeft(xmlBusList[index]);
		var scheduledtime = Trimet.Arrivals.getScheduledTime(xmlBusList[index]);

		if (Trimet.Arrivals.isArrivalScheduled(xmlBusList[index]) == true){
			isScheduled = true;
			arrivalTimeStyle = "color: red;";
		}
		
		if (Trimet.Detours.hasDetour(xmlBusList[index])){
			hasDetour = true;
			// no style means the div will be shown
			detourStyle = "";
		}
		
		var busListData = {
			routeDescription: routeDescription,
			routeNumber: routeNumber,
			arrivalTime: arrivalTime,
			scheduledTime: scheduledtime,
			arrivalTimeStyle: arrivalTimeStyle,
			detourStyle: detourStyle
		}
		
		this.busListModel.items.push(busListData);
	}
	
	this.busListModel.listTitle = this.busStop.getDirection();
	//update list on screen
	this.updateBusList(isScheduled);
	
	
	// So that the detour data is only grabbed once
	if (hasDetour == true && $("detour-list").style.display == "none"){
		this.getDetourData();
	}

};

/*
 * Called by Prototype when the request fails.
 */
DisplaystopAssistant.prototype.failure = function(transport) {
	/*
	 * Use the Prototype template object to generate a string from the return status.
	 */
	Mojo.Log.info("******** Ajax get failure");
	var template = new Template($L("Error: Status #{status} returned from Trimet xml request."));
	var message = template.evaluate(transport);
	
	/*
	 * Show an alert with the error.
	 */
	Trimet.showError(message);
	this.stopSpinner();
}


DisplaystopAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
	this.startTimers();

};

DisplaystopAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	  
	this.stopTimers();
};

DisplaystopAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.document, Mojo.Event.stageActivate, this.handleStageActivate.bind(this));
	Mojo.Event.stopListening(this.controller.document, Mojo.Event.stageDeactivate, this.handleStageActivate.bind(this));
};
