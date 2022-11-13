$(function(){
	thePIT.Reload()
	
	var microblendRatio = Number($("#AimMTile").val())
	var microblendRatioVal = (1/microblendRatio) * 1024

	var defaults = {
		size : $("#AimMTile").val(),
		horizontal : $("#AimU").val(),
		vertical : $("#AimV").val()
	}

	$("#dispAimU").html($("#AimU").val());
	$("#dispAimV").html($("#AimV").val());
	$("#dispAimTile").html($("#AimMTile").val());

	$("#AimMTile, #AimV, #AimU").on("input",function(event){
		
		microblendRatio = Number($("#AimMTile").val())
		microblendRatioVal = (1/microblendRatio) * 1024

		$("#AimMTile").prev("span").children().text($("#AimMTile").val());
		$("#AimV").prev("span").children().text($("#AimV").val());
		$("#AimU").prev("span").children().text($("#AimU").val());

		$("#theAimerOverlay").css("background-size",microblendRatioVal+"px")
		$("#theAimerOverlay").css("background-position","bottom "+((1024 - microblendRatioVal) +(microblendRatioVal * Number($("#AimV").val())))+"px left "+(-(Number($("#AimU").val())*microblendRatioVal))+"px")
		//old left (1024-(1024 * Number($("#AimU").val())))
	})

	$(document).on('keydown', function(e) { if (e.shiftKey == false) { shiftSpeedup = false; $("#AimV, #AimU, #AimMTile").prop("step",'0.001');}else{$("#AimV, #AimU, #AimMTile").prop("step",'0.01');} });

	$("#theAimerOverlay").on('setDefaults',function(){
		defaults.size = $("#AimMTile").val()
		defaults.horizontal = $("#AimU").val()
		defaults.vertical = $("#AimV").val()
	})

	$("#reloadAim").click(function(){
		$("#AimU").val(defaults.horizontal)
		$("#AimV").val(defaults.vertical)
		$("#AimMTile").val(defaults.size)
		$("#AimMTile").trigger("input");
	})

	$("#confirmAim").click(function(){
			thePIT.Done({
				H: Number($("#AimU").val()),
				V: Number($("#AimV").val()),
				S: Number($("#AimMTile").val()),
				Link: $("#AimChain").is(":checked")
			})
	})
});
