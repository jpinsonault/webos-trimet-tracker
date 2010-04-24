function AddstopAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	this.items = [];
	this.xmlData;
	this.baseUrl = 'http://developer.trimet.org/ws/V1/arrivals?appID=4830CC8DCF9D9BE9EB56D3256&locIDs=';
	
	this.busRoutes = [];
}

AddstopAssistant.prototype.setup = function() {
	
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	// Command Menu Buttons
	////////////////////////////////

	this.addStopModel = {
    	label: $L("Add Stop"),
	    command: "addStop"
    };
	
	this.lookupButtonModel = {
    	label: $L("Look Up Once"),
	    command: "lookupOnce"
    };
	
	this.cmdMenuModel = {
        visible: true,
        items: [this.addStopModel, this.lookupButtonModel]
    };

	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
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
	this.submitButtonModel = {
		buttonLabel : 'Add Stop',
		buttonClass : '',
		disabled : false
	};
	
	this.controller.setupWidget('addStopSubmitButton', {type: Mojo.Widget.activityButton}, this.submitButtonModel);
	
	// Lookup Once Button
	////////////////////////////////
	this.lookupOnceButtonModel = {
		buttonLabel : 'Lookup Once',
		buttonClass : '',
		disabled : false
	};
	
	this.controller.setupWidget('lookupOnceButton', {type: Mojo.Widget.activityButton}, this.lookupOnceButtonModel);
	
	
	// Text Field
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
		
	this.controller.setupWidget('addStopTextField', this.textFieldAttributes, this.textFieldModel);

	// Listeners
	////////////////////////////////
	
};

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

AddstopAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'addStop':
			this.handleAddStopButton();
			break;
			
			case 'lookupOnce':
			this.handleLookupOnceButton();
			break;
		}
	}
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
	
	// deactivate the spinner
	this.stopSpinner();
	
	if (!Trimet.hasError(this.xmlData)){
		
		this.fillBusRouteList();
		
		switch (action) {
			case 'add':
			this.doAddStop();
			break;
			
			case 'lookup':
			this.doLookupOnce();
			break;
		}
	}
	else{
		Trimet.showError(this, Trimet.getError(this.xmlData));
	}
}

AddstopAssistant.prototype.fillBusRouteList = function(){
	
	var xmlBusList = this.xmlData.getElementsByTagName("arrival");
	
	for (var index = 0; index < xmlBusList.length; ++index) {
		var routeNumber = xmlBusList[index].getAttribute("route");
		
		if (this.busRoutes.lastIndexOf(routeNumber) < 0){
			this.busRoutes.push(routeNumber);
		}
	}
	this.busRoutes.sort();
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
	Trimet.showError(message);
}

AddstopAssistant.prototype.handleAddStopButton = function()
{
	this.getStopData(this.textFieldModel.value, "add");
}

AddstopAssistant.prototype.handleLookupOnceButton = function()
{
	this.getStopData(this.textFieldModel.value, "lookup");
}

AddstopAssistant.prototype.doLookupOnce = function(){
	var stopData = {
		stopID: this.textFieldModel.value, 
		stopDescription: this.xmlData.getElementsByTagName("location")[0].getAttribute("desc"),
		direction: this.xmlData.getElementsByTagName("location")[0].getAttribute("dir"),
		busRoutes: this.busRoutes,
		listIndex: -1
	};
	this.controller.stageController.pushScene('displaystop', stopData);
}

AddstopAssistant.prototype.doAddStop = function()
{
	//pop the current scene off the scene stack
	var stopData = {
		stopID: this.textFieldModel.value, 
		description: this.xmlData.getElementsByTagName("location")[0].getAttribute("desc"),
		direction: this.xmlData.getElementsByTagName("location")[0].getAttribute("dir"),
		busRoutes: this.busRoutes,
		listIndex: -1
	};	
	
	this.controller.stageController.popScene(stopData);

}

AddstopAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

AddstopAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	 
};

AddstopAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
