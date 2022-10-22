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
	overrides = 0
	microblend = {
			file : 'base\\surfaces\\microblends\\default.xbm',
			tiles : 1,
			contrast : 0.0,
			normal : 1.0,
			offset : { h:0.0, v:0.0}
	}
	
}

class Mlsetup {
	version = [0,0,3]
	ratio = 1.0
	normal = true

	constructor(){
		this.Layers = []
		for (let i=0;i<20;i++){
			this.Layers.push(new Layer())
		}
	}

	reset(layer=0){
		this.Layers[layer] = new Layer()
	}

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
	
	getVersion(jsonObject){
		if (typeof(jsonObject)=='object'){
			if (jsonObject.Header !== undefined){
					this.version = jsonObject.Header.WKitJsonVersion.split(".")
			}
			if (jsonObject.Chunks !== undefined){
				this.version = [0,0,1]
			}
		}
	}
	
	import(mlsetupObject){
		this.getVersion(mlsetupObject) //research for wolvenkit Json version
		var layeriteration = null
		var i = 0;
		
		switch (Number(this.version[2])){
			case 3:
			case 2:
				//Iteration on mlsetupObject.Data.RootChunk.layers
				layeriteration = mlsetupObject.Data.RootChunk.layers;
				for (const [key, prop] of Object.entries(layeriteration)) {
					this.Layers[i].color=prop.colorScale;
					this.Layers[i].material=prop.material.DepotPath;
					this.Layers[i].tiles=prop.matTile;
					this.Layers[i].microblend.tiles = prop.mbTile
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
          this.Layers[i].opacity = prop.opacity
          this.Layers[i].overrides = prop.overrides
          this.Layers[i].roughnessIn = prop.roughLevelsIn
          this.Layers[i].roughnessOut = prop.roughLevelsOut
					i++
				}
				this.normals = !!mlsetupObject.Data.RootChunk.usenormal
				this.ratio = mlsetupObject.Data.RootChunk.ratio
				break;
			case 1:
				//Iteration on mlsetupObject.Chunks.0.Properties.layers
				layeriteration = mlsetupObject.Chunks[0].Properties.layers;
				for (const [key, prop] of Object.entries(layeriteration)) {
					this.Layers[i].color=prop.colorScale;
					this.Layers[i].material=prop.material;
					this.Layers[i].tiles=prop?.matTile ? prop.matTile : 1;
					this.Layers[i].microblend.tiles = prop.mbTile
          this.Layers[i].metalIn=prop.metalLevelsIn
          this.Layers[i].metalOut = prop.metalLevelsOut
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
				this.normals = true
				this.ratio = mlsetupObject.Chunks[0].Properties.ratio
				break;
		}
	}
	
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
