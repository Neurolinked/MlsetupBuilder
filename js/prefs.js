window.$ = window.jQuery;
$(function(){
	var arguments = thePIT.Args();
	var wkitto
	var pref_recent

	//thePIT.RConfig();
	//function to update the form
	function compiletheform(configurazione){
		$("#prefxunbundle").val(configurazione.unbundle);
		$("#wCLIexe").val(configurazione.wcli);
		$("input [name='maskExtFormat']").prop("checked", false);
		$("input [name='maskExtFormat'][value='"+configurazione.maskformat+"']").prop("checked", true);
	}
	//loading of the datas from configuration
	loading = thePIT.RConfig();

	loading.then(function(result){
		compiletheform(result);
		pref_recent = result;
	})


	//Get a new path for the unbundle
	$("#prefxunbundle").click(function(){ thePIT.ConfiguraUnbundle($('#prefxunbundle').val());});
	//Get a new path for the Wolvekit executables
	$("#wCLIexe").click(function(){thePIT.ConfiguraWkitCli($('#wCLIexe').val());});

	$("#writePreferences").click(function(){
		var dummy = {unbundle:$('#prefxunbundle').val(), wcli:$('#wCLIexe').val(),maskformat:'dds'}
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

	$("#prefxunbundle, #wCLIexe").on('focusout',function(){
		console.log('entered');
		if ($("#wCLIexe").hasClass('d-none')){
			if ($("#prefxunbundle").val()==pref_recent.unbundle){
				$("#alertmessage").addClass('d-none');
			}else{
				$("#alertmessage").removeClass('d-none');
			}
		}else{
			if (($("#prefxunbundle").val()==pref_recent.unbundle) && ($("#wCLIexe").val()==pref_recent.wcli)){
				$("#alertmessage").addClass('d-none');
			}else{
				$("#alertmessage").removeClass('d-none');
			}
		}
	});


});
