appMenu = {};

appMenu.appMenuAttr = {omitDefaultItems: true};

appMenu.appMenuModel = {
	items: [
		Mojo.Menu.editItem,
		{label: "Help", command: 'do-help'}
	]
};

appMenu.setupMenu = function(scene){
	Mojo.Log.info("*********Setting up app menu");
	scene.controller.setupWidget(Mojo.Menu.appMenu, appMenu.appMenuAttr, appMenu.appMenuModel);
};
	