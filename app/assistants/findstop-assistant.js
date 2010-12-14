function FindstopAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	  
	  this.xmlRoutesData;
	  this.xmlStopsData;
	  
	// Spinner
	////////////////////////////////
	// Used to allow multiple ajax 
	// 	requests to use the same spinner
	////////////////////////////////
	this.spinnerTracker = new Trimet.Utility.Spinner();  
}

FindstopAssistant.prototype.setup = function() {
	// Menu
	////////////////////////////////
	appMenu.setupMenu(this);
	
	// Add Stop button
	////////////////////////////////

	this.cmdMenuModel = {
   		items: [
      		{label:'Choose Stop', command:'chooseStop'}
   		]
	};

	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.cmdMenuModel);
	
	
	// List Selectors
	////////////////////////////////
	
	// Route Selector
	this.routeList = [{value: '-1', label: "Choose a route"}];
	this.routeSelectorModel = {currentRoute: '-1'};
	this.routeSelectorAttrs = {
	
        choices: this.routeList,
        modelProperty:'currentRoute'
	}
 	
 	this.controller.setupWidget('route-selector', this.routeSelectorAttrs, this.routeSelectorModel);
	this.controller.listen('route-selector', Mojo.Event.propertyChange, this.onChooseRoute.bindAsEventListener(this));
	
	// Direction Selector
	
	this.directionList = [{value: '-1', label: "Choose a direction"}];
	this.directionSelectorModel = {currentDirection: '-1'};
	this.directionSelectorAttrs = {
		
        choices: this.directionList,
        modelProperty:'currentDirection'
	}
	
 	this.controller.setupWidget('direction-selector', this.directionSelectorAttrs, this.directionSelectorModel);
	this.controller.listen('direction-selector', Mojo.Event.propertyChange, this.onChooseDirection.bindAsEventListener(this));
	
	// Stop Selector
	this.stopList = [{value: '-1', label: "Choose a stop"}];
	this.stopSelectorModel = {currentStop: '-1'};
	this.stopSelectorAttrs = {
		
        choices: this.stopList,
        modelProperty:'currentStop'
	}
 	this.controller.setupWidget('stop-selector', this.stopSelectorAttrs, this.stopSelectorModel);
	this.controller.listen('stop-selector', Mojo.Event.propertyChange, this.onChooseStop.bindAsEventListener(this));
	

	// Spinner
	////////////////////////////////
	this.controller.setupWidget("find-stop-spinner",
        this.spinnerAttributes = {
            spinnerSize: "small"
        },
        this.spinnerModel = {
            spinning: false
        }
    );
	
	// Get Routes
	////////////////////////////////
	this.getRoutesData();
};

FindstopAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {	
		switch (event.command) {
			case 'chooseStop':
			this.handleChooseStopButton();
			break;
		}
	}
}

FindstopAssistant.prototype.getRoutesData = function(){
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(Trimet.baseRoutesUrl);
	}
	else{
		url = Trimet.baseRoutesUrl;
	}
	
	// Check for internet connection
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var ajaxOptions = {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotRoutesData.bind(this),
		onFailure: this.getFailure.bind(this)
	}
	
	var request = new Ajax.Request(url, ajaxOptions);
}

FindstopAssistant.prototype.getStopsData = function(){
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(Trimet.baseRoutesUrl + Trimet.endOfRoutesUrl + this.routeSelectorModel.currentRoute);
	}
	else{
		url = Trimet.baseRoutesUrl + Trimet.endOfRoutesUrl + this.routeSelectorModel.currentRoute;
	}
	
	// Check for internet connection
	Connection.testConnection(this);
	
	this.startSpinner();
	
	var ajaxOptions = {
		method: 'get',
		evalJSON: 'force', //to enforce parsing JSON if there is JSON response
		onComplete: this.gotStopsData.bind(this),
		onFailure: this.getFailure.bind(this)
	}
	
	var request = new Ajax.Request(url, ajaxOptions);
}

FindstopAssistant.prototype.gotRoutesData = function(transport) {
	
	this.xmlRoutesData = Trimet.getXML(transport);
	
	// deactivate the spinner
	this.stopSpinner();
	
	if (!Trimet.hasError(this.xmlRoutesData)){
		this.fillRouteSelector();
		$('route-selector-group').show();
	}
	else{
		Trimet.showError(this, Trimet.getError(this.xmlRoutesData));
	}
}

FindstopAssistant.prototype.gotStopsData = function(transport) {
	
	this.xmlStopsData = Trimet.getXML(transport);
	
	// deactivate the spinner
	this.stopSpinner();
	
	if (!Trimet.hasError(this.xmlStopsData)){
		this.fillDirectionSelector();
		$('direction-selector-group').show();
	}
	else{
		Trimet.showError(this, Trimet.getError(this.xmlStopsData));
	}
}

FindstopAssistant.prototype.getFailure = function(transport) {
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

FindstopAssistant.prototype.fillRouteSelector = function(){
	var xmlRouteList = this.xmlRoutesData.getElementsByTagName("route");
	
	for (var index = 0; index < xmlRouteList.length; ++index) {
		var route = xmlRouteList[index].getAttribute("route");
		
		var routeData = {
			value: route,
			label: xmlRouteList[index].getAttribute("desc")
		}
		this.routeList.push(routeData);
	}

	this.updateRouteSelector();


}

FindstopAssistant.prototype.fillDirectionSelector = function(){
	//reset the direction selector
	this.directionList.splice(1,this.directionList.length-1);
	this.directionSelectorModel.currentDirection = -1;
	
	var xmlDirectionList = this.xmlStopsData.getElementsByTagName("dir");
	
	
	for (var index = 0; index < xmlDirectionList.length; ++index) {
		var directionData = {
			value: xmlDirectionList[index].getAttribute("dir"),
			label: xmlDirectionList[index].getAttribute("desc")
		}
		
		this.directionList.push(directionData);
	}
	
	this.updateDirectionSelector();
	
}

FindstopAssistant.prototype.fillStopSelector = function(){
	//reset the direction selector
	this.stopList.splice(1,this.stopList.length-1);
	this.stopSelectorModel.currentStop = -1;
	
	var xmlDirectionList = this.xmlStopsData.getElementsByTagName("dir");
	
	for (var index = 0; index < xmlDirectionList.length; ++index) {
		if(xmlDirectionList[index].getAttribute("dir") == 
			this.directionSelectorModel.currentDirection){
			
			var xmlStopList = xmlDirectionList[index].getElementsByTagName("stop");
			
			for (var routeIndex = 0; routeIndex < xmlStopList.length; ++routeIndex){
				var stopData = {
					value: xmlStopList[routeIndex].getAttribute("locid"),
					label: xmlStopList[routeIndex].getAttribute("desc")
				}
				
				this.stopList.push(stopData);
			}
		}
	}
	
	this.updateStopSelector();
	
	
}

FindstopAssistant.prototype.updateRouteSelector = function(){
	Mojo.Log.info("*************Updating Route Selector");
	
	this.controller.modelChanged(this.routeSelectorModel);
}

FindstopAssistant.prototype.updateDirectionSelector = function(){
	Mojo.Log.info("*************Updating Direction Selector");
	
	this.controller.modelChanged(this.directionSelectorModel);
}

FindstopAssistant.prototype.updateStopSelector = function(){
	Mojo.Log.info("*************Updating Stop Selector");
	
	this.controller.modelChanged(this.stopSelectorModel);
}

FindstopAssistant.prototype.onChooseRoute = function(propertyChangeEvent){
	$("stop-selector-group").hide();
	// to do: disable choose stop button
	this.getStopsData(this.routeSelectorModel.currentRoute);
}

FindstopAssistant.prototype.onChooseDirection = function(propertyChangeEvent){
	this.fillStopSelector();
	$("stop-selector-group").show();
}

FindstopAssistant.prototype.onChooseStop = function(propertyChangeEvent){
	
}

FindstopAssistant.prototype.handleChooseStopButton = function(){
	if (this.stopSelectorModel.currentStop > 0){
		stopData = {
			stopID: this.stopSelectorModel.currentStop
		}
		
		this.controller.stageController.popScene(stopData);
	}
	else{
		Trimet.showError(this, "Please select a stop first.")
	}
	
}

FindstopAssistant.prototype.startSpinner = function(){
	this.spinnerModel.spinning = true;
	this.controller.modelChanged(this.spinnerModel);
	
	this.spinnerTracker.addUser();
}

FindstopAssistant.prototype.stopSpinner = function(){
	this.spinnerTracker.removeUser();
	
	if (this.spinnerTracker.hasNoUsers()){
		this.spinnerModel.spinning = false;
		this.controller.modelChanged(this.spinnerModel);
	}
}

FindstopAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

FindstopAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

FindstopAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
