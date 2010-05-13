 // Names
////////////////////////////////
Trimet = {};
Trimet.Arrivals = {};
Trimet.Utility = {};
Trimet.Timers = {};
Trimet.Detours = {};

 // Constants
////////////////////////////////
Trimet.appID = "4830CC8DCF9D9BE9EB56D3256";
Trimet.baseArrivalsUrl = 'http://developer.trimet.org/ws/V1/arrivals?appID=' + Trimet.appID + '&locIDs=';
Trimet.baseDetoursUrl = 'http://developer.trimet.org/ws/V1/detours?appID=' + Trimet.appID + '&routes=';
Trimet.baseRoutesUrl = 'http://developer.trimet.org/ws/V1/routeConfig/appid/' + Trimet.appID ;
Trimet.endOfRoutesUrl = '/dir/true/stops/route/';
Trimet.baseTripPlannerUrl = 'http://developer.trimet.org/ws/V1/trips/tripplanner/appid/' + Trimet.appID;
Trimet.daysOfWeek = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");

Trimet.NonBusRoutes = {
	"100": "Blue", 
	"90": "Red",
	"200": "Green",
	"190": "Yellow",
	"203": "WES"
}

// 30 seconds
Trimet.Timers.refreshTime = 30000;
// 5 seconds
Trimet.Timers.updateTime = 5000;

 // Trimet.Utility
////////////////////////////////
Trimet.Utility.clearList = function(list){
	if(list.length > 0){
		list.splice(0,list.length);	
	}
}

Trimet.Utility.parseRouteList = function(routeList){
	list = [];
	var newList = routeList;
	
	for (var index = 0; index < newList.length; ++index){
		if(Trimet.Utility.isNonBusRoute(newList[index])){
			newList[index] = Trimet.NonBusRoutes[newList[index]];
		}
	}
	return routeList.join(", ");
}

Trimet.Utility.isNonBusRoute = function(stopID){
	if(Trimet.NonBusRoutes.hasOwnProperty(stopID)){
		return true;
	}
	else{
		return false;
	} 
}

Trimet.Utility.encodeUrl = function(tripParameters){
	// http://developer.trimet.org/ws/V1/trips/tripplanner/maxIntineraries/6/format/xml/fromplace/
	// pdx/toplace/zoo/date/9-9-2009/time/2:00%20PM/arr/D/min/T/walk/0.50/mode/A/appId/YourAppIdHere
	
	var am = "am";
	var hours = tripParameters.time.getHours();
	var minutes = tripParameters.time.getMinutes();
	
	if (hours >= 12){
		am = "pm";
		
		if (hours > 12){
			hours = hours - 12;
		}
	}
	
	var time = hours + ":" + minutes + " " + am;
	
	var month = tripParameters.date.getMonth() + 1;
	var day = tripParameters.date.getDate();
	var year = tripParameters.date.getFullYear();
	
	var date = month + "-" + day + "-" + year;
	
	var url = Trimet.baseTripPlannerUrl + '/fromplace/' + tripParameters.fromPlace +
		'/toplace/' + tripParameters.toPlace + '/arr/' + tripParameters.arr +
		'/min/' + tripParameters.min + '/mode/' + tripParameters.mode +
		'/time/' + time + '/date/' + date;
		
	return url;
}

// Spinner 
////////////////////////////////
Trimet.Utility.Spinner = function() {
	this.users = 0;
	
	this.addUser = function(){
		this.users++;
	}
	this.removeUser = function(){
		if(this.users > 0){
			this.users--;
		}
	}
	
	this.hasNoUsers = function(){
		return this.users == 0;
	}
};


 // Trimet.Error
////////////////////////////////
Trimet.hasError = function (xmlData){
	hasError = (xmlData.getElementsByTagName("errorMessage").length > 0);
	return hasError; 
}

Trimet.getError = function (xmlData){
	return xmlData.getElementsByTagName("errorMessage")[0].childNodes[0].nodeValue;
};

Trimet.getXML = function (transport) {
	// Use responseText, not responseXML!! try: reponseJSON 
	var xmlString = transport.responseText;	

	// Convert the string to an XML object
	var xmlData = (new DOMParser()).parseFromString(xmlString, "text/xml");
	
	return xmlData;
}

Trimet.showError = function(scene, errorMessage){
	Mojo.Log.info("********* Error Dialog: ", errorMessage);
	scene.controller.showAlertDialog({
	    onChoose: function(value) {},
		title: $L("Error"),
		message: errorMessage,
		choices:[{label: $L('OK'), value:'ok', type:'color'}]
	});
};

 // Trimet.Arrivals
////////////////////////////////
Trimet.Arrivals.convertToMinutes = function(unixArrivalTime){
	var date = new Date();
	unixCurrentTime =  date.getTime();
	unixArrivalTime = parseInt(unixArrivalTime);
		
	var arrivalTime = Math.round(((unixArrivalTime - unixCurrentTime)/1000)/60);
	// convert to string and return
	return (arrivalTime + '');
}

Trimet.Arrivals.isArrivalScheduled = function(xmlArrival){
	var isScheduled = (xmlArrival.getAttribute("status") == "scheduled");
	return isScheduled;
};

// Takes in a xml arrival and outputs the number of minutes left
Trimet.Arrivals.getMinutesLeft = function(xmlArrival){
	var unixArrivalTime;
	if (this.isArrivalScheduled(xmlArrival) == true){
		unixArrivalTime = xmlArrival.getAttribute("scheduled");
	}
	else{
		unixArrivalTime = xmlArrival.getAttribute("estimated");
	}
	
	var arrivalTime = Trimet.Arrivals.convertToMinutes(unixArrivalTime);
	
	return arrivalTime;
};

Trimet.Arrivals.getScheduledTime = function(xmlArrival){
	var scheduledArrivalTime = xmlArrival.getAttribute("scheduled");
	
	var arrivalTime = new Date();
	var now = new Date();
	
	arrivalTime.setTime(scheduledArrivalTime);
	
	var arrivalString = arrivalTime.toLocaleTimeString();
	arrivalString = Trimet.Arrivals.stripSeconds(arrivalString);
	
	if (arrivalTime.getDay() != now.getDay()){
		arrivalString += ", " + Trimet.daysOfWeek[arrivalTime.getDay()];
	} 
	
	return arrivalString;
}

Trimet.Arrivals.stripSeconds = function(timeString){
	return timeString.substring(0, timeString.length - 3);
}

 // Trimet.Detours
////////////////////////////////

Trimet.Detours.hasDetour = function(xmlArrival){
	return xmlArrival.getAttribute("detour") == "true";
}

Trimet.Detours.getDetours = function(xmlData){
	return xmlData.getElementsByTagName("detour");
}