function AddstopAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	this.items = [];
	this.xmlData;
	this.baseUrl = 'http://developer.trimet.org/ws/V1/arrivals?appID=4830CC8DCF9D9BE9EB56D3256&locIDs=';
}

AddstopAssistant.prototype.setup = function() {
	
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
	
	
	// Add Stop Button
	////////////////////////////////
	this.textFieldModel = {
       	value : "",
       	disabled : false
	};
	
	this.textFieldAttributes = {
		modifierState: 	Mojo.Widget.numLock,
		focusMode:		Mojo.Widget.focusSelectMode
	};
		
	this.controller.setupWidget('addStopTextField', this.textFieldAttributes, this.textFieldModel);

	// Listeners
	////////////////////////////////
	this.controller.listen('addStopSubmitButton', Mojo.Event.tap, this.handleAddStop.bind(this));
	this.controller.listen('lookupOnceButton', Mojo.Event.tap, this.handleLookupOnce.bind(this));
};

AddstopAssistant.prototype.getStopData = function(stopID, action) {
	if (Mojo.Host.current === Mojo.Host.mojoHost) {
		var url = '/proxy?url=' + encodeURIComponent(this.baseUrl + stopID);
	}
	else{
		url = this.baseUrl + stopID;
	}
	
	
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
	
	// Use responseText, not responseXML!! try: reponseJSON 
	var xmlString = transport.responseText;	

	// Convert the string to an XML object
	this.xmlData = (new DOMParser()).parseFromString(xmlString, "text/xml");
	
	// deactivate the spinner
	$('addStopSubmitButton').mojo.deactivate();
	$('lookupOnceButton').mojo.deactivate();

	if (this.isStopIDValid()){
		if(action == "add"){
			this.handlePop();
		}
		else{
			this.doLookupOnce();
		}
	}
	else{
		
		var errorMessage = this.xmlData.getElementsByTagName("errorMessage")[0].childNodes[0].nodeValue;
		this.controller.showAlertDialog({
		    onChoose: function(value) {},
			title: $L("Error"),
			message: errorMessage,
			choices:[{label: $L('OK'), value:'ok', type:'color'}]
		});
	}
}

/*
 * Called by Prototype when the request succeeds. Parse the XML response
 */
AddstopAssistant.prototype.gotLookupResults = function(transport) {
	
	// Use responseText, not responseXML!! try: reponseJSON 
	var xmlString = transport.responseText;	

	// Convert the string to an XML object
	this.xmlData = (new DOMParser()).parseFromString(xmlString, "text/xml");

	// deactivate the spinner
	$('lookupOnceButton').mojo.deactivate();

	if (this.isStopIDValid()){
		this.doLookupOnce();
	}
	else{
		var errorMessage = this.xmlData.getElementsByTagName("errorMessage")[0].childNodes[0].nodeValue;
		this.controller.showAlertDialog({
		    onChoose: function(value) {},
			title: $L("Error"),
			message: errorMessage,
			choices:[{label: $L('OK'), value:'ok', type:'color'}]
		});
	}
}

AddstopAssistant.prototype.isStopIDValid = function(transport){
	
	return this.xmlData.getElementsByTagName("errorMessage").length == 0;
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

AddstopAssistant.prototype.handleAddStop = function()
{
	this.getStopData(this.textFieldModel.value, "add");
}

AddstopAssistant.prototype.handleLookupOnce = function()
{
	this.getStopData(this.textFieldModel.value, "lookup");
}

AddstopAssistant.prototype.doLookupOnce = function(){
	var stopData = {
		stop_id: this.textFieldModel.value, 
		description: this.xmlData.getElementsByTagName("location")[0].getAttribute("desc")
	};
	this.controller.stageController.pushScene('displaystop', stopData);
}

AddstopAssistant.prototype.handlePop = function()
{
	//pop the current scene off the scene stack
	var stopData = {
		stop_id: this.textFieldModel.value, 
		description: this.xmlData.getElementsByTagName("location")[0].getAttribute("desc")
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
	   this.controller.stopListening('addStopSubmitButton', Mojo.Event.tap, this.handleAddStop.bind(this));
	   this.controller.stopListening('lookupOnceButton', Mojo.Event.tap, this.handleLookupOnce.bind(this));
};
