function BusStop(xmlArrivalData){
	this.xmlArrivalData = xmlArrivalData;
	
	if (!this.hasError()) {
		this.xmlBusList = this.getXmlBusList();
	}
}

// Functions
////////////////////////////////
	
BusStop.prototype.hasError = function (){
	hasError = (this.xmlArrivalData.getElementsByTagName("errorMessage").length > 0);
	return hasError; 
};

BusStop.prototype.getLength = function (){
	return this.xmlBusList.length; 
};


BusStop.prototype.getError = function (){
	return this.xmlArrivalData.getElementsByTagName("errorMessage")[0].childNodes[0].nodeValue;
};

BusStop.prototype.getXmlBusList = function(){
	return this.xmlArrivalData.getElementsByTagName("arrival");
}

BusStop.prototype.getStopDescription = function(){
	return this.xmlArrivalData.getElementsByTagName("location")[0].getAttribute("desc");
}

BusStop.prototype.getDirection = function(){
	return this.xmlArrivalData.getElementsByTagName("location")[0].getAttribute("dir")
}

BusStop.prototype.getBusRouteList = function(){

	if(this.busRouteList == undefined){
		this.busRouteList = [];
		
		for (var index = 0; index < this.xmlBusList.length; ++index) {
			var routeNumber = this.xmlBusList[index].getAttribute("route");
			
			if (this.busRouteList.lastIndexOf(routeNumber) < 0){
				this.busRouteList.push(routeNumber);
			}
		}
		
		this.busRouteList.sort();
	}
	
	return this.busRouteList;
}