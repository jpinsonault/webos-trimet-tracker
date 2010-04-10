function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the stage is first created */
	
	/* for a simple application, the stage assistant's only task is to push the scene, making it
	   visible */
	  
	
	this.controller.pushScene("first");
};

StageAssistant.prototype.handleCommand = function (event) {
	this.controller=Mojo.Controller.stageController.activeScene();
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
			case 'do-help':
			this.controller.stageController.pushScene('help');
			break;
		}
	}
}