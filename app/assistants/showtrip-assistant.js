function ShowtripAssistant(trimetTrip) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	this.trimetTrip = trimetTrip;
	
	this.stopElements = [];
}

ShowtripAssistant.prototype.setup = function() {
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	// Stop List
	////////////////////////////////
	this.tripList = [];
	this.tripListModel = {listTitle:$L(''), items:this.tripList};
	
    this.tripListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'showtrip/listcontainer',
		itemTemplate: 'showtrip/tripListItem',
		swipeToDelete: false,
        reorderable: false,
    };
	
    this.controller.setupWidget('trip-list', this.tripListAttrs, this.tripListModel);
	
	// Depart Option Radio
	////////////////////////////////
	
	this.optionsRadioAttributes = {
		choices: [
			{label : 'Option 1', value : 1},
			{label : 'Option 2', value : 2},
			{label : 'Option 3', value : 3}
		]
	}

	this.optionsRadioModel = {
		value : 1,
		disabled:false
	}
	this.controller.setupWidget('options-radio', this.optionsRadioAttributes,this.optionsRadioModel );
	
	// Listeners
	////////////////////////////////
	this.controller.listen('options-radio', Mojo.Event.propertyChange, this.onRadioChange.bind(this));
	this.onStopButtonTapHandler = this.onStopButtonTap.bindAsEventListener(this);
	
	// Misc Setup
	////////////////////////////////
	this.fillItineraryDetails();
	
	this.fillTripList();
};

ShowtripAssistant.prototype.fillTripList = function() {
	//this.tripListModel.startLocation = this.trimetTrip.getStartLocation();
	//this.tripListModel.endLocation = this.trimetTrip.getEndLocation();
	
	this.tripListModel.items = this.trimetTrip.getDirectionsList();
	
	this.controller.modelChanged(this.tripListModel);
};

ShowtripAssistant.prototype.fillItineraryDetails = function() {
	$("start-time").update(this.trimetTrip.getStartTime());
	$("end-time").update(this.trimetTrip.getEndTime());
	$("travel-time").update(this.trimetTrip.getDuration());
	$("transfers").update(this.trimetTrip.getTransfers());
	$("fare").update(this.trimetTrip.getAdultFare());
	$("walking-time").update(this.trimetTrip.getWalkingTime());
	$("waiting-time").update(this.trimetTrip.getWaitingTime());
};

ShowtripAssistant.prototype.onRadioChange = function(propertyChangeEvent) {
	this.cleanupStopListeners();
	this.trimetTrip.setItinerary(propertyChangeEvent.value);
	
	this.fillItineraryDetails();
	this.fillTripList();
	
	this.setupStopListeners();
};

ShowtripAssistant.prototype.cleanupStopListeners = function() {
	
	if(this.stopElements.length > 0){
		Mojo.Log.info("********* cleaning up stop listeners");
		for(var index = 0; index < this.stopElements.length; index++){
			this.controller.stopListening(this.stopElements[index], Mojo.Event.tap, this.onStopButtonTapHandler);
		}
		
		// clear the listener list
		this.stopElements = [];
	}
};

ShowtripAssistant.prototype.setupStopListeners = function() {
	this.cleanupStopListeners();
	
	Mojo.Log.info("********* Setting up stop listeners");

	for(var index = 0; index < this.tripListModel.items.length; index++){
		if (this.tripListModel.items[index].mode != "Walk") {
			var startStopElement = this.controller.get(this.tripListModel.items[index].startDivID);
			var endStopElement = this.controller.get(this.tripListModel.items[index].endDivID);
			
			this.stopElements.push(startStopElement, endStopElement);
			
			this.controller.listen(startStopElement, Mojo.Event.tap, this.onStopButtonTapHandler);
			this.controller.listen(endStopElement, Mojo.Event.tap, this.onStopButtonTapHandler);
		}
	}
};

ShowtripAssistant.prototype.onStopButtonTap = function(event) {
	this.controller.stageController.pushScene('displaystop', $(event.target.id).attributes.stopid.value);
};

ShowtripAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
	Mojo.Log.info("********* In Showtrip Activate");
	this.setupStopListeners();	
};

ShowtripAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

ShowtripAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	  
	this.controller.stopListening('options-radio', Mojo.Event.propertyChange, this.onRadioChange.bind(this));
};
