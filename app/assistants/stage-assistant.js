function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */
	
	/* for a simple application, the stage assistant's only task is to push the scene, making it
	   visible */
	  
	// Setup Depot
	///////////////////////////////
	// The depot has two keys: "stops", and "version"
	// "stops" holds all the stop-list data, "version" holds the version
	// the app had at last launch. Used to check if the app has updated itself
	///////////////////////////////
	TrimetTracker = {};
	var options = {
		name: "trimet_tracker_db", //Name used for the HTML5 database name. (required)
		replace: false // open an existing depot
	};
	
	TrimetTracker.stopListDepot = new Mojo.Depot(options, this.dbOpenOK.bind(this), this.dbOpenFail.bind(this));
	
	this.controller.pushScene("first");
};

StageAssistant.prototype.dbOpenOK = function() { 
    Mojo.Log.info("........","Database opened OK"); 
}; 

StageAssistant.prototype.dbOpenFail = function() { 
    Mojo.Log.info("........","Failed to open depot."); 
}; 

StageAssistant.prototype.handleCommand = function (event) {
	this.controller=Mojo.Controller.stageController.activeScene();
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			case 'do-help':
			this.controller.stageController.pushScene('help');
			break;
			case 'do-donate':
			this.controller.stageController.pushScene('donate');
			break;
		}
	}
}