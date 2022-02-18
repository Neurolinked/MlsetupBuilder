window.$ = window.jQuery;

// lowest color console.log(ml_libraries.canvas_clean_01_30.overrides.colorScale.filter(maxred => maxred.v.reduce((a, b) => a + b, 0)<0.095));
// Highest color console.log(ml_libraries.canvas_clean_01_30.overrides.colorScale.filter(maxred => maxred.v.reduce((a, b) => a + b, 0)>0.9));

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0;
}
async function abuildMB(microblendObj){
  if (typeof(microblendObj)=="object"){
    if ((microblendObj.hasOwnProperty("microblends")) && (microblendObj.hasOwnProperty("package")) ){
      for (k=0, j=microblendObj.microblends.length;k<j;k++){
        $("#mbSelect").append("<option data-package='"+microblendObj.package+"' data-thumbnail='./images/"+microblendObj.microblends[k].name+".png' value='base\\surfaces\\microblends\\"+microblendObj.microblends[k].name+".xbm'>"+microblendObj.microblends[k].name+"</option>");
        $("#cagethemicroblends").append("<li style=\"background-image:url('./images/thumbs/"+microblendObj.microblends[k].name+".png');'\" data-package='"+microblendObj.package+"'  data-toggle='tooltip' title='"+microblendObj.microblends[k].name+"'> </li>");
      }
    }
  }
  return;
}
async function abuildMaterial(materialArray){
	if (typeof(materialArray)=="object"){
		for (k=0, j=materialArray.length;k<j;k++){
			// background-image: url('./images/material/asphalt.jpg');
			$("#cagemLibrary").append("<div style=\"background:url('images/material/"+materialArray[k].name+".png') no-repeat;background-size:100% auto;\" data-ref='"+materialArray[k].name+"' data-path='"+materialArray[k].path+"'>"+materialArray[k].name.replaceAll("_"," ")+"</div>");
		}
	}
}

function slideMaterials(index){
	if (index/3>1){
		$("#cagemLibrary").animate({scrollTop:((Math.floor(index/3)-1)*67)+"px"},700);
	}
}

$(function(){
  var shiftSpeedup = false;
  var indexLayerContextual = null; //variable index for the copied Data
  var dataContextual = {};

  //Building the list of microblends
  let buildmyMicroblends = abuildMB(coreMblends);
	let buildmyNuMaterial = abuildMaterial(materialCore);

  $('[data-toggle="tooltip"]').tooltip(); //force tooltip to build up

  $(document).on('keydown', function(e) {
    if (e.shiftKey) {  shiftSpeedup = true; $("#AimV, #AimU, #AimMTile").prop("step",'0.1');
	}else{  shiftSpeedup = false; $("#AimV, #AimU, #AimMTile").prop("step",'0.001');}
  });

  $(document).on('keyup', function(e) { if (e.shiftKey == false) { shiftSpeedup = false; $("#AimV, #AimU, #AimMTile").prop("step",'0.001');} });
/* Contestual menu on layers */
  const contextMenu = document.getElementById("layers-contextual");
  const layerscope = document.querySelector("#layeringsystem");

  $("#layeringsystem li").on("contextmenu",function(event){
    if ($(this).attr("disabled")!="disabled"){
        event.preventDefault();
        indexLayerContextual = Number($(this).text());
        //event.target.classList.add("active");
        const { clientX: mouseX, clientY: mouseY } = event;
        $("#layers-contextual").css("top",`${mouseY}px`).css("left",`${mouseX}px`);
        $("#layers-contextual").addClass("visible");
    }
  });

  $("#layers-contextual li").click(function(){
    if ($(this).attr("disabled")!="disabled"){
      switch ($(this).data("action")) {
        case 'cpall':
          dataContextual = {};
          console.log(dataContextual);
          dataContextual.labels = $("#layeringsystem li").eq(indexLayerContextual).attr("data-labels");
          dataContextual.mattile = $("#layeringsystem li").eq(indexLayerContextual).data("mattile");
          dataContextual.material = $("#layeringsystem li").eq(indexLayerContextual).data("material");
          dataContextual.color = $("#layeringsystem li").eq(indexLayerContextual).data("color");
          dataContextual.normal = $("#layeringsystem li").eq(indexLayerContextual).data("normal");
          dataContextual.roughin = $("#layeringsystem li").eq(indexLayerContextual).data("roughin");
          dataContextual.roughout = $("#layeringsystem li").eq(indexLayerContextual).data("roughout");
          dataContextual.metalout = $("#layeringsystem li").eq(indexLayerContextual).data("metalout");
          dataContextual.offsetu = $("#layeringsystem li").eq(indexLayerContextual).data("offsetu");
          dataContextual.offsetv = $("#layeringsystem li").eq(indexLayerContextual).data("offsetv");
          dataContextual.opacity = $("#layeringsystem li").eq(indexLayerContextual).data("opacity");
          //microblend data
          dataContextual.mblend = $("#layeringsystem li").eq(indexLayerContextual).data("mblend");
          dataContextual.mbtile = $("#layeringsystem li").eq(indexLayerContextual).data("mbtile");
          dataContextual.mbcontrast = $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast");
          dataContextual.mbnormal = $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal");
          dataContextual.mboffu = $("#layeringsystem li").eq(indexLayerContextual).data("mboffu");
          dataContextual.mboffv = $("#layeringsystem li").eq(indexLayerContextual).data("mboffv");
          $("#layers-contextual li").eq(1).removeAttr("disabled");
          $("#layers-contextual li").eq(3).removeAttr("disabled");
          break;
        case 'pstall':
          $("#layeringsystem li").eq(indexLayerContextual).data("labels",dataContextual.labels);
          $("#layeringsystem li").eq(indexLayerContextual).data("mattile",dataContextual.mattile);
          $("#layeringsystem li").eq(indexLayerContextual).data("material",dataContextual.material);
          $("#layeringsystem li").eq(indexLayerContextual).data("color",dataContextual.color);
          $("#layeringsystem li").eq(indexLayerContextual).data("normal",dataContextual.normal);
          $("#layeringsystem li").eq(indexLayerContextual).data("roughin",dataContextual.roughin);
          $("#layeringsystem li").eq(indexLayerContextual).data("roughout",dataContextual.roughout);
          $("#layeringsystem li").eq(indexLayerContextual).data("metalout",dataContextual.metalout);
          $("#layeringsystem li").eq(indexLayerContextual).data("offsetu",dataContextual.offsetu);
          $("#layeringsystem li").eq(indexLayerContextual).data("offsetv",dataContextual.offsetv);
          $("#layeringsystem li").eq(indexLayerContextual).data("opacity",dataContextual.opacity);
          //microblend data
          $("#layeringsystem li").eq(indexLayerContextual).data("mblend",dataContextual.mblend);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbtile",dataContextual.mbtile);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast",dataContextual.mbcontrast);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal",dataContextual.mbnormal);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffu",dataContextual.mboffu);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffv",dataContextual.mboffv);
          //Setup the HTML just in case
          $('#layeringsystem li').eq(indexLayerContextual).attr({
            "data-mattile":dataContextual.mattile,
            "data-labels":dataContextual.labels,
            "data-material":dataContextual.material,
            "data-opacity":dataContextual.opacity,
            "data-color":dataContextual.color,
            "data-normal":dataContextual.normal,
            "data-roughin":dataContextual.roughin,
            "data-roughout":dataContextual.roughout,
            "data-metalout":dataContextual.metalout,
            "data-offsetU":dataContextual.offsetu,
            "data-offsetV":dataContextual.offsetv,
            "data-mblend":dataContextual.mblend,
            "data-mbtile":dataContextual.mbtile,
            "data-mbcontrast":dataContextual.mbcontrast,
            "data-mbnormal":dataContextual.mbnormal,
            "data-mboffu":dataContextual.mboffu,
            "data-mboffv":dataContextual.mboffv
          });
          $("#layeringsystem li").eq(indexLayerContextual).click();
          break;
        case 'cpmb':
          dataContextual = {};
          dataContextual.mblend = $("#layeringsystem li").eq(indexLayerContextual).data("mblend");
          dataContextual.mbtile = $("#layeringsystem li").eq(indexLayerContextual).data("mbtile");
          dataContextual.mbcontrast = $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast");
          dataContextual.mbnormal = $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal");
          dataContextual.mboffu = $("#layeringsystem li").eq(indexLayerContextual).data("mboffu");
          dataContextual.mboffv = $("#layeringsystem li").eq(indexLayerContextual).data("mboffv");
          $("#layers-contextual li").eq(1).addAttr("disabled");
          $("#layers-contextual li").eq(3).removeAttr("disabled");
          break;
        case 'pstmb':
          $("#layeringsystem li").eq(indexLayerContextual).data("mblend",dataContextual.mblend);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbtile",dataContextual.mbtile);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbcontrast",dataContextual.mbcontrast);
          $("#layeringsystem li").eq(indexLayerContextual).data("mbnormal",dataContextual.mbnormal);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffu",dataContextual.mboffu);
          $("#layeringsystem li").eq(indexLayerContextual).data("mboffv",dataContextual.mboffv);
          $('#layeringsystem li').eq(indexLayerContextual).attr({
            "data-mblend":dataContextual.mblend,
            "data-mbtile":dataContextual.mbtile,
            "data-mbcontrast":dataContextual.mbcontrast,
            "data-mbnormal":dataContextual.mbnormal,
            "data-mboffu":dataContextual.mboffu,
            "data-mboffv":dataContextual.mboffv
          });
          $("#layeringsystem li").eq(indexLayerContextual).click();
          break;
        default:
      }
      //console.log(dataContextual);
      $("#layers-contextual").removeClass("visible");
    }
  });

	//replace chars not matching the standard features
	$("#layerRandomCfg").keyup(function (event) {
		let stringa = $(this).val();
		stringa = stringa.replace(/^[,\-]+/,'').replace(/[a-zA-Z\s]+/g,'').replace(/[^0-9,\-\s]+/g,'').replace(/,{2,}/g,',').replace(/\-{2,}/g,'-');
		$(this).val(stringa);
	});

/* Normalization layers numbers*/
  function normalizeNumbers(){
    if ($("#layerTile").val() % 1 == 0){ $("#layerTile").val(Number($("#layerTile").val()).toFixed(1));    }
    if ($("#layerOpacity").val() % 1 == 0){ $("#layerOpacity").val(Number($("#layerOpacity").val()).toFixed(1)); }
    if ($("#layerOffU").val() % 1 == 0){ $("#layerOffU").val(Number($("#layerOffU").val()).toFixed(1)); }
    if ($("#layerOffV").val() % 1 == 0){ $("#layerOffV").val(Number($("#layerOffV").val()).toFixed(1)); }
    if ($("#mbTile").val() % 1 == 0){ $("#mbTile").val(Number($("#mbTile").val()).toFixed(1)); }
    if ($("#mbNorm").val() % 1 == 0){ $("#mbNorm").val(Number($("#mbNorm").val()).toFixed(1)); }
  }

	const microBlend = new fabric.Canvas('maskFabric');//initialize the fabric Element
	microBlend.selection=false;
	microBlend.uniformScaling = true; //only scaling 1:1
	microBlend.uniScaleKey = 'null'; //remove non-uniform scaling

	microBlend.on('object:moving', function(e) {
     let microblendRatio =  Number($("#mbTile").val());
		//let sopra = String(e.target.aCoords.tl).split(","); //create an array with x and y of the top left point corner
		//let sotto = String(e.target.aCoords.br).split(","); //create an array with x and y of the bottom right corner
    $("#aimPanels span:first-child span").text(-1*Number(e.target.aCoords.tl.x/512).toFixed(2));
    $("#AimU").val(-1*Number(e.target.aCoords.tl.x/512));
    $("#aimPanels span:nth-child(3) span").text(-1*Number((512-e.target.aCoords.br.y)/512).toFixed(2));
    $("#AimV").val(-1*Number((512-e.target.aCoords.br.y)/512));
	 });


	var semaphoreCLKmBlend =false;

	localStorage = window.localStorage;
	const license = localStorage.getItem('ReadLicense');

	const licenseWindow = document.getElementById('LicenseModal');
	const licenseModal = new bootstrap.Modal(licenseWindow);
	const wGLBInfo = new bootstrap.Modal(document.getElementById('modalInfo'));

	const AimMBlend = new bootstrap.Modal(document.getElementById('AimBlend'));
	const AimWindows = document.getElementById('AimBlend');
	//On open of the aiming windows
	AimWindows.addEventListener('shown.bs.modal', function (event) {
   let tiling =$("#mbTile").val();
   tiling = Number(tiling);
 	 let horizontal_mb = $("#mbOffU").val();
   horizontal_mb = Number(horizontal_mb);
   let vertical_mb = $("#mbOffV").val();
   vertical_mb = Number(vertical_mb);
   //connect value
   $("#AimMTile").val(tiling);
   $("#AimV").val(vertical_mb);
   $("#AimU").val(horizontal_mb);
	 //load visually the values
	 document.getElementById('dispAimTile').innerHTML = tiling;
	 document.getElementById('dispAimU').innerHTML = horizontal_mb;
	 document.getElementById('dispAimV').innerHTML = vertical_mb;

	 var sel_Microblend = $("#mb-preview").attr('src');
   let microblendRatio =  Number($("#mbTile").val());
   microblendRatioVal = (1/microblendRatio) * 512;

	 fabric.Image.fromURL(sel_Microblend, function(oImg) {
		 	oImg.scaleToHeight(microblendRatioVal);
			oImg.scaleToWidth(microblendRatioVal);
      //oImg.originY="bottom";
			//oImg.hasControls = false;
      oImg.flipY=true;
      console.log(oImg.height+" "+oImg.width);
			oImg.opacity=0.7;

      var patternSourceCanvas = new fabric.StaticCanvas();
      //patternSourceCanvas.setDimensions({width:oImg.width,height:oImg.height});
      patternSourceCanvas.setDimensions({width:oImg.getScaledWidth(),height:oImg.getScaledHeight()});
      patternSourceCanvas.add(oImg);
      patternSourceCanvas.renderAll();

      var pattern = new fabric.Pattern({
       source: patternSourceCanvas.getElement(),
       repeat: 'repeat',
     });

     pattern.originX="center";
     pattern.originY="bottom";
		 var verticalsource = 512-microblendRatioVal;
     pattern.offsetX=-horizontal_mb*microblendRatioVal;
		 pattern.offsetY=verticalsource+(vertical_mb*microblendRatioVal);

     //console.log("X:"+pattern.offsetX+" Y:"+pattern.offsetY+" offset: "+ (scalesizinoffset*512) +" ratio: "+microblendRatioVal);

      microBlend.add(
        new fabric.Rect(
          {
            width:512,
            height:512,
            left: 0,
            top: 0,
            fill: pattern,
            objectCaching: false,
            hasControls:false,
            lockScalingX : true,
            lockScalingY : true,
            lockMovementX : true,
            lockMovementY : true
          },
        ),
      );

      document.getElementById('AimU').oninput = function () {
				document.getElementById('dispAimU').innerHTML = this.value;
				let resizable = ((1/Number(document.getElementById('AimMTile').value)) * 512);
        pattern.offsetX =-1*(Number(this.value)*resizable);
        microBlend.requestRenderAll();
      };

			document.getElementById('AimV').oninput = function () {
				document.getElementById('dispAimV').innerHTML  = this.value;
				let resizable = ((1/Number(document.getElementById('AimMTile').value)) * 512);
				verticalsource = 512-resizable
				pattern.offsetY=verticalsource+(Number(this.value)*resizable);
        microBlend.requestRenderAll();
      };

			document.getElementById('AimMTile').oninput = function () {
				document.getElementById('dispAimTile').innerHTML  = this.value;
				let resizable = ((1/Number(this.value)) * 512);
				 oImg.scaleToWidth(resizable);
				 oImg.scaleToHeight(resizable);

				 let actualX = document.getElementById('AimU').value
				 let actualY = document.getElementById('AimV').value

				 pattern.offsetY=512-resizable+(actualY*resizable);
				 pattern.offsetX =-1*(actualX*resizable);

				 patternSourceCanvas.setDimensions({
					 width: oImg.getScaledWidth(),
					 height: oImg.getScaledHeight(),
				 });
				 microBlend.requestRenderAll();
		 };

		});
 	});

	AimWindows.addEventListener('hide.bs.modal', function (event) {	microBlend.clear();	});

  //Speed Changing for Aiming Windows
  $("#AimV, #AimU, #AimMTile").on("change",function(){
    if (shiftSpeedup){ $(this).attr("step","0.1");  }else{  $(this).attr("step","0.001"); }
  });

	$("#confirmAim").click(function(){
		$("#mbOffU").val($("#AimU").val());
		$("#mbOffV").val($("#AimV").val());
		$("#mbTile").val($("#AimMTile").val());
		if ($("#AimChain").prop('checked')){
			$("#layerOffU").val($("#AimU").val());
			$("#layerOffV").val($("#AimV").val());
			$("#layerTile").val($("#AimMTile").val());
		}
		AimMBlend.hide();
	});

  $("#reloadAim").click(function(){
		//reload the value from the main window
    $("#AimU").val($("#mbOffU").val());
		$("#AimV").val($("#mbOffV").val());
		$("#AimMTile").val($("#mbTile").val());

    $('#dispAimU').text($("#AimU").val());
    $('#dispAimV').text($("#AimV").val());
    $('#dispAimTile').text($("#AimMTile").val());
  });

	//Displays of the license
	licenseWindow.addEventListener('hidden.bs.modal', function (event) { localStorage.setItem('ReadLicense',Date.now()); });

	if (license==null){ licenseModal.show();}

  //activate and deactivate double layering
  $("#onlyOneSide").click(function(){
    var sideBox = $("#dat-container ul li:nth-of-type(4) input[type='checkbox']");
    sideBox.click();//("checked",!sideBox.prop("checked"));
  });

	var TextureLoad = new Event('fire');

  //actions connected to the click onto the layers list
	$('#layeringsystem li').click(function(e){
		if (!$(this).attr("disabled")){
      //activate the new one only if isn't disabled
			$('#layeringsystem li').removeClass('active');
			$(this).addClass('active');
			$("#maskLayer").attr("value",$(this).text());
      //if the model is already loaded it fires the event to load the masks
      //in the event if the layer selected is over the maximum layers
      //it load the 0 masks for security
      if ($("#modelTarget").attr('loaded')=='true'){
  			let fireTxLoad = document.getElementById('maskLayer');
  			fireTxLoad.dispatchEvent(TextureLoad);
      }

      //Load the layers infor into the fields
      let materialByClick = String($(this).data("material")).replace(/^.*[\\\/]/, '').split('.')[0];
			semaphoreCLKmBlend=true;
			//Reset material Library 1.5.99
			$("#cagemLibrary > div").removeClass("active");
			$("#cagemLibrary > div[data-ref='"+materialByClick+"']").addClass("active");
			slideMaterials($("#cagemLibrary > div.active").index());
			//
      $("#materialTrees").jstree().deselect_all(true);//reset the material library
      let materialdummy = materialJson.filter(materiale =>(materiale.text==materialByClick)); //filter the material on the layer selected
			$("#materialTrees").jstree("select_node",materialdummy[0].id); //fire the selection of the material for loading the inputs
      //Setup the inputs
      $("#matInput").val($(this).data("material"));
			$("#layerTile").val($(this).data("mattile"));
			$("#layerOpacity").val($(this).data("opacity")).change();
			$("#layerColor").val($(this).data("color"));
			$("#layerNormal").val(String($(this).data("normal")));
			$("#layerRoughIn").val(String($(this).data("roughin")));
			$("#layerRoughOut").val(String($(this).data("roughout")));
			$("#layerMetalIn").val(String($(this).data("metalin")));
			$("#layerMetalOut").val(String($(this).data("metalout")));
			$("#layerOffU").val($(this).data("offsetu"));
			$("#layerOffV").val($(this).data("offsetv"));
      //Microblend section
			$("#mbInput").val($(this).data("mblend"));
			$("#mbTile").val($(this).data("mbtile"));
			$("#mbCont").val($(this).data("mbcontrast"));
			$("#mbNorm").val($(this).data("mbnormal"));
			$("#mbOffU").val($(this).data("mboffu"));
			$("#mbOffV").val($(this).data("mboffv"));
      //setup the chosen colors for the layer
			let  ricercacolore = $(this).data("color");

      if ($("#LayerColorL option").filter(function(){ return this.textContent.startsWith(ricercacolore)}).length>0){
        $("#LayerColorL option").filter(function(){ return this.textContent.startsWith(ricercacolore)}).prop("selected","selected");
        $("#LayerColorL").change();//fire the events as a user color selection to update colors percentage and preview
      }else{
        $("#LayerColorL").prop('selectedIndex',0); //reset to null to let overrides work
      }
			$("#cagecolors span[title='"+ricercacolore+"']").addClass("active");
			$("#mbInput").focusout(); //fires up the change of material blending preview
		}
	});

	var ModelsLibrary = $('#modelsTree').jstree({
		'core' : {"themes": {"name": "default-dark","dots": true,"icons": true},'check_callback' : true,'data' : modelsJson},
		'types' : {
							"default" : { "icon" : "text-warning fas fa-folder" },
              "custom" : { "icon" : "custom fas fa-folder" },
							"man" : { "icon" : "fas fa-mars" },
							"woman" : { "icon" : "fas fa-venus" },
              "car" : { "icon" : "text-danger fas fa-car-side" },
              "moto" :{ "icon" : "text-danger fas fa-motorcycle" },
              "weapons" : { "icon" : "text-primary fas fa-skull-crossbones" },
							"kiddo" : {"icon": "text-warning fas fa-baby"},
              "layer0" : {"icon": "text-white fas fa-star-half"},
              "custmask" : {"icon":"custom"},
							},
		"search":{"show_only_matches": true,"show_only_matches_children":true},
		"plugins" : [ "search","types","state" ],//"plugins" : [ "search","types","contextmenu","state" ],
    //"contextmenu":{ "items": customMdlMenu }
	}).bind("dblclick.jstree", function (event) {
    /*
     var node = $(event.target).closest("li");
     var data = node.data("jstree");*/
     $('#btnMdlLoader').click();
     // Do my action
  });

  function customMdlMenu(node){
    //console.log(node.type);
    switch (node.type){
      case 'default':
        return false;
        break;
      case 'custmask':
        return {
          "AddMaskset": {
            "separator_before": false,
            "separator_after": false,
            "label": "Add Maskset",
            "icon": "fas fa-plus",
            "action": function (obj) { }
          }
        };
        break;
      case 'custom':
      return {
          "Export": {
              "separator_before": false,
              "separator_after": false,
              "label": "Export",
              "icon": "fas fa-file-export",
              "action": function (obj) {
                let test = $('#modelsTree').jstree(true).get_json(node,{flat:true});
                console.log(test);
              }
          },
        }
        break;
      default:
        return {
            "Customize": {
                "separator_before": false,
                "separator_after": false,
                "label": "customize",
                "icon": "fas fa-edit",
                "action": function (obj) {
                  let radix = $('#modelsTree').jstree(true);
                  radix.copy_node(node,'custom','last',function(child,father,pos){
                    oldtype = String(child.icon).replace('text-white','');
                    radix.set_type(child,'custmask');
                    radix.set_icon(child,"custom "+oldtype);
                  });
                }
            },
          }
    }
  }
//When selecting a model from the library it load data in the inputs
$('#modelsTree').on('select_node.jstree',function(ev,node){
	let maxlayers = 19;
	if ((node.node.type=='man')||(node.node.type=='woman')||(node.node.type=='car')||(node.node.type=='layer0')||(node.node.type=='moto')||(node.node.type=='weapons')||(node.node.type=='kiddo')){
    $("#modelTarget").attr('loaded',false);
		$("#modelTarget").val(node.node.li_attr['model']);
		$("#masksTemplate").val(node.node.li_attr['masks']);
		if (node.node.li_attr.hasOwnProperty('layers')){
			maxlayers = node.node.li_attr.layers;
		}
		$("#maxLayers").val(maxlayers);
	}
});
	//setup the search inside the model list in the offcanvas jsTree
	//var modToSearch=false;
/*
	force function to search
  $("#modelFinder").keyup(function (event) {
    if (event.which === 13) {
        var v = $('#modelFinder').val();
        $('#modelsTree').jstree(true).search(v);
      }
  });*/

	function debounce(cb, interval, immediate) {
	  var timeout;

	  return function() {
	    var context = this, args = arguments;
	    var later = function() {
	      timeout = null;
	      if (!immediate) cb.apply(context, args);
	    };

	    var callNow = immediate && !timeout;

	    clearTimeout(timeout);
	    timeout = setTimeout(later, interval);

	    if (callNow) cb.apply(context, args);
	  };
	};

	function searchDaModelTree() {
		var v = $('#modelFinder').val();
		$('#modelsTree').jstree(true).search(v);
		$("#modelFinder").removeClass('searching');
	}

	$("#modelFinder").on('keypress',debounce(searchDaModelTree, 300));

  $("#modelFinderCleared").click(function(){
		 $("#modelFinder").val("");
		 $('#modelsTree').jstree(true).clear_search();
		 $('#modelsTree').jstree(true).close_all();
	 });
  $("#modelFinderCloser").click(function(){$('#modelsTree').jstree(true).close_all();});

  //when the loading of the layer configuration setup a microblend
  //it activate the display onto the preview

	$("#mbInput").on('focusout',function(){
		$("#mbSelect option").removeAttr("selected");
		$("#mbSelect").val($("#mbInput").val()).trigger('updateMblend');
	});

	$("#mbInput").keyup(function (event) {
    if (event.which === 13) {
			$("#mbSelect option").removeAttr("selected");
			$("#mbSelect").val($("#mbInput").val()).trigger('updateMblend');
    }
	});

	$("#mbSelect").on('updateMblend',function(){
		test = $("#mbInput").val().replaceAll("\\","\\\\");

		if ($("#mbSelect option[value='"+test+"']").length==0){
			$("#mb-preview").prop("src","./images/_nopreview.gif");
		}else{
			//if ($("#mbSelect option[value='"+$("#mbInput").val()+"']").attr("data-thumbnail")!== undefined){
  			$("#mb-preview").prop("src",$("#mbSelect option[value='"+test+"']").attr("data-thumbnail")).on('error', function() { 	$("#mb-preview").prop("src","./images/_nopreview.gif")});
  		//}
		}
	})

	//load a new texture to display as microblends and fille the name in the microblend file name
	$("#mbSelect").change(function(event){
		/*
		console.log(event);
		semaphoreCLKmBlend=false;
    let notCustom = false;
		console.log($('#mbSelect option[value="'+$("#mbInput").val()+'"]').length);

    $('#mbSelect option').each(function() {
        if ($(this).val()==$("#mbInput").val()){
          notCustom=true;
          return true;
        }
    });
*/
  /*  if (notCustom){*/
  		$("#mbInput").val($(this).val());
      if ($("#mbSelect option:selected").attr("data-thumbnail")!== undefined){
  			$("#mb-preview").prop("src",$("#mbSelect option:selected").attr("data-thumbnail")).on('error', function() { 	$("#mb-preview").prop("src","./images/_nopreview.gif"); console.log("rilevato errore");});
  		}

		/*
    }else{
      $("#mb-preview").prop("src","./images/_nopreview.gif");
    }*/
	});

	//chage to a new microblend
	$("#bg-changer").change(function(){	$("#mb-preview").prop("style","background-color:"+$(this).val());	});
  //reset css fx on microblend
  $("#resetMB").click(function(){
		$("#mbInput").val("base\\surfaces\\microblends\\default.xbm").focusout();
	});
  $("#cleanFX").click(function(){$("#mb-preview").removeClass('blend-lumi');});
  //apply luminosity on microblend preview
  $("#lumiFX").click(function(){$("#mb-preview").toggleClass("blend-lumi");});
  //apply invert on microblend preview
  //$("#invertFX").click(function(){$("#mb-preview").removeClass('blend-lumi').addClass("blend-invert");});
  //microblend flipping
	$("#mb-preview").click(function(){
	  $(this).toggleClass("flip");
	  $('i.fa-hand-point-down').toggleClass("fa-hand-point-up");
	});
	//Material libraries and search
	var matToSearch=false;

	$("#matFinder").keyup(function () {

    if(matToSearch) { clearTimeout(matToSearch); }

    matToSearch = setTimeout(function () {
      var v = $('#matFinder').val();
      $('#materialTrees').jstree(true).search(v);
    }, 250);
  });
  //every time the switch skin it's clicked, it reload automatically the mesh
  //$("#switchSkinned").click(function(){ $("#btnMdlLoader").click();});

  $("#matFinderCleared").click(function(){$("#matFinder").val("").keyup()}); //cleanup the material search

	var TreeMaterial = $('#materialTrees').jstree({
		'core' : {"themes": {"name": "default-dark","dots": true,"icons": true},'check_callback' : true,'data' : materialJson},
		'types' : {
							"default" : { "icon" : "text-warning fas fa-folder" },
							"materials" : { "icon" : "text-info fas fa-box" }
							},
		"search":{"show_only_matches": true,"show_only_matches_children":true},
		"plugins" : [ "search","types" ]
	});

	$("#layerOpacity").change(function(){
			if (Number($(this).val())==0){
				$("#layerOpacity").addClass('bg-attention');
			}else{
				$("#layerOpacity").removeClass('bg-attention');
			}
	});

	//Material Loading and building
	TreeMaterial.on('select_node.jstree',function(ev,node){
		if (node.node.type==='materials'){
			//the node is a material, then change the material
			//console.log(node.node);
			$("#materialSummary").html(node.node.text);
			$("#matInput").val(node.node.a_attr['data-val']);

			if (ml_libraries.hasOwnProperty(node.node.text)){
				let materialtoload = node.node.text;

				console.log("%cMaterial override loaded for "+materialtoload, "color:green"); //"%cThis is a green text", "color:green"
        $("#Rough_out_values").html('');//reset optional roughness
				$("#Rough_In_values").html('');
				$("#Metal_Out_values").html('');//reset optional metalLevelsOut
        $("#Norm_Pow_values").html('');
				$("#materialcolors").html('');
				$("#cagecolors").html('');

        let toodarkClass;

				Object.entries(ml_libraries[materialtoload].overrides.colorScale).forEach(([key,value])=>{
          toodarkClass='';
          let colorchecking = tinycolor.fromRatio({r:value.v[0],g:value.v[1],b:value.v[2]});
          //if (!(colorchecking.getBrightness()>90) && (colorchecking.getBrightness()<110)){
          if (!tinycolor.isReadable(colorchecking,"#3c454d")){
            toodarkClass='bg-light';
          }
					$("#materialcolors").append('<option class="'+toodarkClass+'" style="color:rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);" value="rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);">'+value.n+' &#9632;</option>');
					$("#cagecolors").append('<span style="background-color:'+colorchecking.toRgbString()+';" data-toggle="tooltip" title="'+value.n+'" >&nbsp;</span>');
					//$("#cagecolors").append('<span style="background-color:rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);" data-toggle="tooltip" title="'+value.n+'" >&nbsp;</span>');
				});

        //build up the lists of roughness for the current material
				Object.entries(ml_libraries[materialtoload].overrides.roughLevelsIn).forEach(([key,value])=>{
					$("#Rough_In_values").append('<option value="'+value.n+'" >'+value.n+' ('+value.v.toString()+')</option>');
				});

        Object.entries(ml_libraries[materialtoload].overrides.roughLevelsOut).forEach(([key,value])=>{
          $("#Rough_out_values").append('<option value="'+value.n+'" >'+value.n+' ('+value.v.toString()+')</option>');
        });

        Object.entries(ml_libraries[materialtoload].overrides.normalStrength).forEach(([key,value])=>{
          $("#Norm_Pow_values").append('<option value="'+value.n+'" >'+value.n+' ('+String(value.v)+')</option>');
        });

				Object.entries(ml_libraries[materialtoload].overrides.metalLevelsOut).forEach(([key,value])=>{
          $("#Metal_Out_values").append('<option value="'+value.n+'" >'+value.n+' ('+String(value.v)+')</option>');
        });
			}else{
				console.log("%cNo material override entry loaded for:  "+String(node.node.a_attr['data-val']).replace(/^.*[\\\/]/, '').split('.')[0], "color:blue");
				$("#materialcolors").html("");
			}
		}
	});

	$("body").on('click','#cagemLibrary > div',function(event){

		$("#cagemLibrary > div").removeClass("active");
		$(this).addClass('active');

		if ($(this).index()/3>1){
			slideMaterials($(this).index());
			//$("#cagemLibrary").animate({scrollTop:((Math.floor($(this).index()/3)-1)*67)+"px"},700);
		}
		$("#materialSummary").html($(this).data('ref'));
		$("#matInput").val($(this).data('path'));

		if (ml_libraries.hasOwnProperty($(this).data('ref'))){
			let materialtoload = $(this).data('ref');

			console.log("%cMaterial override loaded for "+materialtoload, "color:green"); //"%cThis is a green text", "color:green"

			$("#Rough_out_values").html('');//reset optional roughness
			$("#Metal_Out_values").html('');
			$("#Rough_In_values").html('');
			$("#Norm_Pow_values").html('');
			$("#materialcolors").html('');
			$("#cagecolors").html('');

			let toodarkClass;

			Object.entries(ml_libraries[materialtoload].overrides.colorScale).forEach(([key,value])=>{
				toodarkClass='';
				let colorchecking = tinycolor.fromRatio({r:value.v[0],g:value.v[1],b:value.v[2]});
				//if (!(colorchecking.getBrightness()>90) && (colorchecking.getBrightness()<110)){
				if (!tinycolor.isReadable(colorchecking,"#3c454d")){
					toodarkClass='bg-light';
				}
				$("#materialcolors").append('<option class="'+toodarkClass+'" style="color:rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);" value="rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);">'+value.n+' &#9632;</option>');
				$("#cagecolors").append('<span style="background-color:'+colorchecking.toRgbString()+';" data-toggle="tooltip" title="'+value.n+'" >&nbsp;</span>');
				//$("#cagecolors").append('<span style="background-color:rgb('+Math.floor(value.v[0]*100)+'%,'+Math.floor(value.v[1]*100)+'%,'+Math.floor(value.v[2]*100)+'%);" data-toggle="tooltip" title="'+value.n+'" >&nbsp;</span>');
			});

			//build up the lists of data loaded from the material chosen

			Object.entries(ml_libraries[materialtoload].overrides.roughLevelsIn).forEach(([key,value])=>{
				$("#Rough_In_values").append('<option value="'+value.n+'" >'+value.n+' ('+value.v.toString()+')</option>');
			});

			Object.entries(ml_libraries[materialtoload].overrides.roughLevelsOut).forEach(([key,value])=>{
				$("#Rough_out_values").append('<option value="'+value.n+'" >'+value.n+' ('+value.v.toString()+')</option>');
			});

			Object.entries(ml_libraries[materialtoload].overrides.normalStrength).forEach(([key,value])=>{
				$("#Norm_Pow_values").append('<option value="'+value.n+'" >'+value.n+' ('+String(value.v)+')</option>');
			});

			Object.entries(ml_libraries[materialtoload].overrides.metalLevelsOut).forEach(([key,value])=>{
				$("#Metal_Out_values").append('<option value="'+value.n+'" >'+value.n+' ('+String(value.v)+')</option>');
			});
		}else{
			console.log("%cNo material override entry loaded for:  "+String($(this).data('path')).replace(/^.*[\\\/]/, '').split('.')[0], "color:blue");
			$("#materialcolors").html("");
		}
	});


  //Clicking outside the contextual menu
  $("body").on('click',function(event){
    if (contextMenu.classList.contains("visible")){
      if (event.target.offsetParent != contextMenu) {
        contextMenu.classList.remove("visible");
      }
    }
  });

	//On change on the color selection, update the bigger color preview and the line that say the percentage
	$("body").on('change','#LayerColorL', function(){
		$(".tint").prop('style','background-color:'+$(this).val()+"!important;");
		$("#layerColor").val($('#LayerColorL option:selected').text().slice(0,-2));
	  let choosed_color = tinycolor($(this).val());
	  $("#colorPntage").html(choosed_color.toPercentageRgbString()); //convert to text percentage the colors
	});

	$("body").on('click','#cagecolors span',function(){
		$("#cagecolors span").removeClass('active');
		$(this).addClass('active');
		let colorchanger = $(this).attr("title");
		$("body #materialcolors").prop('selectedIndex',0);
		if ($("body #materialcolors option:contains('"+colorchanger+"')").length>0) {
			$("body #materialcolors option:contains('"+colorchanger+"')").prop("selected",true);
		}else{
			$("body #defaultcolors option:contains('"+colorchanger+"')").prop("selected",false);
		}
		$("body #LayerColorL").change();
	});

  $("#cagethemicroblends li").click(function(){
    let theoneselected = $(this).data('bs-original-title');
    console.log(theoneselected+" :contains('"+theoneselected+"')");
    $("#mbSelect option").removeAttr("selected").filter(function() { return $(this).text() === theoneselected;}).attr('selected', true).change();
    //$("#mbSelect").find("option:contains('"+theoneselected+"')").attr('selected', true).change();
  });

	$("#layerRandomizer").click(function(){
    let max_blends = 5;
    let layblend;
		//get options
		var turnOnOff = $("#rndOnOff").prop('checked'); //can the randomized set opacity to e from 0 ?
		var rndmizeAll = $("#rndAll").prop('checked');
		var rndMBlend = $("#rndMbWild").prop('checked');
		//get active layers to be randomized
		var layerSactive = $("#layeringsystem li:not([disabled])").length;
    var subjectlayer, subjectlayerRText
		var layerfilter = $("#layerRandomCfg").val();

		//check on random layer selections
		if ($("#layerRandomCfg").val()!=""){
			//last cleanup, remove single and multiple , or - alone at the start or end of the string
			layerfilter = layerfilter.replace(/[2-9][0-9]{1}|\d{3,}/g,'19').replace(/[,\-]+$/,'');
			var arraychilds = new Set(layerfilter.split(',').sort());//create a unique set from a sorted array
			$("#layerRandomCfg").val(Array.from(arraychilds).join(',')); //translate the obtained values in the field
			//if it contain the value 0-19 or 19-0 all the layers are selected to be used... so clean the filter even more
			if (arraychilds.has('0-19') || arraychilds.has('19-0')){
				$("#layerRandomCfg").val('0-19');
			}else{
				//here we explode the ranges
				arraychilds.forEach((item, i, set) => {
					if (String(item).match(/^\d+\-\d+$/)!==null){
						let values = String(item).split('-').map(Number);
						if (values[0]==values[1]){
							set.delete(item);
							set.add(values[0]);
						}else{
							let minimum = Math.min.apply(Math, values)
							let maximum = Math.max.apply(Math, values);
							set.delete(item);
							for (k=minimum;k<=maximum;k++){
								set.add(k);
							}
						}
					}
				});
			}
			subjectlayerRText=Array.from(arraychilds).map(String); //Display The list
		}



    if (!turnOnOff){
	    subjectlayer = $("#layeringsystem li:not([disabled])").filter(
	      function(){
					if ($("#layerRandomCfg").val()!=""){
						if ((subjectlayerRText.includes($(this)[0].innerText)) && (Number($(this).data("opacity"))>0)){
							return true;
						}
					}else{
	        	return Number($(this).data("opacity"))>0;
					}
	    });
    }else{
			if ($("#layerRandomCfg").val()!=""){
				subjectlayer = $("#layeringsystem li:not([disabled])").filter(
					function(){
						return subjectlayerRText.includes($(this)[0].innerText);
					});
			}else{
				subjectlayer = $("#layeringsystem li:not([disabled])");
			}

    }

    if (!rndMBlend){max_blends=1;}

    let materialist = Object.keys(ml_libraries)
      .filter((key) => !key.match(/^(concrete|ebony|wood|asphalt|cliff|ceramic|grass|brick|terrain|mud|soil|rock|gravel|sand|factory|wallpaper|window|plaster|unused)\w+/g))
      .reduce((cur,key) => { return Object.assign(cur,{[key]:ml_libraries[key]}) },{} );

    let materialA = Object.keys(materialist);
    let numaterial = materialA.length;
    let material_colors = 0;
    let materialselect = "unused";
    let materialrnd = "";

    let numerocicle = subjectlayer.length;
    let microblenda = $("#mbSelect option:not([disabled])");

    //Scelta layer
    if ((numerocicle > 3)){
      layblend = 1 + Math.floor(Math.random() * (numerocicle-4))
    }

    //let mblist = Object.entries($("#mbSelect option").filter())
    for (k=0;k<numerocicle;k++){

        if ((turnOnOff) && (k>0) && $("#layeringsystem li").eq(subjectlayer[k].innerText).data("opacity")>0){
          if (Math.random() > 0.45){
            $("#layeringsystem li").eq(subjectlayer[k].innerText).data("opacity",0);
          }
        }else{
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("opacity",(parseFloat(Math.random()*0.99) + parseFloat(0.01)).toFixed(2));
        }

        $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-opacity",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("opacity"));

        if (Number($("#layeringsystem li").eq(subjectlayer[k].innerText).data("opacity")) > 0){
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("mattile",(Math.random() * 15).toFixed(2));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("mbtile",(Math.random() * 15).toFixed(2));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("mbcontrast",Math.random().toFixed(2));
          if ((((rndMBlend) && (Math.random() > 0.6)) || (k==layblend)) && (k>0)  && (max_blends>0)){
            $("#layeringsystem li").eq(subjectlayer[k].innerText).data("mblend",microblenda[Math.floor(Math.random() * microblenda.length)].value);
            max_blends=max_blends-1;
          }else{
            $("#layeringsystem li").eq(subjectlayer[k].innerText).data("mblend","base\\surfaces\\microblends\\default.xbm");
          }
          materialselect = materialA[(Math.floor(Math.random() * (numaterial-1)))];
          //console.log(materialselect);
          materialrnd = materialJson.filter(mat => mat.text == materialselect)[0].a_attr['data-val'];
          //console.log(materialrnd);
          material_colors = materialist[materialselect].overrides.colorScale[Math.floor(Math.random() * (materialist[materialselect].overrides.colorScale.length - 1))].n;
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("material",materialrnd);
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("color",material_colors);
          $("#layeringsystem li").eq(subjectlayer[k].innerText).data("labels","("+material_colors+") "+materialselect);
          //material Choice
          //setup to html to interact with CSS
          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-labels",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("labels"));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-mattile",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("mattile"));

          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-mbtile",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("mbtile"));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-mblend",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("mblend"));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-mbcontrast",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("mbcontrast"));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-color",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("color"));
          $("#layeringsystem li").eq(subjectlayer[k].innerText).attr("data-material",$("#layeringsystem li").eq(subjectlayer[k].innerText).data("material"));
        }
      $("#layeringsystem li.active").click();
    }
	});

  //Clean the actual selected layer
  $("#clean-Layer").click(function(){
    //if a layer is active
  	if ($("#layeringsystem li.active").length>0){
  		$("#matInput").val("base\\surfaces\\materials\\special\\unused.mltemplate");//clean the material
  		$("#layerOpacity").val("0.0").change();//zeroing the opacity
  		$("#layerColor").val("null_null");//color replace
  		$("#applytoMyLayer").click(); //trigger the application to layer
  	}
  });

  $("#wash-layers").click(function(){ vacuumCleaner(); });

  //Activate the first layer disabled
  $("#actlast-Layer").click(function(){
    if ($("#layeringsystem li[disabled]").length>0){
      $("#layeringsystem li[disabled]").eq(0).removeAttr('disabled');
    }
  });

  //Erase layers but let opacity at 1.0
  $("#wipe-layer").click(function(){ vacuumCleaner(false); });

  //applying data to the structure of li
  $("#applytoMyLayer").click(function(){
    if ($("#layeringsystem li.active").length==1){
      normalizeNumbers();
      let livelloeditato =$("#layeringsystem li.active");
      livelloeditato.attr("data-opacity",$("#layerOpacity").val());//to activate/deactivate Opacity in layers display
      livelloeditato.attr("data-labels","("+$("#layerColor").val()+") "+ String($("#matInput").val()).replace(/^.*[\\\/]/, '').split('.')[0]);
      livelloeditato.data("material",$("#matInput").val());
      livelloeditato.data("mattile",$("#layerTile").val());
      livelloeditato.data("opacity",$("#layerOpacity").val());
      livelloeditato.data("color",$("#layerColor").val());
      livelloeditato.data("normal",String($("#layerNormal").val()));
      livelloeditato.data("roughin",String($("#layerRoughIn").val()));
      livelloeditato.data("roughout",String($("#layerRoughOut").val()));
      livelloeditato.data("metalin",String($("#layerMetalIn").val()));
      livelloeditato.data("metalout",String($("#layerMetalOut").val()));
      livelloeditato.data("offsetu",$("#layerOffU").val());
      livelloeditato.data("offsetv",$("#layerOffV").val());
      livelloeditato.data("mblend",$("#mbInput").val());
      livelloeditato.data("mbtile",$("#mbTile").val());
      livelloeditato.data("mbcontrast",$("#mbCont").val());
      livelloeditato.data("mbnormal",$("#mbNorm").val());
      livelloeditato.data("mboffu",$("#mbOffU").val());
      livelloeditato.data("mboffv",$("#mbOffV").val());
      semaphoreCLKmBlend=true;
    }else{
      console.log("NO level selected");
    }
  });
 /*------------------------------------------------------------------------------------
  Import Export of JSON
---------------------------------------------------------------------------------------*/
//----File Auto Loader
$("#importTech").change(function(){
	var fr=new FileReader(); //new reading Object
	fr.onload=function(){$("#passaggio").val(fr.result);} //get the result of the reading to the textarea
	fr.readAsText($("#importTech")[0].files[0]); //Read as a text file
});
//Cleanep all the layers value
function vacuumCleaner(on = true){
  let c_opacity
  //Cleanup all layers value
  if (on){ c_opacity=1.0; }else{ c_opacity=0.0; }
  for (k=0;k<=19;k++){
    $('#layeringsystem li').eq(k).data({
      mattile:'1.0',
      labels:'(null_null) unused',
      material:'base\\surfaces\\materials\\special\\unused.mltemplate',
      opacity:c_opacity,
      color:'null_null',
      normal:'null',
      roughin:'null',
      roughout:'null',
      metalin:'null',
      metalout:'null',
      offsetU:0.0,
      offsetV:0.0,
      mblend:'base\\surfaces\\microblends\\default.xbm',
      mbtile:1.0,
      mbcontrast:0.0,
      mbnormal:1.0,
      mboffu:0.0,
      mboffv:0.0
    });
    $('#layeringsystem li').eq(k).attr({
      "data-mattile":'1.0',
      "data-labels":'(null_null) unused',
      "data-material":'base\\surfaces\\materials\\special\\unused.mltemplate',
      "data-opacity":String(c_opacity),
      "data-color":'null_null',
      "data-normal":'null',
      "data-roughin":'null',
      "data-roughout":'null',
      "data-metalin":'null',
      "data-metalout":'null',
      "data-offsetU":'0.0',
      "data-offsetV":'0.0',
      "data-mblend":'base\\surfaces\\microblends\\default.xbm',
      "data-mbtile":'1.0',
      "data-mbcontrast":'0.0',
      "data-mbnormal":'1.0',
      "data-mboffu":'0.0',
      "data-mboffv":'0.0'
    });

    $('#layeringsystem li').eq(0).data({opacity:1.0});
    $('#layeringsystem li').eq(0).attr({"data-opacity":"1.0"});
  }
}
//----Button to load
$("#TheMagicIsHere").click(function(){
		if (String($("#passaggio").val()).trim()!="") {
			theArcOfNOA = JSON.parse($("#passaggio").val());
			/*if (theArcOfNOA.Extension==".mlsetup"){ */
				if (theArcOfNOA.Chunks[0].Properties.layers.length>0){
					vacuumCleaner();//cleanup all layers data in the lists
					var tempArray=[];
					tempArray=theArcOfNOA.Chunks[0].Properties.layers;
          //console.log(tempArray);
					k=0;
          let basicOpacity,tempTile,tempMat,tempNorm,tempMetalIN,tempMetalOUT,tempRoughIN,tempRoughOUT,tempCol
          let tempoffU,tempoffV
          let tempMBlend,tempMBTile,tempMBNS,tempMBCon,tempMBoffU,tempMBoffV;
					tempArray.forEach(function(element) {
// Layer - Reset
						basicOpacity='1.0';
						tempTile ="1.0";
            tempMat='base\\surfaces\\materials\\special\\unused.mltemplate';
            tempCol='null_null';
            tempNorm = 'null';
						tempMetalIN ="null";
						tempMetalOUT ="null";
            tempRoughIN ="null";
						tempRoughOUT ="null";
            tempoffU ='0';
						tempoffV ='0';

// Multiblend Reset
            tempMBTile ='1.0';
            tempMBlend = "base\\surfaces\\microblends\\default.xbm";
            tempMBNS='1.0';
						tempMBCon='1.0';
            tempMBoffU ='0';
            tempMBoffV ='0';


						if (element.hasOwnProperty('matTile')){tempTile=element.matTile;}
						if (element.hasOwnProperty('opacity')){ basicOpacity=element.opacity;	}
            if (element.hasOwnProperty('material')){ tempMat=element.material;}

            if (element.hasOwnProperty('colorScale')){ tempCol=element.colorScale;}
						if (element.hasOwnProperty('normalStrength')){ tempNorm=element.normalStrength;}
            if (element.hasOwnProperty('metalLevelsIn')){ tempMetalIN=element.metalLevelsIn;}
						if (element.hasOwnProperty('metalLevelsOut')){ tempMetalOUT=element.metalLevelsOut;}
						if (element.hasOwnProperty('roughLevelsin')){ tempRoughIN=element.roughLevelsin;}
						if (element.hasOwnProperty('roughLevelsOut')){ tempRoughOUT=element.roughLevelsOut;}

            if (element.hasOwnProperty('offsetU')){ tempoffU=element.offsetU;}
            if (element.hasOwnProperty('offsetV')){ tempoffV=element.offsetV;}

            if (element.hasOwnProperty('microblend')){  if(element.microblend!=''){ tempMBlend=element.microblend; } }
            if (element.hasOwnProperty('mbTile')){ tempMBTile=element.mbTile;}
            if (element.hasOwnProperty('microblendNormalStrength')){ tempMBNS=element.microblendNormalStrength;}
						if (element.hasOwnProperty('microblendContrast')){ tempMBCon=element.microblendContrast;}

            if (element.hasOwnProperty('microblendOffsetU')){ tempMBoffU=element.microblendOffsetU;}
						if (element.hasOwnProperty('microblendOffsetV')){ tempMBoffV=element.microblendOffsetV;}

            if ($('#layeringsystem li').eq(k).attr('disabled')!=='disabled'){
              $('#layeringsystem li').eq(k).data({
                mattile:tempTile,
                labels:'('+tempCol+') '+ String(tempMat).replace(/^.*[\\\/]/, '').split('.')[0],
                material:tempMat,
                opacity:basicOpacity,
                color:tempCol,
                normal:tempNorm,
                roughin:tempRoughIN,
                roughout:tempRoughOUT,
                metalin:tempMetalIN,
                metalout:tempMetalOUT,
                offsetU:tempoffU,
                offsetV:tempoffV,
                mblend:tempMBlend,
                mbtile:tempMBTile,
                mbcontrast:tempMBCon,
                mbnormal:tempMBNS,
                mboffu:tempMBoffU,
                mboffv:tempMBoffV
              });
              $('#layeringsystem li').eq(k).attr({
                "data-mattile":tempTile,
                "data-labels":'('+tempCol+') '+ String(tempMat).replace(/^.*[\\\/]/, '').split('.')[0],
                "data-material":tempMat,
                "data-opacity":basicOpacity,
                "data-color":tempCol,
                "data-normal":tempNorm,
                "data-roughin":tempRoughIN,
                "data-roughout":tempRoughOUT,
                "data-metalin":tempMetalIN,
                "data-metalout":tempMetalOUT,
                "data-offsetU":tempoffU,
                "data-offsetV":tempoffV,
                "data-mblend":tempMBlend,
                "data-mbtile":tempMBTile,
                "data-mbcontrast":tempMBCon,
                "data-mbnormal":tempMBNS,
                "data-mboffu":tempMBoffU,
                "data-mboffv":tempMBoffV
              });
            }
						k++;
					});
					console.log("%c- Imported "+$("#importTech").val()+", Now cleanup -","background-color:green;color:yellow;")
          $("#load-info").html('<span class="badge bg-info text-dark">Imported : '+$("#importTech").val().substring($("#importTech").val().lastIndexOf('\\')+1)+' </span>');
					$("#importTech").val("");
          $("#layeringsystem li.active").click();
				}
				/*
			}else{
				//using tooltip
				console.log('Json file not compatible');
			}*/
		}else{
      console.log('No file loaded');
		}
	});
  //Event to export your setup
  $("#exportJason").click(function(){
		let nomefile = 'commonlayer.json';
    //check if there is already a chosed Names
		if (String($("#nametoexport").val()).trim()!==''){
			nomefile = String($("#nametoexport").val()).split('.')[0].replace(/\W/g, '').toLowerCase();
			//$("#exportJason").attr("download",nomefile+".json");
		}/*else{
			$("#exportJason").attr("download","material.json");
		}*/

    //if there are a system of layers setup
	  if ($("#layeringsystem li").length > 0 ){
      //file header
			//let preamble ='{\r\n  "Extension": ".mlsetup",\r\n'
			let preamble ='{\r\n'
										+'  "Chunks": {\r\n'
										+'    "0": {\r\n'
										+'      "Type": "Multilayer_Setup",\r\n'
										+'      "ParentIndex": -1,\r\n'
										+'      "Properties": {\r\n'
										+'        "cookingPlatform": [\r\n'
										+'          "PLATFORM_PC"\r\n'
										+'        ],\r\n'
										+'        "layers": [\r\n';
      let ratiovalue='\r\n';
      let ratioIVal = $("#layerRatio").val();
      if ((!isNaN(ratioIVal)) && (typeof(ratioIVal)!==undefined) && (Number(ratioIVal)!=1)){
          ratiovalue = ',\r\n        "ratio": '+Number(ratioIVal)+'\r\n';
      }
      //file tail
			let closing = '\r\n        ]'+ratiovalue+'      }\r\n    }\r\n  }\r\n}';
			let jsonbody = '';

		for (k=0;k<$("#layeringsystem li:not([disabled])").length;k++){
			jsonOpacity='';
			jsonOffsetU='';
			jsonOffsetV='';
			jsonMbOffU='';
			jsonMbOffV='';
			jsonMBTile='';
      jsonlayerRoughIn='            "roughLevelsIn": "null",\r\n';

			if (k!=0){
				//no Opacity
				//no offsetu no offsetv
				jsonOpacity='            "opacity": '+Number($("#layeringsystem li").eq(k).data('opacity')).toFixed(Number($("#layeringsystem li").eq(k).data('opacity')).countDecimals())+',\r\n';
			}
			if ($("#layeringsystem li").eq(k).data('opacity')==1){
				jsonOpacity='';
			}
			if ($("#layeringsystem li").eq(k).data('offsetu')>0) {
				jsonOffsetU='            "offsetU": '+Number($("#layeringsystem li").eq(k).data('offsetu')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetu')).countDecimals())+',\r\n';
			}

			if ($("#layeringsystem li").eq(k).data('offsetv')>0) {
				jsonOffsetV='            "offsetV": '+Number($("#layeringsystem li").eq(k).data('offsetv')).toFixed(Number($("#layeringsystem li").eq(k).data('offsetv')).countDecimals())+',\r\n';
			}

			if ($("#layeringsystem li").eq(k).data('mboffu')>0) {
				jsonMbOffU='            "microblendOffsetU": '+Number($("#layeringsystem li").eq(k).data('mboffu')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffu')).countDecimals())+',\r\n';
			}
			if ($("#layeringsystem li").eq(k).data('mboffv')>0) {
				jsonMbOffV='            "microblendOffsetV": '+Number($("#layeringsystem li").eq(k).data('mboffv')).toFixed(Number($("#layeringsystem li").eq(k).data('mboffv')).countDecimals())+',\r\n';
			}
			if ($("#layeringsystem li").eq(k).data('mblend').replace(/^.*[\\\/]/, '').split('.')[0]!="default"){
				if (Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(2)!=1.00){
					jsonMBTile='            "mbTile": '+Number($("#layeringsystem li").eq(k).data('mbtile')).toFixed(Number($("#layeringsystem li").eq(k).data('mbtile')).countDecimals())+',\r\n';
				}
			}
      if ($("#layeringsystem li").eq(k).data('roughin')!='null'){
        if(($("#layeringsystem li").eq(k).data('roughin')=='2e977a') || ($("#layeringsystem li").eq(k).data('roughin')=='48a1ae')){
          jsonlayerRoughIn='            "roughLevelsIn": "'+$("#layeringsystem li").eq(k).data('roughin')+'",\r\n'
        }
      }

				jsonbody += '          {\r\n            "matTile": '+Number($("#layeringsystem li").eq(k).data('mattile')).toFixed(2)+',\r\n'
						+jsonMBTile
						+'            "microblend": "'+$("#layeringsystem li").eq(k).data('mblend').replaceAll(/\\/g, '\\\\')+'",\r\n'
						+'            "microblendContrast": '+Number($("#layeringsystem li").eq(k).data('mbcontrast')).toFixed(2)+',\r\n'
						+'            "microblendNormalStrength": '+Number($("#layeringsystem li").eq(k).data('mbnormal')).toFixed(2)+',\r\n'
						+jsonMbOffU+jsonMbOffV+jsonOpacity+jsonOffsetU+jsonOffsetV
						+'            "material": "'+$("#layeringsystem li").eq(k).data('material').replaceAll(/\\/g, '\\\\')+'",\r\n'
						+'            "colorScale": "'+$("#layeringsystem li").eq(k).data('color')+'",\r\n'
						+'            "normalStrength": "'+$("#layeringsystem li").eq(k).data('normal')+'",\r\n'
						+jsonlayerRoughIn
						+'            "roughLevelsOut": "'+$("#layeringsystem li").eq(k).data('roughout')+'",\r\n'
						+'            "metalLevelsIn": "null",\r\n'
						+'            "metalLevelsOut": "'+$("#layeringsystem li").eq(k).data('metalout')+'"\r\n'
						+'          },\r\n';

		}

		jsonbody=jsonbody.slice(0,-3); //removes latest commas
		thePIT.Export({
			file:nomefile,
			content:preamble+jsonbody+closing,
			type:'mlsetup'
		});
		/*var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(preamble+jsonbody+closing); //pack the text to be sent
		var link = document.getElementById('exportJason').href = dataUri;*/
	 }
 });

 $("#modelCopyPath").click(function(){
    navigator.clipboard.writeText($("#prefxunbundle").val()+$("#modelTarget").val().replaceAll(/\//g,'\\'));
  });
 $("#modelTexPath").click(function(){
   navigator.clipboard.writeText($("#prefxunbundle").val()+$("#masksTemplate").val().replaceAll(/\//g,'\\'));
  });

 //Display the counted meshes
	console.log("Mesh linked :"+modelsJson.filter(attri => attri.li_attr!=undefined).length);
});
