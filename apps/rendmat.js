$(function(){
	var configDepot
	var completeBuffer

	let pDepot = thePIT.ReadConfig('depot');

	pDepot.then((result)=>{
		configDepot = result
	}).catch((error) => {
    console.error(`Error after reading the configuration: ${error.message}`);
  })

	var materialBuffer = new MaterialBuffer(configDepot)

	var templateLibrary
	//__________________________________________________________________

	function LibTemplatesGen(){
		if (templateLibrary.hasOwnProperty('MaterialTemplates')){
			if (templateLibrary.MaterialTemplates.length > 0){
				let libraryCodeGenerator = ''
				for(const [key,template] of Object.entries(templateLibrary.MaterialTemplates)){
					libraryCodeGenerator +=`<div class="mb-2 layer-0 rounded border border-secondary" >
						<div class="templateStripes rounded-top p-1">
							<button type="button" data-templatecast-index='${key}' class="btn btn-micro btn-warning"><i class="fa-solid fa-backward"></i></button>
							<span class="badge bg-dark ">${template.Name.split("\\").reverse()[0]}</span>
							</div>
								<div class="p-1 fs-75 text-dark" >
									<details class="layer-0 text-light ">
										<summary class="layer-1 text-warning pb-1 text-break">${template.Name}</summary>
										&nbsp;${Object.keys(template.Data).join("<br/>&nbsp;")}
									</details>
								</div>
							</div>`;
				}
				return libraryCodeGenerator;
			}
		}else{
			return "";
		}
	}

	//__________________________________________________________________
	var lastMaterialTXT = '';
	var localmaterialBuffer = {}


	$("#materialImport").click(function(){
		$('#importfield').trigger('click');
	});

	$("body").on("click",".sendtoEdit",function(e){
		e.preventDefault();
		let identifier = Number($(this).attr('data-materialIndex'));//$(this).parent().parent().parent().index();
		$("body #Material div.mat_instance details").removeClass("active");
		$("body #Material div.mat_instance:nth-child("+(1+identifier)+") details").addClass("active");

		$("#Mat_S_name").val(materialBuffer.Materials[identifier].Name)
		$("#Mat_Base_S_name").val(materialBuffer.Materials[identifier].BaseMaterial)
		$("#Mat_Temp_S_name").val(materialBuffer.Materials[identifier].MaterialTemplate)

		var toCast = materialBuffer.MaterialTemplates.filter(el => el.Name==materialBuffer.Materials[identifier].MaterialTemplate)[0]
		let dummy = new MaterialTemplate(toCast.Name,toCast.Data)
		$("#Mat_Setup div.card-body").html(dummy.cast());
		for (const [prop,differ] of Object.entries(materialBuffer.Materials[identifier].Data)){
			switch (typeof(differ)){
				case 'object':
						if (differ!=null){
							for (const [nuid,realval] of Object.entries(differ)){
								$("div[data-built='BuildFromTemplate'] input[data-field='"+prop+"."+nuid+"']").val(realval).keyup().change();
							}
						}else{
							$("div[data-built='BuildFromTemplate'] input[data-field='"+prop+"']").val('null').keyup();
						}
					break;
				default:
						if (differ!=null){
							$("div[data-built='BuildFromTemplate'] input[data-field='"+prop+"']").val(differ).keyup();
						}else{
							$("div[data-built='BuildFromTemplate'] input[data-field='"+prop+"']").val('null').keyup();
						}
					break;
			}
		}
		//console.log(toCast);
		//Cast the template
		//Apply the values
		//$("#Mat_S_name").val($("body #Material details:nth-child("+($(this).index()+1)+") summary").text());
	}).on("loadMaterial",function(e){
		try{
			if (isValidJSON(e.detail.content)){
				UItranslateMaterial(e.detail.content);
			}else{
				throw new Error("Invalid format");
			}
		}catch(error){
			console.error(error);
		}
	});

	$("#MatCFiltering").keyup(function(){
		if ($("#MatCFiltering")==""){
			$("#bodyLibrary > div").removeClass("d-none");
			return
		}
		if (templateLibrary?.MaterialTemplates.length > 0){
			let onoffmaterial = templateLibrary.MaterialTemplates.map(el => el.Name.split("\\").reverse()[0].includes($("#MatCFiltering").val()))
			for (const [index, element] of onoffmaterial.entries()) {
				console.log(index, element);
				if (element){
					$("#bodyLibrary > div").eq(index).removeClass("d-none")
				}else{
					$("#bodyLibrary > div").eq(index).addClass("d-none")
				}
			}
		}
	});

	$("#MatCFiltering").on("search",function(){
		$("#bodyLibrary > div").removeClass("d-none");
	})

	$("body").on("click",".sendtoTrash",function(e){
		materialBuffer.remove(Number($(this).attr("data-materialindex")))//removeElement
		$("#Material").html(materialBuffer.codeMaterial()); //rebuildlist
		$("#TexList ul.list-group").html(materialBuffer.codeTextures());
		$("#Mtemplate").html(materialBuffer.codeTemplates());
		//$(this).closest("div.mat_instance").addClass('d-none');
		/*
		$('#Material div.mat_instance').map((index, el)=>{
		    return el.classList.contains('d-none') ? index : null;
		})*/
	});

	$("body").on("click","button[data-template-index]",function(){
		if (materialBuffer?.MaterialTemplates.length > $(this).data("template-index")){
			var materialToSearch
			materialToSearch = materialBuffer.MaterialTemplates[$(this).data("template-index")].Name;
		}
	});

	$("body").on("click","button[data-templatecast-index]",function(){
		let materialTemplated = new MaterialTemplate(templateLibrary.MaterialTemplates[$(this).attr('data-templatecast-index')].Name,templateLibrary.MaterialTemplates[$(this).attr('data-templatecast-index')].Data)
		if ($("#Mat_S_name").val()==""){ $("#Mat_S_name").val(templateLibrary.MaterialTemplates[$(this).attr('data-templatecast-index')].Name.split("\\").reverse()[0]) }
		$("#Mat_Base_S_name, #Mat_Temp_S_name").val(templateLibrary.MaterialTemplates[$(this).attr('data-templatecast-index')].Name)
		$("#Mat_Setup div.card-body").html(materialTemplated.cast());
	});

	$("body").on("click","button.toDefault",function(event){
		//console.log($(this))
		let componente = $(this).prev("input")
		//console.log(componente)
		componente.val(componente.attr("default")).keyup()
	});

	$("body").on("keyup","div[data-built='BuildFromTemplate'] input",function(){
		if ($(this).attr("default")!=$(this).val()){
			$(this).addClass("custom");
		}else{
			$(this).removeClass("custom");
		}
	});

	function UItranslateMaterial(content){
		materialBuffer = null;
		materialBuffer = new MaterialBuffer();
		materialBuffer.import(content);

		$("#Material").html(materialBuffer.codeMaterial());
		$("#TexList ul.list-group").html(materialBuffer.codeTextures());
		$("#Mtemplate").html(materialBuffer.codeTemplates());
	}

	$("#importfield").change(function(){
		var fr=new FileReader(); //new reading Object
		fr.onload=function(){
			lastMaterialTXT = fr.result;
			if (isValidJSON(lastMaterialTXT)){
				UItranslateMaterial(lastMaterialTXT);
			}else{
				new Notification("Json format",{ body: "Your file has been parsed and there are errors please verify it with a Json syntax checker" }).show();
			}
			$("#importfield").val("");
		} //get the result of the reading to the textarea
		if ($(this)[0].files[0]){
			fr.readAsText($(this)[0].files[0]); //Read as a text file
		}
	});

	$("#materialExport").click(function(){
		var bufferProduced = Object();
		var excluded = []

		$('#Material details').each((index, el)=>{
		    if (el.classList.contains('d-none')){
					excluded.push(index)
			};
		});
		$('#Material details.d-none').remove()
		//console.log(excluded);

		excluded.reverse().forEach((el)=>{
			materialBuffer.Materials.splice(el,1);
		})
		//cleaned Up materials entry, then templates, in between you get the textures that need to be eliminated
		var exportThoseTemplate = Array.from(new Set(materialBuffer.Materials.map(el => el.MaterialTemplate)))
		bufferProduced.MaterialTemplates = materialBuffer.MaterialTemplates.filter(el => exportThoseTemplate.indexOf(el.Name) >= 0)
		//console.log(bufferProduced.MaterialTemplates)
		thePIT.Export(JSON.stringify(materialBuffer,null, "  "))
	});

	$("#packItBack").click(function(){
		let myinputdatas = $("div[data-built='BuildFromTemplate'] input");

		if (myinputdatas.length>0){
			let mydatas = {}
			let textures = new Set()
			myinputdatas.each(function(index,field){
				if ($(field).data("field").match(/\./)){
					let dummy = $(field).data("field").split(".")
					if (!mydatas.hasOwnProperty(dummy[0])){
						mydatas[dummy[0]]={}
					}
					if (field.value.match(/^[\d\.\,-]+$/)){
						mydatas[dummy[0]][dummy[1]]=parseFloat(field.value);
					}else{
						mydatas[dummy[0]][dummy[1]]=field.value;
					}
				}else{
					if (field.value.match(/^[\d\.\,-]+$/)){
						mydatas[$(field).data("field")]=parseFloat(field.value);
					}else{
						mydatas[$(field).data("field")]=field.value;
					}
				}
				//console.log($(field).data("field"),field.value)
				if (field.value.match(/.+\\.+\.xbm$/)){
					textures.add(field.value)
				}
			});
			let theMaterial = new Material($("#Mat_S_name").val(),$("#Mat_Base_S_name").val(), $("#Mat_Temp_S_name").val(), mydatas )

			/*push all the textures in the textureList,
			push all the templates in the templates and check for overwrite*/
			if (!materialBuffer.hasOwnProperty("MaterialTemplates")) {
				materialBuffer = new MaterialBuffer(configDepot)
			}
			if (materialBuffer.MaterialTemplates.find( el => el.Name == theMaterial.MaterialTemplate) == undefined){
				//i will add to the template BUT fixing The texture List
				var idxTemplateToCopy = templateLibrary.MaterialTemplates.findIndex(mat => mat.Name == theMaterial.MaterialTemplate)
				if (idxTemplateToCopy >= 0){
					materialBuffer.MaterialTemplates.push(templateLibrary.MaterialTemplates[idxTemplateToCopy])
					$("#Mtemplate").html(materialBuffer.codeTemplates());
				}else{
					Notification.requestPermission().then((result) => {
						new Notification('Error',{body: `Something happened, because i can't find anywhere your template ${theMaterial.MaterialTemplate} `})
					});
					return false
				}
			}
			//$("#TexList ul.list-group").html(materialBuffer.codeTextures()); TODO use even in the first Import the Class

			let indexMaterial = materialBuffer.find(theMaterial.Name)
			if (indexMaterial >=0){
				materialBuffer.Materials.splice(indexMaterial,1,theMaterial)
				$("#Material div").eq(indexMaterial).replaceWith(materialBuffer.codeMaterial(indexMaterial));
			}else{
				materialBuffer.pushMaterial(theMaterial)
				$("#Material").html(materialBuffer.codeMaterial());
			}
			$("#TexList ul.list-group").html(materialBuffer.codeTextures());
		}else{
			Notification.requestPermission().then((result) => {
			  new Notification('?????',{body: 'There is nothing to add... shaking my head'})
			});
		}
	});

	/* TemplateLibrary Section */

	//BuildUp your template Library
	function LoadTemplateLibrary(){
		$.get("../jsons/material_template.json").done(function(content){
			if (typeof(content)=='object'){
				templateLibrary = content
				$("#tplLibrary div.card-body").html(LibTemplatesGen());
				$("#tplLibrary div.card-body > div").addClass("Flashy");
				setTimeout(function() { $("#tplLibrary div.card-body > div").removeClass("Flashy");}, 1200);
			}
		});
	}
	LoadTemplateLibrary();
	//push templates in the library
	$("body").on("click","button[data-template-index]",function(e){
		if (($(this).attr("data-template-index")!==undefined) && ($(this).attr("data-template-index") !== false) ){
			let templateToLibraryIndex = Number($(this).attr("data-template-index"))
			let dummyindex = templateLibrary.MaterialTemplates.findIndex(el => el?.Name == materialBuffer.MaterialTemplates[templateToLibraryIndex].Name)
			if (dummyindex >= 0){
				$("#tplLibrary div.card-body > div").eq(dummyindex)[0].scrollIntoView();
				$("#tplLibrary div.card-body > div").eq(dummyindex).addClass("Duplicate")
				setTimeout(function() { $("#tplLibrary div.card-body > div").eq(dummyindex).removeClass("Duplicate")}, 1200);
			}else{
				//need to be pushed
				$("#MatCFiltering").val("").keyup()
				templateLibrary.MaterialTemplates.push(materialBuffer.MaterialTemplates[templateToLibraryIndex])
				$("#tplLibrary div.card-body").html(LibTemplatesGen());
			}
		}
	});

	//color change on datafield that is a color channel and take in account the siblings field
	$("body").on("change","input[data-field]",function(e){
		var theField = $(e.target);
		if (($(e.target).attr("data-field")!==undefined) && ($(e.target).attr("data-field") !== false) ){
			if (
				(theField.attr("data-field").includes(".Red")) ||
				(theField.attr("data-field").includes(".Green")) ||
				(theField.attr("data-field").includes(".Blue")) ||
				(theField.attr("data-field").includes(".Alpha")) ){
					//console.log(theField.parent().children("input"));
					let fieldval = []
					theField.parent().children("input").each(function(index,el){
						fieldval.push($(el).val())
					})
					theField.parent().children("div.showColor").attr("style",`background-color:rgba(${fieldval[0]},${fieldval[1]},${fieldval[2]},${Number(fieldval[3]/255)});`)
			}else{
				if ($(this).val()==""){
					$(this).val($(this).attr("default"))
				}
			}
		}
	});


	//Reload the Json file, used to cleanup the library in case you don't want a template in it
	$("#bReloadLibrary").click(function(){
		LoadTemplateLibrary();
		$("#MatCFiltering").val("").keyup();
	 });
	//save to file and have a backup in your userfolder
	$("#bSaveLibrary").click(function(){ thePIT.BackupLibrary(JSON.stringify(templateLibrary,null,"  ")) });

	/* Eyedropper color preview
	$("body").on("click","div.showColor",function(){
		if (!window.EyeDropper) {
	    console.log('Your browser does not support the EyeDropper API');
	    return;
	  }
		const eyeDropper = new EyeDropper();

	  eyeDropper.open().then((result) => {
	    console.log(result.sRGBHex)
	  }).catch((e) => {
	    console.log(e);
	  });
	})
	*/
});
