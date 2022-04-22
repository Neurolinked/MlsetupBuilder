var helpJson=[
{"id": "i_0","parent": "#","text": "What this software do ?","type": "info"},
{"id": "hdi_0","parent": "#","text": "How do i ...","type": "howdoi","state": {"opened": true}},
{"id": "hdi_001","parent": "hdi_0","text": " .. start with it","type": "basic"},
{"id": "hdi_002","parent": "hdi_0","text": " .. import a style","type": "basic"},
{"id": "hdi_003","parent": "hdi_0","text": " .. apply my edits","type": "basic"},
{"id": "hdi_004","parent": "hdi_0","text": " .. save my work","type": "basic"},
{"id": "hdi_005","parent": "hdi_0","text": " .. display a model","type": "basic"}
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
			},
			"plugins" : ["types" ]
	}).on('select_node.jstree',function(ev,node){
    HelpOffcanvas.hide();

		switch (node.node.id) {
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
							element: document.querySelector('#modelsInformation div.btn-group:nth-child(2)'),
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
				break;
		}
	});
});
