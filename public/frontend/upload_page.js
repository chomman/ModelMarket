//Backbone.js would do this stuff well
var upload_types= ["zip file", "texture", "3d model"];

function create_asset_on_div (id) {
    var asset_list = $("#"+id);
    var num_assets = asset_list.children().length;
    console.log(num_assets);
    var name = "asset" + num_assets;

    var row = $("<div>").addClass("upload-asset-element");
    
    

    var align_container = $('<div>').addClass("upload-asset-inline");

    var description_input = $('<input>');
    description_input.prop("name", "description_"+name);
    description_input.prop("placeholder", "description");

    var drop_down_input = create_drop_down (name);
    var upload_field_input = create_upload_field (name);

    row.append(align_container).append(upload_field_input);
    row.append(align_container).append(drop_down_input);
    row.append(align_container).append(description_input);
    asset_list.append(row);
}

function create_drop_down (name) {
    var drop_down_input = $("<select></select>").addClass("upload-asset-inline");
    for (t in upload_types){
        drop_down_input.append("<option>" + upload_types[t] + "</option>");
    }
    drop_down_input.prop("name", "drop_" + name)
    return drop_down_input;
}

function create_upload_field (name) {
    var upload_field_input = $('<input>');;
    upload_field_input.prop("type", "file");
    upload_field_input.prop("name", "file_" + name);
    return upload_field_input;
}
$( document ).ready( function(){
    $( "#add_asset" ).bind( "click", function() {
        create_asset_on_div('upload_assets');
    }); 
});
