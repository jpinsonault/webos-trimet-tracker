AppInfo = {};
AppInfo.Depot = {};

AppInfo.authorEmail = "joe.pinsonault@gmail.com";
AppInfo.authorName = "Joe Pinsonault";
AppInfo.title = Mojo.appInfo.title;
AppInfo.donateUrl = 'https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=8EL3F6464FHPG&lc=US&item_name=Beagle%20Apps&item_number=1&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted';
AppInfo.blogUrl = 'http://beagleapps.wordpress.com/trimet-tracker/'
AppInfo.authorWebsite = "http://www.google.com/profiles/joe.pinsonault";
AppInfo.projectWebsite = "http://code.google.com/p/webos-trimet-tracker/";
AppInfo.version = Mojo.appInfo.version;
AppInfo.vendor = Mojo.appInfo.vendor;
AppInfo.copyright = '&copy; Copyright 2010 Joe Pinsonault';

// HTML string to display in the new-features dialog
AppInfo.newFeaturesHtml = Mojo.View.render({template: 'first/new-features'})

AppInfo.showNewFeatures = function(){
	
}

AppInfo.Depot.checkIfUpdated = function(){
	Mojo.Log.info("********* Checking version");
	TrimetTracker.stopListDepot.simpleGet("version", AppInfo.Depot.gotVersion.bind(this), AppInfo.Depot.getFailure.bind(this));
}

AppInfo.Depot.gotVersion = function(oldVersion){
	Mojo.Log.info("********* Old version: ", oldVersion, " Curent Version: ", AppInfo.version);
	if(oldVersion != AppInfo.version){
		Mojo.Log.info("********* Showing update dialog");
		AppInfo.Depot.setVersion();
		AppInfo.showNewFeatures();
	}
}

AppInfo.showNewFeatures = function(){
	var activeSceneController = Mojo.Controller.stageController.activeScene();
	
	activeSceneController.showAlertDialog({
		onChoose: function(value) {},
		title: $L("New Features"),
		message: AppInfo.newFeaturesHtml,
		choices:[{label: $L('OK'), value:'ok', type:'color'}],
		allowHTMLMessage: true
    });
}

AppInfo.Depot.setVersion = function(){
	Mojo.Log.info("********* Setting Version to: ", AppInfo.version);
	TrimetTracker.stopListDepot.add("version", AppInfo.version, AppInfo.Depot.addSuccess.bind(this), AppInfo.Depot.addFailure.bind(this));

}

AppInfo.Depot.getFailure = function(transaction, result){
	Mojo.Log.info("........","Failed to get data from depot: ", result.message); 
}

AppInfo.Depot.addSuccess = function(event) {
	Mojo.Log.info("........","Depot Add Success.");
};

AppInfo.Depot.addFailure = function(transaction, result) {
	Mojo.Log.info("........","Depot Add Failure: ", result.message);
};
