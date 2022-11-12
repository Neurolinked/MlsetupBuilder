const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
	'thePIT',
  {
		Done : (microcoords) =>{
			ipcRenderer.send('main:setMicroCoords',microcoords);
		}
	}
)

ipcRenderer.on('preload:configure', (event, configurations) => {
		fieldH = document.querySelector("#AimU") //Horizontal offset
		fieldV = document.querySelector("#AimV") //Vertical offset
		fieldT = document.querySelector("#AimMTile") //Microblend Tiles
		mblendVisual = document.querySelector("#theAimerOverlay")
		//get values
		fieldH.value = configurations.hasOwnProperty('horizontal') ? configurations.horizontal : 0.0
		fieldV.value = configurations.hasOwnProperty('vertical') ? configurations.vertical : 0.0
		fieldT.value = configurations.hasOwnProperty('tiles') ? configurations.tiles : 0.06
		//fire Updates

		//preparing the canvas
		let microblendRatio, microblendRatioVal
		microblendRatio = Number(fieldT.value)
		microblendRatioVal = (1/microblendRatio) * 1024;

		const ctx = document.getElementById('theAimer').getContext('2d');
		const img = new Image();   // Create new img element
		img.addEventListener('load', () => {
		// execute drawImage statements here
			ctx.drawImage(img, 0, 0,microblendRatioVal,microblendRatioVal);
		}, false);
		img.src = configurations.mask // configurations.microblend.replace("./","../");

		mblendVisual.style=`background-image:url("${configurations.microblend.replace("./","../")}");background-size:${microblendRatioVal}px;background-position:bottom ${(1024 - microblendRatioVal) +(microblendRatioVal* Number(fieldV.value))}px left ${-(Number(fieldH.value)*microblendRatioVal)}px;transform:scaleY(-1);`
		document.querySelector("#mblendImg").value = configurations.microblend.replace("./","../");
		//Dispatching events to display the right datas
		fieldT.dispatchEvent(new Event('input', {bubbles:true}));
		mblendVisual.dispatchEvent(new Event('setDefaults', {bubbles:true}));
})
