function HelpAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

HelpAssistant.prototype.setup = function() {
	
	// Version/Vendor Info
	////////////////////////////////
	$("title").update("Help")
	$('app-info-title').update(AppInfo.title);
	$('app-description').update("Version: " + AppInfo.version + " by " + AppInfo.vendor);
	$('copyright').update(AppInfo.copyright);
	
	// Support/Credit Lists
	////////////////////////////////
	this.supportListModel = {
		listTitle: $L('Support:'),
		items: [
			{
				text: 'Send Email',
				detail: AppInfo.authorEmail,
				subject: "Support: "  + AppInfo.title,
				type:'email',
				subtitle: 'Feedback Also Appreciated',
				Class: 'img_email'
			},
			{
				text: 'Project Website',
				subtitle: 'Google Code Hosting',
				detail: AppInfo.projectWebsite,
				type: 'web',
				Class: 'img_web'
			}
		]
	};
	
	this.supportListAttrs = {
		itemTemplate:'help/listitem',
		listTemplate:'help/listcontainer',
		emptyTemplate:'help/emptylist',
		swipeToDelete: false
	};
	
	this.creditsListModel = {
		listTitle: $L('Credits:'),
		items: [
			{
				text: AppInfo.authorName,
				detail: AppInfo.authorWebsite,
				type:'web',
				subtitle: 'Google Profile',
				Class: 'img_web'
			}
		]
	};
	
	this.creditsListAttrs = {
		itemTemplate:'help/listitem',
		listTemplate:'help/listcontainer',
		emptyTemplate:'help/emptylist',
		swipeToDelete: false
	};
	
	this.controller.setupWidget('support-list', this.supportListAttrs, this.supportListModel);
	this.controller.setupWidget('credits-list', this.creditsListAttrs, this.creditsListModel);
	
	// Listeners
	////////////////////////////////
	Mojo.Event.listen(this.controller.get('support-list'),Mojo.Event.listTap,this.handleListTap.bind(this))
	Mojo.Event.listen(this.controller.get('credits-list'),Mojo.Event.listTap,this.handleListTap.bind(this))
};

HelpAssistant.prototype.handleListTap = function(event) {
	switch (event.item.type){
		case 'web':
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: "open",
			parameters:  {
				id: 'com.palm.app.browser',
				params: {
				target: event.item.detail
				}
			}
		});
		break;
		/////////////////////////////
		case 'email':
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
		    method:'open',
		    parameters:{ target: 'mailto:' + event.item.detail + "?subject="+event.item.subject}
		});	
		break;
	}
};

HelpAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

HelpAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

HelpAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('support-list'),Mojo.Event.listTap,this.handleListTap.bind(this))
	Mojo.Event.stopListening(this.controller.get('credits-list'),Mojo.Event.listTap,this.handleListTap.bind(this))
};
