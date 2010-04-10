 // Names
////////////////////////////////
Trimet = {};
Trimet.Arrivals = {};

 // Constants
////////////////////////////////
Trimet.baseUrl = 'http://developer.trimet.org/ws/V1/arrivals?appID=4830CC8DCF9D9BE9EB56D3256&locIDs=';


 // Trimet.Error
////////////////////////////////
Trimet.hasError = function (xmlData){
	hasError = (xmlData.getElementsByTagName("errorMessage").length > 0);
	Mojo.Log.info("*********** Has Error: ", hasError);
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
		scene.controller.showAlertDialog({
		    onChoose: function(value) {},
			title: $L("Error"),
			message: errorMessage,
			choices:[{label: $L('OK'), value:'ok', type:'color'}]
		});
};

 // Trimet.Error
////////////////////////////////
Trimet.Arrivals.convertToMinutes = function(unixArrivalTime){
	var date = new Date();
	unixCurrentTime =  date.getTime();
	unixArrivalTime = parseInt(unixArrivalTime);
		
	var arrivalTime = Math.round(((unixArrivalTime - unixCurrentTime)/1000)/60);
	Mojo.Log.info("*********** In convertToMinutes");
	// convert to string and return
	return (arrivalTime + '');
}

Trimet.Arrivals.isArrivalScheduled = function(xmlArrival){
	var isScheduled = (xmlArrival.getAttribute("status") == "scheduled");
	return isScheduled;
};

// Takes in a xml arrival and outputs the number of minutes left
Trimet.Arrivals.getArrivalTime = function(xmlArrival){
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