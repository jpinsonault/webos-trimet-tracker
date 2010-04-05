function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	  
	 // Setup Depot
	////////////////////////////////
	// The depot only has one key: "stops", a list of stop ID and Description pairs
	///////////////////////////////
	var options = {
		name: "trimet_tracker_db", //Name used for the HTML5 database name. (required)
		replace: false // open an existing depot
	};
	
	this.stopListDepot = new Mojo.Depot(options, this.dbOpenOK.bind(this), this.dbOpenFail.bind(this));
}

FirstAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
        
	 // Add Stop Button
	////////////////////////////////
	this.controller.setupWidget('addStopButton', {}, {buttonLabel: 'Add Stop'});
	
	 // Stop List
	////////////////////////////////
	this.stopList = [];
	this.listModel = {listTitle:$L('My List'), items:this.stopList};
	
    this.ListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'first/listcontainer',
		itemTemplate: 'first/listItem',
		swipeToDelete: true,
        reorderable: true,

    };
	
    this.controller.setupWidget('stop_list', this.ListAttrs, this.listModel);		
	this.listWidget = $('stop_list');
	
	//populate the list from file
	this.askForStopList();
	
	 // Setup Listeners
	////////////////////////////////
	Mojo.Event.listen($('addStopButton'),Mojo.Event.tap, this.handleAddStopButtonPress.bind(this));
	Mojo.Event.listen($('stop_list'), Mojo.Event.listTap, this.listClickHandler.bind(this));
	Mojo.Event.listen($('stop_list'), Mojo.Event.listDelete, this.listDeleteHandler.bind(this));
	Mojo.Event.listen($('stop_list'), Mojo.Event.listReorder, this.listReorderHandler.bind(this));
};

FirstAssistant.prototype.listDeleteHandler = function(event){
	// Remove the item and re-save the depot
	this.stopList.splice(event.index,1);
	this.stopListDepot.add("stops", this.stopList, this.depotAddSuccess.bind(this), this.depotAddFailure.bind(this))
}

FirstAssistant.prototype.listReorderHandler = function(event){
	// Move the stop around and save the depot
	this.stopList.splice(this.stopList.indexOf(event.item), 1);
	this.stopList.splice(event.toIndex, 0, event.item);
	this.stopListDepot.add("stops", this.stopList, this.depotAddSuccess.bind(this), this.depotAddFailure.bind(this))
}

FirstAssistant.prototype.askForStopList = function(){
	// Get the stop list from the depot
	this.stopListDepot.simpleGet("stops", this.fillStopList.bind(this), this.depotGetFailure.bind(this));
};

FirstAssistant.prototype.fillStopList = function(stops){
	// Fills the stopList with the items from the depot
	if (stops != null) {
		for (var index = 0; index < stops.length; ++index) {
			this.stopList.push.apply(this.stopList, [{
				stop_id: stops[index].stop_id,
				description: stops[index].description
			}]);
		}
		this.controller.modelChanged(this.listModel);
	}
	else {
		Mojo.Log.info("........", "List is empty")
	}
};

FirstAssistant.prototype.depotGetFailure = function(transaction, result){
	 Mojo.Log.info("........","Failed to get data from depot: ", result.message); 
}

FirstAssistant.prototype.dbOpenOK = function() { 
    Mojo.Log.info("........","Database opened OK"); 
}; 

FirstAssistant.prototype.dbOpenFail = function() { 
    Mojo.Log.info("........","Failed to open depot."); 
}; 


FirstAssistant.prototype.handleAddStopButtonPress = function(){
	// Add Stop: Push the add stop scene
	this.controller.stageController.pushScene('addstop');
}

FirstAssistant.prototype.listClickHandler = function(event){
	Mojo.Log.info("........", "in click handler"); 
	// Setup the data for the Display Stop Scene and push the scene
	var stopData = {
		stop_id: event.item.stop_id, 
		description: event.item.description
	};
	Mojo.Log.info("........", "before pushscene"); 
	
	this.controller.stageController.pushScene('displaystop', stopData); 
}

FirstAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	  
	if (event != undefined) {
		// Push the stop data from the Add Stop scene onto the stopList
		this.stopList.push.apply(this.stopList, [{stop_id:event.stop_id, description:event.description}]);
		this.controller.modelChanged(this.listModel);
		// Save the depot
		this.stopListDepot.add("stops", this.stopList, this.depotAddSuccess.bind(this), this.depotAddFailure.bind(this));
	}
};

FirstAssistant.prototype.depotAddSuccess = function(event) {
	Mojo.Log.info("........","Depot Add Success.");
};

FirstAssistant.prototype.depotAddFailure = function(transaction, result) {
	Mojo.Log.info("........","Depot Add Failure: ", result.message);
};

FirstAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	  
};

FirstAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening($('addStopButton'),Mojo.Event.tap, this.handleAddStopButtonPressBinder);
	Mojo.Event.stopListening($('stop_list'), Mojo.Event.listTap, this.listClickHandler);
	Mojo.Event.stopListening($('stop_list'), Mojo.Event.listDelete, this.listDeleteHandler.bind(this));
	Mojo.Event.stopListening($('stop_list'), Mojo.Event.listReorder, this.listReorderHandler.bind(this));
};
