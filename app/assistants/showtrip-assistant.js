function ShowtripAssistant(trimetTrip) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	this.trimetTrip = trimetTrip;
	
	this.stopListeners = [];
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
	
	if(this.stopListeners.length > 0){
		Mojo.Log.info("********* cleaning up stop listeners");
		for(var index = 0; index < this.stopListeners.length; index++){
			this.controller.stopListening(this.stopListeners[index], Mojo.Event.tap, this.onStopButtonTap.bind(this));
		}
		
		// clear the listener list
		this.stopListeners = [];
	}
};

ShowtripAssistant.prototype.setupStopListeners = function() {
	Mojo.Log.info("********* Setting up stop listeners");
	
	this.cleanupStopListeners();

	for(var index = 0; index < this.tripListModel.items.length; index++){
		if (this.tripListModel.items[index].mode != "Walk") {
			var startStopListener = this.controller.get(this.tripListModel.items[index].startDivID);
			var endStopListener = this.controller.get(this.tripListModel.items[index].endDivID);
			
			this.stopListeners.push(startStopListener, endStopListener);
			
			this.controller.listen(startStopListener, Mojo.Event.tap, this.onStopButtonTap.bind(this));
			this.controller.listen(endStopListener, Mojo.Event.tap, this.onStopButtonTap.bind(this));
		}
	}
};

ShowtripAssistant.prototype.onStopButtonTap = function(event) {
	Mojo.Log.info("********* stop:", $(event.target.id).attributes.stopid.value, event.type);
};

ShowtripAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
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
