function TripPlanner(xmlTripData){
	this.xmlTripData = xmlTripData;

	this.currentItinerary = 1;
	
	if (!this.hasError()) {
		this.xmlItineraries = this.getItineraries();
		this.xmlTimeDistances = this.getTimeDistances();
		this.xmlFares = this.getFares();
	}
}


// Functions
////////////////////////////////
	
TripPlanner.prototype.hasError = function (){
	hasError = (this.xmlTripData.getElementsByTagName("response")[0].getAttribute("success") == "false");
	return hasError; 
};

TripPlanner.prototype.getError = function (){
	var error = this.xmlTripData.getElementsByTagName("message")[0].childNodes[0].nodeValue;
	Mojo.Log.info("********* Trip Error: ", error);
	return error;
};

TripPlanner.prototype.setItinerary = function (number){
	if (number > 0 && number <= this.xmlItineraries.childNodes.length){
		this.currentItinerary = number;
	}
	else{
		Mojo.Log.error("********* Tried to set current itinerary to invalid number: ", number);
	}
};

TripPlanner.prototype.getNumberOfItineraries = function(){
	return this.xmlItineraries.childNodes.length;
}

TripPlanner.prototype.getItineraries = function(){
	return this.xmlTripData.getElementsByTagName("itineraries")[0];
}

TripPlanner.prototype.getTimeDistances = function(){
	var xmlTimeDistances = [];
	
	// traverse the itineraries and get the first time-distance node for each
	for (var index = 0; index < this.xmlItineraries.childNodes.length; index++){
		xmlTimeDistances.push(this.xmlItineraries.childNodes[index].firstChild);
	}
	
	return xmlTimeDistances;
}

// Functions - Time and Distance
////////////////////////////////

TripPlanner.prototype.getFares = function(){
	var xmlFares = this.xmlTripData.getElementsByTagName("fare");
	
	return xmlFares;
}

TripPlanner.prototype.getStartTime = function(){
	var startTime = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("startTime")[0].firstChild.nodeValue;
	
	return startTime;
}

TripPlanner.prototype.getEndTime = function(){
	var endTime = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("endTime")[0].firstChild.nodeValue;
	
	return endTime;
}

TripPlanner.prototype.getDuration = function(){
	var duration = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("duration")[0].firstChild.nodeValue;
	
	return duration;
}

TripPlanner.prototype.getWaitingTime = function(){
	var xmlWaitingTime = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("waitingTime")[0];
	if (xmlWaitingTime != undefined){
		var waitingTime = xmlWaitingTime.firstChild.nodeValue;
	} 
	else {
		waitingTime = "0"
	}
	
	return waitingTime;
}

TripPlanner.prototype.getWalkingTime = function(){
	var xmlWalkingTime = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("walkingTime")[0];
	if (xmlWalkingTime != undefined){
		var walkingTime = xmlWalkingTime.firstChild.nodeValue;
	} 
	else {
		walkingTime = "0"
	}
	
	return walkingTime;
}

TripPlanner.prototype.getWaitingtime = function(){
	var waitingTime = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("waitingTime")[0].firstChild.nodeValue;
	
	return waitingTime;
}

TripPlanner.prototype.getWalkingTime = function(){
	var walkingTime = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("walkingTime")[0].firstChild.nodeValue;
	
	return walkingTime;
}

TripPlanner.prototype.getTransfers = function(){
	var transfers = this.xmlTimeDistances[this.currentItinerary-1].getElementsByTagName("numberOfTransfers")[0].firstChild.nodeValue;
	
	return transfers;
}

TripPlanner.prototype.getAdultFare = function(){
	var adultFare = this.xmlFares[this.currentItinerary-1].getElementsByTagName("regular")[0].firstChild.nodeValue;
	
	return adultFare;
}

/*TripPlanner.prototype.getStudentFare = function(itineraryNumber){
	var duration = this.xmlTimeDistances[itineraryNumber-1].getElementsByTagName("duration").firstChild.nodeValue;
	
	return duration;
}

TripPlanner.prototype.getHonoredFare = function(itineraryNumber){
	var duration = this.xmlTimeDistances[itineraryNumber-1].getElementsByTagName("duration").firstChild.nodeValue;
	
	return duration;
}*/

// Functions - Trip Directions
////////////////////////////////

TripPlanner.prototype.getStartLocation = function(){
	var xmlFrom = this.xmlTripData.getElementsByTagName("from")[0];
	return xmlFrom.getElementsByTagName("description")[0].firstChild.nodeValue;
}

TripPlanner.prototype.getEndLocation = function(){
	var xmlTo = this.xmlTripData.getElementsByTagName("to")[0];
	return xmlTo.getElementsByTagName("description")[0].firstChild.nodeValue;
}

TripPlanner.prototype.getStopIDList = function(){
	var stopIDList = [];
	var xmlItinerary = this.xmlItineraries.childNodes[this.currentItinerary-1];
	
	var xmlLegList = xmlItinerary.getElementsByTagName("leg");
	
	for (var index = 0; index < xmlLegList.length; index++) {
	
		var xmlLeg = xmlLegList[index];
		var xmlFrom = xmlLeg.getElementsByTagName("from")[0];
		var xmlTo = xmlLeg.getElementsByTagName("to")[0];
		
		if(xmlLeg.getAttribute("mode") != "Walk"){
			startStopID = xmlFrom.getElementsByTagName("stopId")[0].firstChild.nodeValue;
			endStopID = xmlTo.getElementsByTagName("stopId")[0].firstChild.nodeValue;
			
			stopIDList.push(startStopID);
			stopIDList.push(endStopID);
		}
	}
	
	return stopIDList;
}

TripPlanner.prototype.getDirectionsList = function(){
	var directionList = [];
	var xmlItinerary = this.xmlItineraries.childNodes[this.currentItinerary-1];
	
	var xmlLegList = xmlItinerary.getElementsByTagName("leg");
	
	var stopIDs = [];
	
	for(var index = 0; index < xmlLegList.length; index++){
		
		var xmlLeg = xmlLegList[index];
		
		xmlTimeDistance = xmlLeg.getElementsByTagName("time-distance")[0];
		xmlFrom = xmlLeg.getElementsByTagName("from")[0];
		xmlFromPos = xmlFrom.getElementsByTagName("pos")[0];
		xmlTo = xmlLeg.getElementsByTagName("to")[0];
		xmlToPos = xmlTo.getElementsByTagName("pos")[0];
		
		
		directionItemData = {
			mode: xmlLeg.getAttribute("mode"),
			order: xmlLeg.getAttribute("order"),
			startLocation: xmlFrom.getElementsByTagName("description")[0].firstChild.nodeValue,
			endLocation: xmlTo.getElementsByTagName("description")[0].firstChild.nodeValue,
			duration: xmlTimeDistance.getElementsByTagName("duration")[0].firstChild.nodeValue,
			distance: xmlTimeDistance.getElementsByTagName("distance")[0].firstChild.nodeValue,
			startTime: '',
			endTime: '',
			startStopID: '',
			endStopID: '',
			direction: '',
			routeDescription: '',
			startLat: xmlFromPos.getElementsByTagName("lat")[0].firstChild.nodeValue,
			startLon: xmlFromPos.getElementsByTagName("lon")[0].firstChild.nodeValue,
			endLat: xmlToPos.getElementsByTagName("lat")[0].firstChild.nodeValue,
			endLon: xmlToPos.getElementsByTagName("lon")[0].firstChild.nodeValue,
			walkModeStyle: "display:none;",
			transitModeStyle: "display:none;",
			walkModeStartStyle: "display:none;",
			startDivID: '',
			endDivID: ''
		};
		
		
		if(directionItemData.mode != "Walk"){
			var xmlRoute = xmlLeg.getElementsByTagName("route")[0];
			
			directionItemData.routeDescription = xmlRoute.getElementsByTagName("name")[0].firstChild.nodeValue;
			directionItemData.startTime = xmlTimeDistance.getElementsByTagName("startTime")[0].firstChild.nodeValue;
			directionItemData.endTime = xmlTimeDistance.getElementsByTagName("endTime")[0].firstChild.nodeValue;
			directionItemData.startStopID = xmlFrom.getElementsByTagName("stopId")[0].firstChild.nodeValue;
			directionItemData.endStopID = xmlTo.getElementsByTagName("stopId")[0].firstChild.nodeValue;
			
			directionItemData.startDivID = index + ".1";
			directionItemData.endDivID = index + ".2";
			
			directionItemData.transitModeStyle = '';
		}
		else{
			directionItemData.direction = this.parseDirection(xmlLeg.getElementsByTagName("direction")[0].firstChild.nodeValue) 
			directionItemData.walkModeStyle = '';
			
			if (directionItemData.order == "start"){
				directionItemData.walkModeStartStyle = '';
			}
		}
		
		directionList.push(directionItemData);
	}
	
	return directionList;
}

TripPlanner.prototype.parseDirection = function(direction){
	var directions = {
		"north": "North",
		"ne": "Northeast",
		"east": "East",
		"se": "Southeast",
		"south": "South",
		"sw": "Southwest",
		"west": "West",
		"nw": "Northwest",
	}
	
	return directions[direction];
}





