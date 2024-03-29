function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
}

FirstAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
        
	// Header Title
	////////////////////////////////
	$("first-header").update("Favorite Stops");
		
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	 
	// Add Stop button
	////////////////////////////////

	this.cmdMenuModel = {
   		items: [
      		{label:'Add Stop', command:'addStop', icon: 'new'},
			{label:'Trip Planner', command:'planTrip'}
   		]
	};

	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
	 // Stop List
	////////////////////////////////
	this.stopList = [];
	this.listModel = {items:this.stopList};
	
    this.ListAttrs = {
		renderLimit:20,
		lookahead: 15,
		listTemplate: 'first/listcontainer',
		itemTemplate: 'first/listItem',
		swipeToDelete: true,
        reorderable: true,

    };
	
    this.controller.setupWidget('stop_list', this.ListAttrs, this.listModel);		
	
	//populate the list from file
	Mojo.Log.info("********* About to ask for list");
	this.askForStopList();
	
	// Check if the app has been updated
	AppInfo.Depot.checkIfUpdated();
	
	 // Setup Listeners
	////////////////////////////////
	Mojo.Event.listen($('stop_list'), Mojo.Event.listTap, this.listClickHandler.bind(this));
	Mojo.Event.listen($('stop_list'), Mojo.Event.listDelete, this.listDeleteHandler.bind(this));
	Mojo.Event.listen($('stop_list'), Mojo.Event.listReorder, this.listReorderHandler.bind(this));
};

FirstAssistant.prototype.updateStopList = function(){
	Mojo.Log.info("*************Updating List");
	
	this.controller.modelChanged(this.listModel);
	
	
	// show or hide the empty list message
	if (this.listModel.items.length == 0){
		Mojo.Log.info("********* List empty");
		this.showEmptyListMessage();
	}
	else{
		this.hideEmptyListMessage();
	}

}

FirstAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'addStop':
			this.controller.stageController.pushScene('addstop');
			break;
			case 'planTrip':
			this.controller.stageController.pushScene('tripplanner');
			break;
		}
	}
}

FirstAssistant.prototype.listDeleteHandler = function(event){
	// Remove the item and re-save the depot
	this.listModel.items.splice(event.index,1);
	TrimetTracker.stopListDepot.add("stops", this.listModel.items, AppInfo.Depot.addSuccess.bind(this), AppInfo.Depot.addFailure.bind(this));
	this.updateStopList();
}

FirstAssistant.prototype.listReorderHandler = function(event){
	// Move the stop around and save the depot
	this.listModel.items.splice(this.listModel.items.indexOf(event.item), 1);
	this.listModel.items.splice(event.toIndex, 0, event.item);
	TrimetTracker.stopListDepot.add("stops", this.listModel.items, AppInfo.Depot.addSuccess.bind(this), AppInfo.Depot.addFailure.bind(this))
}

FirstAssistant.prototype.askForStopList = function(){
	// Get the stop list from the depot
	Mojo.Log.info("********* About to ask for list");
	TrimetTracker.stopListDepot.simpleGet("stops", this.fillStopList.bind(this), AppInfo.Depot.getFailure.bind(this));
	
};

FirstAssistant.prototype.fillStopList = function(stops){
	
	this.listModel.items = [];
	// Fills the stopList with the items from the depot
	
	if (stops == undefined){
		Mojo.Log.info("********* Stops undefined")
		stops = [];
	}
	
	for (var index = 0; index < stops.length; ++index) {
		
		// new to version 1.2.5
		if (stops[index].busRoutes == undefined){
			var busRoutes = []
		}
		else{
			
			var busRoutes = stops[index].busRoutes;
			var busRoutesString = Trimet.Utility.parseRouteList(busRoutes);
		}
		
		var stopData = {
			stop_id: stops[index].stop_id,
			description: stops[index].description,
			direction: stops[index].direction,
			busRoutes: busRoutes,
			busRoutesString: busRoutesString
		}
		
		this.listModel.items.push(stopData);
	}
	this.updateStopList();
};

FirstAssistant.prototype.showEmptyListMessage = function(){
	$("empty-list-message").show();
}

FirstAssistant.prototype.hideEmptyListMessage = function(){
	$("empty-list-message").hide();
}

FirstAssistant.prototype.handleAddStopButtonPress = function(){
	// Add Stop: Push the add stop scene
	this.controller.stageController.pushScene('addstop');
}

FirstAssistant.prototype.listClickHandler = function(event){
	Mojo.Log.info("........", "in click handler");
	// Setup the data for the Display Stop Scene and push the scene
	
	this.controller.stageController.pushScene('displaystop', event.item.stop_id);
}

FirstAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	
	this.askForStopList();
};

FirstAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	  
};

FirstAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening($('stop_list'), Mojo.Event.listTap, this.listClickHandler);
	Mojo.Event.stopListening($('stop_list'), Mojo.Event.listDelete, this.listDeleteHandler.bind(this));
	Mojo.Event.stopListening($('stop_list'), Mojo.Event.listReorder, this.listReorderHandler.bind(this));
};
