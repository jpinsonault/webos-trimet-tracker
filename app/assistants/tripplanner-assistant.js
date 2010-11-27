function TripplannerAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	// Spinner
	////////////////////////////////
	// Used to allow multiple ajax 
	// 	requests to use the same spinner
	////////////////////////////////
	this.spinnerTracker = new Trimet.Utility.Spinner();
}

TripplannerAssistant.prototype.setup = function() {
	
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	// Command Menu
	////////////////////////////////

	this.cmdMenuModel = {
   		items: [
      		{label:'Plan Trip', command:'planTrip'},
			{label:'Help', command:'help'},
			{label:'Reverse', command:'reverse'}
   		]
	};

	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
	// Spinner
	////////////////////////////////
	this.controller.setupWidget("tripplanner-spinner",
        this.spinnerAttributes = {
            spinnerSize: "small"
        },
        this.spinnerModel = {
            spinning: false
        }
    );
	
	// Date/Time pickers
	////////////////////////////////
	this.dateModel = {date : new Date()};
	this.controller.setupWidget('datepicker', {modelProperty:'date'}, this.dateModel);
	
	this.timeModel = {time : new Date()};
	this.controller.setupWidget('timepicker', {modelProperty:'time'}, this.timeModel);
	
	// To/from textfields
	////////////////////////////////
	// Start
	this.startTextFieldModel = {
       	value : "",
       	disabled : false
	};
	
	this.startTextFieldAttributes = {
		focusMode:		Mojo.Widget.focusSelectMode,
		hintText: "Start Location"
	};
		
	this.controller.setupWidget('start-textfield', this.startTextFieldAttributes, this.startTextFieldModel);

	// End
	this.endTextFieldModel = {
       	value : "",
       	disabled : false
	};
	
	this.endTextFieldAttributes = {
		hintText: "End Location"
	};
		
	this.controller.setupWidget('end-textfield', this.endTextFieldAttributes, this.endTextFieldModel);
	
	// Depart Option Radio
	////////////////////////////////
	
	this.departRadioAttributes = {
		choices: [
			{label : 'Depart After', value : 'D'},
			{label : 'Arrive By', value : 'A'},
		]
	}

	this.departRadioModel = {
		value : 'D',
		disabled:false
	}
	this.controller.setupWidget('depart-radio', this.departRadioAttributes,this.departRadioModel );
	
	// Get GPS Button
	////////////////////////////////
	
	this.gpsButtonAttributes = {
		type: Mojo.Widget.activityButton
	}
	this.gpsButtonModel = {
		buttonLabel: 'Get Current Location',
		buttonClass: 'affirmative',
		disabled: false
	}
	this.controller.setupWidget('get-gps-button', this.gpsButtonAttributes, this.gpsButtonModel);
	Mojo.Event.listen(this.controller.get('get-gps-button'),Mojo.Event.tap, this.onGpsButtonTap.bind(this));
	
};

TripplannerAssistant.prototype.getTripData = function(){
	
	var tripParameters = {
		fromPlace: this.startTextFieldModel.value,
		fromCoord: '',
		toPlace: this.endTextFieldModel.value,
		toCoord: '',
		date: this.dateModel.date,
		time: this.timeModel.time,
		min: 'T',
		arr: this.departRadioModel.value,
		mode: 'A'
	}
	
	var url = Trimet.Utility.encodeUrl(tripParameters);
	
	Mojo.Log.info("********* URL: ", url);
	
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		url = '/proxy?url=' + encodeURIComponent(url);
	}
	
	// Check for internet connection
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var ajaxOptions = {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotTripData.bind(this),
		onFailure: this.getFailure.bind(this)
	}
	
	var request = new Ajax.Request(url, ajaxOptions);
}

TripplannerAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'planTrip':
			this.getTripData();
			break;
			
			case 'help':
			this.controller.stageController.pushScene('tripplannerhelp'); 
			break;
			
			case 'reverse':
			this.reverseLocations();
			break;
		}
	}
}


TripplannerAssistant.prototype.onGpsButtonTap = function() {
	
	var request = this.controller.serviceRequest('palm://com.palm.location', {
		method:"getCurrentPosition",
		parameters: {
			accuracy: 1,
			responseTime: 2
		},
		onSuccess: this.gotGpsData.bind(this),
		onFailure: this.gpsFailure.bind(this)
	});
}

TripplannerAssistant.prototype.gotTripData = function(transport){
	this.xmlTripData = Trimet.getXML(transport);
	
	var trimetTrip = new TripPlanner(this.xmlTripData); 
	
	// deactivate the spinner
	this.stopSpinner();
	
	if (!trimetTrip.hasError()){
		this.controller.stageController.pushScene('showtrip', trimetTrip); 
	}
	else{
		Trimet.showError(this, trimetTrip.getError());
	}
}

TripplannerAssistant.prototype.gotGpsData = function(gpsData){
	Mojo.Log.info("********* Got GPS Data: " + gpsData.latitude +','+ gpsData.longitude);

	if(gpsData.errorCode == 0){
			this.controller.serviceRequest('palm://com.palm.location', {
			method:"getReverseLocation",
			parameters:{
				latitude: gpsData.latitude,
				longitude: gpsData.longitude
			},
			onSuccess: this.gotReverseGpsData.bind(this),
			onFailure: this.reverseGpsFailure.bind(this)
		});

	}
}

TripplannerAssistant.prototype.gotReverseGpsData = function(reverseGpsData){
	if (reverseGpsData.errorCode == 0) {
		Mojo.Log.info("********* Reverse GPS Data: ", reverseGpsData.address);
		
		var fullAddress = reverseGpsData.address;
		var shortAddress = fullAddress.split(";")[0];
		this.startTextFieldModel.value = shortAddress;
		
		this.controller.modelChanged(this.startTextFieldModel);
		$("get-gps-button").mojo.deactivate();
	}
}

TripplannerAssistant.prototype.gpsFailure = function(error){
	Mojo.Log.error("********* GPS Failure: ", error.errorCode);
	Trimet.showError(this, "GPS Error: " + error.errorCode);
}

TripplannerAssistant.prototype.reverseGpsFailure = function(error){
	Mojo.Log.info("********* Reverse GPS Failure: ", error.errorCode);
	Trimet.showError(this, "Reverse GPS Error: " + error.errorCode);
}

TripplannerAssistant.prototype.getFailure = function(transport) {
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

TripplannerAssistant.prototype.startSpinner = function(){
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	this.spinnerTracker.addUser();
}

TripplannerAssistant.prototype.stopSpinner = function(){
	this.spinnerTracker.removeUser();
	
	if (this.spinnerTracker.hasNoUsers()){
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
}

TripplannerAssistant.prototype.reverseLocations = function(){
	var temp = this.startTextFieldModel.value;
	this.startTextFieldModel.value = this.endTextFieldModel.value;
	this.endTextFieldModel.value = temp;
	this.controller.modelChanged(this.startTextFieldModel);
	this.controller.modelChanged(this.endTextFieldModel);
}

TripplannerAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

TripplannerAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

TripplannerAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('get-gps-button'),Mojo.Event.tap, this.onGpsButtonTap)
};
