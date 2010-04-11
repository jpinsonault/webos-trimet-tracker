function DisplaystopAssistant(stopData) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	  
	// Gather Data from args
	////////////////////////////////
	this.stopID = stopData.stop_id;
	this.description = stopData.description;
	this.direction = stopData.direction;
	this.xmlData;
}

DisplaystopAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	
	$("stop_header").update(this.stopID + ": " + this.description);
	
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	// Bus List
	////////////////////////////////
	
	this.busList = [];
	
	this.listModel = {
		items:this.busList,
		listTitle: this.direction
	};
	
    this.ListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'displaystop/listcontainer',
		itemTemplate: 'displaystop/listItem',
    };
	
	this.controller.setupWidget('bus_list', this.ListAttrs, this.listModel);
	
	// Refresh button
	////////////////////////////////
	
	this.reloadModel = {
    	label: $L("Refresh"),
    	icon: "refresh",
	    command: "refreshStops"
    };
                        

    this.cmdMenuModel = {
        visible: true,
        items: [this.reloadModel, {}]
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
	this.getStopData(this.stopID);
	
	/* add event handlers to listen to events from widgets */
};

DisplaystopAssistant.prototype.updateBusList = function(isScheduled){
	this.controller.modelChanged(this.listModel);
	
	// Display notice for scheduled stops
	if(isScheduled == true){
		$("has_scheduled_arrival").show();
	}
	else{
		$("has_scheduled_arrival").hide();
	}
}

DisplaystopAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'refreshStops':
			// clear out the bus list
			this.busList.splice(0,this.busList.length);
	
			this.getStopData(this.stopID);
			break;
		}
	}
}

DisplaystopAssistant.prototype.getStopData = function() {
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(Trimet.baseUrl + this.stopID);
	}
	else{
		url = Trimet.baseUrl + this.stopID;
	}
	
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var request = new Ajax.Request(url, {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotResults.bind(this),
		onFailure: this.failure.bind(this)
	});
	
}

DisplaystopAssistant.prototype.startSpinner = function(){
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
}

DisplaystopAssistant.prototype.stopSpinner = function(){	
	this.spinnerModel.spinning = false;
	this.controller.modelChanged(this.spinnerModel);
}

/*
 * Called by Prototype when the request succeeds. Parse the XML response
 */
DisplaystopAssistant.prototype.gotResults = function(transport) {
	this.xmlData = Trimet.getXML(transport);
	
	if (!Trimet.hasError(this.xmlData)){
		this.fillBusList();
	}
	else{
		Trimet.showError(Trimet.getError(this.xmlData));
	}
}

DisplaystopAssistant.prototype.isStopIDValid = function(){
	return true;
	// TODO actually check
};

DisplaystopAssistant.prototype.fillBusList = function(){
	
	var xmlBusList = this.xmlData.getElementsByTagName("arrival");
	var isScheduled = false;
	
	for (var index = 0; index < xmlBusList.length; ++index)
	{
		var route = xmlBusList[index].getAttribute("shortSign");

		var style = "";
		
		var arrivalTime = Trimet.Arrivals.getMinutesLeft(xmlBusList[index]);
		var scheduledtime = Trimet.Arrivals.getScheduledTime(xmlBusList[index]);

		if (Trimet.Arrivals.isArrivalScheduled(xmlBusList[index]) == true){
			isScheduled = true;
			style = "color: red;";
		}
		
		var busListData = {
			route: route,
			arrival_time: arrivalTime,
			scheduled_time: scheduledtime,
			style: style
		}
		
		this.listModel.items.push(busListData);
	}
	//update list on screen
	this.updateBusList(isScheduled);
	
	this.stopSpinner();
	
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
}


DisplaystopAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

DisplaystopAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DisplaystopAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
