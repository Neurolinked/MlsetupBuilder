$(function(){
	
	$("#dispAimU").html($("#AimU").val());
	$("#dispAimV").html($("#AimV").val());
	$("#dispAimTile").html($("#AimMTile").val());
	
	$("#AimMTile, #AimV, #AimU").on("input",function(){
		$(this).prev("span").children().text($(this).val());
	})
	
	
});
