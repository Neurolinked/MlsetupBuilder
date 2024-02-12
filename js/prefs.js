window.$ = window.jQuery;
$(function(){
	var arguments = thePIT.Args();
	var wkitto
	var pref_recent

	//thePIT.RConfig();
	//function to update the form
	function compiletheform(configurazione){
		$("#prefxunbundle").val(configurazione.paths.depot);
		$("#wCLIexe").val(configurazione.paths.wcli);
		$("#gameArch").val(configurazione.paths.game);
		//$("#wCLIDep").val(configurazione.depot);
		$("input[name='maskExtFormat']").prop("checked", false);
		$("input[name='maskExtFormat'][value='"+configurazione.maskformat+"']").prop("checked", true);
	}
	//loading of the datas from configuration
	loading = thePIT.RConfig();

	loading.then(function(result){
		compiletheform(result);
		console.log(result);
		pref_recent = result;
	})

$("#gameArch, #prefxunbundle").click(async function(){
		var id = $(this).attr("id");
		var titleDialog =''
		switch (id){
			case 'prefxunbundle' :
				titleDialog = `Choose the unbundle folder`
				break;
			case 'gameArch':
				titleDialog = `Choose the game archive folder`
				break;
			/* to be removed
			case 'wCLIDep':
				titleDialog = `Choose the Wolvenkit Depot Folder`
				break;*/
		}
		var config = await thePIT.chooseAFolder($(this).val(),titleDialog);
		$(this).val(config);
});

	//Get a new path for the unbundle
	//$("#prefxunbundle").click(function(){ thePIT.ConfiguraUnbundle($('#prefxunbundle').val());});
	//Get a new path for the Wolvekit executables
	$("#wCLIexe").click(function(){thePIT.ConfiguraWkitCli($('#wCLIexe').val());});

	$("#writePreferences").click(function(){
		console.log($("input[name='maskExtFormat']:checked").val());
		var dummy = {
			paths:{
				depot:$('#prefxunbundle').val(),
				wcli:$('#wCLIexe').val(),
				game:$("#gameArch").val()
			},
			maskformat:	$("input[name='maskExtFormat']:checked").val()
		}
		thePIT.SaveAll(dummy);
		$("#alertmessage").addClass('d-none');
		pref_recent = dummy;
	});

	$("#reloadPreferences").click(function(){
		var reloading = thePIT.RConfig();
		reloading.then(function(result){
			compiletheform(result);
			pref_recent = result;
			$("#prefxunbundle").trigger('focusout');
		});
	});

	$("#prefxunbundle, #wCLIexe, #gameArch").on('focusout',function(){
		if ($("#wCLIexe").hasClass('d-none')){
			if (
				($("#prefxunbundle").val()==pref_recent.paths.depot) && 
				($("#gameArch").val()==pref_recent.paths.game)
			) {
				$("#alertmessage").addClass('d-none');
			}else{
				$("#alertmessage").removeClass('d-none');
			}
		}else{
			if (
				($("#prefxunbundle").val()==pref_recent.paths.depot) && 
				($("#wCLIexe").val()==pref_recent.paths.wcli) && 
				($("#gameArch").val()==pref_recent.paths.game)
			){
				$("#alertmessage").addClass('d-none');
			}else{
				$("#alertmessage").removeClass('d-none');
			}
		}
	});


});
