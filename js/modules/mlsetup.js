/**
 * Layer Class
 * the default values are into square brackets
 * @class
 * @property {number} tiles					- number of tiles of the layer [1.0]
 * @property {number} material			- path of a material [full path of unused.mltemplate]
 * @property {number} opacity				- [1.0]
 * @property {string} color					- [null_null]
 * @property {string} normals				- [null]
 * @property {string} roughnessIn		- [null]
 * @property {string} roughnessOut	- [null]
 * @property {string} metalIn				- [null]
 * @property {string} metalOut			- [null]
 * @property {number} offsetU				- [0.0]
 * @property {number} offsetV				- [0.0]
 * @property {number} overrides			- [0]
 * @property {object} microblend
 * @property {string} microblend.file - path of a microblend [full path of default.xbm]
 * @property {number} microblend.tiles - [1.0]
 * @property {number} microblend.contrast - [0.0]
 * @property {number} microblend.normal 	- [1.0]
 * @property {object} microblend.offset
 * @property {number} microblend.offset.h 	- [0.0] orizzontal offset of the microblend
 * @property {number} microblend.offset.v 	- [0.0] vertical offset of the microblend
 */
class Layer {
	tiles = 1.0
	material = 'base\\surfaces\\materials\\special\\unused.mltemplate'
	opacity = 1.0
	color = 'null_null'
	normal = 'null'
	roughnessIn = 'null'
	roughnessOut = 'null'
	metalIn = 'null'
	metalOut = 'null'
	offsetU = 0.0
	offsetV = 0.0
	overrides = 'None'
	microblend = {
			file : 'base\\surfaces\\microblends\\default.xbm',
			tiles : 1.0,
			contrast : 0.0,
			normal : 1.0,
			offset : { h:0.0, v:0.0}
	}
	#disabled = false

	constructor(_tiles=1.0,_material='base\\surfaces\\materials\\special\\unused.mltemplate',_opacity=1.0,_color='null_null',_normal='null',_roughIn='null',_roughOut='null',_metalIn='null',_metalOut='null',_offsetU=0.0,_offsetV=0.0,_overrides='None',_mbFile='base\\surfaces\\microblends\\default.xbm',_mbTiles=1.0,_mbContrast=0.0,_mbNormal=1.0,_mbOffsetU=0.0,_mbOffsetV=0.0){
		this.tiles= parseFloat(_tiles);
		this.material = String(_material);
		this.opacity = parseFloat(_opacity)
		this.color = String(_color)
		this.normal = String(_normal)
		this.roughnessIn = String(_roughIn)
		this.roughnessOut = String(_roughIn)
		this.metalIn = String(_metalIn)
		this.metalOut = String(_metalOut)
		this.offsetU = parseFloat(_offsetU)
		this.offsetV = parseFloat(_offsetV)
		this.overrides = String(_overrides)
		this.microblend.file = String(_mbFile),
		this.microblend.tiles = parseFloat(_mbTiles),
		this.microblend.contrast = parseFloat(_mbContrast),
		this.microblend.normal = parseFloat(_mbNormal),
		this.microblend.offset.h = parseFloat(_mbOffsetU);
		this.microblend.offset.v = parseFloat(_mbOffsetV);
		this.#disabled = false
	}
	get disabled(){
		return this.#disabled;
	}
	set disabled(val=true){
		if (typeof(val)=="boolean"){
			this.#disabled = val;
		}
	}
}

/**
 * Creates a new Mlsetup.
 * @property {Array.<number>} version - version in 3 number notation
 * @property {number} ratio						- [1.0]
 * @property {boolean} normal					- [true]
 * @property {Array.<Layer>} Layers		- arrays of 20 Layer classes
 * @class
 */
class Mlsetup {
	version = [0,0,9]
	ratio = 1.0
	normal = true
	#file = '';

	/** @constructs */
	constructor(){
		this.Layers = []
		for (let i=0;i<20;i++){
			this.Layers.push(new Layer())
		}
	}

	/**
	 * Reset the chosen Layer to a default state
	 * @param {number} layer
	 */
	reset(layer=0){
		this.Layers[layer] = new Layer()
	}

	disable(size){
		for (let i=19;i>=(size-1);i--){
			if (this.Layers[i]!=undefined){
				this.Layers[i].disabled = true
			}
		}	
	}

	/**
	 * Swap two layers in the Mlsetup array stack
	 * @param {number} idSource
	 * @param {number} idDest
	 */
	swap(idSource , idDest){
		if (Number(idSource) && Number(idDest)){
			if (idSource!=idDest){
				let s = this.Layers[idSource]
				let d = this.Layers[idDest]
				this.Layers[idDest] = s
				this.Layers[idSource] = d
				return true
			}
			return false
		}else{
			return false
		}
	}

	/**
	 * Push an empty Layer in the Mlsetup array stack
	 */
	plug(){
		if (this.Layers.length<20){
			this.Layers.push(new Layer())
		}
	}

	/**
	 * Remove the last Layer in the array stack
	 */
	unplug(counted=1){
		if (this.Layers.length>0){
				this.Layers.splice(-1*counted,counted)
		}
	}

	/**
	 * Configure the version parameter of the MLsetup json object imported
	 * @param {object} jsonObject
	 */
	getVersion(jsonObject){
		if (typeof(jsonObject)=='object'){
			if (jsonObject.Header !== undefined){
					this.version = jsonObject.Header.WKitJsonVersion.split(".")
			}
			if (jsonObject.Chunks !== undefined){
				this.version = [0,0,0]
			}
		}
	}

	/**
	 * Translate the json object into a full mlsetup
	 * @param {object} mlsetupObject
	 */
	import(mlsetupObject){
		this.getVersion(mlsetupObject)
		var limit = 20
		var layeriteration = null
		var i = 0;
    	var testMinVersion = Number(this.version[2]);

		switch (true){
			case (testMinVersion>=2):
				this.#file = mlsetupObject.Header.ArchiveFileName
				//Iteration on mlsetupObject.Data.RootChunk.layers
				layeriteration = mlsetupObject.Data.RootChunk.layers;
				limit = mlsetupObject.Data.RootChunk.layers.length
				for (const [key, prop] of Object.entries(layeriteration)) {
					this.Layers[i].color=prop.colorScale;
					this.Layers[i].material=prop.material.DepotPath;
					this.Layers[i].tiles=prop?.matTile ? prop.matTile: 1;
					this.Layers[i].microblend.tiles = prop?.mbTile >=0 ? prop?.mbTile : 1.0
					this.Layers[i].metalIn=prop.metalLevelsIn
					this.Layers[i].metalOut = prop.metalLevelsOut
					this.Layers[i].microblend.file = prop.microblend.DepotPath
					this.Layers[i].microblend.contrast = prop.microblendContrast
					this.Layers[i].microblend.normal = prop.microblendNormalStrength
					this.Layers[i].microblend.offset.h = prop.microblendOffsetU
					this.Layers[i].microblend.offset.v = prop.microblendOffsetV
					this.Layers[i].normal = prop.normalStrength
					this.Layers[i].offsetU = prop.offsetU
					this.Layers[i].offsetV = prop.offsetV
					this.Layers[i].opacity = prop?.opacity!=undefined ? prop.opacity : 1
					this.Layers[i].overrides = prop.overrides
					this.Layers[i].roughnessIn = prop.roughLevelsIn
					this.Layers[i].roughnessOut = prop.roughLevelsOut
					i++
				}
				this.normal = mlsetupObject.Data.RootChunk.useNormal
				this.ratio = (mlsetupObject.Data.RootChunk?.ratio!=undefined) ? mlsetupObject.Data.RootChunk.ratio : 1.0;
				break;
			case (testMinVersion==1):
				//Iteration on mlsetupObject.Chunks.0.Properties.layers
				limit = mlsetupObject.Data.RootChunk.Properties.layers.length
				layeriteration = mlsetupObject.Data.RootChunk.Properties.layers;
				for (const [key, prop] of Object.entries(layeriteration)) {
					let thisLayer = prop.Properties
					this.Layers[i].color=thisLayer.colorScale;
					this.Layers[i].material=thisLayer.material.DepotPath;
					this.Layers[i].tiles=thisLayer?.matTile ? thisLayer.matTile : 1;
					this.Layers[i].microblend.tiles = thisLayer.mbTile
					this.Layers[i].metalIn=thisLayer.metalLevelsIn
					this.Layers[i].metalOut = thisLayer.metalLevelsOut
					this.Layers[i].microblend.file = thisLayer.microblend.DepotPath
					this.Layers[i].microblend.contrast = thisLayer.microblendContrast
					this.Layers[i].microblend.normal = thisLayer.microblendNormalStrength
					this.Layers[i].microblend.offset.h = thisLayer?.microblendOffsetU ? thisLayer.microblendOffsetU : 0
					this.Layers[i].microblend.offset.v = thisLayer?.microblendOffsetV ? thisLayer.microblendOffsetV : 0
					this.Layers[i].normal = thisLayer.normalStrength
					this.Layers[i].offsetU = thisLayer?.offsetU!=undefined ? thisLayer.offsetU : 0
					this.Layers[i].offsetV = thisLayer?.offsetV!=undefined ? thisLayer.offsetV : 0
					this.Layers[i].opacity = thisLayer?.opacity!=undefined ? thisLayer.opacity : 1
					this.Layers[i].overrides = thisLayer.overrides = 0
					this.Layers[i].roughnessIn = thisLayer.roughLevelsIn
					this.Layers[i].roughnessOut = thisLayer.roughLevelsOut
					i++
				}
				this.normal = true
				this.ratio = (mlsetupObject.Data.RootChunk.Properties.ratio!=undefined) ? mlsetupObject.Data.RootChunk.Properties.ratio : 1.0;
				break;
			default:
				limit = mlsetupObject.Chunks[0].Properties.layers.length
				layeriteration = mlsetupObject.Chunks[0].Properties.layers;
				for (const [key, prop] of Object.entries(layeriteration)) {
					this.Layers[i].color=prop.colorScale;
					this.Layers[i].material=prop.material;
					this.Layers[i].tiles=prop?.matTile ? prop.matTile : 1.0;
					this.Layers[i].microblend.tiles = prop.mbTile
					this.Layers[i].metalIn=prop.metalLevelsIn
					this.Layers[i].metalOut = prop.metalLevelsOut
					this.Layers[i].microblend.tiles = prop?.mbTile >=0 ? prop.mbTile : 1.0
					this.Layers[i].microblend.file = prop.microblend
					this.Layers[i].microblend.contrast = prop.microblendContrast
					this.Layers[i].microblend.normal = prop.microblendNormalStrength
					this.Layers[i].microblend.offset.h = prop?.microblendOffsetU ? prop.microblendOffsetU : 0
					this.Layers[i].microblend.offset.v = prop?.microblendOffsetV ? prop.microblendOffsetV : 0
					this.Layers[i].normal = prop.normalStrength
					this.Layers[i].offsetU = prop?.offsetU!=undefined ? prop.offsetU : 0
					this.Layers[i].offsetV = prop?.offsetV!=undefined ? prop.offsetU : 0
					this.Layers[i].opacity = prop?.opacity!=undefined ? prop.opacity : 1
					this.Layers[i].overrides = prop.overrides = 0
					this.Layers[i].roughnessIn = prop.roughLevelsIn
					this.Layers[i].roughnessOut = prop.roughLevelsOut
					i++
				}
				this.normal = true
				this.ratio = (mlsetupObject.Chunks[0].Properties?.ratio!=undefined) ? mlsetupObject.Chunks[0].Properties?.ratio : 1.0;
				break;
		}
		if (limit < 20){
      		this.unplug(20-limit)
		}
		//fix unusual mlsetups with more than 20 layers
		if (this.Layers.length>20){
			this.Layers.splice(19,this.Layers.length-20);
		}
	}

	export(file){
		//Export the actual mlsetup to last version Wolvenkit format
		var dummyObj = {
			"Header": {
				"WolvenKitVersion": "8.16.1",
				"WKitJsonVersion": "0.0.9",
				"GameVersion": 2200,
				"ExportedDateTime": "",
				"DataType": "CR2W",
				"ArchiveFileName": ""
			},
			"Data":{
				"Version": 195,
				"BuildVersion": 0,
				"RootChunk": {
					"$type": "Multilayer_Setup",
					"cookingPlatform": "PLATFORM_PC",
					"layers": [],
					"ratio": this.ratio,
					"useNormal": parseInt(this.normal)
				}
			}
		};
		for(var i=0;i<this.Layers.length;i++){
			let actuallayer = this.Layers[i]
			let layer = {
					"$type": "Multilayer_Layer",
					"colorScale": {
						"$type": "CName",
						"$storage": "string",
						"$value": actuallayer.color,
					},
					"material": {
						"DepotPath": {
						"$type": "ResourcePath",
						"$storage": "string",
						"$value": actuallayer.material
						},
						"Flags": "Default"
					},
					"matTile": actuallayer.tiles,
					"mbTile": actuallayer.microblend.tiles,
					"metalLevelsIn": {
						"$type": "CName",
						"$storage": "string",
						"$value": actuallayer.metalIn
					},
					"metalLevelsOut": {
						"$type": "CName",
						"$storage": "string",
						"$value": actuallayer.metalOut
					},
					"microblend": {
						"DepotPath": {
						"$type": "ResourcePath",
						"$storage": "string",
						"$value": actuallayer.microblend.file
						},
						"Flags": "Default"
					},
					"microblendContrast": actuallayer.microblend.contrast,
					"microblendNormalStrength": actuallayer.microblend.normal,
					"microblendOffsetU": actuallayer.microblend.offset.h,
          			"microblendOffsetV": actuallayer.microblend.offset.v,
					"normalStrength": {
						"$type": "CName",
						"$storage": "string",
						"$value": actuallayer.normal
					},
					"offsetU": actuallayer.offsetU,
					"offsetV": actuallayer.offsetV,
					"opacity": actuallayer.opacity,
					"overrides": {
						"$type": "CName",
						"$storage": "string",
						"$value": "None"
					},
					"roughLevelsIn": {
						"$type": "CName",
						"$storage": "string",
						"$value": actuallayer.roughnessIn
					},
					"roughLevelsOut": {
						"$type": "CName",
						"$storage": "string",
						"$value": actuallayer.roughnessOut
					}
				};
			dummyObj.Data.RootChunk.layers.push(layer);
		}
		return JSON.stringify(dummyObj,null,2);
	}

	getPath(){
		return this.#file;
	}
	getFile(){
		var filename = "";
		if (this.#file!=""){
			filename = String(this.#file).split("\\").reverse()[0].split(".")[0]
			console.log(filename)
		}else{
			return "commonlayer";
		}
		return filename;
	}
	//recheck all the format types 
	matchTypes(){
		console.log("not Now");
	}
	/**
	 * Translate the source string into a compiled version of the whole MLsetup.
	 * It replace from the source template, string to the parameters value from every Layer
	 * The source string need to have every text target property enclosed in braces
	 * example `{color}` will be replaced in the string by the color value for every layer
	 * The list of parameters are
	 * color - color for the layer
	 * material - material path
	 * material|short - just the material name
	 * tiles
	 * microTile - microblend tile
	 * opacity
	 * metalIn - metalLevelsIn
	 * metalOut - metalLevelsOut
	 * microblend - microblend path
	 * microblend|short - just the name of the microblend
	 * microContrast
	 * microOffH - microblend offset horizontal
	 * microOffV - microblend offset vertical
	 * normal
	 * offsetU - Layer offset horizontal
	 * offsetV - Layer offset vertical
	 * overrides
	 * roughnessIn - Roughness In
	 * roughnessOut - Roughness Out
	 * open - replaced with open if the layer opacity is different from 0
	 * @param {string} codetemplate
	 * @return {string}
	 */
	template(codetemplate){
		var generated =''
		var appoggio
		this.Layers.forEach((layer,key)=>{
			appoggio = codetemplate
			appoggio = appoggio.replaceAll('{color}',layer.color)
			appoggio = appoggio.replaceAll('{material}',layer.material)
			appoggio = appoggio.replaceAll('{material|short}',String(layer.material).split("\\").reverse()[0].split(".")[0])
			appoggio = appoggio.replaceAll('{tiles}',layer.tiles)
			appoggio = appoggio.replaceAll('{microTile}',layer.microblend.tiles)
			appoggio = appoggio.replaceAll('{opacity}',layer.opacity)
			appoggio = appoggio.replaceAll('{metalIn}',layer.metalIn)
			appoggio = appoggio.replaceAll('{metalOut}',layer.metalOut)
			appoggio = appoggio.replaceAll('{microblend}',layer.microblend.file)
			appoggio = appoggio.replaceAll('{microblend|short}',String(layer.microblend.file).split("\\").reverse()[0].split(".")[0])
			appoggio = appoggio.replaceAll('{microContrast}',layer.microblend.contrast)
			appoggio = appoggio.replaceAll('{microNormal}',layer.microblend.normal)
			appoggio = appoggio.replaceAll('{microOffH}',layer.microblend.offset.h)
			appoggio = appoggio.replaceAll('{microOffV}',layer.microblend.offset.v)
			appoggio = appoggio.replaceAll('{normal}',layer.normal)
			appoggio = appoggio.replaceAll('{offsetU}',layer.offsetU)
			appoggio = appoggio.replaceAll('{offsetV}',layer.offsetV)
			appoggio = appoggio.replaceAll('{overrides}',layer.overrides)
			appoggio = appoggio.replaceAll('{roughnessIn}',layer.roughnessIn)
			appoggio = appoggio.replaceAll('{roughnessOut}',layer.roughnessOut)
			if (layer.opacity==0){
				appoggio = appoggio.replaceAll('{open}',"")
			}else{
				appoggio = appoggio.replaceAll('{open}',"open")
			}
			generated += appoggio.replace("{i}",key)
		})
		return generated
	}

}
