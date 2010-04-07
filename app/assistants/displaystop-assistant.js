function DisplaystopAssistant(stopData) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	// 
	////////////////////////////////
	this.stopID = stopData.stop_id;
	this.description = stopData.description;
	this.direction = stopData.direction;
	this.xmlData;
	this.baseUrl = 'http://developer.trimet.org/ws/V1/arrivals?appID=4830CC8DCF9D9BE9EB56D3256&locIDs=';
}

DisplaystopAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	
	$("stop_header").update(this.stopID + ": " + this.description);
	
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
	Mojo.Log.info("********** About to update")
	
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

DisplaystopAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {
		if (event.command == "refreshStops") {
			
			// clear out the bus list
			this.busList.splice(0,this.busList.length);
	
			this.getStopData(this.stopID);
			return;
		}
	}
}

DisplaystopAssistant.prototype.getStopData = function() {
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(this.baseUrl + this.stopID);
	}
	else{
		url = this.baseUrl + this.stopID;
	}
	
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
	
	
	// Use responseText, not responseXML!! try: reponseJSON 
	var xmlstring = transport.responseText;	

	// Convert the string to an XML object
	this.xmlData = (new DOMParser()).parseFromString(xmlstring, "text/xml");
	
	if (this.isStopIDValid()){
		this.fillBusList();
	}
	else{
		//TODO: check XML data for error message
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
		var unixArrivalTime = this.getArrivalTime(xmlBusList[index]);
		var style = "";
		
		var arrivalTime = this.convertToMinutes(unixArrivalTime);
		
		if (this.isArrivalScheduled(xmlBusList[index]) == true){
			isScheduled = true;
			style = "color: red;";
		}
		
		this.busList.push.apply(this.busList, [{route: route, arrival_time: arrivalTime, style: style}]);
	}
	//update list on screen
	this.controller.modelChanged(this.listModel);
	
	this.stopSpinner();
	
	// Display notice for scheduled stops
	if(isScheduled == true){
		Mojo.Log.info("........","Has scheduled arrival");
		$("has_scheduled_arrival").show();
	}
	else{
		$("has_scheduled_arrival").hide();
	}
};

DisplaystopAssistant.prototype.getArrivalTime = function(xmlArrival){
	var arrivalTime;
	if (this.isArrivalScheduled(xmlArrival) == true){
		arrivalTime = xmlArrival.getAttribute("scheduled");
	}
	else{
		arrivalTime = xmlArrival.getAttribute("estimated");
	}
	return arrivalTime;
};

DisplaystopAssistant.prototype.isArrivalScheduled = function(xmlArrival){
	return (xmlArrival.getAttribute("status") == "scheduled");
};

DisplaystopAssistant.prototype.convertToMinutes = function(unixArrivalTime){
	
	var currentUnixTime = this.xmlData.getElementsByTagName("resultSet")[0].getAttribute("queryTime");

	currentUnixTime =  parseInt(currentUnixTime);	

	unixArrivalTime = parseInt(unixArrivalTime);
	
	var arrivaltime = Math.round(((unixArrivalTime - currentUnixTime)/1000)/60);
	
	// convert to string and return
	return (arrivaltime + '');
};

/*
 * Called by Prototype when the request fails.
 */
DisplaystopAssistant.prototype.failure = function(transport) {
	/*
	 * Use the Prototype template object to generate a string from the return status.
	 */
	var template = new Template($L("Error: Status #{status} returned from Trimet xml request."));
	var message = template.evaluate(transport);
	
	/*
	 * Show an alert with the error.
	 */
	this.controller.showAlertDialog({
	    onChoose: function(value) {},
		title: $L("Error"),
		message: message,
		choices:[
			{label: $L('OK'), value:'ok', type:'color'}    
		]
	});
}

DisplaystopAssistant.prototype.getBuses = function() {
	// TODO make this work
	this.busList.push.apply(this.busList, [{route: this.stopID, arrival_time: "32"}]);
	this.controller.modelChanged(this.listModel);
};

DisplaystopAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	//this.getBuses();
};

DisplaystopAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

DisplaystopAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
