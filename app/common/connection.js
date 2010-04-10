Connection = {};

Connection.testConnection = function(scene){
	Mojo.Log.info("*********Testing Internet Connection");
	scene.controller.serviceRequest('palm://com.palm.connectionmanager', {
     method: 'getstatus',
     parameters: {},
     onSuccess: Connection.ConnectionServiceSuccess.bind(this, scene),
     onFailure: function(response){}
 	});
};

Connection.ConnectionServiceSuccess = function(scene, response){
	
	if (response.isInternetConnectionAvailable == false) {
		scene.controller.showAlertDialog({
			onChoose: function(value){},
			title: $L("Error"),
			message: "No internet connection available.",
			choices: [{
				label: $L('OK'),
				value: 'ok',
				type: 'color'
			}]
		});
	}
};
	