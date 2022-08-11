var helpJson=[
{"id": "i_0","parent": "#","text": "What this software do ?","type": "info"},
{"id": "hdi_0","parent": "#","text": "How do i ...","type": "howdoi","state": {"opened": true}},
{"id": "hdi_001","parent": "hdi_0","text": " .. start with it","type": "basic"} ,
/* Video Section */
{"id": "vid_0","parent": "#","text": "Videos","type": "videoroot"},
{"id": "vid_001","parent": "vid_0","text": "Official features video channel" , "type":"video"},
{"id": "vid_002","parent": "vid_0","text": "Cyberpunk 2077 Color and Material [MLSETUP BUILDER] Modding Tutorial 2022" , "type":"video"}
];

$(function(){
	var ModelOffcanvas = new bootstrap.Offcanvas(document.getElementById('ModelLibrary'));
	var HelpOffcanvas = new bootstrap.Offcanvas(document.getElementById('HowDoI'));

	var HelpLibrary = $('#HelpTree').jstree({
		'core' : {"themes": {"name": "default-dark","dots": true,"icons": true},
		'check_callback' : true,
		'data' : helpJson
		},
		'types' : {
				"info" : { "icon" : "text-info fa-solid fa-circle-info" },
				"howdoi" : { "icon" : "text-warning fa-solid fa-circle-question" },
				"basic" : {"icon" : "text-warning fa-solid fa-question"},
        "advanced" : { "icon" : "fa-solid fa-brain" },
				"videoroot" : {"icon" : "text-danger fa-solid fa-clapperboard"},
				"video" : {"icon" : "text-danger fa-solid fa-video"},
			},
			"plugins" : ["types" ]
	}).on('select_node.jstree',function(ev,node){
    HelpOffcanvas.hide();

		switch (node.node.id) {
			case 'vid_0':
				ev.preventDefault();
			break;
			case 'vid_001':
			case 'vid_002':
				thePIT.extMedia(node.node.id);
			break;
			case 'i_0':
				introJs().setOptions({
					tooltipClass: 'biggerTooltip',
					steps: [{
					    title: 'What this software do ?',
					    intro: 'The software is ment to help you creating .json files that can be compiled in .mlsetup format and assigned with everything that use the Cyberpunk 2077 multilayer systems'
					  },
						{
							title: 'Layer system',
					    element: document.querySelector('#layeringsystem'),
					    intro: 'The multilayer editor system does not need a model to be displayed in the viewport to work'
					  },
						{
							title: '3D viewport',
							element:document.querySelector('#thacanvas'),
							intro: 'It has a 3d viewport to load exported 3d models from the game. This is useful to acknowledge where the material you are editing goes on.'
						},
						{
							title: 'Model Library',
							element: document.querySelector('#modelsNavbar div.btn-group:nth-child(2)'),
							intro:'A searchable model library with simple icon that display the type of 3d model (man, woman or kid target models, car pieces, weapons ecc...)',
						},
						{
							title:'Import files',
							element:document.querySelector('#importTech'),
							intro:'From here you can import the json format of mlsetup file',
							position:'bottom'
						},
						{
							title:'Materials',
							element:document.querySelector('#materialChoser'),
							intro:'There is a material database that include every basic material the game use and automatically load value for normals, colors,metalness and roughness',
							position:'bottom'
						},
						{
							title:'Material colors',
							element: document.querySelector('#cagecolors'),
							intro:'There is a color picker with swatches created for the chosen materials',
							position:'left'
						},
						{
							title:'Microblends',
							element: document.querySelector('#mb-preview'),
							intro:'There is a microblend preview display, a gallery for them and a system to place them surgically on a model.<br/><strong>What are microblends ?</strong><br />Something like <u>stencil</u> that you use to apply materials',
							position:'left'
						},
						{
							title:'Microblend Aim System',
							element: document.querySelector('[data-bs-target="#AimBlend"]'),
							intro: 'Developed a visual system for microblend positioning over the current layer mlmasks, with that you can:<p>Move resize and syncro the edits to the offset of the current material</p>',
							position:'left'
						},
						{
							title:'Export and compile',
							element: document.querySelector('#exportversions'),
							intro: 'Export you edit to json format, and if you have configured the software, found your file compiled and ready to be used for a mod',
							position:'left'
						}
					]
				}).start()
				.onbeforechange(function(){
					//
				})
				.oncomplete	(function(){
					HelpOffcanvas.show();
				})
				.onexit(function(){
					HelpOffcanvas.show();
				});
				break;
			case 'hdi_001':
			introJs().setOptions({
				tooltipClass: 'biggerTooltip',
				steps: [{
						title: 'How do I start with it ?',
						intro: 'First things first, MlsetupBuilder need a repository of datas from the game, let\'s start configuring and building it'
					},
					{
							title: 'First requirements',
							intro: 'Before doing anything, you need to fulfill some requirements. Create a folder in a disk with at least 31GB of space. <span class="text-warning">It\'s Better if you use a folder name without spaces or strange characters</span>.'
					},
					{
							title: 'Secondary requirements',
							intro: 'To export datas from the game you need <span class="text-warning">Wolvenkit-CLI</span> software, somewhere in your system. Actually the versions from 1.5.2 work fine. <a class="text-warning" href="https://github.com/WolvenKit">Wolvenkit page on Github</a>'
					},
					{
						title:'Preferences',
						intro:'<img src="./images/system/prefs.jpg" />'/*,
						position:'bottom'*/
					},
					{
						title:'Preferences..',
						intro:'From the <span class="text-warning">File</span> Menu, select <span class="text-warning">Preferences</span>.<br />In the displayed windows you need to choose the folder you created in the <span class="badge bg-warning text-dark" >uncook folder</span> field AND select the <span class="badge bg-warning text-dark" >Wolvenkit-CLI executable</span> you wanna use to export the datas'/*,
						position:'bottom'*/
					},
					{
						title:'Save',
						intro:'Save the unsaved preferences and close the Preferences window'/*,
						position:'bottom'*/
					},
					{
						title:'Build the Repository',
						intro:'Back to the main window, you can select the operation to export the datas from the menu <span class="text-warning">Build > Repository</span>'/*,
						position:'bottom'*/
					},
					{
						title:'Build the Repository.',
						intro:' <img src="./images/system/repobuild.jpg" />'/*,
						position:'bottom'*/
					},
					{
						title:'Build the Repository.',
						intro:'<img src="./images/system/uncook.jpg" />'/*
						position:'bottom'*/
					},
					{
						title:'Build the Repository..',
						intro:'For the first time uncook, you just click the Uncook button on the bottom of the last displayed window and wait the execution of the software.'/*,
						position:'bottom'*/
					},
					{
						title:'Build the Repository...',
						intro:'If it complete without errors, you will see all the switch autoclosing and 3 double bars completed with a log of the operation done on the right that display mostly <span class="badge bg-success" >something done</span> lines.'/*,
						position:'bottom'*/
					},
					{
						title:'Build the Repository....',
						intro:'The building it\'s done, now let\'s generate the microblends thumbs preview for your interface. Close the repository building window.'/*,
						position:'bottom'*/
					},
					{
						title:'Generate the microblends preview',
						intro:'Go back to the <span class="badge bg-warning text-dark" >Build menu</span>, now select <span class="badge bg-warning text-dark" >Microblends</span>.'/*,
						position:'bottom'*/
					},
					{
						title:'Generate the microblends preview.',
						intro:'<img src="./images/system/blendbuild.jpg" />'/*
						position:'bottom'*/
					},
					{
						title:'Generate the microblends preview..',
						intro:'<img src="./images/system/mblends.jpg" />'/*
						position:'bottom'*/
					},
					{
						title:'Generate the microblends preview...',
						intro:'To get it done, Click on the <span class="badge bg-warning text-dark" >Start</span> button and wait for the operations to be completed, if anything go as intended, now you\'re ready to go. Close the window and to be sure, close and re-open MlsetupBuilder'/*,
						position:'bottom'*/
					},
					{
						title:'You\'ve done it, Cheers!',
						intro:'<span class="h1 d-block text-center">&#128525;</span>'/*,
						position:'bottom'*/
					}
					]
				}).start()
					.onbeforechange(function(){
						//
					})
					.oncomplete	(function(){
						HelpOffcanvas.show();
					})
					.onexit(function(){
						HelpOffcanvas.show();
					});
				break;
		}
	});
});
