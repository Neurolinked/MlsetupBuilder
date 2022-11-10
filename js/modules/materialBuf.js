class MaterialTemplate{
	Name = ''
	Data = Object()
	
	constructor(path, datas){
		if (typeof(datas)=='object'){
			this.Name = path
			this.Data = datas
		}else{
			this.Name = null
			Data = Object()
		}
	}
	
	cast(){
		let htmlbuildelement = ''
		let objprops = ''
		let limit
		for (const [property, value] of Object.entries(this.Data)) {
			switch (typeof(value)){
				case 'string':
				htmlbuildelement += `<div class="input-group input-group-sm">
						<div class="badge my-auto">${property}</div>
						<input type="text" class="form-control" data-field='${property}' default='${value}' value='${value}'>
					</div>`
					break
				case 'number':
				htmlbuildelement += `<div class="input-group input-group-sm">
						<div class="badge my-auto">${property}</div>
						<input type="number" class="form-control" data-field='${property}' default='${value}' value='${value}'>
					</div>`
					break
				case 'object':
					if (value!=null){
						objprops = ''
						for(const [key, val] of Object.entries(value)){
							limit = key.match(/^(Red|Green|Blue|Alpha)$/) ? [0,255] : ["",""]
							objprops += `<div class="badge my-auto">${key}</div>
							<input type="number" class="form-control" data-field='${property}.${key}' min="${limit[0]}" max="${limit[1]}" default='${val}' value='${val}'>`
						}
						if (Object.keys(value).includes('Alpha')){
								objprops += `<div data-link="${property}" class="showColor" style="background-color:rgba(${value.Red},${value.Green},${value.Blue},${value.Alpha});"> </div>`
						}
					htmlbuildelement +=`<div class="input-group input-group-sm flex-nowrap">
									<div class="badge my-auto">${property}</div>
									<div class="input-group input-group-sm flex-nowrap">${objprops}</div>
								</div>`
					}else{
						htmlbuildelement +=`<div class="input-group input-group-sm">
										<div class="badge my-auto">${property}</div>
										<input type="text" class="form-control" data-field='${property}' default='' value=''>
									</div>`						
					}
					break
				default:
					break
			}
		}
		return `<div data-built='BuildFromTemplate'>${htmlbuildelement}</div>`;
	}
}

class Material {
	Name = ''
	BaseMaterial = ''
	MaterialTemplate = ''
	Data = Object()
	
	constructor(name, base, template, datas){
		if (
			((typeof(name)=='string') && (name!="") ) &&
			((typeof(template)=='string') && (template.match(/.+\\.+/)) )
			){
				this.Name = name
				this.MaterialTemplate = template
				if ((typeof(base)=='string') && (template.match(/^.+\\.*$/))) {
					this.BaseMaterial = base
				}else{
					this.BaseMaterial = template
				}
				if (typeof(datas)=='object'){
					this.Data = datas
				}
		}else{
			return false
		}
	}
	
	Jsonic(){
		console.log(JSON.stringify(this,null,"  "))
		return `    {
      "Name": "${this.Name}",
      "BaseMaterial": "${this.BaseMaterial}",
      "MaterialTemplate": "${this.MaterialTemplate}",
			"Data":
    }`;
	}
}

class MaterialBuffer {
	MaterialRepo = '' //MaterialRepo
	Materials = [] //Materials
	TexturesList = [] //TexturesList
	MaterialTemplates = [] //MaterialTemplates
	
	constructor(depotPath = ''){
		depotPath +=''	//avoid getting a null an use it as a string
		this.MaterialRepo = depotPath
	}
	
	import(jsonContent = '{}' ){
		let mbDummy = {}
		try {
			mbDummy = JSON.parse(jsonContent)
			if ((mbDummy.hasOwnProperty("MaterialRepo")) &&
			 		(mbDummy.hasOwnProperty("Materials")) &&
					(mbDummy.hasOwnProperty("TexturesList")) &&
					(mbDummy.hasOwnProperty("MaterialTemplates")) ){	
						
					if  (mbDummy.Materials.length>0){
						 this.Materials = mbDummy.Materials
					}
					if  (mbDummy.TexturesList.length>0){
						 this.TexturesList = mbDummy.TexturesList
					}
					if  (mbDummy.MaterialTemplates.length>0){
						 this.MaterialTemplates = mbDummy.MaterialTemplates
					}
				return true;
			}else{
				return false;
			}
		}catch(error){
			return false;
		}
	}
	
	push(newMaterial){
		if (!(newMaterial instanceof Material)){
			return false
		}
		this.Materials.push(newMaterial)
	}
	
	pushTemplate(newTemplate){
		if (!(newTemplate instanceof MaterialTemplate)){
			return false
		}
		this.MaterialTemplates.push(newTemplate)
		this.#UpdateTextures()
		return true;
	}
	
	/* Searching and sorting */
	find(nameToFind,type='material'){
		if (type=='material'){
			return this.Materials.findIndex(mat => mat.Name==nameToFind)
		}else if(type=='template'){
			return this.MaterialTemplates.findIndex(mat => mat.Name==nameToFind)
		}
	}
	
	remove(index=NaN){
		if ((Number.isNaN(index)) || (index==null))  {
			return false
		}
		this.Materials.splice(index,1)
		this.#UpdateTextures() //relist the Textures
		this.#fixTemplates() //shut away the Templates unused
		return true
	}
	
	codeMaterial(index=NaN){
		let codeMaterial = ''
		if (Number.isNaN(index)){
			for (const [key, material] of Object.entries(this.Materials)) {
				codeMaterial += `<div class="mat_instance mb-1" ><details class="border outline-l1" >
						<summary data-type="${material.BaseMaterial}">${material.Name}</summary>
						${material.MaterialTemplate}
						<button type="button" class="mt-2 d-block btn btn-sm btn-danger btn-tiny sendtoTrash" data-materialIndex='${key}'><i class="fa-solid fa-trash"></i></button>
					</details><span class="d-block-inline bg-dark" ><span class="text-warning ps-1 pe-2 sendtoEdit " data-materialIndex='${key}'><i class="fa-solid fa-square-arrow-up-right"></i></span></span></div>`;
			}
		}else{
			codeMaterial = `<div class="mat_instance mb-1" ><details class="border outline-l1" >
					<summary data-type="${this.Materials[index].BaseMaterial}">${this.Materials[index].Name}</summary>
					${this.Materials[index].MaterialTemplate}
					<button type="button" class="mt-2 d-block btn btn-sm btn-danger btn-tiny sendtoTrash" data-materialIndex='${index}'><i class="fa-solid fa-trash"></i></button>
				</details><span class="d-block-inline bg-dark" ><span class="text-warning ps-1 pe-2 sendtoEdit " data-materialIndex='${index}'><i class="fa-solid fa-square-arrow-up-right"></i></span></span></div>`;
		}
		this.#UpdateTextures()
		return codeMaterial;
	}
	
	codeTextures(){
		if (this.TexturesList.length <= 0){ return "";} //No textures, no code
		let codetextures = ''
		this.TexturesList.forEach((texture) =>{
			codetextures += `<li class="list-group-item text-break">${texture}</li>`
		})
		return codetextures;
	}
	//Interface templating function
	codeTemplates(){
		if (this.MaterialTemplates.length <= 0){return "";} //No Templates, no code
		
		let codeTemplate =""
		
		this.MaterialTemplates.forEach((template, key) =>{
			codeTemplate += `<div class="card mb-1" >
					  <div class="row g-0 layer-3">
					    <div class="col-md-9 ">
					      <div class="card-body">
					        <h6 class="card-title txt-primary">${template.Name.split("\\").reverse()[0]}</h6>
					        <p class="card-text">${template.Name}</p>
					      </div>
					    </div>
							<div class="col-md-3 my-auto text-center">
								<button type="button" data-template-index='${key}' class="btn btn-sm btn-secondary"><i class="fa-solid fa-forward"></i></button>
							</div>
					  </div>
					</div>`;
		})
		return codeTemplate;
	}
	
	#fixTemplates(){
		let m = Array.from(new Set(this.Materials.map(m => m.MaterialTemplate))) //list of templates taken from materials
		let t = this.MaterialTemplates.map( t => t.Name ) //list of the actual templates
		let lostTemplate = t.filter( tem => !m.includes(tem) );
		let t_pos = this.MaterialTemplates.findIndex(tem => tem.Name==lostTemplate)
		if (t_pos>=0){
			this.MaterialTemplates.splice(t_pos,1)
		}
	}

	#UpdateTextures(){
		var TextureListed 
		this.MaterialTemplates.forEach((template,key)=>{
			TextureListed =new Set([...Object.values(template.Data).filter(el=>String(el).match(/^.+\.xbm$/))])
		})
		this.Materials.forEach((template,key)=>{
			TextureListed =new Set([...Object.values(template.Data).filter(el=>String(el).match(/^.+\.xbm$/)), ...TextureListed])
		})
		this.TexturesList = Array.from(TextureListed)
	}
	
}
