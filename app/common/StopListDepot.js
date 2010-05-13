function TrimetTrackerDepot(xmlArrivalData){
	
	
	this.depot = new Mojo.Depot(options, this.dbOpenOK.bind(this), this.dbOpenFail.bind(this));
	
}

BusStop.prototype.dbOpenOK = function() { 
    Mojo.Log.info("........","Database opened OK"); 
	
	// Setup
	
	this.stopList = this.getStopList();
}; 

BusStop.prototype.dbOpenFail = function() { 
    Mojo.Log.info("........","Failed to open depot."); 
}; 