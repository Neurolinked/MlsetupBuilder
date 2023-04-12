const bc = new BroadcastChannel("streaming");
bc.postMessage("This is a test message for everyone.");
$(function(){

    var ModelsLibrary = $('#treeeeeeeeeeee').jstree({
        'core': { "dblclick_toggle": false, "themes": { "name": "default-dark", "dots": true, "icons": true }, 'check_callback': true, 'data': modelsJson },
        'types': {
            "default": { "icon": "text-warning fas fa-folder" },
            "scan": { "icon": "text-danger fas fa-magnifying-glass" },
            "custom": { "icon": "custom fas fa-folder" },
            "custmesh": { "icon": "custom fas fa-dice-d6" },
            "man": { "icon": "fas fa-mars" },
            "woman": { "icon": "fas fa-venus" },
            "car": { "icon": "text-danger fas fa-car-side" },
            "moto": { "icon": "text-danger fas fa-motorcycle" },
            "weapons": { "icon": "text-primary fas fa-skull-crossbones" },
            "kiddo": { "icon": "text-warning fas fa-baby" },
            "decal": { "icon": "text-white fas fa-tag" },
            "layer0": { "icon": "text-white fas fa-star-half" },
            "custmask": { "icon": "custom fas fa-mask-face" },
            "hair": { "icon": "fa-solid fa-scissors" },
        },
        "search": { "show_only_matches": true, "show_only_matches_children": true },
        "plugins": ["search", "types", "state", "contextmenu"]
    });

});
