$(function () {
    const port = $("#WSPort").val();
    const socket = new WebSocket(`ws://localhost:${port}`);

    $("#WSSend").click(function(){
        if ((socket.readyState == 1) && ($("#WSMessage").val()!='')){
            socket.send($("#WSMessage").val());
        }
    });
    
    socket.addEventListener("message", (event) => {
        $("#WSmsgreply").val(event.data);
    });
});